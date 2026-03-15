/**
 * Livestock Connect - Core storage & utilities
 * RBAC: Farmer (Seller) & Buyer. Load before auth.js and livestock.js.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    USERS: 'livestock_connect_users',
    CURRENT_USER: 'livestock_connect_current_user',
    LISTINGS: 'livestock_connect_listings',
    NOTIFICATIONS: 'livestock_connect_notifications'
  };

  const getStorage = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const setStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  };

  const getUsers = () => getStorage(STORAGE_KEYS.USERS, []);
  const saveUsers = (users) => setStorage(STORAGE_KEYS.USERS, users);
  const getCurrentUser = () => getStorage(STORAGE_KEYS.CURRENT_USER, null);
  const setCurrentUser = (user) => setStorage(STORAGE_KEYS.CURRENT_USER, user);
  const isLoggedIn = () => !!getCurrentUser();

  const getLoginUrl = () => {
    const path = window.location.pathname || '';
    if (path.indexOf('/farmer/') !== -1 || path.indexOf('/buyer/') !== -1) return '../login.html';
    return 'login.html';
  };

  const requireAuth = (requiredRole) => {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = getLoginUrl();
      return false;
    }
    if (requiredRole && user.role !== requiredRole) {
      if (user.role === 'farmer') window.location.href = window.location.pathname.indexOf('/buyer/') !== -1 ? '../dashboard.html' : 'dashboard.html';
      else window.location.href = window.location.pathname.indexOf('/farmer/') !== -1 ? '../buyer/marketplace.html' : 'buyer/marketplace.html';
      return false;
    }
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    const path = window.location.pathname || '';
    const base = path.indexOf('/farmer/') !== -1 || path.indexOf('/buyer/') !== -1 ? '..' : '';
    window.location.href = base ? base + '/index.html' : 'index.html';
  };

  const showToast = (message, type = 'success') => {
    const existing = document.getElementById('toast-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'notification-toast alert-' + (type === 'error' ? 'error' : 'success');
    container.setAttribute('role', 'alert');
    container.textContent = message;
    document.body.appendChild(container);

    setTimeout(() => {
      if (container.parentNode) container.remove();
    }, 3000);
  };

  const formatUGX = (num) => {
    const n = typeof num === 'number' ? num : parseInt(num, 10);
    if (isNaN(n)) return '— UGX';
    return new Intl.NumberFormat('en-UG', { style: 'decimal', minimumFractionDigits: 0 }).format(n) + ' UGX';
  };

  const getHealthBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('sick')) return 'badge-sick';
    if (s.includes('checkup')) return 'badge-checkup';
    return 'badge-healthy';
  };

  /**
   * Registers a callback to run when the page is shown again (back/forward cache or tab focus).
   * Call this with your page's "refresh content" function so data stays fresh when navigating.
   */
  const onPageShowRefresh = (callback) => {
    if (typeof callback !== 'function') return;
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) callback();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') callback();
    });
  };

  window.LivestockConnect = {
    getStorage,
    setStorage,
    getUsers,
    saveUsers,
    getCurrentUser,
    setCurrentUser,
    isLoggedIn,
    requireAuth,
    logout,
    showToast,
    formatUGX,
    getHealthBadgeClass,
    onPageShowRefresh,
    STORAGE_KEYS
  };
})();
