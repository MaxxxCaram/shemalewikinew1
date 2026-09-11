import PocketBase from 'pocketbase';

export const pb = new PocketBase('https://api.shemalewiki.online');

// Persist auth session across page reloads (localStorage)
pb.authStore.onChange(() => {
  // PocketBase SDK auto-saves to localStorage by default
});

/**
 * Login a trans companion into the users collection.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<RecordModel>} the authenticated user record
 */
export async function login(email, password) {
  const authData = await pb.collection('users').authWithPassword(email, password);
  return authData.record;
}

/**
 * Logout current user.
 */
export function logout() {
  pb.authStore.clear();
}

/**
 * Get current authenticated user record (or null).
 */
export function currentUser() {
  return pb.authStore.isValid ? pb.authStore.record : null;
}
