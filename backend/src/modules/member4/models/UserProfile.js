import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: '',
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: [
        'Male',
        'Female',
        'Prefer not to say',
      ],
      default: 'Prefer not to say',
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 150,
      default: '',
    },

    focus: [
      {
        type: String,
        trim: true,
      },
    ],

    avatarUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

export const UserProfile =
  mongoose.model(
    'UserProfile',
    userProfileSchema,
  );