/**
 * Livestock Connect - Core utilities
 * Load before auth.js and livestock.js.
 */

(function () {
  'use strict';

  const getSupabase = () => window.SupabaseClient ? window.SupabaseClient.getSupabase() : null;

  const getCurrentUser = async () =>
    window.SupabaseClient ? await window.SupabaseClient.getCurrentUser() : null;

  const isLoggedIn = async () => !!(await getCurrentUser());

  const requireAuth = async (requiredRole) => {
    const user = await getCurrentUser();
    const path = window.location.pathname || '';

    if (!user || !user.role) {
      // Not logged in — avoid redirecting if already on login/index to prevent loops
      const safePages = ['login.html', 'index.html', 'register.html'];
      const onSafePage = safePages.some(p => path.endsWith(p));
      if (!onSafePage) {
        const loginUrl = (path.includes('/farmer/') || path.includes('/buyer/'))
          ? '../login.html' : 'login.html';
        window.location.replace(loginUrl);
      }
      return false;
    }

    if (requiredRole && user.role !== requiredRole) {
      // Logged in but wrong role — redirect to their correct page
      const isSubdir = path.includes('/farmer/') || path.includes('/buyer/');
      const base = isSubdir ? '../' : '';
      window.location.replace(
        user.role === 'farmer'
          ? base + 'dashboard.html'
          : base + 'buyer/marketplace.html'
      );
      return false;
    }

    return true;
  };

  const logout = async () => {
    const client = getSupabase();
    if (client) await client.auth.signOut();
    window.location.replace('index.html');
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = [
      'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
      'background:' + (type === 'error' ? '#c0392b' : '#27ae60'),
      'color:#fff', 'padding:10px 20px', 'border-radius:8px',
      'font-size:14px', 'z-index:9999', 'max-width:90vw', 'text-align:center',
      'box-shadow:0 2px 8px rgba(0,0,0,0.2)'
    ].join(';');
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const formatUGX = (num) => {
    if (num == null || isNaN(num)) return 'UGX —';
    return 'UGX ' + Number(num).toLocaleString('en-UG');
  };

  const getHealthBadgeClass = (status) => {
    if (!status) return 'badge-default';
    const s = status.toLowerCase();
    if (s === 'healthy') return 'badge-success';
    if (s === 'sick' || s === 'ill') return 'badge-danger';
    if (s === 'recovering') return 'badge-warning';
    return 'badge-default';
  };

  const onPageShowRefresh = (callback) => {
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) callback();
    });
  };

  window.LivestockConnect = {
    getCurrentUser,
    isLoggedIn,
    requireAuth,
    logout,
    showToast,
    formatUGX,
    getHealthBadgeClass,
    onPageShowRefresh
  };
})();
