// Quiz attempt history and progress tracking, extracted from the original page.
(function initQuizAttemptHistory(){
 'use strict';
 const HISTORY_KEY='quizAttemptHistoryV1';
 let activeAttempt=null;
 function readHistory(){const v=loadStore(HISTORY_KEY,[]);return Array.isArray(v)?v.filter(x=>x&&typeof x==='object'):[];}
 function writeHistory(rows){return saveStore(HISTORY_KEY,rows.slice(0,100));}
 function fmtDate(iso){try{return new Date(iso).toLocaleString('vi-VN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(e){return String(iso||'');}}
 function initializeFilters(){
  const gf=document.getElementById('quizHistoryGradeFilter'),sf=document.getElementById('quizHistorySubjectFilter');
  if(gf&&!gf.dataset.ready){for(let i=1;i<=9;i++)gf.insertAdjacentHTML('beforeend',`<option value="${i}">Lớp ${i}</option>`);gf.dataset.ready='1';gf.addEventListener('change',renderHistory);}
  if(sf&&!sf.dataset.ready){const names=[...new Set(Object.keys(bank||{}).map(k=>String(k).split('|').slice(1).join('|')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));sf.innerHTML='<option value="all">Tất cả môn</option>'+names.map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join('');sf.dataset.ready='1';sf.addEventListener('change',renderHistory);}
 }
 function filteredRows(){const g=document.getElementById('quizHistoryGradeFilter')?.value||'all',s=document.getElementById('quizHistorySubjectFilter')?.value||'all';return readHistory().filter(x=>(g==='all'||String(x.grade)===g)&&(s==='all'||x.subject===s));}
 function renderHistory(){
  initializeFilters();
  const list=document.getElementById('quizAttemptHistoryList'),summary=document.getElementById('quizHistorySummary');if(!list||!summary)return;
  const rows=filteredRows();
  if(!rows.length){summary.innerHTML='<div class="quiz-history-metric"><span>📘 Lượt làm bài</span><b>0</b></div>';list.innerHTML='<p class="muted">Chưa có lịch sử phù hợp bộ lọc. Khi hoàn thành Quiz, kết quả sẽ hiện tại đây.</p>';return;}
  const avg=Math.round(rows.reduce((n,x)=>n+(Number(x.pct)||0),0)/rows.length),best=Math.max(...rows.map(x=>Number(x.pct)||0)),totalCorrect=rows.reduce((n,x)=>n+(Number(x.score)||0),0),totalQuestions=rows.reduce((n,x)=>n+(Number(x.total)||0),0);
  let trend='Chưa đủ lượt cùng lớp–môn để so sánh';
  const first=rows[0],previous=rows.slice(1).find(x=>String(x.grade)===String(first.grade)&&x.subject===first.subject);
  if(previous){const diff=(Number(first.pct)||0)-(Number(previous.pct)||0);trend=(diff>0?'+':'')+diff+' điểm % so với lần trước của lớp '+first.grade+' · '+first.subject;}
  summary.innerHTML=`<div class="quiz-history-metric"><span>📝 Lượt làm bài</span><b>${rows.length}</b><small>Lưu tối đa 100 lượt; hiển thị 30 lượt gần nhất</small></div><div class="quiz-history-metric"><span>📊 Điểm trung bình</span><b>${avg}%</b><small>${totalCorrect}/${totalQuestions} câu đúng cộng dồn</small></div><div class="quiz-history-metric"><span>🏆 Điểm cao nhất</span><b>${best}%</b><small>Trong các lượt đang lọc</small></div><div class="quiz-history-metric"><span>📈 So sánh gần nhất</span><b style="font-size:1rem">${escapeHTML(trend)}</b></div>`;
  list.innerHTML=rows.slice(0,30).map((x,i)=>{const pct=Math.max(0,Math.min(100,Number(x.pct)||0)),level=pct>=80?'high':pct>=50?'mid':'low',answered=Math.max(0,Math.min(Number(x.total)||0,Number(x.answered)||0)),duration=Math.max(0,Number(x.elapsedSec)||0),timeText=duration>=60?`${Math.floor(duration/60)} phút ${duration%60} giây`:`${duration} giây`,title=x.mode||'Quiz';return `<article class="quiz-history-item"><span class="quiz-history-badge ${x.timeUp?'timeup':''}">${x.timeUp?'⏰ Hết giờ':escapeHTML(title)}</span><p class="muted">${escapeHTML(fmtDate(x.at))}</p><h4>Lớp ${escapeHTML(x.grade)} · ${escapeHTML(x.subject)}</h4><p><b>${Number(x.score)||0}/${Number(x.total)||0} câu đúng</b> · đã làm ${answered}/${Number(x.total)||0} câu</p><div class="quiz-history-pct ${level}">${pct}%</div><div class="quiz-history-progress"><span style="width:${pct}%"></span></div><p class="small-note">Độ khó: ${escapeHTML(x.difficultyLabel||'Tất cả')} · Thời gian: ${escapeHTML(timeText)}</p><button type="button" class="secondary" data-quiz-history-repeat="${i}" data-grade="${escapeHTML(x.grade)}" data-subject="${escapeHTML(x.subject)}" data-total="${Number(x.total)||10}" data-difficulty="${escapeHTML(x.difficulty||'all')}">Làm đề mới môn này</button></article>`;}).join('');
  list.querySelectorAll('[data-quiz-history-repeat]').forEach(btn=>btn.addEventListener('click',()=>{const g=String(btn.dataset.grade||'1'),sub=btn.dataset.subject||'';document.getElementById('qGrade').value=g;fillSubjects('qGrade','qSubject');document.getElementById('qSubject').value=sub;const count=Number(btn.dataset.total)||10,sel=document.getElementById('qCount');if(!Array.from(sel.options).some(o=>Number(o.value)===count))sel.insertAdjacentHTML('beforeend',`<option value="${count}">${count}</option>`);sel.value=String(count);document.getElementById('difficulty').value=btn.dataset.difficulty||'all';showTab('quiz');startQuiz();}));
 }
 function exportHistory(){const rows=readHistory();if(!rows.length){alert('Chưa có lịch sử Quiz để xuất.');return;}const cols=['at','grade','subject','mode','score','total','answered','pct','difficultyLabel','elapsedSec','timeUp'];const csv=[cols,...rows.map(x=>cols.map(k=>x[k]??''))].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='lich-su-quiz-lop-1-9.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
 function clearHistory(){if(!confirm('Xóa lịch sử các lượt Quiz đã lưu? Thao tác này chỉ xóa lịch sử chi tiết, không xóa điểm cộng dồn, EXP, xu hay câu sai.'))return;writeHistory([]);renderHistory();}
 const startBase=startQuiz;
 startQuiz=function(){const examMinutes=Number(document.getElementById('examDuration')?.value)||0;activeAttempt={startedAt:Date.now(),grade:String(document.getElementById('qGrade')?.value||''),subject:String(document.getElementById('qSubject')?.value||''),difficulty:String(document.getElementById('difficulty')?.value||'all'),difficultyLabel:({all:'Tất cả',easy:'Dễ',medium:'Vừa',hard:'Khó'})[document.getElementById('difficulty')?.value||'all']||'Tất cả',mode:examMinutes>0?'Quiz có giới hạn thời gian':'Quiz',timeLimitMinutes:examMinutes};return startBase.apply(this,arguments);};
 const smartBase=typeof startSmartReview==='function'?startSmartReview:null;
 if(smartBase)startSmartReview=function(){const beforeRun=quizRunId,result=smartBase.apply(this,arguments);if(quizRunId!==beforeRun&&Array.isArray(questions)&&questions.length&&!quizFinished)activeAttempt={startedAt:Date.now(),grade:String(document.getElementById('qGrade')?.value||''),subject:String(document.getElementById('qSubject')?.value||''),difficulty:'all',difficultyLabel:'Ôn lỗi sai',mode:'Ôn lỗi sai',timeLimitMinutes:0};return result;};
 const retryBase=typeof retryWrong==='function'?retryWrong:null;
 if(retryBase)retryWrong=function(){const beforeRun=quizRunId,result=retryBase.apply(this,arguments);if(quizRunId!==beforeRun&&Array.isArray(questions)&&questions.length&&!quizFinished)activeAttempt={startedAt:Date.now(),grade:String(document.getElementById('qGrade')?.value||''),subject:String(document.getElementById('qSubject')?.value||''),difficulty:'all',difficultyLabel:'Ôn câu sai',mode:'Làm lại câu sai',timeLimitMinutes:0};return result;};
 const finishBase=finish;
 finish=function(timeUp){
  const wasFinished=quizFinished,hasQuiz=Array.isArray(questions)&&questions.length>0;
  const snap=!wasFinished&&hasQuiz?{grade:String(document.getElementById('qGrade')?.value||activeAttempt?.grade||''),subject:String(document.getElementById('qSubject')?.value||activeAttempt?.subject||''),score:Number(score)||0,total:questions.length,answered:Math.min(questions.length,(Number(score)||0)+(Array.isArray(wrongQuestions)?wrongQuestions.length:0)),difficulty:activeAttempt?.difficulty||'all',difficultyLabel:activeAttempt?.difficultyLabel||'Tất cả',mode:activeAttempt?.mode||(Number(document.getElementById('examDuration')?.value)>0?'Quiz có giới hạn thời gian':'Quiz'),startedAt:activeAttempt?.startedAt||Date.now(),timeLimitMinutes:activeAttempt?.timeLimitMinutes||0}:null;
  const result=finishBase.apply(this,arguments);
  if(snap&&quizFinished){const now=Date.now(),entry={id:`${now}-${Math.random().toString(36).slice(2,8)}`,at:new Date(now).toISOString(),grade:snap.grade,subject:snap.subject,mode:snap.mode,score:snap.score,total:snap.total,answered:snap.answered,pct:Math.round(snap.score/Math.max(1,snap.total)*100),difficulty:snap.difficulty,difficultyLabel:snap.difficultyLabel,elapsedSec:Math.max(0,Math.round((now-snap.startedAt)/1000)),timeLimitMinutes:snap.timeLimitMinutes,timeUp:!!timeUp};const rows=readHistory();rows.unshift(entry);writeHistory(rows.slice(0,100));activeAttempt=null;renderHistory();}
  return result;
 };
 document.getElementById('exportQuizHistory')?.addEventListener('click',exportHistory);
 document.getElementById('clearQuizHistory')?.addEventListener('click',clearHistory);
 const progressBase=renderProgress;
 renderProgress=function(){const r=progressBase.apply(this,arguments);renderHistory();return r;};
 initializeFilters();renderHistory();
})();
