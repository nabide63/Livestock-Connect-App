/**
 * Livestock Connect - Cloudinary image upload
 * Uploads to Cloudinary and returns the image URL. Uses unsigned preset (no secret in frontend).
 * Requires window.LivestockConnectConfig.cloudinaryCloudName and .cloudinaryUploadPreset.
 */

(function () {
  'use strict';

  window.LivestockConnectConfig = window.LivestockConnectConfig || {};
  const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1';

  /**
   * Upload a file to Cloudinary (unsigned). Returns Promise<string> with secure_url.
   * Rejects if config missing or upload fails.
   * @param {File} file - Image file from input
   * @returns {Promise<string>} - Secure URL of uploaded image
   */
  function uploadImage(file) {
    const config = window.LivestockConnectConfig;
    if (!config || !config.cloudinaryCloudName || !config.cloudinaryUploadPreset) {
      return Promise.reject(new Error('Cloudinary not configured. Set cloudinaryCloudName and cloudinaryUploadPreset in data/config.js'));
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.cloudinaryUploadPreset);

    const url = CLOUDINARY_UPLOAD_URL + '/' + config.cloudinaryCloudName + '/image/upload';

    return fetch(url, {
      method: 'POST',
      body: formData
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (err) {
            throw new Error(err.error && err.error.message ? err.error.message : 'Upload failed');
          }).catch(function (e) {
            if (e.message === 'Upload failed') throw e;
            throw new Error('Upload failed: ' + res.status);
          });
        }
        return res.json();
      })
      .then(function (data) {
        if (data.secure_url) return data.secure_url;
        throw new Error('No URL in response');
      });
  }

  function isCloudinaryConfigured() {
    const config = window.LivestockConnectConfig;
    return !!(config && config.cloudinaryCloudName && config.cloudinaryUploadPreset);
  }

  window.LivestockConnectCloudinary = {
    uploadImage: uploadImage,
    isCloudinaryConfigured: isCloudinaryConfigured
  };
})();
