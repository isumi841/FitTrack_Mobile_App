// Isolated models with the real Member4 schemas. Never connects to MongoDB.
import mongoose from 'mongoose';
import { createMember4Models } from '../src/member4/index.js';
export function memoryMember4Models() {
  const odm = new mongoose.Mongoose();
  const schemas = createMember4Models(odm);
  const models = {};
  for (const [name, Model] of Object.entries(schemas)) {
    const records = new Map();
    const matches = (record, filter) => Object.entries(filter).every(([key, value]) => String(record[key]) === String(value));
    const wrap = value => {
      if (!value) return null;
      const doc = new Model(value);
      doc.save = async () => { await doc.validate(); doc.updatedAt = new Date(); records.set(String(doc._id), doc.toObject()); return doc; };
      return doc;
    };
    const get = filter => [...records.values()].find(record => matches(record, filter));
    models[name] = {
      createIndexes: async () => {},
      create: async value => { const doc = wrap({ ...value, createdAt: new Date() }); return doc.save(); },
      find: filter => ({ sort: async () => [...records.values()].filter(record => matches(record, filter)).map(wrap) }),
      findOne: async filter => wrap(get(filter)),
      findOneAndUpdate: async (filter, update) => { const doc = wrap(get(filter)); if (!doc) return null; Object.assign(doc, update); return doc.save(); },
      findOneAndDelete: async filter => { const doc = wrap(get(filter)); if (doc) records.delete(String(doc._id)); return doc; },
    };
  }
  return { models, odm };
}
