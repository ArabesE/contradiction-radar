import type { WebClient } from '@slack/web-api';
import { logger } from '../logger.js';
import type { Evidence, SearchCapabilities } from '../types.js';

interface SearchMessage {
  author_name?: string;
  channel_id?: string;
  message_ts?: string;
  content?: string;
  permalink?: string;
  is_author_bot?: boolean;
}

interface SearchResponse {
  ok?: boolean;
  results?: { messages?: SearchMessage[] };
  error?: string;
}

export class SlackSearch {
  private capabilities?: SearchCapabilities;

  constructor(private readonly client: WebClient) {}

  async getCapabilities(): Promise<SearchCapabilities> {
    if (this.capabilities && Date.now() - this.capabilities.checkedAt < 60 * 60 * 1000) return this.capabilities;
    const response = await this.client.apiCall('assistant.search.info') as unknown as Record<string, unknown>;
    this.capabilities = {
      semantic: response['is_ai_search_enabled'] === true,
      checkedAt: Date.now(),
    };
    logger.info({ category: 'search_capabilities', semantic: this.capabilities.semantic }, 'Slack search capabilities checked');
    return this.capabilities;
  }

  async findEvidence(claim: string, actionToken: string, current?: Pick<Evidence, 'channelId' | 'messageTs'>): Promise<Evidence[]> {
    const capabilities = await this.getCapabilities();
    const queries = capabilities.semantic
      ? [`What earlier decisions or requirements conflict with: ${claim}?`, keywordQuery(claim)]
      : [keywordQuery(claim)];
    const combined = new Map<string, Evidence>();
    for (const query of queries) {
      const response = (await this.client.apiCall('assistant.search.context', {
        action_token: actionToken,
        query,
        channel_types: ['public_channel'],
        content_types: ['messages'],
        include_context_messages: true,
        include_bots: false,
        limit: 20,
        sort: 'score',
        sort_dir: 'desc',
      })) as SearchResponse;
      if (!response.ok) throw new Error(`Slack search failed: ${response.error ?? 'unknown_error'}`);
      for (const item of response.results?.messages ?? []) {
        if (!item.channel_id || !item.message_ts || !item.permalink || !item.content) continue;
        if (current && item.channel_id === current.channelId && item.message_ts === current.messageTs) continue;
        const key = `${item.channel_id}:${item.message_ts}`;
        combined.set(key, {
          channelId: item.channel_id,
          messageTs: item.message_ts,
          permalink: item.permalink,
          text: item.content,
          ...(item.author_name ? { authorName: item.author_name } : {}),
          ...(item.is_author_bot !== undefined ? { isBot: item.is_author_bot } : {}),
        });
      }
    }
    return [...combined.values()].slice(0, 20);
  }
}

export function keywordQuery(claim: string): string {
  const stop = new Set(['about', 'after', 'again', 'before', 'could', 'from', 'have', 'should', 'that', 'their', 'there', 'these', 'this', 'those', 'with', 'would']);
  const words = claim.toLowerCase().match(/[a-z0-9][a-z0-9.-]*/g) ?? [];
  const selected = [...new Set(words.filter((word) => word.length >= 4 && !stop.has(word)))].slice(0, 7);
  return selected.length ? selected.join(' OR ') : claim.slice(0, 120);
}
