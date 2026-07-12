import { WebClient } from '@slack/web-api';
import { hasRuntimeSecrets, readConfig } from '../src/config.js';

if (!hasRuntimeSecrets()) {
  console.error('UNHEALTHY: runtime credentials are not configured in the local environment.');
  process.exit(1);
}

const config = readConfig();
const client = new WebClient(config.SLACK_BOT_TOKEN);
try {
  const auth = await client.auth.test();
  const search = await client.apiCall('assistant.search.info') as unknown as Record<string, unknown>;
  console.log(JSON.stringify({
    status: 'healthy',
    teamMatches: auth.team_id === config.SLACK_TEAM_ID,
    searchApiAvailable: search.ok === true,
    semanticSearchEnabled: search['is_ai_search_enabled'] === true,
    checkedAt: new Date().toISOString(),
  }));
} catch (error) {
  console.error(`UNHEALTHY: ${error instanceof Error ? error.name : 'unknown_error'}`);
  process.exit(1);
}
