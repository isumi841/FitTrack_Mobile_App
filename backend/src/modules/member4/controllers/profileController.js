import { UserProfile } from '../models/UserProfile.js';

/*
|--------------------------------------------------------------------------
| CREATE PROFILE
|--------------------------------------------------------------------------
| POST /api/member4/profile
*/

export async function createProfile(
  req,
  res,
) {
  try {
    const existingProfile =
      await UserProfile.findOne({
        userId: req.user.id,
      });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message:
          'A profile already exists for this user.',
      });
    }

    const {
      fullName,
      username,
      email,
      phone,
      dateOfBirth,
      gender,
      bio,
      focus,
      avatarUrl,
    } = req.body;

    if (!fullName || !username) {
      return res.status(400).json({
        success: false,
        message:
          'fullName and username are required.',
      });
    }

    const profile =
      await UserProfile.create({
        userId: req.user.id,
        fullName,
        username,
        email,
        phone,
        dateOfBirth:
          dateOfBirth || null,
        gender,
        bio,
        focus:
          Array.isArray(focus)
            ? focus
            : [],
        avatarUrl,
      });

    return res.status(201).json({
      success: true,
      message:
        'Profile created successfully.',
      data: profile,
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
      'Create profile error:',
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to create profile.',
    });
  }
}

/*
|--------------------------------------------------------------------------
| READ PROFILE
|--------------------------------------------------------------------------
| GET /api/member4/profile
*/

export async function getProfile(
  req,
  res,
) {
  try {
    const profile =
      await UserProfile.findOne({
        userId: req.user.id,
      });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message:
          'Profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error(
      'Get profile error:',
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to load profile.',
    });
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PROFILE
|--------------------------------------------------------------------------
| PATCH /api/member4/profile
*/

export async function updateProfile(
  req,
  res,
) {
  try {
    const allowedFields = [
      'fullName',
      'username',
      'email',
      'phone',
      'dateOfBirth',
      'gender',
      'bio',
      'focus',
      'avatarUrl',
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

    const profile =
      await UserProfile.findOneAndUpdate(
        {
          userId: req.user.id,
        },
        updates,
        {
          new: true,
          runValidators: true,
        },
      );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message:
          'Profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Profile updated successfully.',
      data: profile,
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
      'Update profile error:',
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to update profile.',
    });
  }
}

/*
|--------------------------------------------------------------------------
| DELETE PROFILE
|--------------------------------------------------------------------------
| DELETE /api/member4/profile
*/

export async function deleteProfile(
  req,
  res,
) {
  try {
    const profile =
      await UserProfile.findOneAndDelete({
        userId: req.user.id,
      });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message:
          'Profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Profile deleted successfully.',
    });
  } catch (error) {
    console.error(
      'Delete profile error:',
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to delete profile.',
    });
  }
}