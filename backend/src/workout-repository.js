// Adapted from member2_active_workout da9ba24: server/models/workout.js.
// Shared collection; public reads stay active-only, admin operations are authorized in routes.
export function createWorkoutRepository(odm, databaseName = 'fittrack_db') {
  const connection = odm.connection.useDb(databaseName, { useCache: true });
  const exercise = new odm.Schema({ title: String, target: String }, { _id: false });
  const schema = new odm.Schema({
    title: String, category: String, difficulty: String, duration: Number,
    equipment: String, description: String, lowImpact: Boolean,
    exercises: [exercise], active: Boolean,
  }, { collection: 'workouts', timestamps: true, autoCreate: false, autoIndex: false, bufferCommands: false });
  const model = connection.models.Workout ?? connection.model('Workout', schema);
  return {
    list: filter => model.find({ ...filter, active: true }).sort({ createdAt: 1, _id: 1 }).lean().exec(),
    get: id => /^[a-f0-9]{24}$/i.test(id) ? model.findOne({ _id: id, active: true }).lean().exec() : Promise.resolve(null),
    admin: {
      list: () => model.find({}).sort({ createdAt: -1, _id: -1 }).lean().exec(),
      get: id => model.findOne({ _id: id }).lean().exec(),
      create: async input => (await model.create(input)).toObject(),
      update: (id, input) => model.findOneAndUpdate({ _id: id }, { $set: input }, { new: true, runValidators: true }).lean().exec(),
      remove: id => model.findOneAndDelete({ _id: id }).lean().exec(),
    },
  };
}

export function publicWorkout(record) {
  return {
    _id: String(record._id), title: record.title, category: record.category,
    difficulty: record.difficulty, duration: record.duration,
    equipment: record.equipment ?? 'No equipment', description: record.description,
    lowImpact: record.lowImpact ?? false,
    exercises: (record.exercises ?? []).map(({ title, target }) => ({ title, target })),
  };
}

export function workoutOverview(record) {
  const value = publicWorkout(record);
  return {
    id: value._id, name: value.title, category: value.category, level: value.difficulty,
    durationSeconds: value.duration * 60, equipment: [value.equipment],
    description: value.description, lowImpact: value.lowImpact,
    sample: false, sessionReady: false,
    exercises: value.exercises.map((exercise, index) => ({
      id: `${value._id}-movement-${index + 1}`, name: exercise.title, target: exercise.target,
    })),
  };
}
