import express from 'express';
import cors from 'cors';
import { member3Routes, RequestError } from './session-routes.js';
import { exerciseRoutes } from './exercise-routes.js';

export function createApp({ database, corsOrigins, repository, exerciseRepository, config, identity, adminIdentity, isStopping = () => false }) {
  const app = express();
  const allowedOrigins = new Set(corsOrigins);
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const origin = req.get('Origin');
    if (origin && !allowedOrigins.has(origin)) {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
    next();
  });
  // Native apps and PowerShell may have no Origin header; browser origins are explicit.
  app.use(cors({ origin: corsOrigins, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'], credentials: false }));
  app.use(express.json({ limit: '16kb', strict: true }));

  app.get('/api/health', async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      if (!isStopping() && await database.ping()) {
        return res.status(200).json({ status: 'ok', database: 'available' });
      }
    } catch {
      // Driver errors may contain connection details. Never return or log them here.
    }
    return res.status(503).json({ status: 'unavailable', database: 'unavailable' });
  });

  app.use('/api/member3', exerciseRoutes({ exerciseRepository, config, adminIdentity }));
  app.use('/api/member3', member3Routes({ repository, exerciseRepository, config, identity }));
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((error, _req, res, _next) => {
    if (error instanceof RequestError) return res.status(error.status).json({ error: error.message });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
    return res.status(503).json({ error: 'Request could not be saved or loaded. Retry when the service is available.' });
  });
  return app;
}
