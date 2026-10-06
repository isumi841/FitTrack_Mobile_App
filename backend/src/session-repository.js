export const SESSION_COLLECTION = 'workoutsessions';
export function createSessionRepository(odm) {
  const schema = new odm.Schema({
    _id: String, ownerId: { type: String, required: true }, workoutId: String,
    createFingerprint: String, snapshot: odm.Schema.Types.Mixed,
    status: { type: String, enum: ['running', 'paused', 'completed', 'ended-early'] },
    startedAt: Number, updatedAt: Number, finishedAt: Number,
    phase: Number, remainingMs: Number, elapsedMs: Number,
    workSeconds: Number, restSeconds: Number, completedSets: Number, skippedSets: Number,
    completedIntervals: [Number], skippedIntervals: [Number],
    note: String, revision: Number, lastOperation: odm.Schema.Types.Mixed,
  }, { collection: SESSION_COLLECTION, versionKey: false, strict: 'throw', autoCreate: false, autoIndex: false });
  const Model = odm.models.WorkoutSession ?? odm.model('WorkoutSession', schema);
  const clean = doc => { if (!doc) return null; const { _id, ...rest } = doc; return { id: _id, ...rest }; };
  return {
    // Only this collection receives an index. No syncIndexes or global model init.
    initialize: () => Model.collection.createIndex({ ownerId: 1, startedAt: -1 }),
    async create(session) {
      const { id, ...rest } = session;
      try { return clean((await Model.create({ _id: id, ...rest })).toObject()); }
      catch (error) { if (error.code !== 11000) throw error; return this.get(session.ownerId, id); }
    },
    async get(ownerId, id) { return clean(await Model.findOne({ _id: id, ownerId }).lean()); },
    async list(ownerId) { return (await Model.find({ ownerId }).sort({ startedAt: -1 }).limit(200).lean()).map(clean); },
    async update(ownerId, id, revision, session) {
      const { id: _id, ownerId: _owner, ...fields } = session;
      return clean(await Model.findOneAndUpdate({ _id: id, ownerId, revision }, { $set: fields }, { returnDocument: 'after', runValidators: true }).lean());
    },
    async delete(ownerId, id, revision) {
      return (await Model.deleteOne({ _id: id, ownerId, revision, status: { $in: ['completed', 'ended-early'] } })).deletedCount === 1;
    },
  };
}
