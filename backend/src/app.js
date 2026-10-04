import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import goalRoutes from './modules/member4/routes/goalRoutes.js';
import profileRoutes from './modules/member4/routes/profileRoutes.js';
import reminderRoutes from './modules/member4/routes/reminderRoutes.js';

const app = express();

/*
|--------------------------------------------------------------------------
| GLOBAL MIDDLEWARE
|--------------------------------------------------------------------------
*/

app.use(cors());

app.use(
  express.json({
    limit: '1mb',
  }),
);

app.use(morgan('dev'));

/*
|--------------------------------------------------------------------------
| HEALTH ROUTES
|--------------------------------------------------------------------------
*/

app.get('/', (req, res) => {
  res.json({
    success: true,
    message:
      'FitTrack API is running',
  });
});

app.get(
  '/api/health',
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        'FitTrack backend is healthy',
    });
  },
);

/*
|--------------------------------------------------------------------------
| MEMBER 4 ROUTES
|--------------------------------------------------------------------------
*/

app.use(
  '/api/member4/goals',
  goalRoutes,
);

app.use(
  '/api/member4/profile',
  profileRoutes,
);

app.use(
  '/api/member4/reminders',
  reminderRoutes,
);
/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

export default app;