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

// Member 2 workout routes
app.use("/api/member2/workouts", workoutRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("MongoDB connected successfully");
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exitCode = 1;
  }
}

startServer();