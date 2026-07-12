import { App, LogLevel, type BlockAction } from '@slack/bolt';
import type { WebClient } from '@slack/web-api';
import { readConfig } from './config.js';
import { classifyPair, rankFindings } from './domain/classifier.js';
import { extractClaim } from './domain/preprocess.js';
import { logger } from './logger.js';
import { LocalNliEngine } from './nli/model.js';
import { evidenceBlocks } from './slack/blocks.js';
import { recordFeedback } from './slack/feedback.js';
import { SlackSearch } from './slack/search.js';
import type { Evidence, Finding, RadarLabel } from './types.js';

interface PendingContext {
  finding: Finding;
  expiresAt: number;
}

interface ActionPayload {
  findingId: string;
  previousMessageTs?: string;
  predictedLabel?: RadarLabel;
  reasonCodes?: string[];
}

export function createApp(): App {
  const config = readConfig();
  const app = new App({
    token: config.SLACK_BOT_TOKEN,
    appToken: config.SLACK_APP_TOKEN,
    socketMode: true,
    logLevel: LogLevel.ERROR,
  });
  const nli = new LocalNliEngine(config.NLI_MODEL_ID, config.NLI_ALLOW_REMOTE_MODELS);
  const pending = new Map<string, PendingContext>();

  app.event('app_home_opened', async ({ event }) => {
    const opened = event as unknown as { tab?: string; channel?: string };
    if (opened.tab !== 'messages' || !opened.channel) return;
    logger.info({ category: 'agent_opened' }, 'Agent Messages tab opened');
  });

  app.event('app_context_changed', async ({ event }) => {
    const changed = event as unknown as { context?: { entities?: unknown[] } };
    logger.debug({ category: 'context_changed', entityCount: changed.context?.entities?.length ?? 0 }, 'Slack context changed');
  });

  app.event('message', async (args) => {
    const event = args.event as typeof args.event & { channel_type?: string; text?: string; user?: string; bot_id?: string; thread_ts?: string; ts: string; app_context?: unknown };
    if (event.channel_type !== 'im' || event.bot_id || !event.user || !event.text) return;
    const threadTs = event.thread_ts ?? event.ts;
    const pendingKey = `${event.user}:${event.channel}:${threadTs}`;
    const saved = pending.get(pendingKey);
    if (saved && saved.expiresAt > Date.now()) {
      pending.delete(pendingKey);
      const rescored = await nli.score(saved.finding.previous.text, `${saved.finding.current.text} Context: ${event.text}`);
      const updatedCurrent = { ...saved.finding.current, text: `${saved.finding.current.text} Context: ${event.text}` };
      const updated = classifyPair(updatedCurrent, saved.finding.previous, rescored);
      await args.client.chat.postMessage({ channel: event.channel, thread_ts: threadTs, text: `${updated.label}: ${updated.explanation}`, blocks: evidenceBlocks([updated]) });
      return;
    }

    const claim = extractClaim(event.text);
    if (!claim) {
      await args.client.chat.postMessage({
        channel: event.channel,
        thread_ts: threadTs,
        text: 'What exact requirement or decision should I check? Include a project, version, environment, customer group, or time window when relevant.',
      });
      return;
    }

    const body = args.body as typeof args.body & { action_token?: string };
    if (!body.action_token) {
      await args.client.chat.postMessage({
        channel: event.channel,
        thread_ts: threadTs,
        text: 'I cannot run permission-aware workspace search because this event did not include a Slack action token. Please reopen the agent Messages tab and retry from the current context.',
      });
      return;
    }

    await analyzeAndReply(args.client, nli, claim, body.action_token, event.channel, event.ts, threadTs);
  });

  app.action(/radar_(add_context|resolved|false_positive)/, async ({ ack, action, body, client }) => {
    await ack();
    const block = action as BlockAction['actions'][number] & { value?: string; action_id: string };
    const channelId = 'channel' in body && body.channel?.id ? body.channel.id : '';
    const message = ('message' in body ? body.message : undefined) as { thread_ts?: string; ts?: string } | undefined;
    const threadTs = message?.thread_ts ?? message?.ts ?? '';
    const userId = String(body.user.id);
    const payload = parseActionPayload(block.value);
    const actionName = block.action_id.replace('radar_', '') as 'add_context' | 'resolved' | 'false_positive';

    if (actionName === 'add_context') {
      const memoryKey = `${userId}:${channelId}:${threadTs}`;
      const remembered = findingMemory.get(payload.findingId);
      if (remembered) pending.set(memoryKey, { finding: remembered, expiresAt: Date.now() + 10 * 60 * 1000 });
      await recordFeedback(config.FEEDBACK_PATH, {
        findingId: payload.findingId,
        action: 'context_requested',
        actorUserId: userId,
        channelId,
        threadTs,
        createdAt: new Date().toISOString(),
      });
      await client.chat.postMessage({ channel: channelId, thread_ts: threadTs, text: 'Reply with the missing scope, environment, version, customer group, authority, or time window. I will re-check this finding.' });
      return;
    }

    await recordFeedback(config.FEEDBACK_PATH, {
      findingId: payload.findingId,
      action: actionName === 'resolved' ? 'resolved' : 'false_positive',
      actorUserId: userId,
      channelId,
      threadTs,
      ...(payload.previousMessageTs ? { previousMessageTs: payload.previousMessageTs } : {}),
      ...(payload.predictedLabel ? { predictedLabel: payload.predictedLabel } : {}),
      ...(payload.reasonCodes ? { reasonCodes: payload.reasonCodes } : {}),
      createdAt: new Date().toISOString(),
    });
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: threadTs,
      text: actionName === 'resolved' ? 'Marked resolved. I will keep this feedback as body-free structured metadata.' : 'Recorded as a false positive. Thank you—no message text was stored.',
    });
  });

  return app;
}

const findingMemory = new Map<string, Finding>();

async function analyzeAndReply(client: WebClient, nli: LocalNliEngine, claim: string, actionToken: string, channelId: string, messageTs: string, threadTs: string): Promise<void> {
  const search = new SlackSearch(client);
  try {
    await client.apiCall('assistant.threads.setStatus', { channel_id: channelId, thread_ts: threadTs, status: 'Checking earlier Slack evidence…' }).catch(() => undefined);
    const currentPermalink = await client.chat.getPermalink({ channel: channelId, message_ts: messageTs });
    const current: Evidence = { channelId, messageTs, permalink: currentPermalink.permalink ?? '', text: claim };
    const candidates = await search.findEvidence(claim, actionToken, current);
    const findings: Finding[] = [];
    for (const previous of candidates.slice(0, 8)) {
      const scores = await nli.score(previous.text, current.text);
      findings.push(classifyPair(current, previous, scores));
    }
    const ranked = rankFindings(findings.filter((item) => item.label !== 'No contradiction' || item.confidence >= 0.72));
    for (const item of ranked) findingMemory.set(item.id, item);
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: threadTs,
      text: ranked.length ? `Found ${ranked.length} relevant finding${ranked.length === 1 ? '' : 's'}.` : 'No high-value contradiction evidence found.',
      blocks: evidenceBlocks(ranked),
    });
  } catch (error) {
    logger.error({ category: 'analysis_failed', errorName: error instanceof Error ? error.name : 'unknown' }, 'Analysis failed');
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: threadTs,
      text: 'I could not complete the permission-aware check. No conclusion was generated. Please retry once; if it persists, run `npm run health` on the host and review the body-free error log.',
    });
  }
}

function parseActionPayload(value?: string): ActionPayload {
  if (!value) throw new Error('Missing action payload');
  const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as ActionPayload;
  if (!parsed.findingId) throw new Error('Invalid action payload');
  return parsed;
}
