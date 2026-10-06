// Used only by automated tests. Never connected to the shared database.
export class MemoryRepository {
  records = new Map();
  async get(owner, id) { const s = this.records.get(id); return s?.ownerId === owner ? structuredClone(s) : null; }
  async list(owner) { return structuredClone([...this.records.values()].filter(s => s.ownerId === owner)); }
  async create(s) { if (!this.records.has(s.id)) this.records.set(s.id, structuredClone(s)); return this.get(s.ownerId, s.id); }
  async update(owner, id, revision, s) {
    const old = this.records.get(id);
    if (!old || old.ownerId !== owner || old.revision !== revision) return null;
    this.records.set(id, structuredClone(s)); return structuredClone(s);
  }
  async delete(owner, id, revision) {
    const s = this.records.get(id);
    if (!s || s.ownerId !== owner || s.revision !== revision || !['completed', 'ended-early'].includes(s.status)) return false;
    return this.records.delete(id);
  }
}
