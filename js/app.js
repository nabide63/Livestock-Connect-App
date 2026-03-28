/**
 * Livestock Connect - Core utilities (powered by Supabase)
 * Load before auth.js and livestock.js.
 */

(function () {
  'use strict';

  const getSupabase = () => window.SupabaseClient ? window.SupabaseClient.getSupabase() : null;

  const getCurrentUser = async () => window.SupabaseClient ? await window.SupabaseClient.getCurrentUser() : null;

  const isLoggedIn = async () => !!(await getCurrentUser());

  const requireAuth = async (requiredRole) => {
    const user = await getCurrentUser();
    if (!user) {
      const path = window.location.pathname || '';
      const loginUrl = (path.includes('/farmer/') || path.includes('/buyer/')) ? '../login.html' : 'login.html';
      window.location.href = loginUrl;
      return false;
    }
    if (requiredRole && user.role !== requiredRole) {
      window.location.href = user.role === 'farmer' ? 'dashboard.html' : 'buyer/marketplace.html';
      return false;
    }
    return true;
  };

  const logout = async () => {
    const client = getSupabase();
    if (client) await client.auth.signOut();
    window.location.href = 'index.html';
  };

  // Utility functions
  const showToast = (message, type = 'success') => {   };
  const formatUGX = (num) => {  };
  const getHealthBadgeClass = (status) => { };
  const onPageShowRefresh = (callback) => {  };

  window.addEventListener('pageshow', (e) => { if (e.persisted) window.location.reload(); });

  window.LivestockConnect = {
    getCurrentUser,        // ← now async
    isLoggedIn,            // ← now async
    requireAuth,           // ← now async
    logout,                // ← now async
    showToast,
    formatUGX,
    getHealthBadgeClass,
    onPageShowRefresh
  };
})();
