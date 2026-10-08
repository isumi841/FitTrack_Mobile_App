const Workout = require("../models/workout");

const getAllAdminWorkouts = async (req, res) => {
  const databaseName = Workout.db.name || "(disconnected)";
  const collectionName = Workout.collection.name;

  console.info("Admin workout request", {
    route: req.originalUrl,
    database: databaseName,
    collection: collectionName,
  });

  try {
    const workouts = await Workout.find({});

    console.info("Admin workout request completed", {
      route: req.originalUrl,
      database: databaseName,
      collection: collectionName,
      count: workouts.length,
    });

    res.status(200).json({
      success: true,
      count: workouts.length,
      data: workouts,
    });
  } catch (error) {
    console.error("Admin workout request failed", {
      route: req.originalUrl,
      database: databaseName,
      collection: collectionName,
      error,
      message: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

const getWorkouts = async (req, res) => {
  try {
    const {
      search,
      category,
      difficulty,
      duration,
      equipment,
      lowImpact,
    } = req.query;

    const filter = {
      active: true,
    };

    if (category) {
      filter.category = category;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (duration) {
      filter.duration = Number(duration);
    }

    if (equipment) {
      filter.equipment = equipment;
    }

    if (lowImpact === "true") {
      filter.lowImpact = true;
    }

    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          category: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const workouts = await Workout.find(filter);

    res.status(200).json({
      success: true,
      count: workouts.length,
      data: workouts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getWorkoutById = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found",
      });
    }

    res.status(200).json({
      success: true,
      data: workout,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createWorkout = async (req, res) => {
  try {
    const workout = await Workout.create(req.body);

    res.status(201).json({
      success: true,
      data: workout,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateWorkout = async (req, res) => {
  try {
    const workout = await Workout.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found",
      });
    }

    res.status(200).json({
      success: true,
      data: workout,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findByIdAndDelete(
      req.params.id
    );

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Workout deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllAdminWorkouts,
  getWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
};