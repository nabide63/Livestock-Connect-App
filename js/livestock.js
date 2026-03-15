/**
 * Livestock Connect - Listings (marketplace)
 * Farmers add/edit/delete listings. Buyers browse. Data in LocalStorage.
 * Depends on: app.js (LivestockConnect)
 */

(function () {
  'use strict';

  const LC = window.LivestockConnect;
  if (!LC) return;

  const KEY = LC.STORAGE_KEYS.LISTINGS;
  const getStorage = LC.getStorage;
  const setStorage = LC.setStorage;
  const getCurrentUser = LC.getCurrentUser;
  const getUsers = LC.getUsers;

  const getListings = () => getStorage(KEY, []);

  const saveListings = (list) => {
    setStorage(KEY, list);
    return true;
  };

  /**
   * Add a new listing (Farmer only). Returns { success, message, listing }.
   */
  const addListing = (record) => {
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'Not logged in.' };
    if (user.role !== 'farmer') return { success: false, message: 'Only farmers can post animals.' };

    const list = getListings();
    const newListing = {
      id: Date.now().toString(),
      userId: user.id,
      animalType: (record.animalType || '').trim(),
      age: (record.age || '').trim(),
      weight: (record.weight || '').trim(),
      price: (record.price || '').trim(),
      healthStatus: (record.healthStatus || 'Healthy').trim(),
      location: (record.location || '').trim(),
      description: (record.description || '').trim(),
      imageData: record.imageData || null,
      createdAt: new Date().toISOString()
    };

    list.push(newListing);
    saveListings(list);
    return { success: true, message: 'Your animal has been successfully listed.', listing: newListing };
  };

  /**
   * Update listing by id. Only owner can update.
   */
  const updateListing = (id, updates) => {
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'Not logged in.' };

    const list = getListings();
    const index = list.findIndex((l) => l.id === id);
    if (index === -1) return { success: false, message: 'Listing not found.' };
    if (list[index].userId !== user.id) return { success: false, message: 'You can only edit your own listings.' };

    const allowed = ['animalType', 'age', 'weight', 'price', 'healthStatus', 'location', 'description', 'imageData'];
    allowed.forEach((k) => {
      if (updates[k] !== undefined) list[index][k] = updates[k];
    });
    saveListings(list);
    return { success: true, message: 'Listing updated.' };
  };

  /**
   * Delete listing by id. Only owner can delete.
   */
  const deleteListing = (id) => {
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'Not logged in.' };

    const list = getListings();
    const removed = list.find((l) => l.id === id);
    if (!removed) return { success: false, message: 'Listing not found.' };
    if (removed.userId !== user.id) return { success: false, message: 'You can only delete your own listings.' };

    saveListings(list.filter((l) => l.id !== id));
    return { success: true, message: 'Listing deleted.' };
  };

  /**
   * Get all listings for marketplace (buyers) or for a specific farmer.
   */
  const getAllListings = () => {
    const list = getListings();
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  /**
   * Get listings posted by current user (Farmer).
   */
  const getMyListings = () => {
    const user = getCurrentUser();
    if (!user) return [];
    return getListings().filter((l) => l.userId === user.id);
  };

  /**
   * Get single listing by id.
   */
  const getListingById = (id) => getListings().find((l) => l.id === id);

  /**
   * Get farmer (user) by userId for contact page.
   */
  const getFarmerById = (userId) => getUsers().find((u) => u.id === userId);

  /**
   * Get image URL for a listing (imageData or image_url for Supabase compatibility).
   * Returns null if missing or empty.
   */
  const getListingImageUrl = (listing) => {
    const url = listing && (listing.imageData || listing.image_url);
    return (typeof url === 'string' && url.trim().length > 0) ? url : null;
  };

  /**
   * Filter listings by search term (animal type, location).
   */
  const filterListings = (list, searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return list;
    const term = searchTerm.trim().toLowerCase();
    return list.filter(
      (l) =>
        (l.animalType && l.animalType.toLowerCase().includes(term)) ||
        (l.location && l.location.toLowerCase().includes(term)) ||
        (l.description && l.description.toLowerCase().includes(term))
    );
  };

  window.LivestockConnectLivestock = {
    addListing,
    updateListing,
    deleteListing,
    getAllListings,
    getMyListings,
    getListingById,
    getFarmerById,
    getListingImageUrl,
    filterListings
  };
})();
