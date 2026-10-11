import mongoose from 'mongoose';

const VALID_DAYS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
];

const workoutReminderSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
      },

      enabled: {
        type: Boolean,
        default: true,
      },

      time: {
        type: String,
        required: true,
        trim: true,
      },

      days: [
        {
          type: String,
          enum: VALID_DAYS,
        },
      ],

      soundEnabled: {
        type: Boolean,
        default: true,
      },

      vibrationEnabled: {
        type: Boolean,
        default: true,
      },

      motivationalMessage: {
        type: Boolean,
        default: true,
      },

      timezone: {
        type: String,
        default: 'Asia/Colombo',
        trim: true,
      },

      label: {
        type: String,
        trim: true,
        maxlength: 60,
        default: 'Workout Reminder',
      },
    },
    {
      timestamps: true,
    },
  );

workoutReminderSchema.index({
  userId: 1,
  createdAt: -1,
});

export { workoutReminderSchema };
