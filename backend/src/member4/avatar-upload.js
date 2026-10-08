import multer from 'multer';

const allowedTypes =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ]);

const upload = multer({
  storage:
    multer.memoryStorage(),

  limits: {
    fileSize:
      5 * 1024 * 1024,
  },

  fileFilter:
    (req, file, callback) => {
      if (
        !allowedTypes.has(
          file.mimetype,
        )
      ) {
        return callback(
          new Error(
            'Only JPG, PNG, WEBP, HEIC, and HEIF images are allowed.',
          ),
        );
      }

      callback(null, true);
    },
});

export function avatarUpload(
  req,
  res,
  next,
) {
  upload.single('avatar')(
    req,
    res,
    (error) => {
      if (error) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              error.message ||
              'Unable to upload image.',
          });
      }

      next();
    },
  );
}