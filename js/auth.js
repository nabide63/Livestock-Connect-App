/**
 * Livestock Connect - Authentication (RBAC)
 * Register with role (farmer | buyer), login, role-based redirect.
 * Depends on: app.js (LivestockConnect)
 */

(function () {
  'use strict';

  const LC = window.LivestockConnect;
  if (!LC) return;

  const getUsers = LC.getUsers;
  const saveUsers = LC.saveUsers;
  const setCurrentUser = LC.setCurrentUser;
  const getCurrentUser = LC.getCurrentUser;

  const ROLES = { FARMER: 'farmer', BUYER: 'buyer' };

  /**
   * Register new user with role. Returns { success, message }.
   * @param {Object} data - { fullName, phone, location, role, password, confirmPassword }
   */
  const registerUser = (data) => {
    const { fullName, phone, location, role, password, confirmPassword } = data;

    if (!fullName || !phone || !location || !role || !password || !confirmPassword) {
      return { success: false, message: 'Please fill in all fields.' };
    }

    if (role !== ROLES.FARMER && role !== ROLES.BUYER) {
      return { success: false, message: 'Please select a role (Farmer or Buyer).' };
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
      location: (location || '').trim(),
      role: role,
      password: password,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(users);
    return { success: true, message: 'Account created. You can now log in.' };
  };

  /**
   * Login with phone and password. Returns { success, message, user }.
   * Redirect is handled by caller (e.g. login.html) based on user.role.
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
   * Get redirect URL after login based on role.
   */
  const getRedirectAfterLogin = (user) => {
    if (user.role === ROLES.FARMER) return 'dashboard.html';
    if (user.role === ROLES.BUYER) return 'buyer/marketplace.html';
    return 'index.html';
  };

  window.LivestockConnectAuth = {
    registerUser,
    loginUser,
    getRedirectAfterLogin,
    ROLES
  };
})();
