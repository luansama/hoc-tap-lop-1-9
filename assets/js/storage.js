/* Unified facade over the legacy localStorage/volatile fallback and versioned backup. */
(function () {
  'use strict';
  function available() { try { const k='__study_storage_test__'; localStorage.setItem(k,'1'); localStorage.removeItem(k); return true; } catch (_) { return false; } }
  window.StudyStorage = {
    persistent: available(),
    get(key, fallback) { return typeof window.loadStore === 'function' ? window.loadStore(String(key), fallback) : fallback; },
    set(key, value) { return typeof window.saveStore === 'function' ? window.saveStore(String(key), value) : false; },
    exportBackup() { if (typeof window.exportBackup === 'function') return window.exportBackup(); throw new Error('Chức năng sao lưu chưa sẵn sàng.'); },
    importBackup(event) { if (typeof window.importBackup === 'function') return window.importBackup(event); throw new Error('Chức năng khôi phục chưa sẵn sàng.'); }
  };
})();
