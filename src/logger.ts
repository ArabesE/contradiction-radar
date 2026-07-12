import pino from 'pino';

const tokenPattern = /xox[baprs]-[A-Za-z0-9-]+/g;

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: ['token', '*.token', 'action_token', '*.action_token', 'text', '*.text'],
    censor: '[REDACTED]',
  },
  hooks: {
    logMethod(args, method) {
      const sanitized = args.map((arg) =>
        typeof arg === 'string' ? arg.replace(tokenPattern, '[REDACTED_TOKEN]') : arg,
      );
      Reflect.apply(method, this, sanitized);
    },
  },
});
