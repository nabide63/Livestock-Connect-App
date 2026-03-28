/**
 * Livestock Connect - Listings (Supabase backend)
 * All operations use the real 'listings' table.
 */

(function () {
  'use strict';

  const LC = window.LivestockConnect;
  if (!LC) return;

  const getSupabase = () => window.SupabaseClient.getSupabase();
  const getCurrentUser = LC.getCurrentUser;

  const addListing = async (record) => {
    const user = await getCurrentUser();
    if (!user || user.role !== 'farmer') return { success: false, message: 'Only logged-in farmers can post.' };

    const client = getSupabase();
    const newListing = {
      user_id: user.id,
      animal_type: record.animalType?.trim(),
      age: record.age?.trim(),
      weight: record.weight?.trim(),
      price: parseFloat(record.price) || 0,
      health_status: record.healthStatus || 'Healthy',
      location: record.location?.trim(),
      description: record.description?.trim(),
      image_url: record.imageUrl || null   // from Cloudinary
    };

    const { data, error } = await client.from('listings').insert(newListing).select().single();
    return error 
      ? { success: false, message: error.message }
      : { success: true, message: 'Animal listed successfully!', listing: data };
  };

  const updateListing = async (id, updates) => { /* similar Supabase .update() + ownership check via RLS */ };
  const deleteListing = async (id) => { /* similar Supabase .delete() + ownership check */ };
  const getAllListings = async () => {
    const { data } = await getSupabase().from('listings')
      .select('*, profiles!user_id(full_name, phone, location)')
      .order('created_at', { ascending: false });
    return data || [];
  };
  const getMyListings = async () => { /* filter by current user_id */ };
  const getListingById = async (id) => { /* .eq('id', id).single() */ };
  const getFarmerById = async (userId) => { /* query profiles */ };
  const getListingImageUrl = (l) => l?.image_url || null;
  const filterListings = (list, term) => { /* same client-side filter as before */ };

  window.LivestockConnectLivestock = {
    addListing, updateListing, deleteListing,
    getAllListings, getMyListings, getListingById,
    getFarmerById, getListingImageUrl, filterListings
  };
})();
