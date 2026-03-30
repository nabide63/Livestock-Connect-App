/**
 * Livestock Connect - Authentication
 */
(function () {
  'use strict';

  const ROLES = { FARMER: 'farmer', BUYER: 'buyer' };

  const registerUser = async (data) => {
    const { fullName, email, phone, location, role, password, confirmPassword } = data;
    if (!fullName || !email || !phone || !location || !role || !password || !confirmPassword)
      return { success: false, message: 'Please fill in all fields.' };
    if (role !== ROLES.FARMER && role !== ROLES.BUYER)
      return { success: false, message: 'Please select a valid role.' };
    if (password !== confirmPassword)
      return { success: false, message: 'Passwords do not match.' };
    if (password.length < 6)
      return { success: false, message: 'Password must be at least 6 characters.' };

    const client = window.SupabaseClient.getSupabase();
    if (!client) return { success: false, message: 'Supabase not initialized.' };

    try {
      const { data: authData, error } = await client.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim(), phone: phone.trim(), location: location.trim(), role }
        }
      });
      if (error) return { success: false, message: error.message };

      // Insert profile row (non-fatal if RLS blocks it — metadata fallback handles it)
      if (authData.user) {
        await client.from('profiles').upsert({
          id: authData.user.id,
          full_name: fullName.trim(),
          phone: phone.trim(),
          location: location.trim(),
          role
        }, { onConflict: 'id' }).then(() => {}).catch(() => {});
      }

      // Check if email confirmation is required
      const needsConfirm = !authData.session;
      return {
        success: true,
        needsConfirm,
        message: needsConfirm
          ? 'Account created! Please check your email and click the confirmation link before logging in.'
          : 'Account created successfully! You can now log in.'
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  const loginUser = async (email, password) => {
    if (!email || !password)
      return { success: false, message: 'Please enter your email and password.' };

    const client = window.SupabaseClient.getSupabase();
    if (!client) return { success: false, message: 'Supabase not initialized.' };

    try {
      const { error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        // Give specific, helpful messages for common Supabase errors
        let msg = error.message;
        if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid credentials')) {
          msg = 'Incorrect email or password. Please check and try again.';
        } else if (msg.toLowerCase().includes('email not confirmed')) {
          msg = 'Please confirm your email address first. Check your inbox for a confirmation link.';
        } else if (msg.toLowerCase().includes('too many requests')) {
          msg = 'Too many attempts. Please wait a few minutes and try again.';
        }
        return { success: false, message: msg };
      }

      const user = await window.SupabaseClient.getCurrentUser();
      return { success: true, message: 'Login successful!', user };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  const getRedirectAfterLogin = (user) =>
    user && user.role === ROLES.FARMER ? 'dashboard.html' : 'buyer/marketplace.html';

  window.LivestockConnectAuth = { registerUser, loginUser, getRedirectAfterLogin, ROLES };
})();
