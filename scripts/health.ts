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
  const teamMatches = auth.team_id === config.SLACK_TEAM_ID;
  const searchApiAvailable = search.ok === true;
  const semanticSearchEnabled = search['is_ai_search_enabled'] === true;
  if (!teamMatches || !searchApiAvailable || !semanticSearchEnabled) {
    throw new Error('workspace_or_search_invariant_failed');
  }
  console.log(JSON.stringify({
    status: 'healthy',
    teamMatches,
    searchApiAvailable,
    semanticSearchEnabled,
    checkedAt: new Date().toISOString(),
  }));
} catch (error) {
  console.error(`UNHEALTHY: ${error instanceof Error ? error.name : 'unknown_error'}`);
  process.exit(1);
}
