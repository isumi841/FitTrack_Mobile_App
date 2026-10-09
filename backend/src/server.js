import dotenv from 'dotenv';

import app from './app.js';
import { connectDatabase } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(
      `FitTrack API running on http://localhost:${PORT}`,
    );
  });
}

startServer();