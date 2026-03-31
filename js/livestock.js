/**
 * Livestock Connect - Listings (Supabase backend)
 */
(function () {
  'use strict';

  const LC = window.LivestockConnect;
  if (!LC) { console.error('LivestockConnect not loaded'); return; }

  const getClient = () => window.SupabaseClient ? window.SupabaseClient.getSupabase() : null;
  const getUser   = () => window.SupabaseClient ? window.SupabaseClient.getCurrentUser() : null;

  // Only send image_url if it's a valid https:// URL (Cloudinary always returns one).
  // After running fix-image-constraint.sql, null is also accepted by the DB.
  function sanitizeImageUrl(url) {
    if (url && typeof url === 'string' && url.startsWith('https://')) return url;
    return null; // null = no image, which is valid after dropping the constraint
  }

  // ── Add listing ──────────────────────────────────────────
  const addListing = async (record) => {
    const user = await getUser();
    if (!user || user.role !== 'farmer') return { success: false, message: 'Only logged-in farmers can post.' };

    const client = getClient();
    if (!client) return { success: false, message: 'Supabase not initialized.' };

    const imageUrl = sanitizeImageUrl(record.imageData || record.imageUrl);

    // Step 1: Insert the listing WITHOUT image_url first
    const { data, error } = await client.from('listings').insert({
      user_id:       user.id,
      animal_type:   (record.animalType  || '').trim(),
      age:           (record.age         || '').trim(),
      weight:        (record.weight      || '').trim(),
      price:         parseFloat(record.price) || 0,
      health_status: (record.healthStatus || 'Healthy').trim(),
      location:      (record.location    || '').trim(),
      description:   (record.description || '').trim(),
    }).select().single();

    if (error) {
      console.error('addListing insert error:', error);
      return { success: false, message: error.message };
    }

    console.log('addListing — inserted row id:', data.id);

    // Step 2: If we have a Cloudinary URL, update the image_url separately
    // This guarantees image_url is saved even if the column was added after initial schema
    if (imageUrl && data.id) {
      const { error: imgError } = await client
        .from('listings')
        .update({ image_url: imageUrl })
        .eq('id', data.id)
        .eq('user_id', user.id);

      if (imgError) {
        console.error('addListing image_url update error:', imgError);
        // Listing was saved — just without the image. Non-fatal.
      } else {
        console.log('addListing — image_url saved:', imageUrl);
        data.image_url = imageUrl; // patch in-memory so card renders immediately
      }
    }

    const listing = mapRow(data);
    return { success: true, message: 'Animal listed successfully!', listing };
  };

  // ── Update listing ───────────────────────────────────────
  const updateListing = async (id, updates) => {
    const user = await getUser();
    if (!user) return { success: false, message: 'Not logged in.' };

    const client = getClient();
    if (!client) return { success: false, message: 'Supabase not initialized.' };

    const { error } = await client.from('listings').update({
      animal_type:   (updates.animalType  || '').trim(),
      age:           (updates.age         || '').trim(),
      weight:        (updates.weight      || '').trim(),
      price:         parseFloat(updates.price) || 0,
      health_status: (updates.healthStatus || 'Healthy').trim(),
      location:      (updates.location    || '').trim(),
      description:   (updates.description || '').trim(),
      image_url:     sanitizeImageUrl(updates.imageData || updates.imageUrl)
    }).eq('id', id).eq('user_id', user.id);

    return error
      ? { success: false, message: error.message }
      : { success: true,  message: 'Listing updated.' };
  };

  // ── Delete listing ───────────────────────────────────────
  const deleteListing = async (id) => {
    const user = await getUser();
    if (!user) return { success: false, message: 'Not logged in.' };

    const client = getClient();
    if (!client) return { success: false, message: 'Supabase not initialized.' };

    const { error } = await client.from('listings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return error
      ? { success: false, message: error.message }
      : { success: true,  message: 'Listing removed.' };
  };

  // ── Get all listings (buyer marketplace) ─────────────────
  const getAllListings = async () => {
    const client = getClient();
    if (!client) return [];
    const { data, error } = await client.from('listings')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('getAllListings error:', error.message); return []; }
    return (data || []).map(mapRow);
  };

  // ── Get my listings (farmer) ─────────────────────────────
  const getMyListings = async () => {
    const user = await getUser();
    if (!user) { console.warn('getMyListings: no user'); return []; }
    const client = getClient();
    if (!client) { console.warn('getMyListings: no client'); return []; }
    const { data, error } = await client.from('listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) { console.error('getMyListings error:', error.message); return []; }
    console.log('getMyListings: found', (data||[]).length, 'listings');
    return (data || []).map(mapRow);
  };

  // ── Get single listing ───────────────────────────────────
  const getListingById = async (id) => {
    const client = getClient();
    if (!client) return null;
    const { data } = await client.from('listings').select('*').eq('id', id).single();
    return data ? mapRow(data) : null;
  };

  // ── Get farmer profile ───────────────────────────────────
  const getFarmerById = async (userId) => {
    const client = getClient();
    if (!client) return null;
    const { data } = await client.from('profiles').select('full_name, phone, location').eq('id', userId).single();
    if (!data) return null;
    return { fullName: data.full_name, phone: data.phone, location: data.location };
  };

  // ── Helpers ──────────────────────────────────────────────
  // Map snake_case DB row → camelCase app object
  function mapRow(row) {
    return {
      id:           row.id,
      userId:       row.user_id,
      animalType:   row.animal_type,
      age:          row.age,
      weight:       row.weight,
      price:        row.price,
      healthStatus: row.health_status,
      location:     row.location,
      description:  row.description,
      imageData:    row.image_url,
      imageUrl:     row.image_url,
      createdAt:    row.created_at
    };
  }

  const getListingImageUrl = (listing) => listing?.imageData || listing?.imageUrl || null;

  const filterListings = (list, term) => {
    if (!term) return list;
    const t = term.toLowerCase();
    return list.filter(l =>
      (l.animalType || '').toLowerCase().includes(t) ||
      (l.location   || '').toLowerCase().includes(t) ||
      (l.description|| '').toLowerCase().includes(t)
    );
  };

  window.LivestockConnectLivestock = {
    addListing, updateListing, deleteListing,
    getAllListings, getMyListings, getListingById,
    getFarmerById, getListingImageUrl, filterListings
  };
})();
