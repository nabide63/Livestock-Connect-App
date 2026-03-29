/**
 * Livestock Connect - Supabase Client
 * Depends on: js/supabase.js loaded first (sets global `var supabase = ...`)
 */

(function () {
  'use strict';

  var SUPABASE_URL      = 'https://dyjrimcweqeiezhyejpy.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5anJpbWN3ZXFlaWV6aHllanB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1Njk4NjMsImV4cCI6MjA4OTE0NTg2M30.ympeCjZAc0i08WfouHx-jIXDxpO9PIRnm84K_XsIJ-g';

  var supabaseInstance = null;

  function initializeSupabase() {
    if (supabaseInstance) return supabaseInstance;
    var lib = window.supabase;
    if (!lib || typeof lib.createClient !== 'function') {
      console.error('❌ window.supabase.createClient not found.');
      return null;
    }
    try {
      supabaseInstance = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
      console.log('✅ Supabase client initialized.');
      return supabaseInstance;
    } catch (err) {
      console.error('❌ Failed to create Supabase client:', err);
      return null;
    }
  }

  initializeSupabase();

  function getSupabase() {
    return supabaseInstance || initializeSupabase();
  }

  async function getCurrentUser() {
    var client = getSupabase();
    if (!client) return null;

    try {
      var sessionResult = await client.auth.getSession();
      var session = sessionResult.data && sessionResult.data.session;
      if (!session || !session.user) return null;

      var authUser = session.user;
      // user_metadata is set at signup and always available — use it as primary source.
      // This avoids any dependency on the profiles table or RLS policies.
      var meta = authUser.user_metadata || {};

      // Try profiles table as a secondary enrichment (non-fatal if it fails)
      var profile = null;
      try {
        var profileResult = await client
          .from('profiles')
          .select('full_name, phone, location, role')
          .eq('id', authUser.id)
          .single();
        if (profileResult.data) profile = profileResult.data;
      } catch (e) {
        // profiles table unavailable or RLS blocked — that's fine, use metadata
      }

      var role = (profile && profile.role) || meta.role || '';

      // Safety check — if role is still empty, something is wrong with this account
      if (!role) {
        console.warn('⚠️ User has no role in metadata or profiles table.');
      }

      return {
        id:       authUser.id,
        email:    authUser.email,
        fullName: (profile && profile.full_name) || meta.full_name  || '',
        phone:    (profile && profile.phone)     || meta.phone      || '',
        location: (profile && profile.location)  || meta.location   || '',
        role:     role
      };

    } catch (err) {
      console.error('Error in getCurrentUser:', err);
      return null;
    }
  }

  window.SupabaseClient = { getSupabase: getSupabase, getCurrentUser: getCurrentUser };

})();
