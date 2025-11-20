// userStore removed in favor of Firebase Auth and server-side profile stores
// Keep a minimal API to avoid breaking imports while migrating calls to Firebase-backed profiles.

export const userStore = {
  create: async () => { throw new Error('userStore.create() is removed — use Firebase Auth user creation flow'); },
  findOne: async () => null,
  findById: async () => null,
  findByIdAndUpdate: async () => null,
  delete: async () => false,
  clear: async () => { /* no-op */ }
};

export default userStore;
