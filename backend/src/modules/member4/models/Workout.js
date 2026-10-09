import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    sourceWorkoutId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    category: {
      type: String,
      required: true,
      enum: [
        'Strength',
        'Cardio',
        'Core',
        'Mobility',
      ],
    },

    performedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 0,
    },

    calories: {
      type: Number,
      default: 0,
      min: 0,
    },

    exercisesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    setsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    intensity: {
      type: String,
      enum: [
        'Low',
        'Moderate',
        'High',
      ],
      default: 'Moderate',
    },

    completion: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

workoutSchema.index({
  userId: 1,
  performedAt: -1,
});

export const Workout = mongoose.model(
  'Workout',
  workoutSchema,
);