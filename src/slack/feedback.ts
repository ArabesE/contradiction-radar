import { appendFile, chmod, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { RadarLabel } from '../types.js';

export interface FeedbackRecord {
  findingId: string;
  action: 'resolved' | 'false_positive' | 'context_requested';
  actorUserId: string;
  channelId: string;
  threadTs: string;
  previousMessageTs?: string;
  predictedLabel?: RadarLabel;
  reasonCodes?: string[];
  createdAt: string;
}

export async function recordFeedback(path: string, record: FeedbackRecord): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${JSON.stringify(record)}\n`, { encoding: 'utf8', mode: 0o600 });
  await chmod(path, 0o600).catch(() => undefined);
}

