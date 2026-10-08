const express = require("express");

const {
  getAllAdminWorkouts,
  getWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
} = require("../controllers/workoutController");

const router = express.Router();

router.get("/admin", getAllAdminWorkouts);
router.get("/admin/all", getAllAdminWorkouts);
router.get("/", getWorkouts);
router.get("/:id", getWorkoutById);
router.post("/", createWorkout);
router.put("/:id", updateWorkout);
router.delete("/:id", deleteWorkout);

module.exports = router;