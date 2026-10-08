import { ConfigurationError, loadConfig } from './config.js';
import { createDatabase } from './database.js';
import { createService, StartupError } from './lifecycle.js';

let service;

async function stop(code = 0) {
  process.exitCode = Math.max(process.exitCode ?? 0, code);
  try {
    await service?.stop();
  } catch {
    console.error('Unable to complete database shutdown cleanly.');
    process.exitCode = 1;
  }
}

async function main() {
  const config = loadConfig();
  service = createService({ config, database: createDatabase() });
  process.once('SIGINT', () => { void stop(); });
  process.once('SIGTERM', () => { void stop(); });
  const server = await service.start();
  server?.on('error', () => {
    console.error('HTTP server error. Shutting down.');
    void stop(1);
  });
}

main().catch(async error => {
  console.error(error instanceof ConfigurationError || error instanceof StartupError ? error.message : 'Backend startup failed. Check MongoDB credentials, Atlas network access, and whether PORT is already in use.');
  await stop(1);
});
