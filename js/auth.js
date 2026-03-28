/**
 * Livestock Connect - Email + Password Authentication
 */

(function () {
  'use strict';

  const LC = window.LivestockConnect || {};
  const ROLES = { FARMER: 'farmer', BUYER: 'buyer' };

  const registerUser = async (data) => {
    const { fullName, email, phone, location, role, password, confirmPassword } = data;

    if (!fullName || !email || !phone || !location || !role || !password || !confirmPassword) {
      return { success: false, message: 'Please fill in all fields.' };
    }
    if (role !== ROLES.FARMER && role !== ROLES.BUYER) {
      return { success: false, message: 'Please select a valid role.' };
    }
    if (password !== confirmPassword) return { success: false, message: 'Passwords do not match.' };
    if (password.length < 6) return { success: false, message: 'Password must be at least 6 characters.' };

    const client = window.SupabaseClient.getSupabase();
    if (!client) return { success: false, message: 'Supabase not initialized.' };

    try {
      const { data: authData, error } = await client.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            location: location.trim(),
            role
          }
        }
      });

      if (error) return { success: false, message: error.message };

      return { 
        success: true, 
        message: 'Account created successfully!' + (authData.session ? '' : ' Please check your email to confirm if required.') 
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  const loginUser = async (email, password) => {
    if (!email || !password) return { success: false, message: 'Please enter email and password.' };

    const client = window.SupabaseClient.getSupabase();
    if (!client) return { success: false, message: 'Supabase not initialized.' };

    try {
      const { error } = await client.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      if (error) return { success: false, message: error.message };

      const user = await LC.getCurrentUser();
      return { success: true, message: 'Login successful!', user };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  const getRedirectAfterLogin = (user) => {
    return user.role === ROLES.FARMER ? 'dashboard.html' : 'buyer/marketplace.html';
  };

  window.LivestockConnectAuth = {
    registerUser,
    loginUser,
    getRedirectAfterLogin,
    ROLES
  };
})();
