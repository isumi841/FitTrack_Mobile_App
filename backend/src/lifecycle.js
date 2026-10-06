import { createServer } from 'node:http';
import { createApp } from './app.js';

export function createService({ config, database, logger = console, forceExit = code => process.exit(code), shutdownTimeoutMs = 10000 }) {
  let server;
  let stopping = false;
  let shutdown;

  function stop() {
    if (shutdown) return shutdown;
    stopping = true;
    shutdown = (async () => {
      const deadline = setTimeout(() => {
        logger.error('Graceful shutdown timed out. Forcing shutdown.');
        server?.closeAllConnections();
        forceExit(1);
      }, shutdownTimeoutMs);
      deadline.unref();
      try {
        if (server?.listening) {
          await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
        }
      } finally {
        try {
          await database.disconnect();
        } finally {
          clearTimeout(deadline);
        }
      }
    })();
    return shutdown;
  }

  return {
    stop,
    async start() {
      try {
        await database.connect(config.mongodbUri);
        if (stopping) return;
        if (!await database.ping()) throw new Error('Database unavailable');
        if (stopping) return;
        const repository = config.devAuthEnabled ? database.createSessionRepository() : undefined;
        if (repository) await repository.initialize();
        if (stopping) return;
        const exerciseRepository = database.createExerciseRepository?.();
        if (config.adminDevAuthEnabled && exerciseRepository) await exerciseRepository.initialize();
        if (stopping) return;
        const app = createApp({ database, repository, exerciseRepository, config, corsOrigins: config.corsOrigins, isStopping: () => stopping });
        server = createServer(app);
        await new Promise((resolve, reject) => {
          server.once('error', reject);
          server.listen(config.port, config.host, () => {
            server.off('error', reject);
            resolve();
          });
        });
        logger.info(`FitTrack backend listening on port ${server.address().port} (${config.nodeEnv}).`);
        return server;
      } catch {
        // Return a safe error, even when the MongoDB driver includes credentials.
        try { await stop(); } catch { /* Startup error below remains sanitized. */ }
        throw new Error('Backend startup failed. Check MongoDB credentials, Atlas network access, and whether PORT is already in use.');
      }
    },
  };
}
