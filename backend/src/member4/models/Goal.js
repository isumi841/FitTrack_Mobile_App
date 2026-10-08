import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    goalType: {
      type: String,
      required: true,
      enum: [
        'workoutsPerWeek',
        'caloriesPerWeek',
        'workoutMinutes',
        'monthlyWorkouts',
      ],
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    target: {
      type: Number,
      required: true,
      min: 1,
    },

    current: {
      type: Number,
      default: 0,
      min: 0,
    },

    duration: {
      type: String,
      required: true,
      enum: [
        'Weekly',
        'Monthly',
      ],
    },

    status: {
      type: String,
      enum: [
        'active',
        'completed',
        'archived',
      ],
      default: 'active',
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

goalSchema.index({
  userId: 1,
  status: 1,
  createdAt: -1,
});

export { goalSchema };
