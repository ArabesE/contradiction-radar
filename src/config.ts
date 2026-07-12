import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv({ path: '.env.local', quiet: true });

const booleanString = z
  .enum(['true', 'false'])
  .default('true')
  .transform((value) => value === 'true');

const schema = z.object({
  SLACK_BOT_TOKEN: z.string().startsWith('xoxb-'),
  SLACK_APP_TOKEN: z.string().startsWith('xapp-'),
  SLACK_SIGNING_SECRET: z.string().min(8).optional(),
  SLACK_TEAM_ID: z.string().min(1).default('E0BGST8FARF'),
  SLACK_DEMO_CHANNEL_ID: z.string().min(1).optional(),
  NLI_MODEL_ID: z.string().min(1).default('Xenova/nli-deberta-v3-xsmall'),
  NLI_ALLOW_REMOTE_MODELS: booleanString,
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  FEEDBACK_PATH: z.string().default('data/feedback.jsonl'),
});

export type AppConfig = z.infer<typeof schema>;

export function readConfig(): AppConfig {
  return schema.parse(process.env);
}

export function hasRuntimeSecrets(): boolean {
  return Boolean(process.env.SLACK_BOT_TOKEN && process.env.SLACK_APP_TOKEN);
}

