/**
 * Livestock Connect - Seed localStorage with mock data
 * Runs once so the app (and marketplace) looks like the real app with data.
 * Uses same storage keys and data shape as production.
 */

(function () {
  'use strict';

  const SEEDED_KEY = 'livestock_connect_seeded';

  const runSeed = () => {
    const LC = window.LivestockConnect;
    const MOCK = window.MOCK_DATA;
    if (!LC || !MOCK) return;

    try {
      const alreadySeeded = LC.getStorage(SEEDED_KEY, null);
      if (alreadySeeded) return;

      if (window.LivestockConnectSupabase && window.LivestockConnectSupabase.isSupabaseConfigured()) {
        window.LivestockConnectSupabase.seedMockData(MOCK).then((result) => {
          if (result.success) {
            LC.setStorage(SEEDED_KEY, '1');
          } else {
            console.warn('Supabase seed failed:', result.message);
          }
        }).catch((err) => {
          console.warn('Supabase seed failed:', err);
        });
        return;
      }

      if (MOCK.mockUsers && Array.isArray(MOCK.mockUsers)) {
        const existingUsers = LC.getUsers();
        if (existingUsers.length === 0) {
          LC.saveUsers(MOCK.mockUsers);
        }
      }

      if (MOCK.mockListings && Array.isArray(MOCK.mockListings)) {
        LC.setStorage(LC.STORAGE_KEYS.LISTINGS, MOCK.mockListings);
      }

      LC.setStorage(SEEDED_KEY, '1');
    } catch (e) {
      console.warn('Livestock Connect seed failed:', e);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runSeed);
  } else {
    runSeed();
  }
})();
