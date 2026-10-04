// Database doubles for HTTP route tests. Atlas transactions and indexes still
// need an integration check against a configured MongoDB Atlas cluster.
function createMemoryModels() {
  const state = { users: [], pending: [], locks: [], failUserCreate: false };
  let nextId = 1;
  let transactionQueue = Promise.resolve();
  const copy = (value) => value === undefined ? undefined : structuredClone(value);

  function matches(document, filter) {
    return Object.entries(filter).every(([key, expected]) => {
      const actual = document[key];
      if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
        return Object.entries(expected).every(([operator, value]) => {
          if (operator === '$gt') return actual > value;
          if (operator === '$lt') return actual < value;
          if (operator === '$lte') return actual <= value;
          return false;
        });
      }
      if (expected instanceof Date) return actual instanceof Date && actual.getTime() === expected.getTime();
      return actual === expected;
    });
  }

  function query(run) {
    let promise;
    const execute = () => promise || (promise = Promise.resolve().then(run));
    return {
      select() { return this; },
      lean() { return this; },
      then(resolve, reject) { return execute().then(resolve, reject); },
    };
  }

  function uniqueError() {
    const error = new Error('Duplicate email');
    error.code = 11000;
    return error;
  }

  function applyUpdate(document, update) {
    Object.assign(document, copy(update.$set || {}));
    for (const [key, value] of Object.entries(update.$inc || {})) {
      document[key] = (document[key] || 0) + value;
    }
  }

  const User = {
    exists: (filter) => query(() => state.users.some((user) => matches(user, filter))),
    findOne: (filter) => query(() => copy(state.users.find((user) => matches(user, filter)) || null)),
    async create(values) {
      if (state.failUserCreate) throw new Error('Database unavailable (private diagnostic)');
      const input = values[0];
      if (state.users.some((user) => user.email === input.email)) throw uniqueError();
      const user = { ...copy(input), _id: String(nextId++), createdAt: new Date() };
      state.users.push(user);
      return [copy(user)];
    },
  };

  const EmailVerification = {
    findOne: (filter) => query(() => copy(state.pending.find((pending) => matches(pending, filter)) || null)),
    findOneAndUpdate: (filter, update, options) => query(() => {
      const pending = state.pending.find((record) => matches(record, filter));
      if (!pending) return null;
      const previous = copy(pending);
      applyUpdate(pending, update);
      return options?.returnDocument === 'after' || options?.new ? copy(pending) : previous;
    }),
    async create(value) {
      if (state.pending.some((pending) => pending.email === value.email)) throw uniqueError();
      const pending = { ...copy(value), _id: String(nextId++), createdAt: new Date() };
      state.pending.push(pending);
      return copy(pending);
    },
    async updateOne(filter, update) {
      const pending = state.pending.find((record) => matches(record, filter));
      if (!pending) return { modifiedCount: 0 };
      applyUpdate(pending, update);
      return { modifiedCount: 1 };
    },
    async deleteOne(filter) {
      const index = state.pending.findIndex((record) => matches(record, filter));
      if (index === -1) return { deletedCount: 0 };
      state.pending.splice(index, 1);
      return { deletedCount: 1 };
    },
  };

  const AuthEmailLock = {
    findOneAndUpdate: (filter, update, options) => query(() => {
      const lock = state.locks.find((record) => matches(record, filter));
      if (lock) {
        applyUpdate(lock, update);
        return copy(lock);
      }
      if (!options?.upsert) return null;
      const email = update.$set?.email;
      if (state.locks.some((record) => record.email === email)) throw uniqueError();
      const created = { ...copy(update.$set || {}), _id: String(nextId++) };
      state.locks.push(created);
      return copy(created);
    }),
    async deleteOne(filter) {
      const index = state.locks.findIndex((record) => matches(record, filter));
      if (index === -1) return { deletedCount: 0 };
      state.locks.splice(index, 1);
      return { deletedCount: 1 };
    },
  };

  async function startSession() {
    return {
      async withTransaction(work) {
        const previous = transactionQueue;
        let release;
        transactionQueue = new Promise((resolve) => { release = resolve; });
        await previous;
        const snapshot = { users: copy(state.users), pending: copy(state.pending) };
        try {
          return await work();
        } catch (error) {
          state.users = snapshot.users;
          state.pending = snapshot.pending;
          throw error;
        } finally {
          release();
        }
      },
      async endSession() {},
    };
  }

  return { User, EmailVerification, AuthEmailLock, state, startSession };
}

module.exports = { createMemoryModels };
