/**
 * Storage Overwrite — mirrors Navattic's storage-overwrite.js
 * Overrides Storage.clear() to preserve NavTour data keys.
 */

(function overwriteStorageClear() {
  try {
    Storage.prototype.clear = (function (originalClear) {
      return function (this: Storage) {
        const keys = Object.keys(this);
        for (const key of keys) {
          if (
            !key.startsWith('__NAVTOUR') &&
            !key.startsWith('navtour:')
          ) {
            this.removeItem(key);
          }
        }
      };
    })(Storage.prototype.clear);
  } catch (e) {
    console.error('Error when overwriting storage.clear:', e);
  }
})();
