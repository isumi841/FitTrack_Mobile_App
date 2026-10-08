const path = require("node:path");
const dotenv = require("dotenv");

const envPath = path.join(
  path.dirname(require.resolve("./package.json")),
  ".env"
);

const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.error("Failed to load server/.env");
}

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const workoutRoutes = require("./routes/workoutRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("FitTrack API is running");
});

const workoutBasePath = "/api/member2/workouts";
app.use(
  workoutBasePath,
  (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      const message = "Workout database is not connected.";
      console.error("Workout API request while MongoDB is disconnected", {
        route: req.originalUrl,
        database: mongoose.connection.name || "fittrack_db",
        collection: "workouts",
        error: message,
      });
      res.set("Retry-After", "5");
      res.status(503).json({
        success: false,
        message: "Workout database is temporarily unavailable.",
      });
      return;
    }

    next();
  },
  workoutRoutes,
);

const PORT = Number(process.env.PORT || 5000);

async function connectWithRetry() {
  while (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
      console.log("MongoDB connected successfully");
    } catch (error) {
      console.error(
        "MongoDB connection attempt failed; retrying in 5 seconds:",
        error.message,
      );

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  void connectWithRetry();
});

server.on("error", (error) => {
  console.error(`Failed to listen on port ${PORT}:`, error.message);
  process.exitCode = 1;
});