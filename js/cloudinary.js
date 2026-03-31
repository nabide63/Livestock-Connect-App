/**
 * Livestock Connect — Cloudinary Image Upload
 * Unsigned upload using a Cloudinary upload preset.
 * Requires: window.LivestockConnectConfig.cloudinaryCloudName + cloudinaryUploadPreset
 */
(function () {
  'use strict';

  const MAX_SIZE_MB = 10;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

  function isCloudinaryConfigured() {
    const c = window.LivestockConnectConfig;
    return !!(c && c.cloudinaryCloudName && c.cloudinaryUploadPreset);
  }

  /**
   * Upload an image file to Cloudinary.
   * @param {File} file
   * @param {function} onProgress  — optional callback(percent 0-100)
   * @returns {Promise<string>}    — resolves to secure_url
   */
  function uploadImage(file, onProgress) {
    return new Promise(function (resolve, reject) {
      const config = window.LivestockConnectConfig;

      // Config check
      if (!isCloudinaryConfigured()) {
        return reject(new Error(
          'Photo upload not configured. ' +
          'Please create an unsigned upload preset named "livestock_upload" in your Cloudinary dashboard ' +
          'and make sure data/config.js is loaded.'
        ));
      }

      // File type check — allow common mobile formats
      if (file && !ALLOWED_TYPES.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
        return reject(new Error('Please choose a JPG, PNG, or WebP image.'));
      }

      // File size check
      if (file && file.size > MAX_SIZE_MB * 1024 * 1024) {
        return reject(new Error('Image is too large (max ' + MAX_SIZE_MB + 'MB). Please choose a smaller photo.'));
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', config.cloudinaryUploadPreset);
      formData.append('folder', 'livestock');

      const url = 'https://api.cloudinary.com/v1_1/' + config.cloudinaryCloudName + '/image/upload';

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      if (onProgress && xhr.upload) {
        xhr.upload.addEventListener('progress', function (e) {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
      }

      xhr.onload = function () {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            if (data.secure_url) {
              resolve(data.secure_url);
            } else {
              reject(new Error('Upload succeeded but no URL returned.'));
            }
          } else {
            const msg = (data.error && data.error.message) ? data.error.message : 'Upload failed (status ' + xhr.status + ')';
            // Give a friendlier message for the common preset-not-found error
            if (msg.toLowerCase().includes('upload preset') || xhr.status === 400) {
              reject(new Error(
                'Upload preset "' + config.cloudinaryUploadPreset + '" not found or not set to Unsigned. ' +
                'Go to Cloudinary → Settings → Upload → Upload Presets and create an unsigned preset named "livestock_upload".'
              ));
            } else {
              reject(new Error(msg));
            }
          }
        } catch (e) {
          reject(new Error('Upload failed: unexpected response from server.'));
        }
      };

      xhr.onerror = function () {
        reject(new Error('Network error during upload. Check your internet connection.'));
      };

      xhr.ontimeout = function () {
        reject(new Error('Upload timed out. Please try again.'));
      };

      xhr.timeout = 60000; // 60 second timeout
      xhr.send(formData);
    });
  }

  window.LivestockConnectCloudinary = {
    uploadImage: uploadImage,
    isCloudinaryConfigured: isCloudinaryConfigured
  };
})();
