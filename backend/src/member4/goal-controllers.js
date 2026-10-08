import mongoose from 'mongoose';
export function goalControllers({ Goal }) {


/*
|--------------------------------------------------------------------------
| CREATE GOAL
|--------------------------------------------------------------------------
| POST /api/member4/goals
*/
async function createGoal(
  req,
  res,
) {
  try {
    const {
      goalType,
      title,
      target,
      current = 0,
      duration,
      startDate,
      endDate,
    } = req.body;

    if (
      !goalType ||
      !title ||
      target === undefined ||
      !duration
    ) {
      return res.status(400).json({
        success: false,
        message:
          'goalType, title, target and duration are required.',
      });
    }

    const numericTarget =
      Number(target);

    const numericCurrent =
      Number(current);

    if (
      Number.isNaN(numericTarget) ||
      numericTarget <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Target must be greater than 0.',
      });
    }

    if (
      Number.isNaN(numericCurrent) ||
      numericCurrent < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Current progress cannot be negative.',
      });
    }

    const status =
      numericCurrent >= numericTarget
        ? 'completed'
        : 'active';

    const goal = await Goal.create({
      userId: req.user.id,

      goalType,

      title: title.trim(),

      target: numericTarget,

      current: numericCurrent,

      duration,

      status,

      startDate:
        startDate || new Date(),

      endDate:
        endDate || null,
    });

    return res.status(201).json({
      success: true,
      message:
        'Goal created successfully.',
      data: goal,
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

    // Storage errors are sanitized below.

    return res.status(500).json({
      success: false,
      message:
        'Failed to create goal.',
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET ALL GOALS
|--------------------------------------------------------------------------
| GET /api/member4/goals
*/
async function getGoals(
  req,
  res,
) {
  try {
    const {
      status,
      duration,
      goalType,
    } = req.query;

    const filter = {
      userId: req.user.id,
    };

    if (status) {
      filter.status = status;
    }

    if (duration) {
      filter.duration = duration;
    }

    if (goalType) {
      filter.goalType = goalType;
    }

    const goals = await Goal.find(
      filter,
    ).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: goals.length,
      data: goals,
    });
  } catch (error) {
    // Storage errors are sanitized below.

    return res.status(500).json({
      success: false,
      message:
        'Failed to load goals.',
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET ONE GOAL
|--------------------------------------------------------------------------
| GET /api/member4/goals/:id
*/
async function getGoalById(
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
          'Invalid goal ID.',
      });
    }

    const goal = await Goal.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    // Storage errors are sanitized below.

    return res.status(500).json({
      success: false,
      message:
        'Failed to load goal.',
    });
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE GOAL
|--------------------------------------------------------------------------
| PATCH /api/member4/goals/:id
*/
async function updateGoal(
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
          'Invalid goal ID.',
      });
    }

    const existingGoal =
      await Goal.findOne({
        _id: id,
        userId: req.user.id,
      });

    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found.',
      });
    }

    const allowedFields = [
      'goalType',
      'title',
      'target',
      'current',
      'duration',
      'status',
      'startDate',
      'endDate',
    ];

    for (const field of allowedFields) {
      if (
        req.body[field] !==
        undefined
      ) {
        existingGoal[field] =
          req.body[field];
      }
    }

    if (
      existingGoal.current >=
        existingGoal.target &&
      existingGoal.status !==
        'archived'
    ) {
      existingGoal.status =
        'completed';
    }

    if (
      existingGoal.current <
        existingGoal.target &&
      existingGoal.status ===
        'completed'
    ) {
      existingGoal.status =
        'active';
    }

    await existingGoal.save();

    return res.status(200).json({
      success: true,
      message:
        'Goal updated successfully.',
      data: existingGoal,
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

    // Storage errors are sanitized below.

    return res.status(500).json({
      success: false,
      message:
        'Failed to update goal.',
    });
  }
}

/*
|--------------------------------------------------------------------------
| DELETE GOAL
|--------------------------------------------------------------------------
| DELETE /api/member4/goals/:id
*/
async function deleteGoal(
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
          'Invalid goal ID.',
      });
    }

    const goal =
      await Goal.findOneAndDelete({
        _id: id,
        userId: req.user.id,
      });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Goal deleted successfully.',
      data: {
        id: goal._id,
      },
    });
  } catch (error) {
    // Storage errors are sanitized below.

    return res.status(500).json({
      success: false,
      message:
        'Failed to delete goal.',
    });
  }
}
return { createGoal, getGoals, getGoalById, updateGoal, deleteGoal };
}
