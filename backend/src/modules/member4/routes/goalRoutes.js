import express from 'express';

import { devAuth } from '../../../middleware/devAuth.js';

import {
    createGoal,
    deleteGoal,
    getGoalById,
    getGoals,
    updateGoal,
} from '../controllers/goalController.js';

const router = express.Router();

router.use(devAuth);

router
  .route('/')
  .post(createGoal)
  .get(getGoals);

router
  .route('/:id')
  .get(getGoalById)
  .patch(updateGoal)
  .delete(deleteGoal);

export default router;