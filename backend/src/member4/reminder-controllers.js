import mongoose from 'mongoose';
export function reminderControllers({ WorkoutReminder }) {


const VALID_DAYS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
];

function isValidTimeFormat(time) {
  if (typeof time !== 'string') {
    return false;
  }

  const pattern =
    /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

  return pattern.test(time.trim());
}

function normalizeDays(days) {
  if (!Array.isArray(days)) {
    return [];
  }

  return VALID_DAYS.filter((day) =>
    days.includes(day),
  );
}

/*
|--------------------------------------------------------------------------
| CREATE REMINDER
|--------------------------------------------------------------------------
| POST /api/member4/reminders
*/

async function createReminder(
  req,
  res,
) {
  try {
    const {
      enabled = true,
      time,
      days = [],
      soundEnabled = true,
      vibrationEnabled = true,
      motivationalMessage = true,
      timezone = 'Asia/Colombo',
      label = 'Workout Reminder',
    } = req.body;

    if (!time) {
      return res.status(400).json({
        success: false,
        message:
          'Reminder time is required.',
      });
    }

    if (!isValidTimeFormat(time)) {
      return res.status(400).json({
        success: false,
        message:
          'Time must use a format like 06:30 AM.',
      });
    }

    if (!Array.isArray(days)) {
      return res.status(400).json({
        success: false,
        message:
          'days must be an array.',
      });
    }

    const invalidDays =
      days.filter(
        (day) =>
          !VALID_DAYS.includes(day),
      );

    if (invalidDays.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid reminder day: ${invalidDays.join(
          ', ',
        )}`,
      });
    }

    if (
      enabled &&
      days.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Select at least one reminder day when the reminder is enabled.',
      });
    }

    const reminder =
      await WorkoutReminder.create({
        userId: req.user.id,

        enabled,

        time: time.trim(),

        days: normalizeDays(days),

        soundEnabled,

        vibrationEnabled,

        motivationalMessage,

        timezone,

        label,
      });

    return res.status(201).json({
      success: true,
      message:
        'Workout reminder created successfully.',
      data: reminder,
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
        'Failed to create workout reminder.',
    });
  }
}

/*
|--------------------------------------------------------------------------
| READ ALL REMINDERS
|--------------------------------------------------------------------------
| GET /api/member4/reminders
*/

async function getReminders(
  req,
  res,
) {
  try {
    const reminders =
      await WorkoutReminder.find({
        userId: req.user.id,
      }).sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    // Storage errors are sanitized below.

    return res.status(500).json({
      success: false,
      message:
        'Failed to load workout reminders.',
    });
  }
}

/*
|--------------------------------------------------------------------------
| READ ONE REMINDER
|--------------------------------------------------------------------------
| GET /api/member4/reminders/:id
*/

async function getReminderById(
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
          'Invalid reminder ID.',
      });
    }

    const reminder =
      await WorkoutReminder.findOne({
        _id: id,
        userId: req.user.id,
      });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message:
          'Workout reminder not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    // Storage errors are sanitized below.

    return res.status(500).json({
      success: false,
      message:
        'Failed to load workout reminder.',
    });
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE REMINDER
|--------------------------------------------------------------------------
| PATCH /api/member4/reminders/:id
*/

async function updateReminder(
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
          'Invalid reminder ID.',
      });
    }

    const reminder =
      await WorkoutReminder.findOne({
        _id: id,
        userId: req.user.id,
      });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message:
          'Workout reminder not found.',
      });
    }

    const {
      enabled,
      time,
      days,
      soundEnabled,
      vibrationEnabled,
      motivationalMessage,
      timezone,
      label,
    } = req.body;

    if (
      time !== undefined &&
      !isValidTimeFormat(time)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Time must use a format like 06:30 AM.',
      });
    }

    if (
      days !== undefined &&
      !Array.isArray(days)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'days must be an array.',
      });
    }

    if (days !== undefined) {
      const invalidDays =
        days.filter(
          (day) =>
            !VALID_DAYS.includes(day),
        );

      if (
        invalidDays.length > 0
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid reminder day: ${invalidDays.join(
            ', ',
          )}`,
        });
      }
    }

    if (enabled !== undefined) {
      reminder.enabled = enabled;
    }

    if (time !== undefined) {
      reminder.time =
        time.trim();
    }

    if (days !== undefined) {
      reminder.days =
        normalizeDays(days);
    }

    if (
      soundEnabled !== undefined
    ) {
      reminder.soundEnabled =
        soundEnabled;
    }

    if (
      vibrationEnabled !== undefined
    ) {
      reminder.vibrationEnabled =
        vibrationEnabled;
    }

    if (
      motivationalMessage !==
      undefined
    ) {
      reminder.motivationalMessage =
        motivationalMessage;
    }

    if (timezone !== undefined) {
      reminder.timezone =
        timezone;
    }

    if (label !== undefined) {
      reminder.label = label;
    }

    if (
      reminder.enabled &&
      reminder.days.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Select at least one reminder day when the reminder is enabled.',
      });
    }

    await reminder.save();

    return res.status(200).json({
      success: true,
      message:
        'Workout reminder updated successfully.',
      data: reminder,
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
        'Failed to update workout reminder.',
    });
  }
}

/*
|--------------------------------------------------------------------------
| DELETE REMINDER
|--------------------------------------------------------------------------
| DELETE /api/member4/reminders/:id
*/

async function deleteReminder(
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
          'Invalid reminder ID.',
      });
    }

    const reminder =
      await WorkoutReminder.findOneAndDelete(
        {
          _id: id,
          userId: req.user.id,
        },
      );

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message:
          'Workout reminder not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Workout reminder deleted successfully.',
      data: {
        id: reminder._id,
      },
    });
  } catch (error) {
    // Storage errors are sanitized below.

    return res.status(500).json({
      success: false,
      message:
        'Failed to delete workout reminder.',
    });
  }
}
return { createReminder, getReminders, getReminderById, updateReminder, deleteReminder };
}
