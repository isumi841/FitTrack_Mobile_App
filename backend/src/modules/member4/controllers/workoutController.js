import mongoose from 'mongoose';

import { Workout } from '../models/Workout.js';

export async function createWorkout(
  req,
  res,
) {
  try {
    const {
      sourceWorkoutId,
      title,
      category,
      performedAt,
      durationMinutes,
      calories = 0,
      exercisesCount = 0,
      setsCount = 0,
      intensity = 'Moderate',
      completion = 100,
      note = '',
    } = req.body;

    if (
      !title ||
      !category ||
      durationMinutes === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          'title, category and durationMinutes are required.',
      });
    }

    const workout = await Workout.create({
      userId: req.user.id,
      sourceWorkoutId:
        sourceWorkoutId || null,
      title,
      category,
      performedAt:
        performedAt || new Date(),
      durationMinutes,
      calories,
      exercisesCount,
      setsCount,
      intensity,
      completion,
      note,
    });

    return res.status(201).json({
      success: true,
      message:
        'Workout created successfully.',
      data: workout,
    });
  } catch (error) {
    if (
      error.name ===
      'ValidationError'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error(
      'Create workout error:',
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to create workout.',
    });
  }
}

export async function getWorkouts(
  req,
  res,
) {
  try {
    const {
      category,
      intensity,
    } = req.query;

    const filter = {
      userId: req.user.id,
    };

    if (category) {
      filter.category = category;
    }

    if (intensity) {
      filter.intensity = intensity;
    }

    const workouts = await Workout.find(
      filter,
    ).sort({
      performedAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: workouts.length,
      data: workouts,
    });
  } catch (error) {
    console.error(
      'Get workouts error:',
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to load workouts.',
    });
  }
}

export async function getWorkoutById(
  req,
  res,
) {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid workout ID.',
      });
    }

    const workout = await Workout.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message:
          'Workout not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: workout,
    });
  } catch (error) {
    console.error(
      'Get workout error:',
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to load workout.',
    });
  }
}

export async function updateWorkout(
  req,
  res,
) {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid workout ID.',
      });
    }

    const allowedFields = [
      'title',
      'category',
      'performedAt',
      'durationMinutes',
      'calories',
      'exercisesCount',
      'setsCount',
      'intensity',
      'completion',
      'note',
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (
        req.body[field] !==
        undefined
      ) {
        updates[field] =
          req.body[field];
      }
    }

    const workout =
      await Workout.findOneAndUpdate(
        {
          _id: id,
          userId: req.user.id,
        },
        updates,
        {
          new: true,
          runValidators: true,
        },
      );

    if (!workout) {
      return res.status(404).json({
        success: false,
        message:
          'Workout not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Workout updated successfully.',
      data: workout,
    });
  } catch (error) {
    if (
      error.name ===
      'ValidationError'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error(
      'Update workout error:',
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to update workout.',
    });
  }
}

export async function deleteWorkout(
  req,
  res,
) {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid workout ID.',
      });
    }

    const workout =
      await Workout.findOneAndDelete({
        _id: id,
        userId: req.user.id,
      });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message:
          'Workout not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Workout deleted successfully.',
      data: {
        id: workout._id,
      },
    });
  } catch (error) {
    console.error(
      'Delete workout error:',
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to delete workout.',
    });
  }
}