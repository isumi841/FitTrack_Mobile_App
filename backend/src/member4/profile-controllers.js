import mongoose from 'mongoose';
export function profileControllers({ UserProfile, cloudinary }) {
/*
|--------------------------------------------------------------------------
| CREATE PROFILE
|--------------------------------------------------------------------------
| POST /api/member4/profile
*/
function uploadImageBuffer(
  buffer,
) {
  return new Promise(
    (resolve, reject) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              'fittrack/profile-photos',

            resource_type:
              'image',
          },

          (
            error,
            result,
          ) => {
            if (error) {
              reject(error);
              return;
            }

            if (!result) {
              reject(
                new Error(
                  'Cloudinary did not return an upload result.',
                ),
              );
              return;
            }

            resolve(result);
          },
        );

      stream.end(buffer);
    },
  );
}

async function uploadProfileAvatar(
  req,
  res,
) {
  let uploadedImage = null;

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            'Please select a profile photo.',
        });
    }

    const profile =
      await UserProfile.findOne({
        userId: req.user.id,
      });

    if (!profile) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            'Please save your profile before uploading a photo.',
        });
    }

    uploadedImage =
      await uploadImageBuffer(
        req.file.buffer,
      );

    const previousPublicId =
      profile.avatarPublicId;

    profile.avatarUrl =
      uploadedImage.secure_url;

    profile.avatarPublicId =
      uploadedImage.public_id;

    await profile.save();

    /*
     * Remove the old image
     * only after the new one
     * is saved successfully.
     */
    if (previousPublicId) {
      void cloudinary.uploader
        .destroy(
          previousPublicId,
        )
        .catch((error) => {
          console.warn(
            'Unable to remove old avatar:',
            error.message,
          );
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        message:
          'Profile photo updated successfully.',
        data: profile,
      });
  } catch (error) {
    // Storage errors are sanitized below.

    /*
     * Prevent an orphan image
     * if MongoDB saving fails.
     */
    if (
      uploadedImage?.public_id
    ) {
      try {
        await cloudinary.uploader.destroy(
          uploadedImage.public_id,
        );
      } catch {
        // Ignore cleanup failure.
      }
    }

    return res
      .status(500)
      .json({
        success: false,
        message:
          'Failed to upload profile photo.',
      });
  }
}

async function deleteProfileAvatar(
  req,
  res,
) {
  try {
    const profile =
      await UserProfile.findOne({
        userId: req.user.id,
      });

    if (!profile) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            'Profile not found.',
        });
    }

    const previousPublicId =
      profile.avatarPublicId;

    profile.avatarUrl = '';
    profile.avatarPublicId = '';

    await profile.save();

    if (previousPublicId) {
      void cloudinary.uploader
        .destroy(
          previousPublicId,
        )
        .catch((error) => {
          console.warn(
            'Unable to remove Cloudinary avatar:',
            error.message,
          );
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        message:
          'Profile photo removed successfully.',
        data: profile,
      });
  } catch (error) {
    // Storage errors are sanitized below.

    return res
      .status(500)
      .json({
        success: false,
        message:
          'Failed to remove profile photo.',
      });
  }
}

async function createProfile(
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

    // Storage errors are sanitized below.

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

async function getProfile(
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
    // Storage errors are sanitized below.

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

async function updateProfile(
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

    // Storage errors are sanitized below.

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

async function deleteProfile(
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
    // Storage errors are sanitized below.

    return res.status(500).json({
      success: false,
      message:
        'Failed to delete profile.',
    });
  }
}
return { uploadProfileAvatar, deleteProfileAvatar, createProfile, getProfile, updateProfile, deleteProfile };
}
