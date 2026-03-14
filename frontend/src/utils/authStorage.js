const AUTH_USER_KEY = 'tsa_user';
const AUTH_CLEARED_EVENT = 'toolshare:auth-cleared';

export const authStorage = {
  setSession({ user }) {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    }
  },

  getStoredUser() {
    const rawUser = localStorage.getItem(AUTH_USER_KEY);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser);
    } catch {
      localStorage.removeItem(AUTH_USER_KEY);
      return null;
    }
  },

  clearSession() {
    localStorage.removeItem(AUTH_USER_KEY);
    window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
  },

  keys: {
    user: AUTH_USER_KEY,
    clearedEvent: AUTH_CLEARED_EVENT,
  },
};
