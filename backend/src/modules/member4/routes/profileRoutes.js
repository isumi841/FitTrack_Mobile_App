import express from 'express';
import {
    deleteProfileAvatar,
    uploadProfileAvatar,
} from '../controllers/profileController.js';

import { avatarUpload } from '../../../middleware/avatarUpload.js';

import { devAuth } from '../../../middleware/devAuth.js';

import {
    createProfile,
    deleteProfile,
    getProfile,
    updateProfile,
} from '../controllers/profileController.js';

const router = express.Router();

router.use(devAuth);

router.post(
  '/avatar',
  devAuth,
  avatarUpload,
  uploadProfileAvatar,
);

router.delete(
  '/avatar',
  devAuth,
  deleteProfileAvatar,
);

router
  .route('/')
  .post(createProfile)
  .get(getProfile)
  .patch(updateProfile)
  .delete(deleteProfile);

export default router;