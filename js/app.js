/**
 * Livestock Connect - Application Logic
 * Handles auth, livestock CRUD, localStorage, and UI utilities.
 * No frameworks - vanilla JS only.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    USERS: 'livestock_connect_users',
    CURRENT_USER: 'livestock_connect_current_user',
    LIVESTOCK: 'livestock_connect_livestock',
    NOTIFICATIONS: 'livestock_connect_notifications'
  };

  /**
   * Get item from localStorage with safe JSON parse
   */
  const getStorage = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  /**
   * Set item in localStorage
   */
  const setStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  };

  /**
   * Get all registered users (for login/register)
   */
  const getUsers = () => getStorage(STORAGE_KEYS.USERS, []);

  /**
   * Save users array
   */
  const saveUsers = (users) => setStorage(STORAGE_KEYS.USERS, users);

  /**
   * Get current logged-in user
   */
  const getCurrentUser = () => getStorage(STORAGE_KEYS.CURRENT_USER, null);

  /**
   * Set current user (login) or clear (logout)
   */
  const setCurrentUser = (user) => setStorage(STORAGE_KEYS.CURRENT_USER, user);

  /**
   * Check if user is logged in
   */
  const isLoggedIn = () => !!getCurrentUser();

  /**
   * Redirect to login if not authenticated (for protected pages)
   */
  const requireAuth = () => {
    if (!isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  };

  /**
   * Register new user. Returns { success, message }
   */
  const registerUser = (data) => {
    const { fullName, phone, farmLocation, livestockType, password, confirmPassword } = data;

    if (!fullName || !phone || !farmLocation || !livestockType || !password || !confirmPassword) {
      return { success: false, message: 'Please fill in all fields.' };
    }

    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match.' };
    }

    if (password.length < 4) {
      return { success: false, message: 'Password should be at least 4 characters.' };
    }

    const users = getUsers();
    const existing = users.find((u) => u.phone === phone.trim());
    if (existing) {
      return { success: false, message: 'This phone number is already registered.' };
    }

    const user = {
      id: Date.now().toString(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      farmLocation: farmLocation.trim(),
      livestockType: livestockType.trim(),
      password: password,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(users);
    return { success: true, message: 'Account created. You can now log in.' };
  };

  /**
   * Login with phone and password. Returns { success, message, user }
   */
  const loginUser = (phone, password) => {
    if (!phone || !password) {
      return { success: false, message: 'Please enter phone and password.' };
    }

    const users = getUsers();
    const user = users.find((u) => u.phone === phone.trim() && u.password === password);
    if (!user) {
      return { success: false, message: 'Wrong phone number or password.' };
    }

    const { password: _, ...userWithoutPassword } = user;
    setCurrentUser(userWithoutPassword);
    return { success: true, message: 'Login successful.', user: userWithoutPassword };
  };

  /**
   * Logout
   */
  const logout = () => {
    setCurrentUser(null);
    window.location.href = 'index.html';
  };

  /**
   * Get all livestock for current user
   */
  const getLivestock = () => {
    const user = getCurrentUser();
    if (!user) return [];
    const all = getStorage(STORAGE_KEYS.LIVESTOCK, []);
    return all.filter((l) => l.userId === user.id);
  };

  /**
   * Save livestock list (replace all for current user)
   */
  const saveLivestockList = (list) => {
    const user = getCurrentUser();
    if (!user) return false;
    const all = getStorage(STORAGE_KEYS.LIVESTOCK, []);
    const others = all.filter((l) => l.userId !== user.id);
    const mine = list.map((l) => ({ ...l, userId: user.id }));
    setStorage(STORAGE_KEYS.LIVESTOCK, [...others, ...mine]);
    return true;
  };

  /**
   * Add single livestock record
   */
  const addLivestock = (record) => {
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'Not logged in.' };

    const list = getLivestock();
    const newRecord = {
      id: Date.now().toString(),
      userId: user.id,
      animalType: record.animalType || '',
      age: record.age || '',
      weight: record.weight || '',
      healthStatus: record.healthStatus || 'Healthy',
      notes: record.notes || '',
      imageData: record.imageData || null,
      createdAt: new Date().toISOString()
    };

    list.push(newRecord);
    saveLivestockList(list);
    addNotification('Animal added', newRecord.animalType + ' was added to your records.');
    return { success: true, message: 'Livestock successfully added.', record: newRecord };
  };

  /**
   * Update livestock by id
   */
  const updateLivestock = (id, updates) => {
    const list = getLivestock();
    const index = list.findIndex((l) => l.id === id);
    if (index === -1) return { success: false, message: 'Record not found.' };

    list[index] = { ...list[index], ...updates };
    saveLivestockList(list);
    return { success: true, message: 'Record updated.' };
  };

  /**
   * Delete livestock by id
   */
  const deleteLivestock = (id) => {
    const list = getLivestock().filter((l) => l.id !== id);
    saveLivestockList(list);
    return { success: true, message: 'Record deleted.' };
  };

  /**
   * Get single livestock by id
   */
  const getLivestockById = (id) => getLivestock().find((l) => l.id === id);

  /**
   * Simple statistics from livestock list
   */
  const getLivestockStats = () => {
    const list = getLivestock();
    const total = list.length;
    const byType = {};
    let totalWeight = 0;
    let weightCount = 0;

    list.forEach((l) => {
      byType[l.animalType] = (byType[l.animalType] || 0) + 1;
      const w = parseFloat(l.weight);
      if (!isNaN(w)) {
        totalWeight += w;
        weightCount++;
      }
    });

    const recent = [...list]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    return {
      total,
      byType,
      averageWeight: weightCount > 0 ? (totalWeight / weightCount).toFixed(1) : 0,
      recentlyAdded: recent.length
    };
  };

  /**
   * Add a simple notification (stored for profile page)
   */
  const addNotification = (title, message) => {
    const list = getStorage(STORAGE_KEYS.NOTIFICATIONS, []);
    list.unshift({
      id: Date.now().toString(),
      title: title || 'Notification',
      message: message || '',
      createdAt: new Date().toISOString()
    });
    setStorage(STORAGE_KEYS.NOTIFICATIONS, list.slice(0, 50));
  };

  /**
   * Show toast notification
   */
  const showToast = (message, type = 'success') => {
    const existing = document.getElementById('toast-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = `notification-toast alert-${type === 'error' ? 'error' : 'success'}`;
    container.setAttribute('role', 'alert');
    container.textContent = message;
    document.body.appendChild(container);

    setTimeout(() => {
      if (container.parentNode) container.remove();
    }, 3000);
  };

  /**
   * Format number as UGX
   */
  const formatUGX = (num) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(num) + ' UGX';
  };

  /**
   * Get health badge class from status
   */
  const getHealthBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('sick')) return 'sick';
    if (s.includes('checkup')) return 'checkup';
    return 'healthy';
  };

  // Expose public API on window
  window.LivestockConnect = {
    getStorage,
    setStorage,
    getUsers,
    saveUsers,
    getCurrentUser,
    setCurrentUser,
    isLoggedIn,
    requireAuth,
    registerUser,
    loginUser,
    logout,
    getLivestock,
    saveLivestockList,
    addLivestock,
    updateLivestock,
    deleteLivestock,
    getLivestockById,
    getLivestockStats,
    addNotification,
    showToast,
    formatUGX,
    getHealthBadgeClass,
    STORAGE_KEYS
  };
})();
