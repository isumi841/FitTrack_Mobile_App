import express from 'express';

import { devAuth } from '../../../middleware/devAuth.js';

import {
    createProfile,
    deleteProfile,
    getProfile,
    updateProfile,
} from '../controllers/profileController.js';

const router = express.Router();

router.use(devAuth);

router
  .route('/')
  .post(createProfile)
  .get(getProfile)
  .patch(updateProfile)
  .delete(deleteProfile);

export default router;