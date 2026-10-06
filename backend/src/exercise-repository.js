export const EXERCISE_COLLECTION = 'exercises';
export function publicExercise(record) {
  const { createdBy, createFingerprint, deletedAt, ...exercise } = record;
  return exercise;
}
export function createExerciseRepository(odm) {
  const schema = new odm.Schema({
    _id: String, workoutId: { type: String, required: true }, name: String,
    target: String, subtitle: String, cue: String, steps: [String], video: String,
    position: Number, revision: Number, createdAt: Number, updatedAt: Number,
    createdBy: String, createFingerprint: String, deletedAt: Number,
  }, { collection: EXERCISE_COLLECTION, versionKey: false, strict: 'throw', autoCreate: false, autoIndex: false });
  const Model = odm.models.Exercise ?? odm.model('Exercise', schema);
  const clean = doc => { if (!doc) return null; const { _id, ...rest } = doc; return { id: _id, ...rest }; };
  return {
    initialize: () => Model.collection.createIndex({ workoutId: 1, deletedAt: 1, position: 1, createdAt: 1 }),
    async get(id) { return clean(await Model.findOne({ _id: id }).lean()); },
    async list(workoutId) {
      return (await Model.find({ workoutId, deletedAt: { $exists: false } }).sort({ position: 1, createdAt: 1, _id: 1 }).lean()).map(clean);
    },
    async create(exercise) {
      const { id, ...fields } = exercise;
      try { return clean((await Model.create({ _id: id, ...fields })).toObject()); }
      catch (error) { if (error.code !== 11000) throw error; return this.get(id); }
    },
    async update(id, revision, fields) {
      return clean(await Model.findOneAndUpdate({ _id: id, revision, deletedAt: { $exists: false } },
        { $set: fields, $inc: { revision: 1 } }, { returnDocument: 'after', runValidators: true }).lean());
    },
    // Retain a tombstone so a delayed create retry cannot resurrect a deleted exercise.
    async delete(id, revision, now) {
      return (await Model.updateOne({ _id: id, revision, deletedAt: { $exists: false } },
        { $set: { deletedAt: now, updatedAt: now }, $inc: { revision: 1 } })).modifiedCount === 1;
    },
  };
}
