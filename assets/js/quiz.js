/* Quiz keyboard controls and a small inspection API. Answers remain graded by the original answer() function. */
(function () {
  'use strict';
  window.StudyQuiz = {
    getCurrent() {
      const q = typeof questions !== 'undefined' && Array.isArray(questions) ? questions[(typeof qi !== 'undefined' ? qi : -1)] : null;
      if (!Array.isArray(q)) return null;
      return {prompt:String(q[0] || ''), options:Array.isArray(q[1])?q[1].slice():[], answerIndex:Number(q[2]), difficulty:String(q[3]||''), topic:String(q[4]||'')};
    },
    validate(question) {
      return Array.isArray(question) && typeof question[0] === 'string' && Array.isArray(question[1]) && question[1].length >= 2 && Number.isInteger(question[2]) && question[2] >= 0 && question[2] < question[1].length;
    }
  };
  document.addEventListener('keydown', event => {
    if (!/^[1-4]$/.test(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (target && (target.matches('input,textarea,select,[contenteditable="true"]'))) return;
    const section = document.getElementById('quiz');
    if (!section || section.classList.contains('hidden')) return;
    const options = [...document.querySelectorAll('#quizCard .ans:not(:disabled)')];
    const index = Number(event.key) - 1;
    if (options[index] && typeof window.answer === 'function') {
      event.preventDefault();
      window.answer(index);
    }
  });
})();
