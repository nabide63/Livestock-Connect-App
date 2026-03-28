/**
 * Livestock Connect - Supabase Client (Email + Password Auth)
 */

(function () {
  'use strict';

  // REAL SUPABASE VALUES
  const SUPABASE_URL = 'https://dyjrimcweqeiezhyejpy.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_d6T4noMn7DmpR-84WI5b7Q_MvTwquO0'; // my anon/public key

  let supabaseInstance = null;

  const initializeSupabase = () => {
    if (supabaseInstance) return supabaseInstance;
    if (typeof window.Supabase === 'undefined') {
      console.error('❌ Supabase JS not loaded!');
      return null;
    }
    supabaseInstance = window.Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    console.log('✅ Supabase client initialized');
    return supabaseInstance;
  };

  const getSupabase = () => initializeSupabase();

  const getCurrentUser = async () => {
    const client = getSupabase();
    if (!client) return null;

    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await client
      .from('profiles')
      .select('full_name, phone, location, role')
      .eq('id', session.user.id)
      .single();

    return {
      id: session.user.id,
      email: session.user.email,
      fullName: profile?.full_name || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      role: profile?.role || ''
    };
  };

  window.SupabaseClient = { getSupabase, getCurrentUser };
})();