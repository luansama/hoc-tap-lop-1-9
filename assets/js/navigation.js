/* Navigation enhancements: URL hash, remembered section and reliable browser back/forward. */
(function () {
  'use strict';
  const validTabs = new Set(['knowledge','quiz','textbooks','flash','progress','planner','pet','tools','offline','help']);
  const key = 'studyAppV3_lastTab';
  const originalShowTab = window.showTab;
  if (typeof originalShowTab === 'function' && !window.__studyNavigationEnhanced) {
    window.showTab = function (tab) {
      const target = validTabs.has(String(tab)) ? String(tab) : 'knowledge';
      const result = originalShowTab.apply(this, [target]);
      try { localStorage.setItem(key, target); } catch (_) {}
      if (location.hash !== '#' + target) history.replaceState(null, '', '#' + target);
      return result;
    };
    window.__studyNavigationEnhanced = true;
  }
  function restoreTab() {
    const fromHash = location.hash.replace(/^#/, '');
    let remembered = '';
    try { remembered = localStorage.getItem(key) || ''; } catch (_) {}
    const tab = validTabs.has(fromHash) ? fromHash : (validTabs.has(remembered) ? remembered : 'knowledge');
    if (typeof window.showTab === 'function') window.showTab(tab);
  }
  window.addEventListener('hashchange', () => {
    const tab = location.hash.replace(/^#/, '');
    if (validTabs.has(tab) && typeof window.showTab === 'function') window.showTab(tab);
  });
  // Initial view is restored only after the original UI has initialized its controls.
  restoreTab();
  window.StudyNavigation = {validTabs: [...validTabs], go: tab => window.showTab?.(tab)};
})();
