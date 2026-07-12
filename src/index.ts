import { createApp } from './app.js';
import { logger } from './logger.js';

const app = createApp();

await app.start();
logger.info({ category: 'service_started', transport: 'socket_mode' }, 'Contradiction Radar is connected');

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void app.stop().finally(() => process.exit(0));
  });
}

