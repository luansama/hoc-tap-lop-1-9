// Spaced-repetition review for flashcards, extracted from the original page.
/* Ôn tập lặp lại cách quãng. Stores ratings by grade/subject/deck/card and never changes quiz answers. */
(function(){
 'use strict';
 let spacedDueMode=false;
 const spacedIntervals={again:{minutes:10,label:'10 phút nữa'},hard:{minutes:1440,label:'1 ngày nữa'},good:{minutes:4320,label:'3 ngày nữa'},easy:{minutes:10080,label:'7 ngày nữa'}};
 const spacedLabels={again:'Chưa nhớ',hard:'Khó nhớ',good:'Đã nhớ',easy:'Rất dễ'};
 function selected(){return {grade:String(document.getElementById('fGrade')?.value||''),subject:String(document.getElementById('fSubject')?.value||''),deck:String(document.getElementById('fDeck')?.value||'topics')}}
 function spacedKey(card,ctx=selected()){return JSON.stringify([ctx.grade,ctx.subject,ctx.deck,String(card?.front??''),String(card?.back??'')])}
 function readRecords(){const v=loadStore('spacedReviewCards',{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
 function getContextCards(){
  const {grade,subject,deck}=selected();
  const pool=(bank[`${grade}|${subject}`]||[]).filter(item=>Array.isArray(item)&&item.length>=3&&Array.isArray(item[1])&&Number.isInteger(item[2])&&item[2]>=0&&item[2]<item[1].length);
  if(deck==='quiz')return pool.map(item=>({front:String(item[0]),back:`Đáp án: ${item[1][item[2]]}${item[4]?`\nChủ đề: ${item[4]}`:''}`}));
  const groups={};pool.forEach(item=>{const topic=item[4]||'Ôn tập';(groups[topic]||(groups[topic]=[])).push(item)});
  return Object.keys(groups).map(topic=>{const group=groups[topic],sample=group[0];return {front:topic,back:`Câu hỏi ôn tập: ${sample[0]}\nĐáp án: ${sample[1][sample[2]]}\nCó ${group.length} câu liên quan đến chủ đề này trong bộ Quiz.`}})
 }
 function formatDate(ts){const d=new Date(ts);if(!Number.isFinite(d.getTime()))return 'Chưa có lịch';return d.toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
 function escapeText(value){return typeof escapeHTML==='function'?escapeHTML(String(value)):String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 function renderSummary(){
  const host=document.getElementById('spacedReviewSummary');if(!host)return;
  const ctx=selected(),all=getContextCards(),records=readRecords(),now=Date.now();let due=0,future=0,reviewed=0;
  all.forEach(card=>{const r=records[spacedKey(card,ctx)];if(!r){due++;return;}reviewed++;if(Number(r.dueAt)<=now)due++;else future++;});
  host.innerHTML=`<div class="spaced-summary-box"><strong>${due}</strong><span>Thẻ mới / đến hạn</span></div><div class="spaced-summary-box"><strong>${future}</strong><span>Thẻ hẹn sau</span></div><div class="spaced-summary-box"><strong>${reviewed}/${all.length}</strong><span>Thẻ đã có lịch</span></div>`;
 }
 function renderSchedule(){
  const host=document.getElementById('spacedReviewSchedule');if(!host)return;
  const ctx=selected(),records=readRecords(),now=Date.now();
  const rows=Object.entries(records).filter(([,r])=>r&&String(r.grade)===ctx.grade&&String(r.subject)===ctx.subject&&String(r.deck)===ctx.deck).map(([key,r])=>({key,...r})).sort((a,b)=>(Number(a.dueAt)||0)-(Number(b.dueAt)||0));
  if(!rows.length){host.innerHTML='<p class="muted">Chưa có lịch ôn cho lớp–môn và bộ thẻ đang chọn. Bấm “Bắt đầu” hoặc “Học tất cả thẻ”, rồi tự đánh giá sau khi lật thẻ.</p>';return;}
  host.innerHTML=rows.slice(0,12).map(r=>{const due=Number(r.dueAt)||0,isDue=due<=now;return `<div class="spaced-schedule-item"><div><strong>${escapeText(r.front||'Thẻ học')}</strong><small>${escapeText(spacedLabels[r.lastRating]||'Chưa đánh giá')} · Đã ôn ${Number(r.reviewCount)||0} lần</small></div><div><span class="pill" style="${isDue?'background:#dcfce7;color:#166534':'background:#dbeafe;color:#1e40af'}">${isDue?'Đến hạn':formatDate(due)}</span></div></div>`}).join('')+(rows.length>12?`<p class="small-note">Đang hiển thị 12/${rows.length} thẻ gần hạn nhất.</p>`:'');
 }
 function refresh(){renderSummary();renderSchedule();const actions=document.getElementById('spacedRatingWrap');if(actions)actions.hidden=!flashcards.length||!flashBack;}
 const originalRenderFlashcard=renderFlashcard;
 renderFlashcard=function(){originalRenderFlashcard.apply(this,arguments);refresh();};
 const originalStartFlashcards=startFlashcards;
 startFlashcards=function(){spacedDueMode=false;originalStartFlashcards.apply(this,arguments);refresh();};
 window.startSpacedReview=function(){
  originalStartFlashcards.call(this);
  const ctx=selected(),records=readRecords(),now=Date.now();
  flashcards=flashcards.filter(card=>{const r=records[spacedKey(card,ctx)];return !r||Number(r.dueAt)<=now;});
  flashIndex=0;flashBack=false;spacedDueMode=true;
  const feedback=document.getElementById('spacedReviewFeedback');
  if(!flashcards.length){renderFlashcard();const el=document.getElementById('flashcard'),count=document.getElementById('flashCount');if(el)el.textContent='🎉 Chưa có thẻ mới hoặc đến hạn trong bộ đang chọn!';if(count)count.textContent='Các thẻ đã được lên lịch cho lần ôn sau.';if(feedback)feedback.textContent='Đã ôn hết các thẻ đến hạn. Mày có thể chọn “Làm mới lịch ôn” hoặc đổi lớp/môn.';const a=document.getElementById('spacedRatingWrap');if(a)a.hidden=true;refresh();return;}
  if(feedback)feedback.textContent=`Có ${flashcards.length} thẻ mới hoặc đến hạn. Lật thẻ, tự đánh giá rồi hệ thống sẽ lên lịch lần ôn sau.`;
  renderFlashcard();
 };
 window.rateSpacedCard=function(rating){
  if(!flashcards.length)return;
  if(!flashBack){const feedback=document.getElementById('spacedReviewFeedback');if(feedback)feedback.textContent='Hãy lật thẻ để xem đáp án trước, rồi mới tự đánh giá độ nhớ nhé.';return;}
  const interval=spacedIntervals[rating];if(!interval)return;
  const ctx=selected(),card=flashcards[flashIndex],key=spacedKey(card,ctx),records=readRecords(),old=records[key]||{},now=Date.now();
  records[key]={grade:ctx.grade,subject:ctx.subject,deck:ctx.deck,front:String(card.front),back:String(card.back),lastRating:rating,lastReviewedAt:now,dueAt:now+interval.minutes*60000,reviewCount:(Number(old.reviewCount)||0)+1,intervalMinutes:interval.minutes};
  saveStore('spacedReviewCards',records);
  const feedback=document.getElementById('spacedReviewFeedback');if(feedback)feedback.textContent=`Đã lưu “${String(card.front).slice(0,90)}” · ${spacedLabels[rating]}. Nhắc lại ${interval.label}.`;
  if(spacedDueMode){flashcards.splice(flashIndex,1);if(flashcards.length){if(flashIndex>=flashcards.length)flashIndex=0;flashBack=false;renderFlashcard();}else{flashIndex=0;flashBack=false;renderFlashcard();const el=document.getElementById('flashcard'),count=document.getElementById('flashCount');if(el)el.textContent='🎉 Hoàn tất lượt ôn đến hạn!';if(count)count.textContent='Tất cả thẻ mới/đến hạn đã được đánh giá.';if(feedback)feedback.textContent='Giỏi! Mày đã hoàn thành lượt ôn. Lịch nhắc lại đã được lưu trên thiết bị.';}}
  else{nextFlashcard();}
  refresh();
 };
 window.renderSpacedSchedule=function(){renderSummary();renderSchedule();const fb=document.getElementById('spacedReviewFeedback');if(fb)fb.textContent='Đã cập nhật lịch nhắc lại cho lớp, môn và bộ thẻ đang chọn.';};
 window.clearSpacedReview=function(){
  const ctx=selected();if(!confirm(`Xóa lịch ôn lặp lại của Lớp ${ctx.grade} · ${ctx.subject} · bộ thẻ đang chọn? Hành động này không xóa điểm Quiz, EXP hay xu.`))return;
  const records=readRecords();Object.keys(records).forEach(key=>{const r=records[key];if(r&&String(r.grade)===ctx.grade&&String(r.subject)===ctx.subject&&String(r.deck)===ctx.deck)delete records[key];});saveStore('spacedReviewCards',records);const fb=document.getElementById('spacedReviewFeedback');if(fb)fb.textContent='Đã xóa lịch ôn của bộ thẻ đang chọn. Điểm Quiz, EXP và xu không bị thay đổi.';refresh();
 };
 document.getElementById('fGrade')?.addEventListener('change',refresh);
 document.getElementById('fSubject')?.addEventListener('change',refresh);
 document.getElementById('fDeck')?.addEventListener('change',refresh);
 refresh();
})();
