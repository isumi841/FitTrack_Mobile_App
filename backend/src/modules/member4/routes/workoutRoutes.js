import express from 'express';

import { devAuth } from '../../../middleware/devAuth.js';

import {
    createWorkout,
    deleteWorkout,
    getWorkoutById,
    getWorkouts,
    updateWorkout,
} from '../controllers/workoutController.js';

const router = express.Router();

router.use(devAuth);

router
  .route('/')
  .post(createWorkout)
  .get(getWorkouts);

router
  .route('/:id')
  .get(getWorkoutById)
  .patch(updateWorkout)
  .delete(deleteWorkout);

export default router;