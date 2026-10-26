/* Planner summary enhancement: summarize the current daily checklist without replacing its original storage. */
(function () {
  'use strict';
  const host = document.getElementById('dailyTasks');
  if (!host || host.dataset.summaryEnhanced) return;
  const summary = document.createElement('p');
  summary.className = 'planner-summary small-note';
  summary.setAttribute('aria-live','polite');
  host.parentNode.insertBefore(summary, host);
  host.dataset.summaryEnhanced = 'true';
  function update() {
    const boxes = [...host.querySelectorAll('input[type="checkbox"]')];
    if (!boxes.length) { summary.textContent = 'Chưa có nhiệm vụ trong danh sách hôm nay.'; return; }
    const done = boxes.filter(box => box.checked).length;
    summary.textContent = `Tiến độ hôm nay: ${done}/${boxes.length} nhiệm vụ hoàn thành.`;
  }
  host.addEventListener('change', update);
  const observer = new MutationObserver(update);
  observer.observe(host, {childList:true,subtree:true,attributes:true,attributeFilter:['checked']});
  update();
  window.StudyPlanner = {refreshSummary:update};
})();
