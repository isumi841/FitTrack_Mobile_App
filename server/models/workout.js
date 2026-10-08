const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    target: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const workoutSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Full Body",
        "Strength",
        "Cardio",
        "Stretching",
        "Mobility",
        "Core",
      ],
    },

    difficulty: {
      type: String,
      required: true,
      enum: [
        "Beginner",
        "Intermediate",
        "Advanced",
      ],
    },

    duration: {
      type: Number,
      required: true,
    },

    equipment: {
      type: String,
      default: "No equipment",
    },

    description: {
      type: String,
      required: true,
    },

    lowImpact: {
      type: Boolean,
      default: false,
    },

    exercises: {
      type: [exerciseSchema],
      default: [],
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "workouts",
  }
);

module.exports = mongoose.model("Workout", workoutSchema);