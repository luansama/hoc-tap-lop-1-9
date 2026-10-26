// Core application logic carried forward from the original HTML.
// Question banks and shared curriculum metadata are loaded by knowledge.js before this file.
let questions=[],qi=0,score=0,timer=null,remaining=0,wrongQuestions=[],streak=0,bestStreak=(function(){try{return Number(localStorage.getItem("bestStreak"))||0}catch(e){return 0}})(),eliminatedAt={};
let flashcards=[],flashIndex=0,flashBack=false,examTimer=null,examRemaining=0,examDeadline=0;
let quizFinished=false,quizRunId=0,reportDraft=null,gamePairs=[],gameAnswerOrder=[],selectedGameQuestion=null,gameScore=0;
const STORE="studyAppV3_";
const volatileStore=Object.create(null);

function fillGrades(id){const e=document.getElementById(id);for(let i=1;i<=9;i++)e.innerHTML+=`<option value="${i}">Lớp ${i}</option>`}
function fillSubjects(gid,sid){let g=document.getElementById(gid).value;document.getElementById(sid).innerHTML=subjects[g].map(x=>`<option>${x}</option>`).join("")}
fillGrades("kGrade");fillGrades("qGrade");fillGrades("sgGrade");fillGrades("fGrade");
fillSubjects("kGrade","kSubject");fillSubjects("qGrade","qSubject");fillSubjects("sgGrade","sgSubject");fillSubjects("fGrade","fSubject");
document.getElementById("kGrade").onchange=()=>{fillSubjects("kGrade","kSubject");renderKnowledge()};
document.getElementById("kSubject").onchange=renderKnowledge;
document.getElementById("search").oninput=renderKnowledge;
document.getElementById("qGrade").onchange=()=>fillSubjects("qGrade","qSubject");
document.getElementById("sgGrade").onchange=()=>{fillSubjects("sgGrade","sgSubject");updateSgkVolumes();updateSgkLink()};
document.getElementById("sgSubject").onchange=()=>{updateSgkVolumes();updateSgkLink()};
document.getElementById("sgVolume").onchange=updateSgkLink;
document.getElementById("sgSeries").onchange=updateSgkLink;

// IDs below point to the exact book pages on the official NXB Giáo dục Việt Nam portal.
// Order of each pair is Tập 1, Tập 2. Links not confidently matched are intentionally omitted.
const sgkDetailIds={
  "Toán":{
    1:["940114881","940245815"],2:["939830550","939971500"],3:["940103475","939821615"],
    4:["939781966","939791544"],5:["939842795","940023543"],6:["940011379","939957508"],
    7:["939878831","939761299"],8:["940047193","940232902"],9:["939944841","940079258"]
  },
  "Tiếng Việt":{
    1:["940092412","939724784"],2:["940104293","940040335"],3:["940169244","940192790"],
    4:["939811319","940215495"],5:["939751774","940254580"]
  },
  "Ngữ văn":{
    6:["939788653","940021114"],7:["940049915","939863301"],
    8:["939695622","939816789"],9:["939874782","939951356"]
  }
};
const sgkSlugs={"Toán":"toan","Tiếng Việt":"tieng-viet","Ngữ văn":"ngu-van"};
const sgkReaderUrls={
  // Các đường dẫn dưới đây đã được mở kiểm tra trên cổng SGK điện tử của NXB Giáo dục Việt Nam.
  // Toán: Tập 1 và Tập 2, lớp 1–9.
  "1|Toán|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-1-tap-mot.4698216815",
  "1|Toán|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-1-tap-hai.4712748878",
  "2|Toán|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-2-tap-mot.4698648594",
  "2|Toán|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-2-tap-hai.4713893812",
  "3|Toán|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-3-tap-mot.4698702815",
  "3|Toán|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-3-tap-hai.4714081721",
  "4|Toán|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-4-tap-mot.4714093295",
  "4|Toán|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-4-tap-hai.4698870230",
  "5|Toán|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-5-tap-mot.4699756373",
  "5|Toán|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-5-tap-hai.4714103431",
  "6|Toán|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-6-tap-mot.4699854777",
  "6|Toán|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-6-tap-hai.4699864675",
  "7|Toán|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-7-tap-mot.4714106181",
  "7|Toán|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-7-tap-hai.4700015846",
  "8|Toán|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-8-tap-mot.4700097446",
  "8|Toán|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-8-tap-hai.4700102182",
  "9|Toán|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-9-tap-mot.4714692201",
  "9|Toán|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-9-tap-hai.4714699696",

  // Tiếng Việt: Tập 1 và Tập 2, lớp 1–5.
  "1|Tiếng Việt|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tieng-viet-1-tap-mot.4695822132",
  "1|Tiếng Việt|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tieng-viet-1-tap-hai.4698214319",
  "2|Tiếng Việt|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tieng-viet-2-tap-mot.4698590737",
  "2|Tiếng Việt|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tieng-viet-2-tap-hai.4698600732",
  "3|Tiếng Việt|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tieng-viet-3-tap-mot.4698680579",
  "3|Tiếng Việt|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tieng-viet-3-tap-hai.4698697436",
  "4|Tiếng Việt|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tieng-viet-4-tap-mot.4698846675",
  "4|Tiếng Việt|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tieng-viet-4-tap-hai.4698852686",
  "5|Tiếng Việt|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tieng-viet-5-tap-mot.4699740998",
  "5|Tiếng Việt|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tieng-viet-5-tap-hai.4699750731",

  // Ngữ văn: Tập 1 và Tập 2, lớp 6–9.
  "6|Ngữ văn|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-ngu-van-6-tap-mot.4699839775",
  "6|Ngữ văn|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-ngu-van-6-tap-hai.4699846798",
  "7|Ngữ văn|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-ngu-van-7-tap-mot.4699959987",
  "7|Ngữ văn|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-ngu-van-7-tap-hai.4700000210",
  "8|Ngữ văn|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-ngu-van-8-tap-mot.4700073646",
  "8|Ngữ văn|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-ngu-van-8-tap-hai.4700085484",
  "9|Ngữ văn|Tập 1":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-ngu-van-9-tap-mot.4700220434",
  "9|Ngữ văn|Tập 2":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-ngu-van-9-tap-hai.4714685580",

  // Các môn có một cuốn cho cả năm.
  "3|Tin học|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tin-hoc-3.4698739161",
  "4|Tin học|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tin-hoc-4.4698914396",
  "5|Tin học|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tin-hoc-5.4699814459",
  "6|Tin học|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tin-hoc-6.4699918592",
  "7|Tin học|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tin-hoc-7.4700056620",
  "8|Tin học|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tin-hoc-8.4700157933",
  "9|Tin học|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-tin-hoc-9.4700233123",
  "6|Khoa học tự nhiên|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-khoa-hoc-tu-nhien-6.4699875855",
  "7|Khoa học tự nhiên|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-khoa-hoc-tu-nhien-7.4700027658",
  "9|Khoa học tự nhiên|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-khoa-hoc-tu-nhien-9.4700446949",
  "6|GDCD|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-giao-duc-cong-dan-6.4726791109",
  "7|GDCD|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-giao-duc-cong-dan-7.4726822635",
  "8|GDCD|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-giao-duc-cong-dan-8.4726856411",
  "9|GDCD|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-giao-duc-cong-dan-9.4714947143",
  "8|Lịch sử và Địa lí|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-lich-su-dia-li-8.4830375637",
  "9|Lịch sử và Địa lí|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-lich-su-va-dia-li-9.4844021301",
  "7|Mĩ thuật|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-mi-thuat-7.4700045108",
  "7|Âm nhạc|single":"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-am-nhac-7.4700049640"
};
const sgkSingleDetails={
  "6|Khoa học tự nhiên":{slug:"khoa-hoc-tu-nhien-6",id:"939912812"},
  "7|Khoa học tự nhiên":{slug:"khoa-hoc-tu-nhien-7",id:"940150676"},
  "9|Khoa học tự nhiên":{slug:"khoa-hoc-tu-nhien-9",id:"939997871"},
  "6|GDCD":{slug:"giao-duc-cong-dan-6",id:"939886622"},
  "7|GDCD":{slug:"giao-duc-cong-dan-7",id:"940109367"},
  "8|GDCD":{slug:"giao-duc-cong-dan-8",id:"940161565"},
  "9|GDCD":{slug:"giao-duc-cong-dan-9",id:"940038151"},
  "8|Lịch sử và Địa lí":{slug:"lich-su-va-dia-li-8",id:"939798676"},
  "9|Lịch sử và Địa lí":{slug:"lich-su-va-dia-li-9",id:"940191609"},
  "3|Tin học":{slug:"tin-hoc-3",id:"940253536"},
  "4|Tin học":{slug:"tin-hoc-4",id:"940020933"},
  "5|Tin học":{slug:"tin-hoc-5",id:"940231532"},
  "6|Tin học":{slug:"tin-hoc-6",id:"939966735"},
  "7|Tin học":{slug:"tin-hoc-7",id:"939787805"},
  "8|Tin học":{slug:"tin-hoc-8",id:"940160751"},
  "9|Tin học":{slug:"tin-hoc-9",id:"940119364"},
  "7|Mĩ thuật":{slug:"mi-thuat-7",id:"939796786"},
  "7|Âm nhạc":{slug:"am-nhac-7",id:"939707982"}
};
function officialSgkSubject(subject){return subject==="GDCD"?"Giáo dục công dân":subject;}
function bookTitle(grade,subject,volume){
  const titleSubject=officialSgkSubject(subject);
  if(volume==="single") return `${titleSubject} ${grade}`;
  return `${titleSubject} ${grade}, ${volume==="Tập 1"?"tập một":"tập hai"}`;
}
function updateSgkVolumes(){
  const grade=Number(document.getElementById("sgGrade").value);
  const subject=document.getElementById("sgSubject").value;
  const volume=document.getElementById("sgVolume");
  const split=(subject==="Toán")||(subject==="Tiếng Việt"&&grade<=5)||(subject==="Ngữ văn"&&grade>=6);
  const previous=volume.value;
  volume.innerHTML=split?'<option value="Tập 1">Tập 1</option><option value="Tập 2">Tập 2</option>':'<option value="single">Một cuốn / cả năm</option>';
  if(split && (previous==="Tập 1"||previous==="Tập 2")) volume.value=previous;
  if(!split) volume.value="single";
}
function updateSgkLink(){
  const grade=Number(document.getElementById("sgGrade").value);
  const subject=document.getElementById("sgSubject").value;
  const volume=document.getElementById("sgVolume").value;
  const series=document.getElementById("sgSeries").value;
  const summary=document.getElementById("sgkSummary");
  const btn=document.getElementById("sgkOpenLink");
  const help=document.getElementById("sgkHelp");
  const title=bookTitle(grade,subject,volume);
  const baseCatalog=`https://taphuan.nxbgd.vn/tap-huan?grade=${grade}`;
  summary.innerHTML=`<b>${title}</b><br><b>Bộ sách:</b> ${series==="unified"?"Bộ SGK thống nhất (NXB Giáo dục Việt Nam)":series}`;

  if(series!=="unified"){
    btn.href=baseCatalog;
    btn.textContent="🔎 Tìm bộ sách đã chọn";
    help.textContent=`Cổng chính thức mở danh mục lớp ${grade}. Link đọc thẳng cho bộ “${series}” chưa được xác minh trong web này; sau khi mở, tìm tên sách và chọn đúng bộ/môn/tập.`;
    return;
  }

  const key=`${grade}|${subject}|${volume}`;
  if(sgkReaderUrls[key]){
    btn.href=sgkReaderUrls[key];
    btn.textContent="📖 Đọc SGK ngay";
    help.textContent=`Đã có liên kết đọc trực tiếp đến ${title} trên cổng SGK của NXB Giáo dục Việt Nam.`;
    return;
  }
  const ids=sgkDetailIds[subject] ? sgkDetailIds[subject][grade] : null;
  const volumeIndex=volume==="Tập 1"?0:1;
  if(ids && ids[volumeIndex]){
    const slug=sgkSlugs[subject];
    const id=ids[volumeIndex];
    btn.href=`https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/${slug}-${grade}-${volumeIndex===0?"tap-mot":"tap-hai"}-${id}.${id}`;
    btn.textContent="📘 Mở đúng cuốn SGK";
    help.textContent=`Đường dẫn đọc trực tiếp cho ${title} chưa có trong danh sách; đang mở trang chi tiết sách chính thức để mày có thể chọn đúng phiên bản điện tử.`;
    return;
  }
  const single=sgkSingleDetails[`${grade}|${subject}`];
  if(volume==="single" && single){
    btn.href=`https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/${single.slug}-${single.id}.${single.id}`;
    btn.textContent="📘 Mở đúng cuốn SGK";
    help.textContent=`Trang đọc trực tiếp cho ${title} chưa được xác minh trong danh sách; đang mở trang sách chính thức để chọn phiên bản điện tử.`;
    return;
  }
  btn.href=baseCatalog;
  btn.textContent=`🔎 Tìm ${title}`;
  help.textContent=`Chưa xác minh được đường dẫn đọc thẳng cho ${title}, nên nút mở danh mục SGK chính thức đã lọc theo lớp ${grade}. Tại đó, chọn môn ${subject} và đúng tên sách.`;
}
updateSgkVolumes();
updateSgkLink();

function showToolMenu(){
 const menu=document.getElementById('toolMenu');
 const content=document.getElementById('toolsContent');
 if(menu)menu.classList.remove('hidden');
 if(content)content.classList.add('hidden');
 document.querySelectorAll('#tools .tool-card').forEach(el=>el.classList.remove('active'));
}
function showToolModule(index){
 const cards=Array.from(document.querySelectorAll('#tools .tool-card'));
 const menu=document.getElementById('toolMenu');
 const content=document.getElementById('toolsContent');
 if(!Number.isInteger(index)||index<0||index>=cards.length)return;
 cards.forEach((el,i)=>el.classList.toggle('active',i===index));
 if(menu)menu.classList.add('hidden');
 if(content)content.classList.remove('hidden');
 const heading=cards[index].querySelector('h3');
 const title=document.getElementById('toolCurrentTitle');
 if(title)title.textContent=heading?heading.textContent.trim():'Công cụ học tập';
}
function showTab(t){
 const tabs=["knowledge","quiz","textbooks","progress","flash","planner","pet","offline","tools","help"];
 tabs.forEach(x=>{const el=document.getElementById(x);if(el)el.classList.toggle("hidden",t!==x);const b=document.getElementById("tab"+({knowledge:"Knowledge",quiz:"Quiz",textbooks:"Textbooks",progress:"Progress",flash:"Flash",planner:"Planner",pet:"Pet",offline:"Offline",tools:"Tools",help:"Help"}[x]));if(b)b.classList.toggle("active",t===x)});
 if(t==="progress")renderProgress();if(t==="flash"&&!flashcards.length)startFlashcards();if(t==="planner")renderPlanner();if(t==="pet")renderPet();if(t==="tools")refreshTools();
}
function renderKnowledge(){
 const detail=document.getElementById("knowledgeDetail");
 if(detail){detail.classList.add("hidden");detail.innerHTML="";}
 const s=document.getElementById("kSubject").value,grade=document.getElementById("kGrade").value,term=document.getElementById("search").value.toLowerCase();
 // Tin học dùng chủ đề theo đúng lớp và bài đang có trong ngân hàng, tránh hiện chủ đề chung không khớp câu hỏi.
 const topicList=s==="Tin học"?[...new Set((bank[`${grade}|${s}`]||[]).map(item=>String(item[4]||"").trim()).filter(Boolean))]:(topics[s]||[]);
 const arr=topicList.filter(x=>x.toLowerCase().includes(term));
 document.getElementById("knowledgeList").innerHTML=arr.map((x,i)=>`<div class="tile" onclick="openTopic('${s}','${x}')"><span class="icon">${icons[s]||"📘"}</span><b>${x}</b><span class="muted">Xem kiến thức →</span></div>`).join("")||"<p>Không tìm thấy chủ đề.</p>";
}
function openTopic(s,t){
 const g=document.getElementById("kGrade").value;
 const pool=(bank[`${g}|${s}`]||[]).filter(q=>String(q[4]||"").toLowerCase()===String(t).toLowerCase());
 const example=pool[0];
 const sample=example?`<div class="feedback"><b>🧠 Câu tự kiểm tra cùng lớp, môn và chủ đề</b><p>${escapeHTML(example[0])}</p><p><b>Đáp án:</b> ${escapeHTML(example[1][example[2]])}</p></div>`:`<div class="feedback"><b>Chưa có câu hỏi gắn đúng chủ đề này.</b><p>Để tránh học nhầm nội dung, trang không lấy câu từ chủ đề khác thay thế. Hãy chọn chủ đề khác hoặc làm Quiz đúng lớp–môn.</p></div>`;
 document.getElementById("knowledgeDetail").classList.remove("hidden");
 document.getElementById("knowledgeDetail").innerHTML=`<span class="pill">${icons[s]||"📘"} ${escapeHTML(s)} · Lớp ${g}</span><h2>${escapeHTML(t)}</h2><p class="muted">Chủ đề ôn tập thuộc bộ nội dung hiện có. Tên chủ đề và câu tự kiểm tra được lấy từ lựa chọn lớp–môn hiện tại, không đại diện cho mục lục chính thức của mọi bộ SGK.</p><p><b>📌 Cách ôn:</b> Tự nêu khái niệm chính, giải thích bằng lời của mình rồi đối chiếu với ví dụ hoặc câu hỏi.</p>${sample}<p><b>💡 Mẹo học:</b> Đọc hiểu → tự nói lại → làm Quiz → xem lại câu sai.</p><button type="button" class="primary" onclick="useSearchResult('${g}','${s}')">📝 Làm Quiz lớp ${g} môn ${s}</button>`;
 document.getElementById("knowledgeDetail").scrollIntoView({behavior:"smooth"});
}
function shuffleArray(list){
 const out=list.slice();
 for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
 return out;
}
function getPool(){
 const g=document.getElementById("qGrade").value,s=document.getElementById("qSubject").value;
 // Chỉ lấy ngân hàng đã gắn đúng lớp + môn; tuyệt đối không lấy câu hỏi dự phòng từ môn khác.
 let p=(bank[`${g}|${s}`]||[]).slice();
 const d=document.getElementById("difficulty").value;
 if(d!=="all") p=p.filter(item=>item[3]===d);
 return shuffleArray(p);
}
function startQuiz(){
 clearInterval(timer);clearInterval(examTimer);quizFinished=false;quizRunId++;questions=getPool();
 if(!questions.length){
   const g=document.getElementById("qGrade").value,s=document.getElementById("qSubject").value;
   document.getElementById("quizCard").classList.remove("hidden");
   const d=document.getElementById("difficulty").value;
   document.getElementById("quizCard").innerHTML=`<div class="feedback"><b>${d!=="all"?`Chưa có câu ở mức độ “${d==="easy"?"Dễ":d==="medium"?"Vừa":"Khó"}” cho Lớp ${g} · ${s}.`:`Chưa có bộ câu hỏi cho Lớp ${g} · ${s}.`}</b><p>Hệ thống không lấy câu hỏi của môn khác để bù. Hãy thử độ khó “Tất cả” hoặc chọn tổ hợp lớp–môn khác.</p></div>`;
   document.getElementById("examClock").classList.add("hidden");
   return;
 }
 let requestedCount=Number(document.getElementById("qCount").value);
 if(!Number.isFinite(requestedCount)||requestedCount<1)requestedCount=Math.min(10,questions.length);
 let count=Math.min(requestedCount,questions.length);questions=questions.slice(0,count);
 if(!questions.length){document.getElementById("quizCard").classList.remove("hidden");document.getElementById("quizCard").innerHTML='<div class="feedback"><b>Chưa tạo được đề.</b><p>Hãy chọn số câu hợp lệ rồi thử lại.</p></div>';return;}
 qi=0;score=0;wrongQuestions=[];streak=0;eliminatedAt={};
 document.getElementById("quizCard").classList.remove("hidden");
 const duration=Number(document.getElementById("examDuration").value),clock=document.getElementById("examClock");
 if(duration>0){examRemaining=duration*60;clock.classList.remove("hidden");updateExamClock();examTimer=setInterval(()=>{examRemaining--;updateExamClock();if(examRemaining<=0){clearInterval(examTimer);clearInterval(timer);finish(true)}},1000)}else{clock.classList.add("hidden")}
 showQuestion();document.getElementById("quizCard").scrollIntoView({behavior:"smooth"});
}
function randomQuiz(){
 const opts=subjects[document.getElementById("qGrade").value]||[];
 if(opts.length){document.getElementById("qSubject").selectedIndex=Math.floor(Math.random()*opts.length);}
 document.getElementById("difficulty").value="all";
 startQuiz();
}
function showQuestion(){
 clearInterval(timer);let q=questions[qi],sec=+document.getElementById("time").value;
 document.getElementById("quizCard").innerHTML=`<div><span class="pill">Lớp ${document.getElementById("qGrade").value} • ${document.getElementById("qSubject").value}</span><h3>Câu ${qi+1}/${questions.length} • Điểm ${score} • 🔥 Chuỗi đúng ${streak}</h3><div class="bar"><div style="width:${qi/questions.length*100}%"></div></div>${sec?`<p>⏱️ Còn <b id="clock">${sec}</b> giây</p>`:""}<div class="q" id="questionText">${q[0]}</div>${q[4]?`<div class="pill">📌 Chủ đề: ${q[4]}</div>`:""}<div class="quiz-tools"><button type="button" class="secondary" onclick="showHint()">💡 Gợi ý</button><button type="button" class="secondary" onclick="eliminateWrong()">✂️ Loại đáp án sai</button><button type="button" class="secondary" onclick="speakQuestion()">🔊 Đọc câu hỏi</button><button type="button" class="secondary" onclick="reportCurrentQuestion()">🚩 Báo câu hỏi lỗi</button></div><div id="hintBox" class="feedback hidden" aria-live="polite"></div><div class="answers">${q[1].map((a,i)=>`<button type="button" class="ans" data-answer="${i}" onclick="answer(${i})">${String.fromCharCode(65+i)}. ${a}</button>`).join("")}</div><div id="answerFeedback" class="feedback hidden" aria-live="polite"></div></div>`;
 if(sec){remaining=sec;timer=setInterval(()=>{remaining--;let c=document.getElementById("clock");if(c)c.textContent=remaining;if(remaining<=0){clearInterval(timer);answer(-1)}},1000)}
}
function answer(c){
 if(quizFinished||!questions[qi])return;
 clearInterval(timer);let q=questions[qi];document.querySelectorAll(".ans").forEach((b,i)=>{b.disabled=true;if(i===q[2])b.classList.add("correct");if(i===c&&c!==q[2])b.classList.add("wrong")});
 try{const perf=loadStore('questionPerformance',{}),g=document.getElementById('qGrade').value,sub=document.getElementById('qSubject').value,perfKey=`${g}|${sub}|${String(q[0]).slice(0,240)}`;const row=perf[perfKey]||{grade:g,subject:sub,prompt:String(q[0]),topic:q[4]||'',correct:0,wrong:0,skipped:0,total:0,lastSeen:''};row.total++;if(c===q[2])row.correct++;else if(c<0)row.skipped++;else row.wrong++;row.lastSeen=new Date().toISOString();perf[perfKey]=row;saveStore('questionPerformance',perf);}catch(e){}
 const fb=document.getElementById("answerFeedback");if(fb){fb.classList.remove("hidden");fb.innerHTML=(c===q[2]?"✅ Chính xác!":"❌ Chưa đúng.")+` Đáp án đúng: <b>${String.fromCharCode(65+q[2])}. ${q[1][q[2]]}</b>.<br><b>Gợi ý ôn tập:</b> ${explainAnswer(q)}`;}
 if(c===q[2]){score++;streak++;bestStreak=Math.max(bestStreak,streak);try{localStorage.setItem("bestStreak",String(Math.max(bestStreak,Number(localStorage.getItem("bestStreak"))||0)))}catch(e){}}else{streak=0;wrongQuestions.push(q);trackMissedQuestion(q,c);}
 const runId=quizRunId;
 setTimeout(()=>{if(runId!==quizRunId||quizFinished)return;qi++;if(qi<questions.length)showQuestion();else finish()},1800);
}
function showHint(){const q=questions[qi],box=document.getElementById("hintBox");if(!box)return;box.classList.remove("hidden");box.textContent="💡 Gợi ý: Hãy chú ý đến chủ đề “"+(q[4]||document.getElementById("qSubject").value)+"”. Đọc kỹ từng phương án, loại những lựa chọn không phù hợp với khái niệm đang hỏi; gợi ý này chưa tiết lộ đáp án.";}
function eliminateWrong(){const q=questions[qi],buttons=Array.prototype.slice.call(document.querySelectorAll(".ans"));let wrong=buttons.filter((b,i)=>i!==q[2]&&!b.disabled&&!b.classList.contains("eliminated"));shuffleArray(wrong).slice(0,Math.min(2,wrong.length)).forEach(b=>{b.disabled=true;b.classList.add("eliminated");b.style.opacity=".35";b.style.textDecoration="line-through";b.textContent+=" — đã loại";});}
function explainAnswer(q){const subj=document.getElementById("qSubject").value,topic=q[4]||subj;return "Câu này thuộc chủ đề “"+topic+"”. Hãy đối chiếu quy tắc hoặc định nghĩa tương ứng trong phần Kiến thức/SGK; hiện chưa có lời giải chi tiết riêng cho từng câu.";}
function speakQuestion(){if(!('speechSynthesis' in window)){alert("Trình duyệt này chưa hỗ trợ đọc câu hỏi.");return;}try{window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(questions[qi][0]);u.lang="vi-VN";window.speechSynthesis.speak(u);}catch(e){alert("Không thể đọc câu hỏi trên thiết bị này.");}}
function saveNotes(){const g=document.getElementById("qGrade").value,s=document.getElementById("qSubject").value,key="studyNotes_"+g+"_"+s,val=document.getElementById("personalNotes").value;try{localStorage.setItem(key,val);volatileStore[key]=val;document.getElementById("notesStatus").textContent=" Đã lưu!";}catch(e){volatileStore[key]=val;document.getElementById("notesStatus").textContent=" Đã giữ ghi chú trong phiên hiện tại; hãy xuất sao lưu trước khi đóng trang.";}}
function loadNotes(){const g=document.getElementById("qGrade").value,s=document.getElementById("qSubject").value,key="studyNotes_"+g+"_"+s;try{const v=localStorage.getItem(key);document.getElementById("personalNotes").value=v!==null?v:(volatileStore[key]||"");}catch(e){document.getElementById("personalNotes").value=volatileStore[key]||"";}document.getElementById("notesStatus").textContent="";}
function showReview(){const box=document.getElementById("reviewCard");box.classList.remove("hidden");if(!wrongQuestions.length){box.innerHTML="<h3>🔁 Ôn câu sai</h3><p>Tuyệt! Bài này không có câu sai.</p>";return;}box.innerHTML="<h3>🔁 Ôn câu sai ("+wrongQuestions.length+")</h3>"+wrongQuestions.map((q,i)=>`<div class="feedback"><b>${i+1}. ${q[0]}</b><p>Đáp án: ${q[1][q[2]]}</p><p class="muted">Chủ đề: ${q[4]||"Ôn tập"}</p></div>`).join("")+`<button type="button" class="primary" onclick="retryWrong()">Luyện lại câu sai</button>`;}
function retryWrong(){if(!wrongQuestions.length)return;clearInterval(timer);clearInterval(examTimer);questions=wrongQuestions.slice();wrongQuestions=[];qi=0;score=0;streak=0;eliminatedAt={};quizFinished=false;quizRunId++;document.getElementById("reviewCard").classList.add("hidden");document.getElementById("quizCard").classList.remove("hidden");showQuestion();}
function recommendTopics(){const box=document.getElementById("recommendCard");box.classList.remove("hidden");const counts={};wrongQuestions.forEach(q=>{const t=q[4]||document.getElementById("qSubject").value;counts[t]=(counts[t]||0)+1});const list=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]);box.innerHTML="<h3>🎯 Bài nên ôn lại</h3>"+(list.length?"<p>Dựa trên câu trả lời sai, bạn nên xem lại:</p><ul>"+list.map(t=>"<li><b>"+t+"</b> — "+counts[t]+" câu sai</li>").join("")+"</ul>":"<p>Chưa có chủ đề cần ôn thêm. Làm thêm bài Quiz để nhận gợi ý nhé!</p>");}

const fallbackScores={};
function readBestScore(key){
 try{return Number(window.localStorage.getItem(key))||0;}
 catch(e){return fallbackScores[key]||0;}
}
function writeBestScore(key,value){
 fallbackScores[key]=value;
 try{window.localStorage.setItem(key,String(value));}catch(e){/* Private browsing or file:// storage may be blocked on Safari. */}
}
function updateExamClock(){const el=document.getElementById("examClock");if(el){const m=Math.floor(examRemaining/60),sec=examRemaining%60;el.textContent=`⏱️ Thời gian còn lại: ${m}:${String(sec).padStart(2,"0")}`}}
function finish(timeUp){
 if(quizFinished||!questions.length)return;
 quizFinished=true;quizRunId++;
 clearInterval(timer);clearInterval(examTimer);
 const g=document.getElementById("qGrade").value,s=document.getElementById("qSubject").value;
 let pct=Math.round(score/questions.length*100),key=`bestScore_${g}_${s}`,best=readBestScore(key);if(pct>best)writeBestScore(key,pct);
 const stats=loadStore("stats",{}),sk=g+"|"+s;stats[sk]=stats[sk]||{attempts:0,correct:0,total:0,best:0};stats[sk].attempts++;stats[sk].correct+=score;stats[sk].total+=questions.length;stats[sk].best=Math.max(stats[sk].best,pct);saveStore("stats",stats);
 const earned=score*10+Math.round(pct/10)*5;addWallet(earned,Math.max(1,Math.floor(score/2)));const pet=loadStore("pet",{name:"Bắp",level:1,hunger:0,happiness:50});pet.hunger=Math.min(100,(pet.hunger||0)+Math.max(5,score*2));pet.xp=(pet.xp||0)+score*5;while(pet.xp>=pet.level*30){pet.xp-=pet.level*30;pet.level++;}saveStore("pet",pet);
 document.getElementById("quizCard").innerHTML=`<div class="result"><h2>${timeUp?"⏰ Hết giờ thi!":"🎉 Hoàn thành Quiz!"}</h2><div class="big">${score}/${questions.length}</div><p>📊 ${pct}% đúng</p><p>🏆 Thành tích tốt nhất <b>Lớp ${g} • ${s}</b>: <b>${Math.max(pct,best)}%</b></p><p>🔥 Kỷ lục chuỗi trả lời đúng: <b>${bestStreak}</b></p><p>✨ Nhận được <b>${earned} EXP</b> và <b>${Math.max(1,Math.floor(score/2))} xu</b>!</p><button type="button" class="secondary" onclick="showTab('progress')">🏆 Xem thành tích</button><button type="button" class="primary" onclick="startQuiz()">🔄 Làm lại</button><button type="button" class="secondary" onclick="showTab('knowledge')">🧠 Ôn kiến thức</button><button type="button" class="secondary" onclick="showReview()">🔁 Ôn câu sai (${wrongQuestions.length})</button><button type="button" class="secondary" onclick="recommendTopics()">🎯 Gợi ý bài nên học</button></div>`;
}
renderKnowledge();
loadNotes();
initStudyApp();
initTools();
document.getElementById("fGrade").addEventListener("change",()=>{fillSubjects("fGrade","fSubject");startFlashcards();});
document.getElementById("fSubject").addEventListener("change",()=>startFlashcards());
document.getElementById("fDeck").addEventListener("change",()=>startFlashcards());
document.getElementById("flashcard").addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();flipFlashcard();}});
document.getElementById("kGrade").addEventListener("change",function(){fillSubjects("kGrade","kSubject");renderKnowledge();});
document.getElementById("kSubject").addEventListener("change",function(){renderKnowledge();});
document.getElementById("qGrade").addEventListener("change",function(){loadNotes();});
document.getElementById("qSubject").addEventListener("change",function(){loadNotes();});

function loadStore(key,fallback){const full=STORE+key;try{const v=localStorage.getItem(full);if(v!==null)return JSON.parse(v);}catch(e){}try{if(Object.prototype.hasOwnProperty.call(volatileStore,full))return JSON.parse(volatileStore[full]);}catch(e){}return fallback}
function saveStore(key,val){const full=STORE+key,serialized=JSON.stringify(val);volatileStore[full]=serialized;try{localStorage.setItem(full,serialized);return true}catch(e){return false}}
function addWallet(xp,coins){const w=loadStore("wallet",{xp:0,coins:0});w.xp+=xp;w.coins+=coins;saveStore("wallet",w)}
function getLevel(xp){return Math.floor(Math.sqrt(Math.max(0,xp)/100))+1}
function initStudyApp(){renderProgress();renderPlanner();renderPet();loadSchedule();}
function renderProgress(){const w=loadStore("wallet",{xp:0,coins:0}),stats=loadStore("stats",{}),xp=w.xp||0,level=getLevel(xp),next=level*level*100,prev=(level-1)*(level-1)*100,percent=Math.min(100,Math.round((xp-prev)/(next-prev||1)*100));document.getElementById("statSummary").innerHTML=`<div class="stat-box"><div>⭐ Cấp độ</div><div class="stat-number">${level}</div><div class="progress-line"><span style="width:${percent}%"></span></div><small>${xp-prev}/${next-prev} EXP tới cấp tiếp</small></div><div class="stat-box"><div>✨ Tổng EXP</div><div class="stat-number">${xp}</div></div><div class="stat-box"><div>🪙 Xu</div><div class="stat-number">${w.coins||0}</div></div><div class="stat-box"><div>📚 Môn đã luyện</div><div class="stat-number">${Object.keys(stats).length}</div></div>`;const rows=Object.entries(stats).sort((a,b)=>b[1].attempts-a[1].attempts);document.getElementById("subjectStats").innerHTML=rows.length?rows.map(([k,v])=>{const parts=k.split("|"),avg=v.total?Math.round(v.correct/v.total*100):0;return `<div class="feedback"><b>Lớp ${parts[0]} · ${parts[1]}</b><p>${v.attempts} lượt thi · ${v.correct}/${v.total} câu đúng · tốt nhất ${v.best}%</p><div class="progress-line"><span style="width:${avg}%"></span></div><small>Độ chính xác tích lũy: ${avg}%</small></div>`}).join(""):`<p class="muted">Chưa có dữ liệu. Hoàn thành một bài Quiz để bắt đầu thống kê.</p>`;const total=Object.values(stats).reduce((n,v)=>n+v.attempts,0),badges=[{e:"🌱",n:"Bắt đầu hành trình",ok:total>=1,d:"Hoàn thành 1 bài Quiz"},{e:"🔥",n:"Chăm chỉ",ok:total>=5,d:"Hoàn thành 5 bài Quiz"},{e:"🧠",n:"Siêu trí nhớ",ok:xp>=300,d:"Đạt 300 EXP"},{e:"🏆",n:"Cao thủ",ok:xp>=1000,d:"Đạt 1.000 EXP"},{e:"🪙",n:"Tích xu",ok:(w.coins||0)>=50,d:"Tích lũy 50 xu"},{e:"📚",n:"Đa môn",ok:Object.keys(stats).length>=3,d:"Học ít nhất 3 tổ hợp lớp-môn"}];document.getElementById("badgeList").innerHTML=badges.map(b=>`<div class="badge-item ${b.ok?"":"locked"}"><div style="font-size:30px">${b.e}</div><b>${b.n}</b><p class="muted">${b.ok?"Đã mở khóa":b.d}</p></div>`).join("")}
function startFlashcards(){
 const g=document.getElementById("fGrade").value,s=document.getElementById("fSubject").value,deck=document.getElementById("fDeck").value;
 const pool=(bank[`${g}|${s}`]||[]).filter(item=>Array.isArray(item)&&item.length>=3&&Array.isArray(item[1])&&item[2]>=0&&item[2]<item[1].length);
 let arr=[];
 if(deck==="quiz"){
   arr=pool.map(item=>({front:item[0],back:`Đáp án: ${item[1][item[2]]}${item[4]?"\nChủ đề: "+item[4]:""}`}));
 }else{
   const groups={};
   pool.forEach(item=>{const topic=item[4]||"Ôn tập";(groups[topic]||(groups[topic]=[])).push(item);});
   arr=Object.keys(groups).map(topic=>{
     const sample=groups[topic][0];
     return {front:topic,back:`Câu hỏi ôn tập: ${sample[0]}\nĐáp án: ${sample[1][sample[2]]}\nCó ${groups[topic].length} câu liên quan đến chủ đề này trong bộ Quiz.`};
   });
 }
 flashcards=shuffleArray(arr);flashIndex=0;flashBack=false;
 document.getElementById("flashKnownStatus").textContent="";
 renderFlashcard();
}
function renderFlashcard(){
 const el=document.getElementById("flashcard"),count=document.getElementById("flashCount");
 if(!flashcards.length){el.textContent=`Chưa có thẻ cho Lớp ${document.getElementById("fGrade").value} · ${document.getElementById("fSubject").value}. Không dùng thẻ từ môn khác.`;count.textContent="Hãy chọn lớp/môn khác hoặc thử đổi Bộ thẻ.";el.setAttribute("aria-label",el.textContent);return}
 if(flashIndex<0||flashIndex>=flashcards.length)flashIndex=0;
 const c=flashcards[flashIndex];el.textContent=flashBack?c.back:c.front;el.setAttribute("aria-label",`${flashBack?"Mặt sau":"Mặt trước"}: ${el.textContent}. Nhấn Enter hoặc Space để lật.`);el.setAttribute("aria-pressed",String(flashBack));
 count.textContent=`Lớp ${document.getElementById("fGrade").value} · ${document.getElementById("fSubject").value} · Thẻ ${flashIndex+1}/${flashcards.length} · ${flashBack?"Mặt sau":"Mặt trước"}`;
}
function flipFlashcard(){if(!flashcards.length){startFlashcards();return;}flashBack=!flashBack;renderFlashcard()}
function nextFlashcard(){if(!flashcards.length){startFlashcards();return;}flashIndex=(flashIndex+1)%flashcards.length;flashBack=false;renderFlashcard()}
function prevFlashcard(){if(!flashcards.length){startFlashcards();return;}flashIndex=(flashIndex-1+flashcards.length)%flashcards.length;flashBack=false;renderFlashcard()}
function markFlashKnown(){if(!flashcards.length){startFlashcards();return;}const key="flashKnown_"+document.getElementById("fGrade").value+"_"+document.getElementById("fSubject").value,known=loadStore(key,[]),term=flashcards[flashIndex].front;let earned=false;if(!known.includes(term)){known.push(term);saveStore(key,known);addWallet(2,1);earned=true}document.getElementById("flashKnownStatus").textContent=earned?`Đã thuộc “${term}”! +2 EXP và +1 xu 🎉`:`“${term}” đã được đánh dấu thuộc trước đó.`;nextFlashcard()}
function renderPet(){const p=loadStore("pet",{name:"Bắp",level:1,xp:0,hunger:25,happiness:50}),w=loadStore("wallet",{xp:0,coins:0}),face=p.happiness<20?"🥺":p.hunger>70?"🐥":"🐣";document.getElementById("petView").innerHTML=`<div class="pet">${face}</div><h3 style="text-align:center">${escapeHTML(p.name||"Bắp")} · Cấp ${p.level||1}</h3><div class="stat-grid"><div class="stat-box">🍎 No bụng<div class="progress-line"><span style="width:${Math.max(0,100-(p.hunger||0))}%"></span></div><small>${Math.max(0,100-(p.hunger||0))}/100</small></div><div class="stat-box">🎾 Vui vẻ<div class="progress-line"><span style="width:${p.happiness||0}%"></span></div><small>${p.happiness||0}/100</small></div><div class="stat-box">🪙 Xu của bạn<div class="stat-number">${w.coins||0}</div></div></div>`}
function feedPet(){const w=loadStore("wallet",{xp:0,coins:0});if(w.coins<5){document.getElementById("petStatus").textContent="Chưa đủ xu; hoàn thành Quiz hoặc flashcard để kiếm thêm nhé.";return}w.coins-=5;saveStore("wallet",w);const p=loadStore("pet",{name:"Bắp",level:1,xp:0,hunger:25,happiness:50});p.hunger=Math.max(0,(p.hunger||0)-30);p.happiness=Math.min(100,(p.happiness||0)+5);saveStore("pet",p);document.getElementById("petStatus").textContent="Măm măm! Thú cưng đã được cho ăn 🥰";renderPet()}
function playPet(){const w=loadStore("wallet",{xp:0,coins:0});if(w.coins<3){document.getElementById("petStatus").textContent="Chưa đủ xu; làm thêm Quiz để kiếm xu nha.";return}w.coins-=3;saveStore("wallet",w);const p=loadStore("pet",{name:"Bắp",level:1,xp:0,hunger:25,happiness:50});p.happiness=Math.min(100,(p.happiness||0)+20);p.xp=(p.xp||0)+5;saveStore("pet",p);document.getElementById("petStatus").textContent="Chơi vui quá! +5 EXP cho thú cưng 🎉";renderPet()}
function renamePet(){const p=loadStore("pet",{name:"Bắp",level:1,hunger:25,happiness:50}),n=prompt("Đặt tên cho thú cưng:",p.name||"Bắp");if(n&&n.trim()){p.name=n.trim().slice(0,20);saveStore("pet",p);renderPet()}}
function localDateKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function renderPlanner(){const today=localDateKey(),saved=loadStore("daily",{date:today,done:[],rewarded:[]});if(saved.date!==today){saved.date=today;saved.done=[];saved.rewarded=[];}if(!Array.isArray(saved.done))saved.done=[];if(!Array.isArray(saved.rewarded))saved.rewarded=saved.done.slice();saveStore("daily",saved);const tasks=["Học hoặc ôn bài ít nhất 15 phút","Làm một bài Quiz","Ôn lại câu trả lời sai","Học 5 flashcard"];const custom=loadStore("customTasks",[]);document.getElementById("dailyTasks").innerHTML=tasks.map((t,i)=>`<label class="task-row"><input type="checkbox" ${saved.done.includes(i)?"checked":""} onchange="toggleDaily(${i},this.checked)"><span>${t}</span></label>`).join("")+`<p>Hoàn thành ${saved.done.length}/${tasks.length} nhiệm vụ cơ bản hôm nay.</p>`;document.getElementById("customTasks").innerHTML=custom.map((t,i)=>`<label class="task-row"><input type="checkbox" ${t.done?"checked":""} onchange="toggleCustom(${i},this.checked)"><span>${escapeHTML(t.text)}</span><button class="secondary" onclick="removeCustom(${i})">Xóa</button></label>`).join("")}
function toggleDaily(i,on){const today=localDateKey(),d=loadStore("daily",{date:today,done:[],rewarded:[]});if(d.date!==today){d.date=today;d.done=[];d.rewarded=[];}if(!Array.isArray(d.done))d.done=[];if(!Array.isArray(d.rewarded))d.rewarded=d.done.slice();const wasDone=d.done.includes(i);d.done=d.done.filter(x=>x!==i);if(on)d.done.push(i);if(on&&!wasDone&&!d.rewarded.includes(i)){addWallet(5,1);d.rewarded.push(i);}saveStore("daily",d);renderPlanner()}
function addCustomTask(){const el=document.getElementById("customTaskInput"),text=el.value.trim();if(!text)return;const a=loadStore("customTasks",[]);a.push({text,done:false,rewarded:false});saveStore("customTasks",a);el.value="";renderPlanner()}
function toggleCustom(i,on){const a=loadStore("customTasks",[]);if(a[i]){if(typeof a[i].rewarded!=="boolean")a[i].rewarded=!!a[i].done;if(on&&!a[i].done&&!a[i].rewarded){addWallet(5,1);a[i].rewarded=true;}a[i].done=on;saveStore("customTasks",a);renderPlanner()}}
function removeCustom(i){const a=loadStore("customTasks",[]);a.splice(i,1);saveStore("customTasks",a);renderPlanner()}
function saveSchedule(){const ok=saveStore("schedule",document.getElementById("scheduleText").value);document.getElementById("scheduleStatus").textContent=ok?"Đã lưu trên thiết bị.":"Không thể lưu trong trình duyệt này."}
function loadSchedule(){document.getElementById("scheduleText").value=loadStore("schedule","")}
function updateBackupStatus(msg){const ids=["backupStatus","toolBackupStatus"];ids.forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=msg;});}
function isAppStorageKey(k){return typeof k==="string"&&(k.startsWith(STORE)||k.startsWith("studyNotes_")||k.startsWith("bestScore_")||k==="bestStreak");}
function exportBackup(){const data={version:4,app:"HocTapLop1-9",createdAt:new Date().toISOString(),data:{}};try{try{const len=localStorage.length;for(let i=0;i<len;i++){const k=localStorage.key(i);if(k&&isAppStorageKey(k)){const v=localStorage.getItem(k);if(v!==null)data.data[k]=v;}}}catch(storageError){}Object.keys(volatileStore).forEach(k=>{if(isAppStorageKey(k)&&!(k in data.data))data.data[k]=volatileStore[k]});Object.keys(fallbackScores).forEach(k=>{if(isAppStorageKey(k)&&!(k in data.data))data.data[k]=String(fallbackScores[k])});const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="sao-luu-hoc-tap-lop-1-9.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);updateBackupStatus("Đã tạo file sao lưu JSON. Tệp gồm dữ liệu học tập mà trình duyệt hiện cho phép đọc.");}catch(e){updateBackupStatus("Không thể xuất sao lưu trong trình duyệt này. Hãy thử mở file bằng Chrome hoặc Safari đầy đủ.");}}
function importBackup(ev){const file=ev.target.files&&ev.target.files[0];if(!file)return;if(file.size>5*1024*1024){updateBackupStatus("File quá lớn (giới hạn 5 MB). Hãy kiểm tra lại file sao lưu.");ev.target.value="";return;}const reader=new FileReader();reader.onload=()=>{let old={};try{const obj=JSON.parse(reader.result);if(!obj||!obj.data||typeof obj.data!=="object"||Array.isArray(obj.data))throw new Error("invalid");const entries=Object.entries(obj.data).filter(([k,v])=>isAppStorageKey(k)&&typeof v==="string");if(!entries.length)throw new Error("empty");if(!confirm(`Tìm thấy ${entries.length} mục dữ liệu hợp lệ. Khôi phục sẽ ghi đè dữ liệu cùng tên đang có trên thiết bị này. Tiếp tục?`)){updateBackupStatus("Đã hủy khôi phục; dữ liệu hiện tại được giữ nguyên.");return;}for(const [k] of entries){try{old[k]=localStorage.getItem(k)}catch(e){old[k]=null;}}try{entries.forEach(([k,v])=>{if(k.startsWith(STORE)){JSON.parse(v);}volatileStore[k]=v;try{localStorage.setItem(k,v);}catch(e){}});updateBackupStatus("Khôi phục xong! Tải lại trang để cập nhật toàn bộ tiến độ. Nếu trình duyệt chặn lưu trữ, dữ liệu chỉ giữ trong phiên hiện tại.");}catch(writeErr){for(const [k] of entries){try{if(old[k]===null)localStorage.removeItem(k);else localStorage.setItem(k,old[k]);}catch(e){}}throw writeErr;}}catch(e){updateBackupStatus("File sao lưu không hợp lệ hoặc trình duyệt không cho phép ghi dữ liệu. Dữ liệu chưa được khôi phục hoàn chỉnh.");}finally{if(ev.target)ev.target.value="";}};reader.onerror=()=>updateBackupStatus("Không đọc được file. Hãy chọn lại file JSON.");reader.readAsText(file)}

function fillLessonTopics(){const g=document.getElementById('lessonGrade').value,s=document.getElementById('lessonSubject').value,arr=(bank[`${g}|${s}`]||[]),values=[...arr.map(q=>q[4]).filter(Boolean),...(topics[s]||[])],unique=[...new Set(values)];const topicEl=document.getElementById('lessonTopic');topicEl.innerHTML=unique.map(t=>`<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join('');const vol=document.getElementById('lessonVolume');if(vol){const split=(s==='Toán')||(s==='Tiếng Việt'&&Number(g)<=5)||(s==='Ngữ văn'&&Number(g)>=6);const old=vol.value;vol.innerHTML=split?'<option value="Tập 1">Tập 1</option><option value="Tập 2">Tập 2</option>':'<option value="single">Một cuốn / cả năm</option>';if(split&&(old==='Tập 1'||old==='Tập 2'))vol.value=old;else vol.value=split?'Tập 1':'single';}document.getElementById('lessonContent').innerHTML='<p class="muted">Chọn “Học bài này” để tạo phần ôn tập từ câu hỏi có sẵn của đúng lớp–môn.</p>';}
function openLessonStudy(){const g=document.getElementById('lessonGrade').value,s=document.getElementById('lessonSubject').value,t=document.getElementById('lessonTopic').value,series=document.getElementById('lessonSeries').value,vol=document.getElementById('lessonVolume').value;const arr=bank[`${g}|${s}`]||[];const exact=arr.filter(q=>String(q[4]||'')===t);const list=exact.length?exact:arr.filter(q=>String(q[4]||'').toLocaleLowerCase('vi').includes(t.toLocaleLowerCase('vi')));const el=document.getElementById('lessonContent');const bookName=`${s} ${g}${vol==='single'?'':', '+vol}`;const bookText=series==='unified'?'SGK NXB Giáo dục Việt Nam':series;if(!list.length){el.innerHTML=`<div class="sgk-summary"><b>Lớp ${g} · ${escapeHTML(s)} · ${escapeHTML(t)}</b><p>Chưa có câu hỏi được gắn trực tiếp với chủ đề này. Hãy mở sách để đọc bài chính thức, hoặc chọn chủ đề khác.</p></div><button type="button" class="primary" id="lessonOpenBook">📖 Mở ${escapeHTML(bookName)}</button>`;document.getElementById('lessonOpenBook').addEventListener('click',openLessonSgk);return;}const summary=list.slice(0,5).map((q,i)=>`<li>${escapeHTML(q[0])} <span class="muted">(ý ôn tập ${i+1})</span></li>`).join('');el.innerHTML=`<div class="sgk-banner"><b>📘 Bài ôn tập: ${escapeHTML(t)}</b><p><b>Lớp ${g} · ${escapeHTML(s)}</b></p><p><b>Bộ sách:</b> ${escapeHTML(bookText)} · <b>${escapeHTML(vol==='single'?'Cả năm':vol)}</b></p><div class="sgk-summary"><b>Tóm tắt ôn tập từ ngân hàng câu hỏi</b><p>Phần dưới đây tổng hợp các ý đang được hỏi trong bộ câu hỏi của website. Đây là bản ôn tập hỗ trợ, chưa phải bản tóm tắt nguyên văn hoặc mục lục đã xác minh của SGK đã chọn.</p><ul>${summary}</ul></div><p>${list.length} câu luyện tập được gắn với chủ đề này.</p><button type="button" class="secondary" id="lessonOpenBook">📖 Mở sách ${escapeHTML(bookName)}</button></div>`+list.map((q,i)=>`<details class="search-result"><summary><b>${i+1}. ${escapeHTML(q[0])}</b></summary><p><b>Đáp án trong ngân hàng:</b> ${escapeHTML(q[1][q[2]])}</p><p class="small-note">Hãy tự trả lời trước khi mở đáp án. Đáp án cần được đối chiếu với SGK nếu phát hiện dấu hiệu chưa chính xác.</p></details>`).join('')+`<button type="button" class="primary" id="lessonQuizNow">📝 Luyện Quiz cùng lớp–môn</button>`;document.getElementById('lessonOpenBook').addEventListener('click',openLessonSgk);document.getElementById('lessonQuizNow').addEventListener('click',()=>useSearchResult(g,s));}
function openLessonSgk(){const g=document.getElementById('lessonGrade').value,s=document.getElementById('lessonSubject').value,series=document.getElementById('lessonSeries').value,vol=document.getElementById('lessonVolume').value;document.getElementById('sgGrade').value=g;fillSubjects('sgGrade','sgSubject');document.getElementById('sgSubject').value=s;updateSgkVolumes();if([...document.getElementById('sgVolume').options].some(o=>o.value===vol))document.getElementById('sgVolume').value=vol;document.getElementById('sgSeries').value=series;updateSgkLink();showTab('textbooks');document.getElementById('textbooks').scrollIntoView({behavior:'smooth'});}
function fillGradeOptions(id,all=false){const e=document.getElementById(id);if(!e)return;e.innerHTML=all?'<option value="all">Tất cả lớp</option>':'';for(let i=1;i<=9;i++)e.insertAdjacentHTML('beforeend',`<option value="${i}">Lớp ${i}</option>`)}
function subjectsForFilter(grade){if(grade&&grade!=="all")return subjects[grade]||[];return [...new Set(Object.values(subjects).flat())]}
function fillToolSubjectOptions(gradeId,subjectId,all=true){const g=document.getElementById(gradeId).value;const e=document.getElementById(subjectId);const options=subjectsForFilter(g);e.innerHTML=(all?'<option value="all">Tất cả môn</option>':'')+options.map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join('');}
function useSearchResult(grade,subject){const qg=document.getElementById('qGrade'),qs=document.getElementById('qSubject');qg.value=String(grade);fillSubjects('qGrade','qSubject');qs.value=subject;document.getElementById('difficulty').value='all';showTab('quiz');startQuiz();}
function searchEverywhere(){
 const term=(document.getElementById('globalSearch').value||'').trim().toLocaleLowerCase('vi');
 const grade=document.getElementById('toolGrade').value,subject=document.getElementById('toolSubject').value,box=document.getElementById('globalSearchResults');
 if(!term){box.innerHTML='<p class="muted">Nhập từ khóa để tìm trong kiến thức và ngân hàng câu hỏi.</p>';return;}
 const hits=[];
 for(const [key,qs] of Object.entries(bank)){const [g,sub]=key.split('|');if(grade!=='all'&&g!==grade)continue;if(subject!=='all'&&sub!==subject)continue;
  for(const topic of (topics[sub]||[])){if(topic.toLocaleLowerCase('vi').includes(term))hits.push({type:'Chủ đề',g,sub,title:topic,desc:`Chủ đề ôn tập môn ${sub}`});}
  qs.forEach((q,i)=>{const hay=[q[0],...(q[1]||[]),q[4]||''].join(' ').toLocaleLowerCase('vi');if(hay.includes(term))hits.push({type:'Câu hỏi',g,sub,title:q[0],desc:`Đáp án trong ngân hàng: ${q[1][q[2]]} · Chủ đề: ${q[4]||sub}`});});
 }
 const uniq=[];const seen=new Set();for(const h of hits){const k=`${h.g}|${h.sub}|${h.type}|${h.title}`;if(!seen.has(k)){seen.add(k);uniq.push(h)}}
 const shown=uniq.slice(0,80);box.innerHTML=uniq.length?`<p class="muted">Tìm thấy ${uniq.length} kết quả${uniq.length>80?' · đang hiển thị 80 kết quả đầu tiên':''}.</p>`+shown.map((h,i)=>`<div class="search-result"><span class="pill">${h.type} · Lớp ${h.g} · ${escapeHTML(h.sub)}</span><p><b>${escapeHTML(h.title)}</b></p><p class="muted">${escapeHTML(h.desc)}</p><button type="button" class="secondary" data-search-grade="${h.g}" data-search-subject="${escapeHTML(h.sub)}">Ôn lớp ${h.g} · ${escapeHTML(h.sub)}</button></div>`).join(''):'<p class="muted">Không tìm thấy kết quả khớp. Thử từ khóa khác hoặc bỏ bớt bộ lọc.</p>';
 box.querySelectorAll('[data-search-grade]').forEach(btn=>btn.addEventListener('click',()=>useSearchResult(btn.dataset.searchGrade,btn.dataset.searchSubject)));
}
function launchCustomTest(){const g=document.getElementById('customGrade').value,s=document.getElementById('customSubject').value,n=Math.max(1,Math.min(25,Number(document.getElementById('customCount').value)||10));document.getElementById('qGrade').value=g;fillSubjects('qGrade','qSubject');document.getElementById('qSubject').value=s;document.getElementById('qCount').innerHTML=[5,10,15,20,25].map(x=>`<option value="${x}">${x}</option>`).join('');if(![5,10,15,20,25].includes(n)){document.getElementById('qCount').insertAdjacentHTML('beforeend',`<option value="${n}">${n}</option>`)}document.getElementById('qCount').value=String(n);document.getElementById('difficulty').value=document.getElementById('customDifficulty').value;document.getElementById('examDuration').value=document.getElementById('customDuration').value;showTab('quiz');startQuiz();}
function missedStore(){return loadStore('missedQuestions',{})}
function trackMissedQuestion(q,chosen){try{const g=document.getElementById('qGrade').value,s=document.getElementById('qSubject').value,key=`${g}|${s}`,all=missedStore();all[key]=Array.isArray(all[key])?all[key]:[];const id=String(q[0])+'||'+String(q[4]||'');let row=all[key].find(x=>x&&x.id===id);if(!row){row={id,q:q.slice(),count:0,wrongChoices:[],firstSeen:new Date().toISOString(),lastSeen:new Date().toISOString()};all[key].push(row)}row.count=(row.count||0)+1;row.lastSeen=new Date().toISOString();if(Number.isInteger(chosen)&&chosen>=0&&Array.isArray(q[1])){const wrong=q[1][chosen];if(wrong!==undefined&&!row.wrongChoices.includes(wrong))row.wrongChoices.push(wrong)}saveStore('missedQuestions',all);refreshTools();}catch(e){}}
function renderSmartReviewSummary(){const g=document.getElementById('reviewGrade').value,s=document.getElementById('reviewSubject').value,el=document.getElementById('smartReviewSummary');if(!el)return;const all=missedStore(),key=`${g}|${s}`,arr=Array.isArray(all[key])?all[key]:[],count=arr.reduce((n,x)=>n+(x.count||1),0);el.innerHTML=arr.length?`Lớp <b>${g}</b> · <b>${escapeHTML(s)}</b>: có <b>${arr.length}</b> câu từng sai (${count} lượt sai).<p class="small-note">${arr.slice().sort((a,b)=>(b.count||0)-(a.count||0)).slice(0,3).map(x=>escapeHTML(x.q&&x.q[0]||'Câu hỏi')).join('<br>')}</p>`:`Chưa lưu câu sai cho Lớp ${g} · ${escapeHTML(s)}. Sau khi làm Quiz, câu trả lời sai sẽ xuất hiện tại đây.`;}
function startSmartReview(){const g=document.getElementById('reviewGrade').value,s=document.getElementById('reviewSubject').value,all=missedStore(),arr=Array.isArray(all[`${g}|${s}`])?all[`${g}|${s}`]:[];if(!arr.length){renderSmartReviewSummary();return;}clearInterval(timer);clearInterval(examTimer);document.getElementById('qGrade').value=g;fillSubjects('qGrade','qSubject');document.getElementById('qSubject').value=s;document.getElementById('difficulty').value='all';const weightedPool=arr.filter(x=>x&&Array.isArray(x.q)&&Array.isArray(x.q[1])&&Number.isInteger(x.q[2])&&x.q[2]>=0&&x.q[2]<x.q[1].length).slice();if(!weightedPool.length){document.getElementById('smartReviewSummary').textContent='Dữ liệu câu sai không hợp lệ; hãy làm lại Quiz để tạo lịch sử mới.';return;}const selectedReviewQuestions=[];while(weightedPool.length&&selectedReviewQuestions.length<15){const weightSum=weightedPool.reduce((n,x)=>n+Math.max(1,Number(x.count)||1),0);let ticket=Math.random()*weightSum,chosen=0;for(let i=0;i<weightedPool.length;i++){ticket-=Math.max(1,Number(weightedPool[i].count)||1);if(ticket<0){chosen=i;break;}}selectedReviewQuestions.push(weightedPool.splice(chosen,1)[0].q);}questions=selectedReviewQuestions;qi=0;score=0;streak=0;wrongQuestions=[];quizFinished=false;quizRunId++;const reviewCount=String(Math.min(questions.length,15)),countSelect=document.getElementById('qCount');if(!Array.from(countSelect.options).some(o=>o.value===reviewCount))countSelect.insertAdjacentHTML('beforeend',`<option value="${reviewCount}">${reviewCount}</option>`);countSelect.value=reviewCount;document.getElementById('quizCard').classList.remove('hidden');showTab('quiz');showQuestion();document.getElementById('quizCard').scrollIntoView({behavior:'smooth'});}
function clearSmartReview(){const g=document.getElementById('reviewGrade').value,s=document.getElementById('reviewSubject').value;if(!confirm(`Xóa lịch sử câu sai của Lớp ${g} · ${s}?`))return;const all=missedStore();delete all[`${g}|${s}`];saveStore('missedQuestions',all);renderSmartReviewSummary();}
function reportCurrentQuestion(){if(!questions[qi]){reportDraft=null;document.getElementById('reportSummary').textContent='Không có câu Quiz đang mở. Hãy mở câu cần báo rồi bấm nút báo lỗi.';}else{reportDraft={grade:document.getElementById('qGrade').value,subject:document.getElementById('qSubject').value,q:questions[qi].slice(),date:new Date().toISOString()};document.getElementById('reportSummary').innerHTML=`Câu đang báo: <b>Lớp ${reportDraft.grade} · ${escapeHTML(reportDraft.subject)}</b><p>${escapeHTML(reportDraft.q[0])}</p>`;}showTab('tools');}
function saveQuestionReport(){if(!reportDraft){document.getElementById('reportStatus').textContent='Chưa chọn câu Quiz. Hãy quay lại Quiz và bấm “Báo câu hỏi lỗi” trước.';return;}const all=loadStore('reportedQuestions',[]);all.push({id:Date.now(),grade:reportDraft.grade,subject:reportDraft.subject,question:reportDraft.q[0],options:reportDraft.q[1],answerIndex:reportDraft.q[2],kind:document.getElementById('reportKind').value,details:document.getElementById('reportDetails').value.trim(),date:new Date().toISOString()});const persisted=saveStore('reportedQuestions',all);document.getElementById('reportDetails').value='';reportDraft=null;document.getElementById('reportSummary').textContent='Đã ghi nhận báo lỗi trong phiên này. Báo cáo chưa được gửi qua mạng.';document.getElementById('reportStatus').textContent=persisted?'Đã lưu báo lỗi trên thiết bị này; có thể xem trong danh sách bên dưới.':'Đã giữ báo lỗi trong phiên hiện tại; hãy xuất sao lưu trước khi đóng trang vì trình duyệt chặn lưu lâu dài.';renderReportList();}
function renderReportList(){const el=document.getElementById('reportList');if(!el)return;const arr=loadStore('reportedQuestions',[]);el.innerHTML=arr.length?arr.slice().reverse().slice(0,10).map(r=>`<div class="search-result"><span class="pill">Lớp ${escapeHTML(r.grade)} · ${escapeHTML(r.subject)} · ${escapeHTML(r.kind)}</span><p><b>${escapeHTML(r.question)}</b></p><p class="small-note">${escapeHTML(r.details||'Không có mô tả thêm')} · ${escapeHTML(new Date(r.date).toLocaleDateString('vi-VN'))}</p></div>`).join(''):'<p class="muted">Chưa có báo lỗi nào được lưu.</p>';}
function startMiniGame(){const g=document.getElementById('gameGrade').value,s=document.getElementById('gameSubject').value,pool=shuffleArray(bank[`${g}|${s}`]||[]);gamePairs=pool.slice(0,5).map((q,i)=>({id:i,question:q[0],answer:q[1][q[2]],matched:false}));gameAnswerOrder=shuffleArray(gamePairs.map(x=>x.id));selectedGameQuestion=null;gameScore=0;renderMiniGame();}
function renderMiniGame(){const board=document.getElementById('miniGameBoard');if(!board)return;if(!gamePairs.length){board.innerHTML='<p class="muted">Bấm “Bắt đầu vòng mới” để tạo 5 cặp từ đúng lớp và môn đang chọn.</p>';return;}const left=gamePairs.map(x=>`<button type="button" class="pair-btn ${x.matched?'matched':''} ${selectedGameQuestion===x.id?'selected':''}" ${x.matched?'disabled':''} data-game-question="${x.id}">${escapeHTML(x.question)}</button>`).join('');const right=gameAnswerOrder.map(id=>{const x=gamePairs.find(y=>y.id===id);return `<button type="button" class="pair-btn ${x.matched?'matched':''}" ${x.matched?'disabled':''} data-game-answer="${id}">${escapeHTML(x.answer)}</button>`}).join('');board.innerHTML=`<div class="pair-column"><b>1. Chọn câu hỏi</b>${left}</div><div class="pair-column"><b>2. Chọn đáp án</b>${right}</div>`;board.querySelectorAll('[data-game-question]').forEach(btn=>btn.addEventListener('click',()=>{selectedGameQuestion=Number(btn.dataset.gameQuestion);renderMiniGame()}));board.querySelectorAll('[data-game-answer]').forEach(btn=>btn.addEventListener('click',()=>selectGameAnswer(Number(btn.dataset.gameAnswer))));}
function selectGameAnswer(id){if(selectedGameQuestion===null){document.getElementById('miniGameStatus').textContent='Chọn một câu hỏi trước, rồi chọn đáp án ở cột phải.';return;}const q=gamePairs.find(x=>x.id===selectedGameQuestion),a=gamePairs.find(x=>x.id===id);if(!q||!a||q.matched){selectedGameQuestion=null;renderMiniGame();return;}if(q.id===a.id){q.matched=true;gameScore++;selectedGameQuestion=null;document.getElementById('miniGameStatus').textContent=`Đúng rồi! ${gameScore}/${gamePairs.length} cặp đã ghép.`;if(gameScore===gamePairs.length){addWallet(20,3);document.getElementById('miniGameStatus').textContent='🎉 Hoàn thành! +20 EXP và +3 xu.';renderProgress();}}else{document.getElementById('miniGameStatus').textContent='Chưa khớp, thử chọn lại nhé.';}renderMiniGame();}
function renderLabControls(){const kind=document.getElementById('labType').value,el=document.getElementById('labControls');if(kind==='circuit'){el.innerHTML='<div class="tool-controls"><div><label for="labVoltage">Điện áp (V): <span id="labVoltageLabel">6</span></label><input id="labVoltage" type="range" min="1" max="12" value="6" step="0.5"></div><div><label for="labResistance">Điện trở (Ω): <span id="labResistanceLabel">12</span></label><input id="labResistance" type="range" min="1" max="100" value="12" step="1"></div></div>';['labVoltage','labResistance'].forEach(id=>document.getElementById(id).addEventListener('input',runLab));}else if(kind==='water'){el.innerHTML='<label for="labTemperature">Nhiệt độ (°C): <span id="labTemperatureLabel">25</span></label><input id="labTemperature" type="range" min="-20" max="120" value="25" step="1" oninput="runLab()">';document.getElementById('labTemperature').addEventListener('input',runLab);}else{el.innerHTML='<label for="labPH">Giá trị pH: <span id="labPHLabel">7.0</span></label><input id="labPH" type="range" min="0" max="14" value="7" step="0.1" oninput="runLab()">';document.getElementById('labPH').addEventListener('input',runLab);}runLab();}
function runLab(){const kind=document.getElementById('labType').value,out=document.getElementById('labOutput');if(!out)return;if(kind==='circuit'){const v=Number(document.getElementById('labVoltage')?.value||6),r=Number(document.getElementById('labResistance')?.value||12),i=v/r;document.getElementById('labVoltageLabel').textContent=v;document.getElementById('labResistanceLabel').textContent=r;out.innerHTML=`<div>💡 Mạch điện lý tưởng</div><div class="lab-big">${i.toFixed(2)} A</div><p>Dòng điện tính theo định luật Ôm: <b>I = U / R = ${v} / ${r}</b>.</p><p>Minh họa: ${i>0.5?'dòng điện lớn hơn trong phạm vi mô phỏng':i>0.1?'dòng điện mức trung bình trong mô phỏng':'dòng điện nhỏ trong mô phỏng'}.</p>`;}else if(kind==='water'){const t=Number(document.getElementById('labTemperature').value);document.getElementById('labTemperatureLabel').textContent=t;let state,emoji,note;if(t<0){state='Rắn (băng)';emoji='🧊';note='Ở điều kiện thường, nước đóng băng dưới khoảng 0°C.'}else if(t<100){state='Lỏng';emoji='💧';note='Từ khoảng 0°C đến dưới 100°C, nước thường ở thể lỏng.'}else{state='Khí (hơi nước)';emoji='☁️';note='Ở áp suất khí quyển tiêu chuẩn, nước sôi khoảng 100°C.'}out.innerHTML=`<div>${emoji} Trạng thái mô phỏng</div><div class="lab-big">${state}</div><p>Nhiệt độ đang chọn: <b>${t}°C</b>.</p><p>${note}</p>`;}else{const ph=Number(document.getElementById('labPH').value);document.getElementById('labPHLabel').textContent=ph.toFixed(1);const state=ph<6.95?'Axit':ph>7.05?'Bazơ (kiềm)':'Trung tính';const emoji=ph<6.95?'🍋':ph>7.05?'🧼':'💧';out.innerHTML=`<div>${emoji} Mức pH mô phỏng</div><div class="lab-big">pH ${ph.toFixed(1)} · ${state}</div><p>Thang pH thường được biểu diễn từ 0 đến 14; khoảng 7 là trung tính, thấp hơn 7 là axit, cao hơn 7 là bazơ.</p><div class="bar"><div style="width:${ph/14*100}%;background:linear-gradient(90deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#8b5cf6)!important"></div></div>`;}}
function applyAppearance(){const a=loadStore('appearance',{theme:'light',accent:'#2563eb',font:16});document.body.dataset.theme=a.theme==='dark'?'dark':'light';document.documentElement.style.setProperty('--accent',a.accent||'#2563eb');document.documentElement.style.setProperty('--body-font-size',`${Math.max(14,Math.min(22,Number(a.font)||16))}px`);if(document.getElementById('themeMode'))document.getElementById('themeMode').value=a.theme||'light';if(document.getElementById('accentColor'))document.getElementById('accentColor').value=a.accent||'#2563eb';if(document.getElementById('fontScale'))document.getElementById('fontScale').value=String(a.font||16);}
function saveAppearance(){const a={theme:document.getElementById('themeMode').value,accent:document.getElementById('accentColor').value,font:Number(document.getElementById('fontScale').value)};const persisted=saveStore('appearance',a);applyAppearance();document.getElementById('appearanceStatus').textContent=persisted?'Đã lưu cài đặt giao diện trên thiết bị.':'Đã áp dụng cho phiên hiện tại; trình duyệt không cho lưu lâu dài nên hãy giữ file mở.';}
function runBankAudit(){const entries=Object.entries(bank);let errors=[],total=0,scienceFlags=[];for(const [key,arr] of entries){const [g,s]=key.split('|');if(!Array.isArray(arr)||arr.length<25)errors.push(`${key}: hiện có ${Array.isArray(arr)?arr.length:0} câu, mục tiêu tối thiểu 25`);(Array.isArray(arr)?arr:[]).forEach((q,i)=>{total++;if(!Array.isArray(q)||q.length<4){errors.push(`${key}, câu ${i+1}: cấu trúc không hợp lệ`);return;}if(typeof q[0]!=='string'||!q[0].trim())errors.push(`${key}, câu ${i+1}: câu hỏi trống`);if(!Array.isArray(q[1])||q[1].length!==4)errors.push(`${key}, câu ${i+1}: không đủ 4 phương án`);else if(new Set(q[1].map(x=>String(x).trim())).size!==4)errors.push(`${key}, câu ${i+1}: có phương án trùng hệt`);if(!Number.isInteger(q[2])||!q[1]||q[2]<0||q[2]>=q[1].length)errors.push(`${key}, câu ${i+1}: chỉ số đáp án ngoài phạm vi`);if(!['easy','medium','hard'].includes(q[3]))errors.push(`${key}, câu ${i+1}: thiếu mức độ hợp lệ`);const text=(q[0]+' '+(q[4]||'')).toLocaleLowerCase('vi');if(['Khoa học tự nhiên','Khoa học','Tự nhiên và Xã hội'].includes(s)&&/(số hữu tỉ|căn bậc hai|phương trình bậc|phân thức đại số|hệ phương trình|tam giác vuông|đa thức)/i.test(text))scienceFlags.push(`${key}, câu ${i+1}: cần rà dấu hiệu Toán`);});}const repeatMap=new Map();for(const [key,arr] of entries){const [g,sub]=key.split('|');for(const item of (Array.isArray(arr)?arr:[])){const text=String(item&&item[0]||'').trim().toLocaleLowerCase('vi').replace(/\s+/g,' ');if(!text)continue;const rk=sub+'|'+text;if(!repeatMap.has(rk))repeatMap.set(rk,{subject:sub,text:String(item[0]),grades:new Set([g])});else repeatMap.get(rk).grades.add(g);}}const repeated=[...repeatMap.values()].filter(x=>x.grades.size>1);const repeatBySubject={};repeated.forEach(x=>repeatBySubject[x.subject]=(repeatBySubject[x.subject]||0)+1);const repeatLines=Object.entries(repeatBySubject).sort((a,b)=>b[1]-a[1]).map(([sub,n])=>`${sub}: ${n} nội dung câu hỏi lặp giữa các lớp`);const el=document.getElementById('bankAuditResult');el.innerHTML=`<b>Đã kiểm tra ${entries.length} bộ · ${total} câu.</b><p>Đã bổ sung ${window.__questionExpansionReport?.added||0} câu luyện tập mới; loại ${window.__questionExpansionReport?.removed||0} câu trùng nguyên văn trong cùng bộ lớp–môn.</p><p>${errors.length?'Phát hiện '+errors.length+' lỗi cấu trúc:':'Không phát hiện lỗi cấu trúc theo các tiêu chí tự động.'}</p>${errors.length?'<ul>'+errors.slice(0,20).map(x=>`<li>${escapeHTML(x)}</li>`).join('')+'</ul>':''}${repeated.length?`<p><b>⚠️ Phát hiện ${repeated.length} nội dung câu hỏi được dùng ở nhiều lớp trong cùng môn. Đây không phải lỗi cấu trúc, nhưng cần rà soát để bảo đảm độ phân hóa theo lớp:</b></p><ul>${repeatLines.slice(0,12).map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</ul>`:''}${scienceFlags.length?'<p><b>Gợi ý rà trộn môn:</b></p><ul>'+scienceFlags.map(escapeHTML).map(x=>`<li>${x}</li>`).join('')+'</ul>':'<p>Không phát hiện các từ khóa Toán thường gặp trong ngân hàng Khoa học/Khoa học tự nhiên/Tự nhiên và Xã hội.</p>'}<p class="small-note">Đây là kiểm tra tự động về cấu trúc, từ khóa và câu trùng giữa lớp; chưa chứng minh mọi đáp án đều chính xác về mặt học thuật.</p>`;}
function refreshTools(){renderSmartReviewSummary();renderReportList();runBankAudit();}
function initTools(){fillGradeOptions('toolGrade',true);fillGradeOptions('customGrade');fillGradeOptions('reviewGrade');fillGradeOptions('gameGrade');fillGradeOptions('lessonGrade');fillToolSubjectOptions('toolGrade','toolSubject',true);fillToolSubjectOptions('customGrade','customSubject',false);fillToolSubjectOptions('reviewGrade','reviewSubject',false);fillToolSubjectOptions('gameGrade','gameSubject',false);fillToolSubjectOptions('lessonGrade','lessonSubject',false);fillLessonTopics();document.getElementById('toolGrade').addEventListener('change',()=>{fillToolSubjectOptions('toolGrade','toolSubject',true);document.getElementById('toolSubject').value='all';searchEverywhere()});[['customGrade','customSubject'],['reviewGrade','reviewSubject'],['gameGrade','gameSubject'],['lessonGrade','lessonSubject']].forEach(([g,s])=>document.getElementById(g).addEventListener('change',()=>{fillToolSubjectOptions(g,s,false);if(g==='reviewGrade')renderSmartReviewSummary();if(g==='lessonGrade')fillLessonTopics();}));document.getElementById('reviewSubject').addEventListener('change',renderSmartReviewSummary);document.getElementById('lessonSubject').addEventListener('change',fillLessonTopics);document.getElementById('lessonSeries').addEventListener('change',()=>{});document.getElementById('lessonVolume').addEventListener('change',()=>{});document.getElementById('openLessonStudy').addEventListener('click',openLessonStudy);document.getElementById('openLessonSgk').addEventListener('click',openLessonSgk);document.getElementById('globalSearchBtn').addEventListener('click',searchEverywhere);document.getElementById('globalSearch').addEventListener('keydown',e=>{if(e.key==='Enter')searchEverywhere()});document.getElementById('makeCustomTest').addEventListener('click',launchCustomTest);document.getElementById('startSmartReview').addEventListener('click',startSmartReview);document.getElementById('clearSmartReview').addEventListener('click',clearSmartReview);document.getElementById('saveQuestionReport').addEventListener('click',saveQuestionReport);document.getElementById('startMiniGame').addEventListener('click',startMiniGame);document.getElementById('labType').addEventListener('change',renderLabControls);document.getElementById('saveAppearance').addEventListener('click',saveAppearance);document.getElementById('runBankAudit').addEventListener('click',runBankAudit);applyAppearance();renderLabControls();renderMiniGame();refreshTools();}

function escapeHTML(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}


/* Tính năng bổ sung: lưu câu hỏi để ôn lại sau */
function getSavedQuestionItems(){
 const v=loadStore('savedQuestionBank',[]);
 return Array.isArray(v)?v.filter(x=>x&&typeof x.g!=='undefined'&&typeof x.s==='string'&&Array.isArray(x.q)&&typeof x.q[0]==='string'&&Array.isArray(x.q[1])&&Number.isInteger(x.q[2])):[];
}
function currentQuestionIsSaved(q,g,s){
 return getSavedQuestionItems().some(x=>String(x.g)===String(g)&&x.s===s&&x.q[0]===q[0]);
}
function toggleSavedCurrentQuestion(){
 if(!Array.isArray(questions)||!questions[qi])return;
 const q=questions[qi],g=String(document.getElementById('qGrade').value),s=document.getElementById('qSubject').value;
 const saved=getSavedQuestionItems(),index=saved.findIndex(x=>String(x.g)===g&&x.s===s&&x.q[0]===q[0]);
 if(index>=0){saved.splice(index,1);saveStore('savedQuestionBank',saved);}
 else {saved.push({g,s,q:JSON.parse(JSON.stringify(q)),savedAt:new Date().toISOString()});saveStore('savedQuestionBank',saved);}
 updateSaveCurrentButton();renderSavedQuestionPanel();
}
function updateSaveCurrentButton(){
 const b=document.getElementById('saveCurrentQuestionButton');
 if(!b)return;
 const q=Array.isArray(questions)?questions[qi]:null;
 if(!q){b.classList.add('hidden');return;}
 b.classList.remove('hidden');
 const g=document.getElementById('qGrade')?.value||'',s=document.getElementById('qSubject')?.value||'';
 const saved=currentQuestionIsSaved(q,g,s);
 b.textContent=saved?'⭐ Đã lưu câu này · Bỏ lưu':'📌 Lưu câu này để ôn';
 b.setAttribute('aria-pressed',saved?'true':'false');
}
function renderSavedQuestionPanel(){
 const panel=document.getElementById('savedQuestionPanel');if(!panel)return;
 const all=getSavedQuestionItems();
 const oldG=document.getElementById('savedQuestionGrade')?.value||'all';
 const oldS=document.getElementById('savedQuestionSubject')?.value||'all';
 const grades=[...new Set(all.map(x=>String(x.g)))].sort((a,b)=>Number(a)-Number(b));
 const subs=[...new Set(all.map(x=>x.s))].sort((a,b)=>a.localeCompare(b,'vi'));
 const gOpts=[['all','Tất cả lớp'],...grades.map(g=>[g,'Lớp '+g])];
 const sOpts=[['all','Tất cả môn'],...subs.map(s=>[s,s])];
 const selG=grades.includes(oldG)?oldG:'all',selS=subs.includes(oldS)?oldS:'all';
 const filtered=all.filter(x=>(selG==='all'||String(x.g)===selG)&&(selS==='all'||x.s===selS));
 panel.innerHTML=`<div class="saved-q-header"><h2 id="savedQuestionTitle">⭐ Câu hỏi đã lưu để ôn tập</h2><button type="button" class="secondary" id="closeSavedQuestionPanel">Đóng</button></div>
 <p class="muted">Lưu câu khó khi làm Quiz, rồi mở lại ở đây để ôn. Dữ liệu được lưu trên thiết bị này; nếu trình duyệt chặn lưu trữ thì chỉ giữ trong phiên hiện tại.</p>
 <div class="tool-controls"><div><label for="savedQuestionGrade">Lọc lớp</label><select id="savedQuestionGrade">${gOpts.map(([v,t])=>`<option value="${escapeHTML(v)}" ${v===selG?'selected':''}>${escapeHTML(t)}</option>`).join('')}</select></div><div><label for="savedQuestionSubject">Lọc môn</label><select id="savedQuestionSubject">${sOpts.map(([v,t])=>`<option value="${escapeHTML(v)}" ${v===selS?'selected':''}>${escapeHTML(t)}</option>`).join('')}</select></div></div>
 <p><b>${filtered.length}</b> câu hiển thị · <b>${all.length}</b> câu đã lưu</p>
 <div class="saved-q-list">${filtered.length?filtered.map(x=>{const ix=all.indexOf(x);return `<article class="saved-q-item"><div class="pill">Lớp ${escapeHTML(x.g)} · ${escapeHTML(x.s)}${x.q[4]?' · '+escapeHTML(x.q[4]):''}</div><p class="saved-q-prompt">${escapeHTML(x.q[0])}</p><ol type="A">${x.q[1].map((a,i)=>`<li ${i===x.q[2]?'class="saved-q-correct"':''}>${escapeHTML(a)}${i===x.q[2]?' ✓':''}</li>`).join('')}</ol><div class="quiz-tools"><button type="button" class="primary" data-saved-practice="${ix}">▶ Luyện câu này</button><button type="button" class="secondary" data-saved-remove="${ix}">🗑️ Bỏ lưu</button></div></article>`}).join(''):'<div class="feedback">Chưa có câu nào trong bộ lọc này. Khi đang làm Quiz, nhấn “📌 Lưu câu này để ôn”.</div>'}</div>`;
 document.getElementById('closeSavedQuestionPanel').onclick=()=>panel.classList.remove('sq-open');
 document.getElementById('savedQuestionGrade').onchange=renderSavedQuestionPanel;
 document.getElementById('savedQuestionSubject').onchange=renderSavedQuestionPanel;
 panel.querySelectorAll('[data-saved-remove]').forEach(b=>b.onclick=()=>{const arr=getSavedQuestionItems();arr.splice(Number(b.dataset.savedRemove),1);saveStore('savedQuestionBank',arr);renderSavedQuestionPanel();updateSaveCurrentButton();});
 panel.querySelectorAll('[data-saved-practice]').forEach(b=>b.onclick=()=>practiceSavedQuestion(Number(b.dataset.savedPractice)));
}
function practiceSavedQuestion(index){
 const item=getSavedQuestionItems()[index];if(!item)return;
 clearInterval(timer);clearInterval(examTimer);
 const grade=document.getElementById('qGrade');grade.value=String(item.g);fillSubjects('qGrade','qSubject');document.getElementById('qSubject').value=item.s;
 document.getElementById('difficulty').value='all';
 questions=[JSON.parse(JSON.stringify(item.q))];qi=0;score=0;streak=0;wrongQuestions=[];eliminatedAt={};quizFinished=false;quizRunId++;
 const clock=document.getElementById('examDuration');if(clock)clock.value='0';
 const countSelect=document.getElementById('qCount');if(countSelect){if(!Array.from(countSelect.options).some(o=>o.value==='1'))countSelect.insertAdjacentHTML('beforeend','<option value="1">1</option>');countSelect.value='1';}
 const card=document.getElementById('quizCard');card.classList.remove('hidden');
 const panel=document.getElementById('savedQuestionPanel');if(panel)panel.classList.remove('sq-open');
 showTab('quiz');showQuestion();card.scrollIntoView({behavior:'smooth',block:'start'});
}
(function initSavedQuestionFeature(){
 const style=document.createElement('style');style.textContent=`#savedQuestionButton{position:fixed;left:16px;bottom:16px;z-index:9998;border:0;border-radius:999px;padding:11px 15px;background:#6d28d9;color:#fff;font-weight:750;box-shadow:0 3px 14px #0003;cursor:pointer}#savedQuestionPanel{display:none;position:fixed;z-index:9999;left:12px;bottom:68px;width:min(610px,calc(100vw - 24px));max-height:78vh;overflow:auto;padding:18px;background:var(--card,#fff);color:var(--text,#172033);border:1px solid #a5b4fc;border-radius:16px;box-shadow:0 8px 32px #0004}#savedQuestionPanel.sq-open{display:block}.saved-q-header{display:flex;align-items:center;justify-content:space-between;gap:10px}.saved-q-header h2{font-size:1.15rem;margin:0}.saved-q-list{display:grid;gap:12px}.saved-q-item{padding:14px;border:1px solid #dbe4f0;border-radius:12px;background:var(--card,#fff)}.saved-q-prompt{font-weight:700;line-height:1.5}.saved-q-item ol{padding-left:24px}.saved-q-item li{margin:5px 0}.saved-q-correct{color:#15803d;font-weight:700}#saveCurrentQuestionButton{margin-top:8px}@media(max-width:560px){#savedQuestionButton{left:8px;bottom:8px;padding:10px 12px;font-size:13px}#questionQualityButton{right:8px;bottom:8px;padding:10px 12px;font-size:13px}#savedQuestionPanel{left:6px;bottom:54px;width:calc(100vw - 12px);max-height:82vh;padding:13px}.saved-q-header{align-items:flex-start}.saved-q-header h2{font-size:1rem}}`;document.head.appendChild(style);
 const fab=document.createElement('button');fab.id='savedQuestionButton';fab.type='button';fab.textContent='⭐ Câu đã lưu';fab.setAttribute('aria-controls','savedQuestionPanel');fab.setAttribute('aria-expanded','false');fab.onclick=()=>{const p=document.getElementById('savedQuestionPanel');renderSavedQuestionPanel();p.classList.toggle('sq-open');fab.setAttribute('aria-expanded',p.classList.contains('sq-open')?'true':'false');};document.body.appendChild(fab);
 const panel=document.createElement('section');panel.id='savedQuestionPanel';panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','savedQuestionTitle');document.body.appendChild(panel);
 const originalShowQuestion=showQuestion;
 showQuestion=function(){originalShowQuestion();const tools=document.querySelector('#quizCard .quiz-tools');if(tools&&!document.getElementById('saveCurrentQuestionButton')){const b=document.createElement('button');b.id='saveCurrentQuestionButton';b.type='button';b.className='secondary';b.onclick=toggleSavedCurrentQuestion;tools.appendChild(b);}updateSaveCurrentButton();};
})();


/* Mở rộng bảng tiến độ: tổng câu đã làm, độ chính xác chung, câu đã lưu */
(function extendProgressSummary(){
 const baseRenderProgress=renderProgress;
 renderProgress=function(){
  baseRenderProgress();
  const stats=loadStore('stats',{}),entries=Object.values(stats);
  const attempts=entries.reduce((n,x)=>n+(Number(x.attempts)||0),0);
  const answered=entries.reduce((n,x)=>n+(Number(x.total)||0),0);
  const correct=entries.reduce((n,x)=>n+(Number(x.correct)||0),0);
  const accuracy=answered?Math.round(correct/answered*100):0;
  const saved=getSavedQuestionItems().length;
  const summary=document.getElementById('statSummary');
  if(summary)summary.insertAdjacentHTML('beforeend',`<div class="stat-box"><div>📝 Tổng lượt làm bài</div><div class="stat-number">${attempts}</div><small>Cộng dồn các môn đã luyện</small></div><div class="stat-box"><div>🎯 Độ chính xác chung</div><div class="stat-number">${accuracy}%</div><div class="progress-line"><span style="width:${accuracy}%"></span></div><small>${correct}/${answered} câu đúng</small></div><div class="stat-box"><div>⭐ Câu hỏi đã lưu</div><div class="stat-number">${saved}</div><small>Câu cần ôn lại sau</small><button type="button" class="secondary" onclick="document.getElementById('savedQuestionPanel').classList.add('sq-open');renderSavedQuestionPanel()">Xem câu đã lưu</button></div>`);
 };
 try{renderProgress()}catch(e){console.warn('Chưa thể cập nhật bảng tiến độ',e)}
})();

const qualityUpgradeStyle=document.createElement('style');qualityUpgradeStyle.id='qualityUpgradeStyles';qualityUpgradeStyle.textContent="\n.teacher-stat-grid,.knowledge-map-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:12px 0}\n.teacher-stat,.knowledge-map-item{border:1px solid var(--border,#d9e2ef);border-radius:12px;padding:12px;background:var(--card,#fff);min-width:0}\n.teacher-stat b,.knowledge-map-item b{display:block;font-size:1.05rem;overflow-wrap:anywhere}\n.teacher-stat small,.knowledge-map-item small{display:block;line-height:1.5;margin-top:4px;opacity:.8}\n.knowledge-map-item .progress-line{margin:8px 0}\n.knowledge-map-item .knowledge-status{display:inline-block;padding:3px 8px;border-radius:999px;font-size:.8rem;font-weight:700;background:#e2e8f0;color:#334155}\n.knowledge-map-item .knowledge-status.weak{background:#fee2e2;color:#991b1b}\n.knowledge-map-item .knowledge-status.mid{background:#fef3c7;color:#92400e}\n.knowledge-map-item .knowledge-status.strong{background:#dcfce7;color:#166534}\n.teacher-report{border:1px solid var(--border,#d9e2ef);border-radius:10px;padding:12px;margin:10px 0;overflow-wrap:anywhere}\n.teacher-report p{margin:6px 0}\n.teacher-report .teacher-report-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}\n.teacher-report select{max-width:100%;flex:1;min-width:145px}\n#teacherModerationCard textarea,#teacherModerationCard input,#teacherModerationCard select{max-width:100%}\n#teacherModerationCard h4{margin-top:18px}\n.source-ref-card,.concern-item{border:1px solid var(--border,#d9e2ef);border-radius:10px;padding:12px;margin:9px 0;overflow-wrap:anywhere}\n.source-ref-card{background:var(--card,#fff)}\n.concern-item .concern-meta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}\n.concern-badge{display:inline-block;border-radius:999px;padding:3px 8px;font-size:.78rem;font-weight:700;background:#fef3c7;color:#92400e}\n.concern-badge.error{background:#fee2e2;color:#991b1b}\n.concern-badge.info{background:#dbeafe;color:#1e40af}\n.concern-item p{margin:6px 0}\n#teacherModerationCard a{overflow-wrap:anywhere}\n\n.curriculum-editor{margin:14px 0;padding:14px;border:1px solid var(--border,#cbd5e1);border-radius:14px;background:var(--card,#fff)}\n.curriculum-editor h4{margin-top:0!important}\n.curriculum-editor .tool-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}\n.curriculum-check-label{display:flex;align-items:flex-start;gap:9px;margin:10px 0;padding:10px 12px;border:1px solid var(--border,#cbd5e1);border-radius:10px;line-height:1.45}\n.curriculum-check-label input,.curriculum-quiz-filter input{width:20px;height:20px;flex:0 0 20px;margin-top:2px}\n.curriculum-quiz-filter{margin-top:10px;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:12px}\n.curriculum-quiz-filter label{display:flex;align-items:center;gap:9px;font-weight:700}\n.curriculum-item{border:1px solid var(--border,#cbd5e1);border-radius:12px;padding:12px;margin:9px 0;background:var(--card,#fff);overflow-wrap:anywhere}\n.curriculum-item p{margin:5px 0}\n.curriculum-status-pill{display:inline-block;padding:4px 8px;border-radius:8px;font-size:.82rem;font-weight:700;background:#fef3c7;color:#92400e}\n.curriculum-status-pill.verified{background:#dcfce7;color:#166534}\n.curriculum-status-pill.mismatch{background:#fee2e2;color:#991b1b}\n.curriculum-status-pill.reviewing{background:#dbeafe;color:#1e40af}\n.curriculum-item-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:9px}\n.curriculum-item-actions button{min-height:44px}\n.curriculum-item a{overflow-wrap:anywhere}\n@media(max-width:700px){.curriculum-editor .tool-controls{grid-template-columns:1fr}.curriculum-item-actions{display:grid;grid-template-columns:1fr}.curriculum-item-actions button{width:100%}}\n@media(max-width:560px){.teacher-stat-grid,.knowledge-map-grid{grid-template-columns:1fr 1fr}.teacher-report .teacher-report-actions{align-items:stretch}.teacher-report .teacher-report-actions button,.teacher-report .teacher-report-actions select{width:100%}}\n.curriculum-question-flag{margin:10px 0;padding:9px 11px;border:1px solid #f59e0b;border-radius:10px;background:#fffbeb;color:#92400e;font-size:.9rem;line-height:1.45;overflow-wrap:anywhere}\n.curriculum-question-flag.verified{border-color:#86efac;background:#f0fdf4;color:#166534}\n";document.head.appendChild(qualityUpgradeStyle);

(function initTeacherModerationAndKnowledgeMap(){
 'use strict';
 const cloneQuestion=q=>Array.isArray(q)?[q[0],Array.isArray(q[1])?q[1].slice():[],q[2],q[3],q[4]||'']:q;
 const originalBank={};
 Object.keys(bank).forEach(key=>originalBank[key]=(bank[key]||[]).map(cloneQuestion));
 window.__teacherOriginalBank=originalBank;
 const validMarks=['not-reviewed','reviewing','approved','needs-fix'];
 const markNames={'not-reviewed':'Chưa kiểm duyệt','reviewing':'Đang kiểm tra','approved':'Đã kiểm tra','needs-fix':'Cần sửa thêm'};
 const statusNames={'pending':'Chưa xử lý','reviewing':'Đang xử lý','resolved':'Đã xử lý','dismissed':'Không cần sửa'};
 const edits=()=>loadStore('teacherQuestionEdits',[]);
 const marks=()=>loadStore('teacherQuestionMarks',{});
 const sources=()=>loadStore('teacherQuestionSources',{});
 // Seed traceable official-book references for the independently authored Tin hoc question bank.
 // The exact page has not been verified, so the source note explicitly requires teacher review.
 function seedTinHocSourceReferences(){
   const all=sources();let changed=false;
   for(let grade=3;grade<=9;grade++){
     const detail=sgkSingleDetails[`${grade}|Tin học`];if(!detail)continue;
     const bookUrl=`https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/${detail.slug}-${detail.id}.${detail.id}`;
     const arr=bank[`${grade}|Tin học`]||[];
     arr.forEach((item,index)=>{
       const key=`${grade}|Tin học|${index}`;
       if(!all[key]||!all[key].title){
         all[key]={title:`SGK Tin học ${grade} — tham chiếu chủ đề`,publisher:'Nhà xuất bản Giáo dục Việt Nam',location:String(item[4]||'Chủ đề liên quan'),url:bookUrl,note:'Câu hỏi do website tự biên soạn theo mạch kiến thức/chủ đề. Chưa xác minh số trang cụ thể; cần mở SGK đối chiếu nội dung và đáp án trước khi đánh dấu “Đã kiểm tra”.',autoGenerated:true};
         changed=true;
       }
     });
   }
   if(changed)saveStore('teacherQuestionSources',all);
 }
 seedTinHocSourceReferences();
 const reportMarks=()=>loadStore('teacherReportMarks',{});
 const editKey=(g,s,i)=>String(g)+'|'+s+'|'+Number(i);
 function getEditRecord(g,s,i){return edits().find(x=>x&&String(x.grade)===String(g)&&x.subject===s&&Number(x.index)===Number(i));}
 function applySavedEdits(){
   edits().forEach(rec=>{if(!rec||!Array.isArray(rec.q))return;const key=String(rec.grade)+'|'+rec.subject;const index=Number(rec.index);if(Array.isArray(bank[key])&&index>=0&&index<bank[key].length){const source=originalBank[key]?.[index];const expected=String(rec.originalPrompt||'');if(expected&&source&&String(source[0])!==expected)return;bank[key][index]=cloneQuestion(rec.q);}});
 }
 applySavedEdits();
 
 function fillTeacherGrades(){
   const g=document.getElementById('teacherGrade'),s=document.getElementById('teacherSubject');
   if(!g||!s)return;
   g.innerHTML=Array.from({length:9},(_,i)=>`<option value="${i+1}">Lớp ${i+1}</option>`).join('');
   g.value='6';fillTeacherSubjects();
 }
 function fillTeacherSubjects(){
   const g=document.getElementById('teacherGrade'),s=document.getElementById('teacherSubject');if(!g||!s)return;
   const old=s.value;const list=subjects[g.value]||[];
   s.innerHTML=list.map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join('');
   if(list.includes(old))s.value=old;
   fillTeacherQuestions();
 }
 function fillTeacherQuestions(){
   const qSel=document.getElementById('teacherQuestion'),g=document.getElementById('teacherGrade')?.value,s=document.getElementById('teacherSubject')?.value;if(!qSel)return;
   const arr=bank[`${g}|${s}`]||[];const old=qSel.value;
   qSel.innerHTML=arr.map((q,i)=>`<option value="${i}">Câu ${i+1} — ${escapeHTML(String(q&&q[0]||'(thiếu nội dung)').slice(0,95))}${String(q&&q[0]||'').length>95?'…':''}</option>`).join('');
   if(arr.length){if([...qSel.options].some(o=>o.value===old))qSel.value=old;loadTeacherQuestion();}else{clearTeacherEditor();}
 }
 function clearTeacherEditor(){['teacherPrompt','teacherOpt0','teacherOpt1','teacherOpt2','teacherOpt3','teacherTopic','teacherSourceTitle','teacherSourcePublisher','teacherSourceLocation','teacherSourceUrl','teacherSourceNote'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});const status=document.getElementById('teacherEditStatus');if(status)status.textContent='Bộ lớp–môn này chưa có câu hỏi để chỉnh sửa.';}
 function selectedTeacherQuestion(){const g=document.getElementById('teacherGrade')?.value,s=document.getElementById('teacherSubject')?.value,index=Number(document.getElementById('teacherQuestion')?.value);const arr=bank[`${g}|${s}`];if(!Array.isArray(arr)||!Number.isInteger(index)||!arr[index])return null;return {g,s,index,q:arr[index]};}
 function loadTeacherQuestion(){
   const row=selectedTeacherQuestion();if(!row){clearTeacherEditor();return;}
   const q=row.q;document.getElementById('teacherPrompt').value=String(q[0]||'');
   for(let i=0;i<4;i++)document.getElementById('teacherOpt'+i).value=String(q[1]?.[i]??'');
   document.getElementById('teacherCorrect').value=String(Number.isInteger(q[2])?q[2]:0);
   document.getElementById('teacherDifficulty').value=['easy','medium','hard'].includes(q[3])?q[3]:'medium';
   document.getElementById('teacherTopic').value=String(q[4]||'');
   const key=editKey(row.g,row.s,row.index),src=sources()[key]||{};
   document.getElementById('teacherSourceTitle').value=String(src.title||'');
   document.getElementById('teacherSourcePublisher').value=String(src.publisher||'');
   document.getElementById('teacherSourceLocation').value=String(src.location||'');
   document.getElementById('teacherSourceUrl').value=String(src.url||'');
   document.getElementById('teacherSourceNote').value=String(src.note||'');
   const sourceStatus=document.getElementById('teacherSourceStatus');if(sourceStatus)sourceStatus.textContent=src.title?(src.autoGenerated?'Nguồn tham khảo gợi ý đã gắn theo chủ đề SGK; chưa xác minh số trang hay đáp án. Hãy đối chiếu trước khi duyệt.':`Nguồn đã ghi${src.checkedAt?' · cập nhật '+new Date(src.checkedAt).toLocaleString('vi-VN'):''}. Hãy kiểm tra lại nội dung nguồn trước khi duyệt.`):'Chưa ghi nguồn cho câu đang chọn.';
   const savedMark=marks()[key]||'not-reviewed';document.getElementById('teacherReviewMark').value=validMarks.includes(savedMark)?savedMark:'not-reviewed';
   const prior=getEditRecord(row.g,row.s,row.index);const status=document.getElementById('teacherEditStatus');
   status.textContent=prior?`Đang xem câu đã chỉnh sửa trên thiết bị này · Lưu lần cuối: ${prior.modifiedAt?new Date(prior.modifiedAt).toLocaleString('vi-VN'):'không rõ thời gian'}.`:'Đang xem nội dung gốc của bộ câu hỏi.';
 }
 function saveTeacherSource(){
   const row=selectedTeacherQuestion();if(!row){alert('Chọn một câu hỏi hợp lệ trước.');return;}
   const title=document.getElementById('teacherSourceTitle').value.trim();
   const publisher=document.getElementById('teacherSourcePublisher').value.trim();
   const location=document.getElementById('teacherSourceLocation').value.trim();
   const urlText=document.getElementById('teacherSourceUrl').value.trim();
   const note=document.getElementById('teacherSourceNote').value.trim();
   if(urlText){let parsed;try{parsed=new URL(urlText);}catch(e){alert('Liên kết nguồn chưa đúng định dạng URL.');return;}if(!['http:','https:'].includes(parsed.protocol)){alert('Chỉ chấp nhận liên kết http hoặc https.');return;}}
   if(!title&&!publisher&&!location&&!urlText&&!note){const all=sources();delete all[editKey(row.g,row.s,row.index)];const ok=saveStore('teacherQuestionSources',all);document.getElementById('teacherSourceStatus').textContent=ok?'Đã xóa thông tin nguồn cho câu này.':'Đã xóa trong phiên hiện tại nhưng trình duyệt chưa cho lưu lâu dài.';renderTeacherModerationStats();return;}
   if(!title){alert('Hãy nhập tên sách, tài liệu hoặc trang nguồn để dễ truy xuất.');return;}
   const all=sources();all[editKey(row.g,row.s,row.index)]={title,publisher,location,url:urlText,note,checkedAt:new Date().toISOString()};
   const ok=saveStore('teacherQuestionSources',all);
   document.getElementById('teacherSourceStatus').textContent=ok?'Đã lưu thông tin nguồn tham khảo trên thiết bị này. Việc lưu nguồn không tự xác minh tính chính xác của đáp án.':'Đã cập nhật trong phiên này, nhưng trình duyệt chưa cho lưu lâu dài; hãy xuất gói rà soát.';
   renderTeacherModerationStats();
 }
 function saveTeacherQuestion(){
   const row=selectedTeacherQuestion();if(!row){alert('Chọn một câu hỏi hợp lệ trước.');return;}
   const prompt=document.getElementById('teacherPrompt').value.trim();
   const options=[0,1,2,3].map(i=>document.getElementById('teacherOpt'+i).value.trim());
   const answer=Number(document.getElementById('teacherCorrect').value),difficulty=document.getElementById('teacherDifficulty').value,topic=document.getElementById('teacherTopic').value.trim();
   if(!prompt){alert('Nội dung câu hỏi không được để trống.');return;}
   if(options.some(x=>!x)){alert('Cả bốn phương án A, B, C, D đều cần có nội dung.');return;}
   const norm=options.map(x=>x.toLocaleLowerCase('vi').replace(/\s+/g,' '));if(new Set(norm).size!==4){alert('Bốn phương án phải khác nhau. Hãy kiểm tra các lựa chọn trùng.');return;}
   if(!Number.isInteger(answer)||answer<0||answer>3){alert('Hãy chọn đáp án đúng từ A đến D.');return;}
   if(!['easy','medium','hard'].includes(difficulty)){alert('Hãy chọn mức độ hợp lệ.');return;}
   const q=[prompt,options,answer,difficulty,topic];logQuestionHistory(row,row.q,q,'Chỉnh sửa câu hỏi');const all=edits().filter(x=>!(String(x.grade)===String(row.g)&&x.subject===row.s&&Number(x.index)===row.index));
   all.push({grade:String(row.g),subject:row.s,index:row.index,originalPrompt:String(window.__teacherOriginalBank[`${row.g}|${row.s}`]?.[row.index]?.[0]||row.q[0]||''),q,modifiedAt:new Date().toISOString()});
   const persisted=saveStore('teacherQuestionEdits',all);bank[`${row.g}|${row.s}`][row.index]=cloneQuestion(q);
   const key=editKey(row.g,row.s,row.index),currentMarks=marks();currentMarks[key]='reviewing';saveStore('teacherQuestionMarks',currentMarks);
   fillTeacherQuestions();document.getElementById('teacherQuestion').value=String(row.index);loadTeacherQuestion();
   document.getElementById('teacherEditStatus').textContent=persisted?'Đã lưu chỉnh sửa trên thiết bị. Câu sẽ dùng trong các bài Quiz mới. Trạng thái kiểm duyệt chuyển thành “Đang kiểm tra”; hãy xác minh kiến thức trước khi đánh dấu đã kiểm tra.':'Đã áp dụng chỉnh sửa trong phiên hiện tại, nhưng trình duyệt chặn lưu lâu dài. Hãy xuất gói kiểm duyệt trước khi đóng trang.';
   renderTeacherModerationStats();renderTeacherReports();runBankAudit();
 }
 function resetTeacherQuestion(){
   const row=selectedTeacherQuestion();if(!row)return;
   if(!confirm('Khôi phục nội dung gốc của câu này và xóa bản chỉnh sửa cục bộ?'))return;
   logQuestionHistory(row,row.q,window.__teacherOriginalBank[`${row.g}|${row.s}`]?.[row.index]||row.q,'Khôi phục câu gốc');const all=edits().filter(x=>!(String(x.grade)===String(row.g)&&x.subject===row.s&&Number(x.index)===row.index));saveStore('teacherQuestionEdits',all);const key=editKey(row.g,row.s,row.index),allMarks=marks();delete allMarks[key];saveStore('teacherQuestionMarks',allMarks);
   const original=window.__teacherOriginalBank[`${row.g}|${row.s}`]?.[row.index];if(original)bank[`${row.g}|${row.s}`][row.index]=cloneQuestion(original);
   fillTeacherQuestions();document.getElementById('teacherQuestion').value=String(row.index);loadTeacherQuestion();
   document.getElementById('teacherEditStatus').textContent='Đã khôi phục câu gốc trong bộ hiện tại; các bài Quiz mới sẽ dùng nội dung gốc. Nếu lưu trữ bị chặn, thay đổi này chỉ giữ trong phiên.';
   renderTeacherModerationStats();runBankAudit();
 }
 function saveTeacherMark(){
   const row=selectedTeacherQuestion();if(!row)return;
   const key=editKey(row.g,row.s,row.index),all=marks();all[key]=document.getElementById('teacherReviewMark').value;
   const persisted=saveStore('teacherQuestionMarks',all);
   document.getElementById('teacherEditStatus').textContent=persisted?`Đã lưu trạng thái: ${markNames[all[key]]||all[key]}. Nhãn này không tự xác minh độ chính xác kiến thức.`:'Đã đổi nhãn trong phiên hiện tại; trình duyệt chặn lưu lâu dài.';
   renderTeacherModerationStats();
 }
 function renderTeacherModerationStats(){
   const el=document.getElementById('teacherModerationStats');if(!el)return;
   const reportList=loadStore('reportedQuestions',[]),status=reportMarks(),edited=edits(),review=marks(),sourceCount=Object.keys(sources()).length;
   const pending=reportList.filter(r=>!['resolved','dismissed'].includes(status[String(r.id)]||'pending')).length;
   const approved=Object.values(review).filter(v=>v==='approved').length,needsFix=Object.values(review).filter(v=>v==='needs-fix').length;
   el.innerHTML=`<div class="teacher-stat"><small>Báo lỗi cần xử lý</small><b>${pending}</b></div><div class="teacher-stat"><small>Câu đã chỉnh trên thiết bị</small><b>${edited.length}</b></div><div class="teacher-stat"><small>Câu gắn nhãn đã kiểm tra</small><b>${approved}</b></div><div class="teacher-stat"><small>Câu cần sửa thêm</small><b>${needsFix}</b></div><div class="teacher-stat"><small>Câu đã ghi nguồn</small><b>${sourceCount}</b><small>Nguồn do người biên soạn nhập, chưa được web tự xác minh</small></div>`;
 }
 function loadReportIntoEditor(id){
   const r=loadStore('reportedQuestions',[]).find(x=>String(x.id)===String(id));if(!r)return;
   const g=document.getElementById('teacherGrade'),s=document.getElementById('teacherSubject');g.value=String(r.grade);fillTeacherSubjects();s.value=r.subject;fillTeacherQuestions();
   const arr=bank[`${r.grade}|${r.subject}`]||[];let ix=arr.findIndex(q=>String(q[0]).trim()===String(r.question).trim());
   if(ix<0){const original=window.__teacherOriginalBank[`${r.grade}|${r.subject}`]||[];ix=original.findIndex(q=>String(q[0]).trim()===String(r.question).trim());}
   if(ix>=0){document.getElementById('teacherQuestion').value=String(ix);loadTeacherQuestion();document.getElementById('teacherEditStatus').textContent='Đã mở câu được báo lỗi trong trình sửa. Kiểm tra kỹ trước khi lưu thay đổi.';document.getElementById('teacherPrompt').focus();}
   else document.getElementById('teacherEditStatus').textContent='Không tìm thấy nguyên văn câu được báo trong ngân hàng hiện tại. Hãy rà soát thủ công; báo lỗi có thể đã cũ hoặc câu đã được sửa.';
 }
 function setReportStatus(id,value){const all=reportMarks();all[String(id)]=value;saveStore('teacherReportMarks',all);renderTeacherReports();renderTeacherModerationStats();}
 function renderTeacherReports(){
   const el=document.getElementById('teacherReportQueue');if(!el)return;
   const arr=loadStore('reportedQuestions',[]).slice().reverse(),status=reportMarks();
   if(!arr.length){el.innerHTML='<p class="muted">Chưa có báo lỗi nào. Khi làm Quiz, mở Công cụ → Báo câu hỏi lỗi để tạo báo cáo.</p>';renderTeacherModerationStats();return;}
   el.innerHTML=arr.map(r=>{const st=status[String(r.id)]||'pending';return `<article class="teacher-report"><div class="pill">Lớp ${escapeHTML(r.grade)} · ${escapeHTML(r.subject)} · ${escapeHTML(r.kind||'other')}</div><p><b>${escapeHTML(r.question||'(thiếu nội dung)')}</b></p><p class="small-note">${escapeHTML(r.details||'Không có mô tả thêm')} · ${escapeHTML(r.date?new Date(r.date).toLocaleDateString('vi-VN'):'chưa rõ ngày')}</p><div class="teacher-report-actions"><select data-report-status="${escapeHTML(r.id)}" aria-label="Trạng thái báo lỗi"><option value="pending" ${st==='pending'?'selected':''}>Chưa xử lý</option><option value="reviewing" ${st==='reviewing'?'selected':''}>Đang xử lý</option><option value="resolved" ${st==='resolved'?'selected':''}>Đã xử lý</option><option value="dismissed" ${st==='dismissed'?'selected':''}>Không cần sửa</option></select><button type="button" class="secondary" data-report-save="${escapeHTML(r.id)}">Lưu trạng thái</button><button type="button" class="primary" data-report-open="${escapeHTML(r.id)}">Mở trong trình sửa</button></div><p class="small-note">Trạng thái hiện tại: <b>${statusNames[st]||statusNames.pending}</b></p></article>`;}).join('');
   el.querySelectorAll('[data-report-save]').forEach(b=>b.addEventListener('click',()=>{const id=b.getAttribute('data-report-save'),sel=Array.from(el.querySelectorAll('[data-report-status]')).find(x=>x.getAttribute('data-report-status')===id);if(sel)setReportStatus(id,sel.value);}));
   el.querySelectorAll('[data-report-open]').forEach(b=>b.addEventListener('click',()=>loadReportIntoEditor(b.getAttribute('data-report-open'))));
   renderTeacherModerationStats();
 }
 function exportTeacherReview(){
   const data={format:'hoc-tap-lop-1-9-teacher-review-v1',createdAt:new Date().toISOString(),notice:'Gói rà soát cục bộ. Trạng thái kiểm duyệt do người dùng đặt, không phải chứng nhận tự động về độ đúng kiến thức.',reports:loadStore('reportedQuestions',[]),reportStatuses:reportMarks(),questionEdits:edits(),questionStatuses:marks(),questionSources:sources()};
   try{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='goi-kiem-duyet-cau-hoi-lop-1-9.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);document.getElementById('teacherReviewExportStatus').textContent='Đã tạo gói kiểm duyệt JSON. Tệp gồm báo lỗi, trạng thái và các chỉnh sửa câu hỏi cục bộ.';}catch(e){document.getElementById('teacherReviewExportStatus').textContent='Không thể xuất tệp trong trình duyệt này. Hãy thử Chrome hoặc Safari đầy đủ.';}
 }
 function normalizeQuestionText(value){return String(value||'').normalize('NFC').toLocaleLowerCase('vi').replace(/[\s\p{P}\p{S}]+/gu,' ').trim();}
 function questionTokens(value){return new Set(normalizeQuestionText(value).split(/\s+/u).filter(w=>w.length>1));}
 function tokenDice(a,b){const A=questionTokens(a),B=questionTokens(b);if(!A.size||!B.size)return 0;let common=0;A.forEach(x=>{if(B.has(x))common++;});return 2*common/(A.size+B.size);}
 function tokenDiceSets(A,B){if(!A.size||!B.size)return 0;let common=0;A.forEach(x=>{if(B.has(x))common++;});return 2*common/(A.size+B.size);}
 function getAllQuestionRows(){const out=[];for(const [bankKey,arr] of Object.entries(bank)){const [g,subject]=bankKey.split('|');if(!Array.isArray(arr))continue;arr.forEach((q,index)=>{if(!Array.isArray(q))return;const prompt=String(q[0]||'');out.push({g,subject,index,q,prompt,normalized:normalizeQuestionText(prompt),tokens:questionTokens(prompt),options:Array.isArray(q[1])?q[1]:[],answer:q[2],difficulty:q[3],topic:q[4]||'',key:editKey(g,subject,index)});});}return out;}
 function questionContentTokens(value){
   const stop=new Set(['cau','hoi','la','cua','va','trong','mot','nhung','cac','duoc','cho','nao','khi','thi','voi','de','hay','chon','dung','sau','truoc','co','khong','theo','su','dung','vi','lam','neu','nhu','tu','den','ve','tai','tren','duoi','nay','do','moi','dap','an','phuong','neu','giai','thich','em','ban','hoc','sinh','hay','biet','bao','nhieu','gi','the','nao','sau','day','sau','day','sach','bai']);
   return new Set(normalizeQuestionText(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/\s+/u).filter(w=>w.length>=3&&!stop.has(w)));
 }
 function promptSimilarity(a,b){
   const A=questionContentTokens(a),B=questionContentTokens(b);if(!A.size||!B.size)return 0;
   let common=0;A.forEach(t=>{if(B.has(t))common++;});
   const tokenDice=2*common/(A.size+B.size);
   const norm=x=>normalizeQuestionText(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
   const x=norm(a),y=norm(b);if(!x||!y)return tokenDice;
   const ratio=Math.min(x.length,y.length)/Math.max(x.length,y.length);if(ratio<0.68)return tokenDice*0.7;
   const grams=t=>{const out=new Set();for(let i=0;i<t.length-2;i++)out.add(t.slice(i,i+3));return out;};
   const G=grams(x),H=grams(y);let same=0;G.forEach(t=>{if(H.has(t))same++;});
   const charDice=G.size&&H.size?2*same/(G.size+H.size):0;
   return Math.max(tokenDice,tokenDice*.72+charDice*.28);
 }
 function stripSemanticAccents(value){return String(value||'').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');}
 // Canonicalize common wording, replace likely student names and numeric values with markers.
 // This is intentionally a heuristic: markers are used to find candidates, never to auto-delete.
 function normalizeQuestionForMeaning(value){
   let s=stripSemanticAccents(value);
   const names='an|binh|minh|lan|hoa|nam|mai|hung|huy|long|phuc|trang|linh|vy|ngoc|tuan|khoa|chi|dung|ha|tung|my|thao|dat|quan|viet|son|khanh|bao|ngan|thien|yen|duy|tam|thanh|trung|phuong|quyen|nhat|thao|giang|thuy|loan|nga|duc|thinh|kiet|phuong';
   const actions='co|mua|ban|di|doc|viet|hoc|trong|chia|ban|nhan|cho|nhat|dem|lam|chay|dap|ve|xep|dat|giu|mang|dua|an|uong|nhan duoc|su dung|tinh|tinh duoc|lap|tao|ke|giup|tham gia|choi|can|keo|day|keo|rot|do|chuyen|xay|thu gom|thu hoach|di bo|dap xe';
   const personRe=new RegExp('\\b(?:ban hoc sinh|cac ban|hai ban|ban|em be|hoc sinh|em)\\s+('+names+')\\b','g');
   s=s.replace(personRe,(m)=>m.replace(new RegExp('('+names+')$'),' nhanvatdoi'));
   const standaloneRe=new RegExp('\\b('+names+')\\s+(?=(?:'+actions+')\\b)','g');
   s=s.replace(standaloneRe,'nhanvatdoi ');
   // Replace digit forms, fractions, decimals and percentages.
   s=s.replace(/[+-]?\d+(?:[.,]\d+)*(?:\/\d+(?:[.,]\d+)*)?\s*%?/g,' solieudoi ');
   // Mask number words only when they appear before an amount/unit noun, to avoid masking phrases like "tam giac".
   const numWords='mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi|muoi mot|muoi hai|muoi ba|muoi bon|muoi lam|muoi sau|muoi bay|muoi tam|muoi chin|hai muoi|ba muoi|bon muoi|nam muoi|sau muoi|bay muoi|tam muoi|chin muoi|mot tram|hai tram|ba tram';
   const units='qua|cai|con|chiec|vien|quyen|nguoi|ban|hoc sinh|bo|doi|tam|mieng|lit|ml|kg|gam|km|met|cm|mm|gio|phut|giay|ngay|tuan|thang|tuoi|dong|vong|lan|phan tram|sao|viên|chuong|cay|la|hoa|xe|so|so hang|don vi|do|bac|phan|phan tu|te bao|chiec xe|quyen sach|but|hop|chai|qua tao|qua cam|vien bi|hoc sinh';
   s=s.replace(new RegExp('\\b('+numWords+')\\s+(?=(?:'+units+')\\b)','g'),'solieudoi ');
   // Normalize common paraphrases to a shared concept phrase so changed word order can still match.
   s=s.replace(/\b(?:gia tri trung binh cua cac so|gia tri trung binh|trung binh cua cac so|trung binh cong)\b/g,' trungbinhcong ');
   s=s.replace(/\b(?:tong cua cac so|tong cac so|tinh tong cua|tong cua)\b/g,' tong ');
   s=s.replace(/\b(?:hieu cua hai so|hieu cua cac so|tinh hieu cua)\b/g,' hieu ');
   s=s.replace(/\b(?:tich cua cac so|tinh tich cua|tich cua)\b/g,' tich ');
   s=s.replace(/\b(?:thuong cua hai so|thuong cua cac so|tinh thuong cua)\b/g,' thuong ');
   s=s.replace(/\b(?:hay tinh gia tri cua|tinh gia tri cua|tim gia tri cua|ket qua cua phep tinh|thuc hien phep tinh|gia tri cua)\b/g,' tinh ');
   s=s.replace(/\b(?:bang bao nhieu|la bao nhieu|co tat ca bao nhieu|duoc bao nhieu|bao nhieu)\b/g,' ketqua ');
   s=s.replace(/\b(?:nao sau day|sau day|duoi day|hay chon|chon dap an)\b/g,' ');
   return s.replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 }
 function semanticNamesInQuestion(value){
   const s=stripSemanticAccents(value),names='an|binh|minh|lan|hoa|nam|mai|hung|huy|long|phuc|trang|linh|vy|ngoc|tuan|khoa|chi|dung|ha|tung|my|thao|dat|quan|viet|son|khanh|bao|ngan|thien|yen|duy|tam|thanh|trung|phuong|quyen|nhat|giang|thuy|loan|nga|duc|thinh|kiet';
   const cue=new RegExp('\\b(?:ban hoc sinh|cac ban|hai ban|ban|em be|hoc sinh|em)\\s+('+names+')\\b','g');
   const action='co|mua|ban|di|doc|viet|hoc|trong|chia|nhan|cho|nhat|dem|lam|chay|dap|ve|xep|mang|dua|an|uong|su dung|tinh|lap|tao|ke|giup|tham gia|choi|can|day|keo|do|chuyen|xay|thu gom|thu hoach';
   const act=new RegExp('\\b('+names+')\\s+(?=(?:'+action+')\\b)','g');
   return new Set([...s.matchAll(cue),...s.matchAll(act)].map(m=>m[1]).filter(Boolean));
 }
 function numberSignature(value){
   const s=stripSemanticAccents(value),digits=(String(value||'').match(/[+-]?\d+(?:[.,]\d+)*(?:\/\d+(?:[.,]\d+)*)?\s*%?/g)||[]).map(x=>x.replace(/\s+/g,''));
   const written=(s.match(/\b(?:mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi|muoi mot|muoi hai|muoi ba|muoi bon|muoi lam|muoi sau|muoi bay|muoi tam|muoi chin|hai muoi|ba muoi|bon muoi|nam muoi|sau muoi|bay muoi|tam muoi|chin muoi|mot tram|hai tram|ba tram)\s+(?:qua|cai|con|chiec|vien|quyen|nguoi|ban|hoc sinh|kg|gam|km|met|cm|mm|gio|phut|giay|ngay|tuan|thang|tuoi|dong|vong|lan|cay|la|xe|so|but|hop|chai|vien bi|quyen sach)\b/g)||[]).map(x=>x.split(/\s+/)[0]);
   return digits.concat(written);
 }
 function mathOperatorPattern(value){return (String(value||'').match(/[+\-−×*÷:=<>≤≥^√]/g)||[]).map(x=>x==='−'?'-':x==='×'?'*':x==='÷'?'/' :x).join('');}
 function setDice(A,B){if(!A.size||!B.size)return 0;let n=0;A.forEach(v=>{if(B.has(v))n++;});return 2*n/(A.size+B.size);}
 function charTrigramDice(a,b){
   const grams=t=>{const x=new Set();for(let i=0;i<t.length-2;i++)x.add(t.slice(i,i+3));return x;};
   const A=grams(stripSemanticAccents(a)),B=grams(stripSemanticAccents(b));return setDice(A,B);
 }
 function semanticQuestionComparison(a,b,mode){
   const rawTokens=questionContentTokens(a.prompt),rawTokensB=questionContentTokens(b.prompt),rawBag=setDice(rawTokens,rawTokensB);
   const rawText=promptSimilarity(a.prompt,b.prompt);
   const maskA=normalizeQuestionForMeaning(a.prompt),maskB=normalizeQuestionForMeaning(b.prompt);
   const maskedTokens=questionContentTokens(maskA),maskedTokensB=questionContentTokens(maskB),maskedBag=setDice(maskedTokens,maskedTokensB);
   const maskedText=promptSimilarity(maskA,maskB);
   const numA=numberSignature(a.prompt),numB=numberSignature(b.prompt),numASorted=numA.slice().sort(),numBSorted=numB.slice().sort(),hasNumberData=numA.length>0&&numB.length>0,numberChanged=hasNumberData&&JSON.stringify(numASorted)!==JSON.stringify(numBSorted),numberReordered=hasNumberData&&!numberChanged&&JSON.stringify(numA)!==JSON.stringify(numB);
   const namesA=semanticNamesInQuestion(a.prompt),namesB=semanticNamesInQuestion(b.prompt),nameChanged=namesA.size>0&&namesB.size>0&&([...namesA].some(x=>!namesB.has(x))||[...namesB].some(x=>!namesA.has(x)));
   const topicA=normalizeQuestionText(a.topic||''),topicB=normalizeQuestionText(b.topic||''),sameTopic=topicA.length>=4&&topicA===topicB;
   const opA=mathOperatorPattern(a.prompt),opB=mathOperatorPattern(b.prompt),mathPatternSignal=a.subject==='Toán'&&sameTopic&&numA.length>=2&&numB.length>=2&&numberChanged&&opA.length>=1&&opA===opB;
   const answerA=String(a.options[a.answer]??''),answerB=String(b.options[b.answer]??'');
   const answerTokensA=questionContentTokens(answerA),answerTokensB=questionContentTokens(answerB),answerScore=setDice(answerTokensA,answerTokensB);
   const answerExact=normalizeQuestionText(answerA)===normalizeQuestionText(answerB)&&normalizeQuestionText(answerA).length>=1;
   const orderSignal=(rawBag>=0.76&&charTrigramDice(a.prompt,b.prompt)<0.52)||(maskedBag>=0.60&&normalizeQuestionText(a.topic||'').length>=4&&normalizeQuestionText(a.topic||'')===normalizeQuestionText(b.topic||'')&&!numberChanged&&rawBag>=0.35);
   const modeDeep=mode==='deep';
   let score=Math.max(rawText,rawBag*.91,maskedText*.93,maskedBag*.91);
   let semanticReason='';
   // Same structural template after names / numeric values have been masked.
   const maskedStrong=(maskedBag>=(modeDeep?.62:.69)||maskedText>=(modeDeep?.68:.75))&&Math.max(maskedTokens.size,maskedTokensB.size)>=3;
   if(maskedStrong&&(numberChanged||nameChanged)){
     semanticReason=[nameChanged?'tên nhân vật khác nhau':'',numberChanged?'số liệu khác nhau':'',numberReordered?'thứ tự dữ kiện số khác nhau':''].filter(Boolean).join(' và ');
     score=Math.max(score,maskedBag,maskedText*.96);
   }else if(maskedStrong&&orderSignal){
     semanticReason=numberReordered?'cùng dữ kiện số nhưng thứ tự/cách diễn đạt khác':'thứ tự diễn đạt khác nhưng nhóm từ khóa chính gần nhau';
   }else if(orderSignal){
     semanticReason=numberReordered?'cùng dữ kiện số nhưng thứ tự/cách diễn đạt khác':'từ khóa chính gần nhau nhưng thứ tự câu khác';
     score=Math.max(score,rawBag);
   }
   // Reused arithmetic templates with new operands are useful duplicate-pattern alerts, even when the prompt is only "9 + 4 = ?".
   if(mathPatternSignal&&!semanticReason){semanticReason='cùng dạng phép tính và thứ tự toán tử, nhưng số liệu khác nhau';score=Math.max(score,.72);}
   // A topic + a substantial matching correct answer can catch rewording, but requires shared concept words.
   const sharedConceptCount=[...rawTokens].filter(t=>rawTokensB.has(t)).length;
   const isNumericAnswer=/^\d+(?:[.,]\d+)?$/.test(normalizeQuestionText(answerA));
   const topicAnswerSignal=sameTopic&&(answerExact||answerScore>=(modeDeep ? .65 : .78))&&sharedConceptCount>=(modeDeep?2:3)&&(Math.max(answerTokensA.size,answerTokensB.size)>=1||isNumericAnswer);
   if(!semanticReason&&topicAnswerSignal){semanticReason='cùng chủ đề và đáp án đúng, với nhiều từ khóa kiến thức chung';score=Math.max(score,rawBag*.84+(answerExact?0.16:answerScore*.16));}
   if(!semanticReason&&orderSignal){semanticReason=numberReordered?'cùng dữ kiện số nhưng thứ tự/cách diễn đạt khác':'từ khóa chính gần nhau nhưng thứ tự câu khác';}
   if(!semanticReason&&maskedStrong){semanticReason='mẫu câu gần nhau sau khi chuẩn hóa cách diễn đạt';score=Math.max(score,maskedBag,maskedText*.94);}
   const minShared=modeDeep?2:3;
   const likely=(rawText>=(modeDeep?.70:.79)&&sharedConceptCount>=Math.min(2,minShared))||
      (maskedStrong&&sharedConceptCount>=minShared&&(numberChanged||nameChanged||maskedBag>=(modeDeep?.68:.76)||maskedText>=(modeDeep?.72:.79)))||
      (orderSignal&&(rawBag>=(modeDeep ? .70 : .79)||(sameTopic&&numberReordered&&maskedBag>=(modeDeep ? .58 : .62)&&rawBag>=.35)))||
      (topicAnswerSignal&&rawBag>=(modeDeep?.34:.43))||mathPatternSignal;
   // Avoid semantic cross-subject noise unless the actual text match is strong.
   if(a.subject!==b.subject&&rawText<(modeDeep?.88:.92))return null;
   if(!likely)return null;
   if(!semanticReason&&rawText>=(modeDeep ? .80 : .88))semanticReason='nội dung câu chữ rất gần nhau';
   else if(!semanticReason)semanticReason='từ khóa nội dung và cấu trúc câu gần nhau';
   let title='Nghi trùng ý nghĩa';
   if(mathPatternSignal)title='Nghi cùng mẫu bài · đổi số liệu';
   else if(numberChanged||nameChanged)title='Nghi trùng mẫu câu · đổi dữ kiện';
   else if(orderSignal)title='Nghi trùng ý · đảo cách diễn đạt';
   else if(topicAnswerSignal&&rawText<.78)title='Nghi cùng kiến thức · diễn đạt lại';
   return {score:Math.min(1,score),reason:semanticReason,numberChanged,nameChanged,orderSignal,numberReordered,topicAnswerSignal,mathPatternSignal,rawText,maskedBag,rawBag,title};
 }
 function questionSubjectOrGradeWarnings(r){
   const text=[r.prompt,...r.options].join(' '),out=[];
   const isSubject=(...names)=>names.some(n=>String(r.subject).toLocaleLowerCase('vi').includes(n));
   const rules=[
    {names:['toán'],pattern:/\b(số hữu tỉ|số vô tỉ|căn bậc hai|căn thức|hệ phương trình|phương trình bậc hai|hằng đẳng thức|đa thức|đơn thức|định lí pytago|định lý pytago|hệ thức lượng trong tam giác vuông)\b/i,label:'Dấu hiệu nội dung Toán xuất hiện trong môn khác'},
    {names:['tin học'],pattern:/\b(scratch|python|html|lập trình|thuật toán|bảng tính điện tử|phần mềm trình chiếu|hệ điều hành|thư mục|tệp tin|mạng máy tính|công thức trong excel)\b/i,label:'Dấu hiệu nội dung Tin học xuất hiện trong môn khác'},
    {names:['ngữ văn','tiếng việt'],pattern:/\b(biện pháp tu từ|thơ lục bát|nhân hóa|ẩn dụ|hoán dụ|trạng ngữ|chủ ngữ|vị ngữ|từ ghép|từ láy|thành phần biệt lập|phương thức biểu đạt)\b/i,label:'Dấu hiệu kiến thức Tiếng Việt/Ngữ văn xuất hiện trong môn khác'},
    {names:['ngoại ngữ'],pattern:/\b(present simple|past simple|present continuous|past continuous|present perfect|reported speech|passive voice|comparative|superlative|thì hiện tại đơn|thì quá khứ đơn|động từ bất quy tắc)\b/i,label:'Dấu hiệu kiến thức Ngoại ngữ xuất hiện trong môn khác'},
    {names:['khoa học','khoa học tự nhiên','tự nhiên và xã hội'],pattern:/\b(nguyên tử|phân tử|phản ứng hóa học|quang hợp|hô hấp tế bào|định luật ôm|mạch điện|lực ma sát|di truyền|thấu kính|chuyển động đều)\b/i,label:'Dấu hiệu nội dung Khoa học xuất hiện trong môn khác'},
    {names:['lịch sử và địa lí'],pattern:/\b(triều đại|cách mạng tháng tám|hiệp định geneva|kinh tuyến|vĩ tuyến|đới khí hậu|mật độ dân số|đường xích đạo)\b/i,label:'Dấu hiệu nội dung Lịch sử/Địa lí xuất hiện trong môn khác'},
    {names:['âm nhạc'],pattern:/\b(nhịp 2\/4|nhịp 3\/4|gam trưởng|khóa sol|trường độ nốt nhạc|nhạc cụ dân tộc)\b/i,label:'Dấu hiệu nội dung Âm nhạc xuất hiện trong môn khác'},
    {names:['mĩ thuật'],pattern:/\b(bố cục tranh|hình mảng|phối màu|điểm nhấn thị giác|yếu tố tạo hình)\b/i,label:'Dấu hiệu nội dung Mĩ thuật xuất hiện trong môn khác'}
   ];
   for(const rule of rules){if(!isSubject(...rule.names)&&rule.pattern.test(text)){out.push({type:'mismatch',severity:'warn',title:'Có thể sai môn',rows:[r],detail:`${rule.label}. Đây chỉ là dấu hiệu từ từ khóa; hãy kiểm tra ngữ cảnh và SGK trước khi kết luận.`});break;}}
   const grade=Number(r.g),subject=String(r.subject);
   if(subject==='Toán'){
     const gradeRules=[
       {min:7,pattern:/\b(số hữu tỉ|số vô tỉ|tỉ lệ thức|tỉ lệ nghịch|đại lượng tỉ lệ thuận)\b/i,label:'Thuật ngữ thường gắn với Toán từ lớp 7 trở lên'},
       {min:8,pattern:/\b(đơn thức|đa thức|hằng đẳng thức|phân tích đa thức thành nhân tử)\b/i,label:'Thuật ngữ thường gắn với Toán từ lớp 8 trở lên'},
       {min:9,pattern:/\b(phương trình bậc hai|hệ thức lượng trong tam giác vuông|đường tròn ngoại tiếp tam giác|định lí viet|định lý viet)\b/i,label:'Thuật ngữ thường gắn với Toán lớp 9'}
     ];
     for(const rule of gradeRules){if(grade<rule.min&&rule.pattern.test(text)){out.push({type:'mismatch',severity:'warn',title:'Có thể sai lớp',rows:[r],detail:`${rule.label}, nhưng câu hiện ở lớp ${grade}. Chương trình/bộ sách có thể khác nhau; hãy đối chiếu đúng SGK trước khi sửa.`});break;}}
   }
   if(/\b(đạo hàm|tích phân|logarit|ma trận nghịch đảo|tích phân từng phần)\b/i.test(text))out.push({type:'mismatch',severity:'warn',title:'Có thể vượt phạm vi lớp 1–9',rows:[r],detail:'Có thuật ngữ thường thuộc chương trình bậc THPT trở lên hoặc nội dung chuyên sâu. Cần kiểm tra phạm vi bài học được chọn.'});
   return out;
 }
 function findingStableId(f){return [f.type,...f.rows.map(r=>r.key+'::'+r.normalized).sort(),f.title].join('||');}
 function findQuestionConcerns(){
   const rows=getAllQuestionRows(),allSources=sources(),findings=[],exactGroups=new Map(),duplicatePairKeys=new Set(),scope=document.getElementById('concernScope')?.value||'all';
   // Scan each row for structural, answer and subject/grade signals.
   rows.forEach(r=>{
     const n=r.normalized;if(n){if(!exactGroups.has(n))exactGroups.set(n,[]);exactGroups.get(n).push(r);}
     const opts=r.options.map(x=>String(x??'').trim()),optNorm=opts.map(x=>normalizeQuestionText(x));
     if(!r.prompt.trim())findings.push({type:'suspicious',severity:'error',title:'Thiếu nội dung câu hỏi',rows:[r],detail:'Câu hỏi đang để trống.'});
     else if(r.prompt.trim().length<14)findings.push({type:'suspicious',severity:'warn',title:'Câu hỏi quá ngắn',rows:[r],detail:'Kiểm tra xem câu có đủ dữ kiện và rõ nghĩa không.'});
     if(/hãy chọn phát biểu đúng nhất về kiến thức môn học này|phương án [abcd]$/i.test(r.prompt.trim())||opts.some(o=>/^phương án [abcd]$/i.test(o)))findings.push({type:'suspicious',severity:'error',title:'Có thể còn nội dung giữ chỗ',rows:[r],detail:'Câu hoặc phương án có vẻ là văn bản mẫu, không phải câu hỏi hoàn chỉnh.'});
     if(!Number.isInteger(r.answer)||r.answer<0||r.answer>=opts.length)findings.push({type:'suspicious',severity:'error',title:'Đáp án đúng không hợp lệ',rows:[r],detail:'Chỉ số đáp án không khớp số lượng phương án.'});
     if(opts.length!==4)findings.push({type:'suspicious',severity:'warn',title:'Số phương án khác 4',rows:[r],detail:`Câu hiện có ${opts.length} phương án. Kiểm tra theo định dạng Quiz đang dùng.`});
     const normOpts=optNorm.filter(Boolean);
     if(new Set(normOpts).size!==normOpts.length)findings.push({type:'answer',severity:'error',title:'Phương án/đáp án bị lặp trong một câu',rows:[r],detail:'Có ít nhất hai lựa chọn giống nhau sau khi chuẩn hóa chữ hoa, dấu câu và khoảng trắng. Kiểm tra vì câu có thể có nhiều phương án tương đương.'});
     const tooSimilar=[];for(let i=0;i<optNorm.length;i++)for(let j=i+1;j<optNorm.length;j++){if(optNorm[i]&&optNorm[j]&&optNorm[i]!==optNorm[j]&&tokenDice(opts[i],opts[j])>=0.9)tooSimilar.push(`${String.fromCharCode(65+i)} và ${String.fromCharCode(65+j)}`);}
     if(tooSimilar.length)findings.push({type:'answer',severity:'warn',title:'Các phương án gần giống',rows:[r],detail:`Phương án ${[...new Set(tooSimilar)].join(', ')} gần giống nhau; có thể gây nhiều đáp án đúng hoặc khiến câu không rõ ràng.`});
     if(/\b(?:ב בלבד|undefined|null)\b/i.test([r.prompt,...opts].join(' ')))findings.push({type:'suspicious',severity:'warn',title:'Có ký tự/văn bản bất thường',rows:[r],detail:'Câu hỏi hoặc phương án có thể chứa văn bản lỗi.'});
     if(!r.topic||!String(r.topic).trim())findings.push({type:'suspicious',severity:'info',title:'Chưa gắn chủ đề',rows:[r],detail:'Gắn chủ đề giúp phân loại đề và theo dõi kiến thức chính xác hơn.'});
     if(!allSources[r.key]||!allSources[r.key].title)findings.push({type:'source',severity:'info',title:'Chưa ghi nguồn tham khảo',rows:[r],detail:'Ghi tên sách/tài liệu và bài/trang đã thật sự đối chiếu, nếu có.'});
     findings.push(...questionSubjectOrGradeWarnings(r));
   });
   exactGroups.forEach(group=>{if(group.length<2)return;for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){
      const a=group[i],b=group[j];
      if(scope==='same-subject'&&a.subject!==b.subject)continue;
      if(scope==='cross-grade'&&a.g===b.g)continue;
      duplicatePairKeys.add([a.key,b.key].sort().join('||'));
      const sameClass=a.g===b.g&&a.subject===b.subject;
      const answerA=a.options[a.answer],answerB=b.options[b.answer];
      findings.push({type:'duplicate',severity:'error',title:'Câu trùng nguyên văn',rows:[a,b],detail:`Nội dung giống nhau sau khi chuẩn hóa dấu câu/khoảng trắng.${sameClass?' Hai câu nằm trong cùng bộ lớp–môn.':a.subject===b.subject&&a.g!==b.g?' Cùng môn nhưng khác lớp.':a.subject!==b.subject?' Khác môn: cần kiểm tra khả năng phân loại nhầm.':''} ${normalizeQuestionText(answerA)===normalizeQuestionText(answerB)?'Đáp án đang lưu cũng giống nhau.':'Đáp án đang lưu khác nhau — cần đối chiếu cả hai câu.'}`});
   }});
   // Multi-index scan: original tokens, normalized semantic template (numbers/names masked), and same-topic+answer.
   // Very common tokens and placeholders are not indexed by themselves to avoid an O(n²) burst on phones.
   const mode=document.getElementById('concernSimilarityMode')?.value||'balanced';
   const tokenIndexes=[new Map(),new Map()],topicAnswerIndex=new Map(),semanticTemplateIndex=new Map();
   let semanticFindingsTotal=0,semanticScanLimited=false;
   const MAX_SEMANTIC_FINDINGS=2500,MAX_MATCHES_PER_QUESTION=4,MAX_CANDIDATES_PER_QUESTION=260;
   const semanticRows=rows.map(r=>({
     original:questionContentTokens(r.prompt),
     masked:questionContentTokens(normalizeQuestionForMeaning(r.prompt))
   }));
   // Remove marker-only entries from the candidate index; they remain available for pair scoring.
   semanticRows.forEach(f=>{f.original.delete('solieudoi');f.original.delete('nhanvatdoi');f.masked.delete('solieudoi');f.masked.delete('nhanvatdoi');});
   function topicAnswerKey(r){
     const topic=normalizeQuestionText(r.topic||'');const ans=normalizeQuestionText(String(r.options[r.answer]??''));
     if(topic.length<4||ans.length<1||(questionContentTokens(ans).size<1&&!/^\d+(?:[.,]\d+)?$/.test(ans)))return '';
     return r.subject+'|'+topic+'|'+normalizeQuestionText(ans);
   }
   const topicAnswerKeys=rows.map(topicAnswerKey);
   const templateKeyForRow=r=>normalizeQuestionForMeaning(r.prompt);
   for(let i=0;i<rows.length;i++){
     if(semanticFindingsTotal>=MAX_SEMANTIC_FINDINGS){semanticScanLimited=true;break;}
     const a=rows[i],features=semanticRows[i],candidates=new Set();
     for(const [ix,index] of tokenIndexes.entries())features[['original','masked'][ix]].forEach(t=>{
       if(t==='solieudoi'||t==='nhanvatdoi')return;
       const posting=index.get(t);if(posting&&posting.length<=100)posting.forEach(j=>candidates.add(j));
     });
     const taKey=topicAnswerKeys[i];if(taKey){const posting=topicAnswerIndex.get(taKey);if(posting&&posting.length<=60)posting.forEach(j=>candidates.add(j));}
     const templateKey=normalizeQuestionForMeaning(a.prompt);if(templateKey.length>=10){const posting=semanticTemplateIndex.get(templateKey);if(posting&&posting.length<=80)posting.forEach(j=>candidates.add(j));}
     const candidateList=[...candidates].sort((j,k)=>{
       const rank=x=>(templateKeyForRow(rows[x])===templateKey?4:0)+(taKey&&topicAnswerKeys[x]===taKey?2:0);
       return rank(k)-rank(j)||j-k;
     }).slice(0,MAX_CANDIDATES_PER_QUESTION);
     if(candidates.size>MAX_CANDIDATES_PER_QUESTION)semanticScanLimited=true;
     let rowSemanticMatches=0;
     for(const j of candidateList){
       const b=rows[j];if(!b||a.normalized===b.normalized)continue;
       const sameSubject=a.subject===b.subject,sameGrade=a.g===b.g;
       if(scope==='same-subject'&&!sameSubject)continue;
       if(scope==='cross-grade'&&sameGrade)continue;
       const pairKey=[a.key,b.key].sort().join('||');if(duplicatePairKeys.has(pairKey))continue;
       const analysis=semanticQuestionComparison(a,b,mode);if(!analysis)continue;
       duplicatePairKeys.add(pairKey);
       const answerA=a.options[a.answer],answerB=b.options[b.answer];
       const scoreText=`Độ giống mẫu/từ khóa ${Math.round(analysis.score*100)}% theo quy tắc dò; đây không phải xác suất trùng ý.`;
       const explanation=`Dấu hiệu: ${analysis.reason}. ${scoreText} ${normalizeQuestionText(answerA)===normalizeQuestionText(answerB)?'Đáp án đang lưu cũng giống nhau.':'Đáp án đang lưu khác nhau hoặc cần kiểm tra.'} Đây chỉ là cảnh báo heuristic; hãy đọc cả hai câu và đối chiếu SGK trước khi kết luận.`;
       findings.push({type:'duplicate',severity:analysis.score>=(mode==='deep'?.84:.90)?'warn':'info',semantic:true,title:analysis.title,rows:[b,a],detail:explanation,semanticAnalysis:{score:analysis.score,reason:analysis.reason,numberChanged:analysis.numberChanged,nameChanged:analysis.nameChanged,orderSignal:analysis.orderSignal,numberReordered:analysis.numberReordered||false,topicAnswerSignal:analysis.topicAnswerSignal,mathPatternSignal:analysis.mathPatternSignal||false}});
       semanticFindingsTotal++;rowSemanticMatches++;
       if(rowSemanticMatches>=MAX_MATCHES_PER_QUESTION||semanticFindingsTotal>=MAX_SEMANTIC_FINDINGS){if(semanticFindingsTotal>=MAX_SEMANTIC_FINDINGS)semanticScanLimited=true;break;}
     }
     for(let ix=0;ix<tokenIndexes.length;ix++){
       const tokens=features[['original','masked'][ix]],idx=tokenIndexes[ix];
       tokens.forEach(t=>{if(t.length<3)return;if(!idx.has(t))idx.set(t,[]);if(idx.get(t).length<101)idx.get(t).push(i);});
     }
     if(taKey){if(!topicAnswerIndex.has(taKey))topicAnswerIndex.set(taKey,[]);if(topicAnswerIndex.get(taKey).length<61)topicAnswerIndex.get(taKey).push(i);}
     if(templateKey.length>=10){if(!semanticTemplateIndex.has(templateKey))semanticTemplateIndex.set(templateKey,[]);if(semanticTemplateIndex.get(templateKey).length<81)semanticTemplateIndex.get(templateKey).push(i);}
   }
   findings.scanLimited=semanticScanLimited;
   return findings;
 }
 let lastQuestionConcerns=[];
 let questionConcernVisibleCount=0;
 const questionConcernDecisions=()=>loadStore('questionConcernDecisions',{});
 function renderQuestionConcerns(){
   const results=document.getElementById('questionConcernResults'),statsEl=document.getElementById('questionConcernStats');if(!results||!statsEl)return;
   const typeFilter=document.getElementById('concernType')?.value||'all',decisionFilter=document.getElementById('concernDecisionFilter')?.value||'pending',decisions=questionConcernDecisions(),defaultVisible=window.innerWidth<=700?30:80,visibleCount=Math.max(defaultVisible,questionConcernVisibleCount||0);
   lastQuestionConcerns.forEach(f=>{f.id=findingStableId(f);});
   const concernPriority=f=>f.type==='duplicate'?(f.severity==='error'?0:1):f.type==='answer'?(f.severity==='error'?2:3):f.type==='mismatch'?4:(f.severity==='error'?5:f.type==='suspicious'?(f.severity==='warn'?6:7):f.type==='source'?8:9);
   const list=lastQuestionConcerns.filter(f=>{
     if(typeFilter==='semantic'&&!(f.type==='duplicate'&&f.semantic))return false;
     if(typeFilter!=='all'&&typeFilter!=='semantic'&&f.type!==typeFilter)return false;
     const state=decisions[f.id]?.status||'pending';return decisionFilter==='all'||state===decisionFilter;
   }).sort((a,b)=>concernPriority(a)-concernPriority(b));
   const allDuplicateCount=lastQuestionConcerns.filter(f=>f.type==='duplicate').length,answerCount=lastQuestionConcerns.filter(f=>f.type==='answer').length,mismatchCount=lastQuestionConcerns.filter(f=>f.type==='mismatch').length,suspiciousCount=lastQuestionConcerns.filter(f=>f.type==='suspicious').length,sourceCount=lastQuestionConcerns.filter(f=>f.type==='source').length,handled=Object.values(decisions).filter(d=>d&&['reviewed','dismissed'].includes(d.status)).length;
   const semanticCount=lastQuestionConcerns.filter(f=>f.type==='duplicate'&&f.semantic).length;
   statsEl.innerHTML=`<div class="teacher-stat"><small>Cặp/cụm trùng cần xem</small><b>${allDuplicateCount}</b></div><div class="teacher-stat"><small>Nghi trùng ý / đổi dữ kiện</small><b>${semanticCount}</b></div><div class="teacher-stat"><small>Đáp án/phương án lặp</small><b>${answerCount}</b></div><div class="teacher-stat"><small>Dấu hiệu sai lớp/môn</small><b>${mismatchCount}</b></div><div class="teacher-stat"><small>Lỗi cấu trúc</small><b>${suspiciousCount}</b></div><div class="teacher-stat"><small>Chưa ghi nguồn</small><b>${sourceCount}</b></div><div class="teacher-stat"><small>Đã xử lý cảnh báo</small><b>${handled}</b></div>`;
   if(!lastQuestionConcerns.length){results.innerHTML='<p class="muted">Chưa có kết quả. Bấm “Quét ngân hàng câu hỏi” để bắt đầu.</p>';return;}
   if(!list.length){results.innerHTML='<p class="muted">Không có phát hiện trong trạng thái/loại đang chọn.</p>';return;}
   const rowsHTML=(r,slot)=>{
     const answer=r.answer>=0&&r.answer<r.options.length?r.options[r.answer]:'Không xác định';
     const options=r.options.map((o,i)=>`<li><b>${String.fromCharCode(65+i)}.</b> ${escapeHTML(o)}</li>`).join('');
     const src=questionSourcesForReview(r.key);
     return `<section class="concern-question"><span class="pill">${slot} · Lớp ${escapeHTML(r.g)} · ${escapeHTML(r.subject)} · Câu ${r.index+1}</span><h4>${escapeHTML(r.prompt||'(Trống câu hỏi)')}</h4><ol class="concern-options" type="A">${options}</ol><p><b>Đáp án đang lưu:</b> ${escapeHTML(String(answer))}</p><p class="small-note">Chủ đề: ${escapeHTML(String(r.topic||'Chưa gắn'))}${src?` · Nguồn đã ghi: ${escapeHTML(String(src.title||''))} ${escapeHTML(String(src.location||''))}`:''}</p><button type="button" class="secondary" data-concern-open="${escapeHTML(r.key)}">Mở câu này trong trình sửa</button></section>`;
   };
   results.innerHTML=list.slice(0,visibleCount).map(f=>{
     const labels={duplicate:'Trùng / gần giống',answer:'Đáp án / phương án',mismatch:'Có thể sai lớp/môn',suspicious:'Đáng ngờ',source:'Thiếu nguồn'};
     const decision=decisions[f.id]?.status||'pending',decisionLabel=decision==='reviewed'?'Đã rà soát · giữ câu':decision==='dismissed'?'Đã bỏ qua cảnh báo':'Chưa xử lý';
     const decisionHTML=decision==='pending'?'':`<span class="concern-decision ${decision}">${decisionLabel}</span>`;
     const pair=f.rows.length===2?`<div class="concern-compare">${rowsHTML(f.rows[0],'Câu A')}${rowsHTML(f.rows[1],'Câu B')}</div>`:rowsHTML(f.rows[0],'Câu cần xem');
     const buttons=decision==='pending'?`<button type="button" class="primary" data-concern-action="reviewed" data-concern-id="${escapeHTML(f.id)}">✓ Đã rà soát — giữ nguyên câu</button><button type="button" class="secondary" data-concern-action="dismissed" data-concern-id="${escapeHTML(f.id)}">Bỏ qua cảnh báo</button>`:`<button type="button" class="secondary" data-concern-action="pending" data-concern-id="${escapeHTML(f.id)}">Mở lại cảnh báo</button>`;
     return `<article class="concern-item" data-finding-id="${escapeHTML(f.id)}"><div class="concern-meta"><span class="concern-badge ${f.severity==='error'?'error':f.severity==='info'?'info':''}">${labels[f.type]||'Cần xem'}</span><span class="pill">${escapeHTML(f.title)}</span>${decisionHTML}</div><p>${escapeHTML(f.detail)}</p>${pair}<div class="concern-actions">${buttons}</div><p class="small-note">Không có nội dung nào bị xóa tự động. “Bỏ qua cảnh báo” chỉ ẩn cảnh báo khỏi danh sách chưa xử lý; câu vẫn nằm nguyên trong ngân hàng.</p></article>`;
   }).join('')+(list.length>visibleCount?`<div class="concern-actions"><button type="button" class="primary" id="showMoreConcernFindings">Xem thêm ${Math.min(defaultVisible,list.length-visibleCount)} phát hiện (${visibleCount}/${list.length})</button></div>`:'');
   const moreBtn=document.getElementById('showMoreConcernFindings');if(moreBtn)moreBtn.addEventListener('click',()=>{questionConcernVisibleCount=visibleCount+defaultVisible;renderQuestionConcerns();});
   results.querySelectorAll('[data-concern-open]').forEach(btn=>btn.addEventListener('click',()=>{
     const [g,subject,indexText]=btn.getAttribute('data-concern-open').split('|');
     const gEl=document.getElementById('teacherGrade'),sEl=document.getElementById('teacherSubject'),qEl=document.getElementById('teacherQuestion');
     gEl.value=String(g);fillTeacherSubjects();sEl.value=subject;fillTeacherQuestions();qEl.value=String(Number(indexText));loadTeacherQuestion();
     document.getElementById('teacherEditStatus').textContent='Đã mở câu từ danh sách rà soát. Hãy kiểm tra hai câu và đối chiếu nguồn trước khi lưu.';
     document.getElementById('teacherPrompt').focus();
   }));
   results.querySelectorAll('[data-concern-action]').forEach(btn=>btn.addEventListener('click',()=>{
     const id=btn.getAttribute('data-concern-id'),status=btn.getAttribute('data-concern-action'),all=questionConcernDecisions();
     if(status==='pending')delete all[id];else all[id]={status,at:new Date().toISOString()};
     const saved=saveStore('questionConcernDecisions',all);renderQuestionConcerns();
     const statusEl=document.getElementById('questionConcernStatus');if(statusEl)statusEl.textContent=(status==='reviewed'?'Đã đánh dấu đã rà soát; câu được giữ nguyên.':status==='dismissed'?'Đã bỏ qua cảnh báo; câu vẫn còn trong ngân hàng.':'Đã đưa cảnh báo trở lại danh sách cần xử lý.')+(saved?'':' Chưa lưu được lâu dài trên thiết bị; hãy xuất báo cáo khi cần.');
   }));
   document.getElementById('questionConcernStatus').textContent=`Đã quét ${getAllQuestionRows().length} câu. Đang hiển thị ${Math.min(visibleCount,list.length)}/${list.length} phát hiện theo bộ lọc. ${lastQuestionConcerns.scanLimited?'Đã giới hạn số cặp/nghi vấn để giữ tốc độ trên điện thoại; hãy quét thêm theo từng môn hoặc lớp để kiểm tra sâu hơn. ':''}Cảnh báo tự động cần được con người đối chiếu.`;
 }
 function questionSourcesForReview(key){return sources()[key]||null;}
 function runQuestionConcernScan(){
   const status=document.getElementById('questionConcernStatus'),button=document.getElementById('runQuestionConcernScan');if(status)status.textContent='Đang quét ngân hàng. Hãy giữ trang mở trong lúc kiểm tra…';if(button)button.disabled=true;questionConcernVisibleCount=0;
   // Give mobile Safari a chance to paint before scanning.
   setTimeout(()=>{try{lastQuestionConcerns=findQuestionConcerns();renderQuestionConcerns();}catch(e){console.warn('Question concern scan failed',e);if(status)status.textContent='Không hoàn thành được lượt quét. Hãy thử tải lại trang hoặc lọc phạm vi nhỏ hơn.';}finally{if(button)button.disabled=false;}},30);
 }
 function exportQuestionConcernScan(){
   const decisions=questionConcernDecisions();
   const data={format:'hoc-tap-lop-1-9-question-concerns-v1',createdAt:new Date().toISOString(),notice:'Danh sách do quy tắc tự động gợi ý, không thay thế đối chiếu học thuật. Không có câu nào bị xóa tự động.',sources:sources(),findings:lastQuestionConcerns.map(f=>({id:findingStableId(f),type:f.type,severity:f.severity,title:f.title,semantic:!!f.semantic,semanticAnalysis:f.semanticAnalysis||null,detail:f.detail,decision:decisions[findingStableId(f)]||{status:'pending'},questions:f.rows.map(r=>({grade:r.g,subject:r.subject,index:r.index+1,prompt:r.prompt,options:r.options,answerIndex:r.answer,answer:r.options[r.answer]??null,source:sources()[r.key]||null}))}))};
   try{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='bao-cao-kiem-duyet-cau-hoi-lop-1-9.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);document.getElementById('questionConcernStatus').textContent=`Đã xuất ${lastQuestionConcerns.length} phát hiện. Nếu chưa quét, hãy quét trước khi xuất.`;}catch(e){document.getElementById('questionConcernStatus').textContent='Không thể xuất tệp trong trình duyệt này.';}
 }
 const editHistory=()=>loadStore('teacherQuestionHistory',[]);
 function logQuestionHistory(row,before,after,reason){const hist=editHistory();hist.unshift({id:Date.now()+Math.random(),grade:String(row.g),subject:row.s,index:row.index,before:cloneQuestion(before),after:cloneQuestion(after),reason,at:new Date().toISOString()});saveStore('teacherQuestionHistory',hist.slice(0,500));}
 function renderEditHistory(){const root=document.getElementById('editHistoryList');if(!root)return;const list=editHistory();if(!list.length){root.innerHTML='<p class="muted">Chưa có lịch sử chỉnh sửa mới. Những chỉnh sửa cũ trước khi bật chức năng này có thể không có phiên bản trước.</p>';return;}root.innerHTML=list.slice(0,100).map((h,i)=>`<article class="teacher-report"><b>${escapeHTML('Lớp '+h.grade+' · '+h.subject+' · Câu '+(Number(h.index)+1))}</b><p>${escapeHTML(h.reason||'Chỉnh sửa câu hỏi')} · ${escapeHTML(h.at?new Date(h.at).toLocaleString('vi-VN'):'')}</p><p><small>Trước:</small> ${escapeHTML(String(h.before?.[0]||'(trống)').slice(0,180))}</p><p><small>Sau:</small> ${escapeHTML(String(h.after?.[0]||'(trống)').slice(0,180))}</p><button class="secondary" type="button" data-history-restore="${i}">Khôi phục phiên bản trước</button></article>`).join('');root.querySelectorAll('[data-history-restore]').forEach(b=>b.addEventListener('click',()=>{const h=editHistory()[Number(b.dataset.historyRestore)];if(!h||!confirm(`Khôi phục câu lớp ${h.grade} · ${h.subject} · câu ${Number(h.index)+1} về phiên bản trước?`))return;const key=`${h.grade}|${h.subject}`,arr=bank[key];if(!Array.isArray(arr)||!arr[Number(h.index)]){alert('Không tìm thấy câu tương ứng trong ngân hàng hiện tại.');return;}const current=cloneQuestion(arr[Number(h.index)]);logQuestionHistory({g:h.grade,s:h.subject,index:Number(h.index)},current,h.before,'Khôi phục phiên bản trước');const all=edits().filter(x=>!(String(x.grade)===String(h.grade)&&x.subject===h.subject&&Number(x.index)===Number(h.index)));all.push({grade:String(h.grade),subject:h.subject,index:Number(h.index),originalPrompt:String(window.__teacherOriginalBank[key]?.[Number(h.index)]?.[0]||h.before[0]),q:cloneQuestion(h.before),modifiedAt:new Date().toISOString()});saveStore('teacherQuestionEdits',all);arr[Number(h.index)]=cloneQuestion(h.before);fillTeacherQuestions();document.getElementById('teacherGrade').value=String(h.grade);fillTeacherSubjects();document.getElementById('teacherSubject').value=h.subject;fillTeacherQuestions();document.getElementById('teacherQuestion').value=String(h.index);loadTeacherQuestion();renderEditHistory();renderTeacherModerationStats();}));}
 function downloadTextFile(name,textValue,type){const blob=new Blob([textValue],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);}
 function exportQuestionBank(){const out={format:'hoc-tap-lop-1-9-bank-v1',createdAt:new Date().toISOString(),notice:'Các câu chưa tự động được xác minh; cần người kiểm duyệt đối chiếu nguồn.',bank:Object.fromEntries(Object.entries(bank).map(([k,v])=>[k,v.map(cloneQuestion)])),sources:sources(),marks:marks(),edits:edits(),history:editHistory()};downloadTextFile('ngan-hang-cau-hoi-lop-1-9.json',JSON.stringify(out,null,2),'application/json');}
 function csvCell(v){return '"'+String(v??'').replace(/"/g,'""')+'"';}
 function downloadCsvTemplate(){const rows=[['grade','subject','prompt','optionA','optionB','optionC','optionD','answerIndex','difficulty','topic'],['6','Toán','Ví dụ: nhập câu hỏi','Phương án A','Phương án B','Phương án C','Phương án D','0','medium','Chủ đề mẫu']];downloadTextFile('mau-nhap-cau-hoi.csv','\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');}
 function parseCsv(textValue){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<textValue.length;i++){const c=textValue[i];if(quoted){if(c==='"'&&textValue[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell='';}else if(c==='\n'){row.push(cell.replace(/\r$/,''));if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}row.push(cell.replace(/\r$/,''));if(row.some(x=>x.trim()))rows.push(row);if(quoted)throw new Error('CSV có dấu ngoặc kép chưa đóng.');return rows;}
 async function importQuestionBank(){const file=document.getElementById('importQuestionBankFile').files?.[0],status=document.getElementById('questionBankImportStatus');if(!file){status.textContent='Hãy chọn tệp JSON hoặc CSV trước.';return;}if(file.size>10*1024*1024){status.textContent='Tệp quá lớn (giới hạn 10 MB).';return;}try{const textValue=await file.text();let incoming=[];if(file.name.toLowerCase().endsWith('.json')){const obj=JSON.parse(textValue);if(obj?.format==='hoc-tap-lop-1-9-bank-v1'&&obj.bank&&typeof obj.bank==='object'){Object.entries(obj.bank).forEach(([key,arr])=>{const [grade,subject]=key.split('|');if(!Array.isArray(arr))return;arr.forEach((q,index)=>incoming.push({grade,subject,index,q}));});}else if(obj?.format==='hoc-tap-lop-1-9-question-import-v1'&&Array.isArray(obj.questions)){incoming=obj.questions;}else throw new Error('JSON không đúng định dạng ngân hàng được hỗ trợ.');}else{const rows=parseCsv(textValue);if(rows.length<2)throw new Error('CSV không có dòng dữ liệu.');const heads=rows.shift().map(x=>x.trim().toLowerCase());const at=n=>heads.indexOf(n);['grade','subject','prompt','optiona','optionb','optionc','optiond','answerindex'].forEach(n=>{if(at(n)<0)throw new Error('Thiếu cột bắt buộc: '+n);});incoming=rows.map(r=>({grade:r[at('grade')],subject:r[at('subject')],q:[r[at('prompt')],['optiona','optionb','optionc','optiond'].map(n=>r[at(n)]),Number(r[at('answerindex')]),r[at('difficulty')]||'medium',r[at('topic')]||'']}));}
 const valid=[],errors=[];incoming.forEach((item,i)=>{const grade=String(item.grade||''),subject=String(item.subject||''),q=item.q;if(!/^[1-9]$/.test(grade)||!(subjects[grade]||[]).includes(subject)){errors.push(`Dòng ${i+1}: lớp/môn không hợp lệ.`);return;}if(!Array.isArray(q)||String(q[0]||'').trim().length<5||!Array.isArray(q[1])||q[1].length!==4||q[1].some(x=>!String(x||'').trim())||!Number.isInteger(Number(q[2]))||Number(q[2])<0||Number(q[2])>3){errors.push(`Dòng ${i+1}: nội dung/4 phương án/đáp án chưa hợp lệ.`);return;}const opts=q[1].map(x=>String(x).trim().toLocaleLowerCase('vi'));if(new Set(opts).size!==4){errors.push(`Dòng ${i+1}: có phương án trùng.`);return;}valid.push({grade,subject,index:Number.isInteger(item.index)?item.index:null,q:[String(q[0]).trim(),q[1].map(x=>String(x).trim()),Number(q[2]),['easy','medium','hard'].includes(q[3])?q[3]:'medium',String(q[4]||'')]});});
 if(!valid.length){status.textContent=`Không có câu hợp lệ để nhập. ${errors.slice(0,8).join(' ')}`;return;}const preview=`Đọc được ${valid.length} câu hợp lệ và ${errors.length} dòng lỗi. Nhập sẽ lưu thành chỉnh sửa cục bộ, đặt trạng thái “Đang kiểm tra”, không tự đánh dấu đã duyệt. Tiếp tục?`;if(!confirm(preview))return;const all=edits(),allMarks=marks();let added=0;valid.forEach(item=>{const arr=bank[`${item.grade}|${item.subject}`]||[];const index=item.index!==null&&item.index>=0&&item.index<arr.length?item.index:arr.findIndex(q=>String(q[0]).trim()===String(item.q[0]).trim());if(index>=0){const original=arr[index];const record={grade:item.grade,subject:item.subject,index,originalPrompt:String(window.__teacherOriginalBank[`${item.grade}|${item.subject}`]?.[index]?.[0]||original[0]),q:cloneQuestion(item.q),modifiedAt:new Date().toISOString()};const pos=all.findIndex(x=>String(x.grade)===item.grade&&x.subject===item.subject&&Number(x.index)===index);if(pos>=0)all[pos]=record;else all.push(record);arr[index]=cloneQuestion(item.q);allMarks[editKey(item.grade,item.subject,index)]='reviewing';added++;}else{const newIndex=arr.length;arr.push(cloneQuestion(item.q));const key=`${item.grade}|${item.subject}`;const base=window.__teacherOriginalBank[key]||[];base.push(cloneQuestion(item.q));window.__teacherOriginalBank[key]=base;const record={grade:item.grade,subject:item.subject,index:newIndex,originalPrompt:'',q:cloneQuestion(item.q),modifiedAt:new Date().toISOString(),imported:true};all.push(record);allMarks[editKey(item.grade,item.subject,newIndex)]='reviewing';added++;}});saveStore('teacherQuestionEdits',all);saveStore('teacherQuestionMarks',allMarks);fillTeacherQuestions();renderTeacherModerationStats();runBankAudit();status.textContent=`Đã nhập ${added} câu vào chỉnh sửa cục bộ. ${errors.length} dòng bị bỏ qua. Tất cả câu nhập đều ở trạng thái “Đang kiểm tra”; hãy quét và đối chiếu nguồn trước khi dùng.`;}catch(e){status.textContent='Không nhập được tệp: '+String(e.message||e);}}
 function renderQuestionPerformance(){const root=document.getElementById('questionPerformanceList');if(!root)return;const all=loadStore('questionPerformance',{}),rows=Object.values(all).sort((a,b)=>(b.wrong||0)-(a.wrong||0));if(!rows.length){root.innerHTML='<p class="muted">Chưa có dữ liệu câu hỏi. Thống kê bắt đầu từ những câu trả lời sau bản nâng cấp này.</p>';return;}root.innerHTML=rows.slice(0,150).map(r=>{const pct=Math.round(100*(Number(r.correct)||0)/Math.max(1,Number(r.total)||0));const flag=r.total>=5&&pct<40?'Cần kiểm tra (tỉ lệ đúng thấp)':r.total>=5&&pct>95?'Rất dễ hoặc cần kiểm tra':r.total<5?'Chưa đủ lượt để ước lượng':'Chưa có dấu hiệu nổi bật';return `<article class="teacher-report"><b>${escapeHTML('Lớp '+r.grade+' · '+r.subject)}</b><p>${escapeHTML(r.prompt)}</p><p>Đúng ${r.correct||0} · Sai ${r.wrong||0} · Bỏ qua ${r.skipped||0} · Tổng ${r.total||0} · Tỉ lệ đúng ${pct}%</p><span class="pill">${flag}</span></article>`;}).join('');}
 function exportQuestionPerformance(){downloadTextFile('thong-ke-do-kho-cau-hoi.json',JSON.stringify({createdAt:new Date().toISOString(),notice:'Dữ liệu cục bộ của thiết bị hiện tại, không đại diện cho nhiều học sinh.',performance:loadStore('questionPerformance',{})},null,2),'application/json');}
 function applyTeacherMode(){const mode=document.getElementById('teacherModeSelect').value,pin=document.getElementById('teacherPinInput').value,existing=loadStore('teacherLocalPin','');const status=document.getElementById('teacherModeStatus');if(mode==='teacher'){if(!existing){if(pin.length<4||pin.length>12){status.textContent='Lần đầu hãy đặt PIN dài 4–12 ký tự.';return;}if(!confirm('PIN chỉ khóa giao diện trên thiết bị này, không phải bảo mật mạnh. Đặt PIN này?'))return;saveStore('teacherLocalPin',pin);}else if(pin!==existing){status.textContent='PIN không đúng; vẫn giữ chế độ học sinh.';document.getElementById('teacherModeSelect').value='student';return;}}else if(existing&&pin&&pin!==existing){status.textContent='PIN không đúng; không đổi chế độ.';document.getElementById('teacherModeSelect').value='teacher';return;}const isTeacher=mode==='teacher';document.querySelectorAll('#teacherModerationCard input:not([type=file]),#teacherModerationCard select,#teacherModerationCard textarea,#teacherModerationCard button').forEach(el=>{if(['applyTeacherMode','teacherModeSelect','teacherPinInput'].includes(el.id))return;el.disabled=!isTeacher;});status.textContent=isTeacher?'Đang ở chế độ giáo viên trên thiết bị này.':'Đang ở chế độ học sinh; các điều khiển kiểm duyệt đã bị khóa trong giao diện. PIN cục bộ không thay thế xác thực an toàn.';saveStore('teacherLocalMode',isTeacher?'teacher':'student');document.getElementById('teacherPinInput').value='';}
 function initMatrixExam(){const g=document.getElementById('matrixGrade'),sub=document.getElementById('matrixSubject');g.innerHTML=Array.from({length:9},(_,i)=>`<option value="${i+1}">Lớp ${i+1}</option>`).join('');g.value='6';function subjectsForMatrix(){const old=sub.value;sub.innerHTML=(subjects[g.value]||[]).map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join('');if((subjects[g.value]||[]).includes(old))sub.value=old;fillTopics();}function fillTopics(){const topic=document.getElementById('matrixTopic'),arr=bank[`${g.value}|${sub.value}`]||[],topics=[...new Set(arr.map(q=>String(q[4]||'').trim()).filter(Boolean))].sort();topic.innerHTML='<option value="all">Tất cả chủ đề</option>'+topics.map(t=>`<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join('');const lessonEl=document.getElementById('matrixLesson');if(lessonEl){const maps=window.__getQuestionCurriculumMeta;const lessons=[...new Set(arr.map((q,i)=>{const m=maps?maps(g.value,sub.value,i):null;return m&&m.status==='verified'&&m.series&&m.volume&&m.lesson&&m.sourceTitle&&m.sourceEvidence?String(m.lesson).trim():''}).filter(Boolean))].sort();lessonEl.innerHTML='<option value="all">Tất cả bài</option>'+lessons.map(t=>`<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join('');}}g.addEventListener('change',subjectsForMatrix);sub.addEventListener('change',fillTopics);['matrixBookSeries','matrixBookVolume'].forEach(id=>document.getElementById(id)?.addEventListener('change',fillTopics));subjectsForMatrix();document.getElementById('generateMatrixExam').addEventListener('click',()=>{const total=Number(document.getElementById('matrixCount').value),parts=['Easy','Medium','Hard'].map(k=>Number(document.getElementById('matrix'+k).value)),status=document.getElementById('matrixStatus');if(parts.some(x=>!Number.isFinite(x)||x<0||x>100)||parts.reduce((a,b)=>a+b,0)!==100){status.textContent='Tổng tỉ lệ dễ/vừa/khó phải bằng đúng 100%.';return;}const [grade,subject]=[g.value,sub.value],topic=document.getElementById('matrixTopic').value,bookSeries=document.getElementById('matrixBookSeries')?.value||'all',bookVolume=document.getElementById('matrixBookVolume')?.value||'all',lesson=document.getElementById('matrixLesson')?.value||'all',mappedOnly=!!document.getElementById('matrixMappedOnly')?.checked,arrForScope=bank[`${grade}|${subject}`]||[],source=arrForScope.filter(q=>{const index=arrForScope.indexOf(q),m=window.__getQuestionCurriculumMeta?window.__getQuestionCurriculumMeta(grade,subject,index):null;if(topic!=='all'&&String(q[4]||'')!==topic)return false;if(mappedOnly&&(!m||m.status!=='verified'||String(m.grade)!==String(grade)||m.subject!==subject||!m.series||!m.volume||!m.lesson||!m.sourceTitle||!m.sourceEvidence))return false;if(bookSeries!=='all'&&(!m||m.status!=='verified'||m.series!==bookSeries))return false;if(bookVolume!=='all'&&(!m||m.status!=='verified'||m.volume!==bookVolume))return false;if(lesson!=='all'&&(!m||m.status!=='verified'||m.lesson!==lesson))return false;return true;}),difficulty=q=>q[3]==='easy'?'easy':q[3]==='hard'?'hard':'medium',counts=[Math.floor(total*parts[0]/100),Math.floor(total*parts[1]/100),Math.floor(total*parts[2]/100)];for(let i=0;i<total-counts.reduce((a,b)=>a+b,0);i++)counts[i%3]++;const buckets=['easy','medium','hard'].map((d,i)=>({d,n:counts[i],items:shuffleArray(source.filter(q=>difficulty(q)===d))}));const missing=buckets.filter(b=>b.items.length<b.n);if(missing.length){status.textContent='Chưa đủ câu trong bộ đã chọn cho ma trận này: '+missing.map(b=>`${b.d} cần ${b.n}, hiện có ${b.items.length}`).join('; ')+'. Hãy giảm số câu, đổi chủ đề hoặc bổ sung câu được kiểm duyệt.';return;}questions=shuffleArray(buckets.flatMap(b=>b.items.slice(0,b.n).map(cloneQuestion)));qi=0;score=0;wrongQuestions=[];streak=0;eliminatedAt={};quizFinished=false;quizRunId++;document.getElementById('qGrade').value=grade;fillSubjects('qGrade','qSubject');document.getElementById('qSubject').value=subject;document.getElementById('qCount').value=String(total);document.getElementById('difficulty').value='all';clearInterval(timer);clearInterval(examTimer);showTab('quiz');document.getElementById('quizCard').classList.remove('hidden');showQuestion();status.textContent=`Đã tạo đề ${total} câu · Lớp ${grade} · ${subject} · Chủ đề ${topic==='all'?'tất cả':topic}${mappedOnly?' · chỉ câu đã đối chiếu SGK':''}${bookSeries!=='all'?' · bộ sách '+bookSeries:''}${bookVolume!=='all'?' · tập '+bookVolume:''}${lesson!=='all'?' · bài '+lesson:''}.`;});}
  function initTeacherUi(){
   fillTeacherGrades();
   document.getElementById('teacherGrade').addEventListener('change',fillTeacherSubjects);
   document.getElementById('teacherSubject').addEventListener('change',fillTeacherQuestions);
   document.getElementById('teacherQuestion').addEventListener('change',loadTeacherQuestion);
   document.getElementById('saveTeacherQuestion').addEventListener('click',saveTeacherQuestion);
   document.getElementById('saveTeacherSource').addEventListener('click',saveTeacherSource);
   document.getElementById('resetTeacherQuestion').addEventListener('click',resetTeacherQuestion);
   document.getElementById('saveTeacherReviewMark').addEventListener('click',saveTeacherMark);
   document.getElementById('exportTeacherReview').addEventListener('click',exportTeacherReview);
   document.getElementById('refreshTeacherReview').addEventListener('click',renderTeacherReports);
   document.getElementById('refreshEditHistory').addEventListener('click',renderEditHistory);document.getElementById('exportEditHistory').addEventListener('click',()=>downloadTextFile('lich-su-chinh-sua-cau-hoi.json',JSON.stringify(editHistory(),null,2),'application/json'));document.getElementById('refreshQuestionPerformance').addEventListener('click',renderQuestionPerformance);document.getElementById('exportQuestionPerformance').addEventListener('click',exportQuestionPerformance);document.getElementById('exportQuestionBank').addEventListener('click',exportQuestionBank);document.getElementById('downloadQuestionCsvTemplate').addEventListener('click',downloadCsvTemplate);document.getElementById('importQuestionBank').addEventListener('click',importQuestionBank);document.getElementById('applyTeacherMode').addEventListener('click',applyTeacherMode);initMatrixExam();if(loadStore('teacherLocalMode','student')==='teacher'){document.getElementById('teacherModeSelect').value='student';}
   document.getElementById('runQuestionConcernScan').addEventListener('click',runQuestionConcernScan);
   document.getElementById('exportQuestionConcernScan').addEventListener('click',exportQuestionConcernScan);
   document.getElementById('concernType').addEventListener('change',()=>{questionConcernVisibleCount=0;renderQuestionConcerns();});
   document.getElementById('concernDecisionFilter').addEventListener('change',()=>{questionConcernVisibleCount=0;renderQuestionConcerns();});
   document.getElementById('concernScope').addEventListener('change',()=>{if(lastQuestionConcerns.length)runQuestionConcernScan();});
   document.getElementById('concernSimilarityMode')?.addEventListener('change',()=>{if(lastQuestionConcerns.length)runQuestionConcernScan();});
   renderTeacherReports();renderTeacherModerationStats();renderEditHistory();renderQuestionPerformance();runBankAudit();
 }
 
 function renderKnowledgeMap(){
   const root=document.getElementById('knowledgeMap');if(!root)return;
   const stats=loadStore('stats',{}),missed=loadStore('missedQuestions',{});const rows=[];
   for(const [key,arr] of Object.entries(bank)){
     const [g,sub]=key.split('|');const st=stats[key];if(!st||!Number(st.total))continue;
     const accuracy=Math.round((Number(st.correct)||0)/Math.max(1,Number(st.total)||0)*100);
     const missedRows=Array.isArray(missed[key])?missed[key]:[];
     const topicsCount={};missedRows.forEach(x=>{const t=x?.q?.[4]||'Chủ đề khác';topicsCount[t]=(topicsCount[t]||0)+(Number(x.count)||1);});
     const weakTopic=Object.entries(topicsCount).sort((a,b)=>b[1]-a[1])[0];
     const status=accuracy<60?['Cần củng cố','weak']:accuracy<80?['Đang tiến bộ','mid']:['Khá vững','strong'];
     rows.push({g,sub,accuracy,total:Number(st.total)||0,attempts:Number(st.attempts)||0,bankCount:Array.isArray(arr)?arr.length:0,weakTopic,missCount:missedRows.reduce((n,x)=>n+(Number(x.count)||1),0),status});
   }
   rows.sort((a,b)=>a.accuracy-b.accuracy||b.missCount-a.missCount);
   if(!rows.length){root.innerHTML='<div class="feedback">Chưa có đủ dữ liệu để vẽ bản đồ. Hãy làm và hoàn thành ít nhất một bài Quiz; bảng sẽ tự tổng hợp độ chính xác theo lớp–môn.</div>';return;}
   root.innerHTML=rows.map(r=>`<article class="knowledge-map-item"><div class="pill">Lớp ${escapeHTML(r.g)} · ${escapeHTML(r.sub)}</div><p><span class="knowledge-status ${r.status[1]}">${r.status[0]}</span></p><b>${r.accuracy}% chính xác</b><div class="progress-line"><span style="width:${r.accuracy}%"></span></div><small>${r.total} câu đã trả lời · ${r.attempts} lượt Quiz</small><small>Ngân hàng hiện có: ${r.bankCount} câu</small><small>${r.weakTopic?'Chủ đề cần xem lại: '+escapeHTML(r.weakTopic[0])+' ('+r.weakTopic[1]+' lần sai)':'Chưa ghi nhận chủ đề sai nổi bật.'}</small><p><button type="button" class="secondary" data-kmap-grade="${escapeHTML(r.g)}" data-kmap-subject="${escapeHTML(r.sub)}">${r.missCount?'🔁 Ôn câu sai':'📝 Luyện Quiz'}</button></p></article>`).join('');
   root.querySelectorAll('[data-kmap-grade]').forEach(b=>b.addEventListener('click',()=>{
     const g=b.getAttribute('data-kmap-grade'),sub=b.getAttribute('data-kmap-subject');
     if((loadStore('missedQuestions',{})[`${g}|${sub}`]||[]).length){
       showTab('tools');showToolModule(3);document.getElementById('reviewGrade').value=g;fillToolSubjectOptions('reviewGrade','reviewSubject',false);document.getElementById('reviewSubject').value=sub;renderSmartReviewSummary();startSmartReview();
     }else{document.getElementById('qGrade').value=g;fillSubjects('qGrade','qSubject');document.getElementById('qSubject').value=sub;document.getElementById('difficulty').value='all';showTab('quiz');startQuiz();}
   }));
 }
 const originalShowTab=showTab;
 showTab=function(t){originalShowTab(t);if(t==='progress')renderKnowledgeMap();if(t==='tools'){renderTeacherReports();renderTeacherModerationStats();}};
  initTeacherUi();
 renderKnowledgeMap();
 // Improve flashcard keyboard/touch accessibility without replacing its existing click action.
 const flashcardEl=document.getElementById('flashcard');
 if(flashcardEl){flashcardEl.setAttribute('role','button');flashcardEl.setAttribute('tabindex','0');flashcardEl.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat){e.preventDefault();flipFlashcard();}});}
 // Safari/file-origin persistence can be restricted; keep all local controls usable and explain the limit.
 try{const probe='__study_storage_probe__';localStorage.setItem(probe,'1');localStorage.removeItem(probe);}catch(e){const f=document.querySelector('footer');if(f&&!document.getElementById('storageLimitNote')){const n=document.createElement('p');n.id='storageLimitNote';n.className='small-note';n.textContent='Lưu ý: trình duyệt đang hạn chế bộ nhớ cục bộ. Ghi chú và tiến độ có thể chỉ giữ đến khi đóng trang; hãy xuất bản sao lưu khi có thể.';f.appendChild(n);}}
})();
