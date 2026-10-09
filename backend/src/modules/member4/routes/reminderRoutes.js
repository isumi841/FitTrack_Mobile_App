import express from 'express';

import { devAuth } from '../../../middleware/devAuth.js';

import {
    createReminder,
    deleteReminder,
    getReminderById,
    getReminders,
    updateReminder,
} from '../controllers/reminderController.js';

const router = express.Router();

router.use(devAuth);

router
  .route('/')
  .post(createReminder)
  .get(getReminders);

router
  .route('/:id')
  .get(getReminderById)
  .patch(updateReminder)
  .delete(deleteReminder);

export default router;