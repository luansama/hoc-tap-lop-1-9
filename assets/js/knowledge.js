/*
 * Knowledge/data layer for Học Tập Lớp 1–9.
 * Loads question banks from data/questions/grade-N.json, then exposes the legacy
 * array shape used by the existing UI so older features continue to work.
 */
(function () {
  'use strict';
  const currentScript = document.currentScript;
  const projectRoot = new URL('../../', currentScript.src);
  const subjects = {
    1:['Toán','Tiếng Việt','Tự nhiên và Xã hội','Đạo đức','Âm nhạc','Mĩ thuật'],
    2:['Toán','Tiếng Việt','Tự nhiên và Xã hội','Đạo đức','Âm nhạc','Mĩ thuật'],
    3:['Toán','Tiếng Việt','Tự nhiên và Xã hội','Đạo đức','Tin học','Âm nhạc','Mĩ thuật'],
    4:['Toán','Tiếng Việt','Khoa học','Lịch sử và Địa lí','Đạo đức','Tin học','Công nghệ','Âm nhạc','Mĩ thuật'],
    5:['Toán','Tiếng Việt','Khoa học','Lịch sử và Địa lí','Đạo đức','Tin học','Công nghệ','Âm nhạc','Mĩ thuật'],
    6:['Toán','Ngữ văn','Khoa học tự nhiên','Lịch sử và Địa lí','GDCD','Tin học','Công nghệ','Ngoại ngữ','Âm nhạc','Mĩ thuật'],
    7:['Toán','Ngữ văn','Khoa học tự nhiên','Lịch sử và Địa lí','GDCD','Tin học','Công nghệ','Ngoại ngữ','Âm nhạc','Mĩ thuật'],
    8:['Toán','Ngữ văn','Khoa học tự nhiên','Lịch sử và Địa lí','GDCD','Tin học','Công nghệ','Ngoại ngữ','Âm nhạc','Mĩ thuật'],
    9:['Toán','Ngữ văn','Khoa học tự nhiên','Lịch sử và Địa lí','GDCD','Tin học','Công nghệ','Ngoại ngữ','Âm nhạc','Mĩ thuật']
  };
  const icons = {'Toán':'➗','Tiếng Việt':'📖','Ngữ văn':'📚','Tự nhiên và Xã hội':'🌱','Khoa học':'🔬','Khoa học tự nhiên':'🧪','Lịch sử và Địa lí':'🌍','Đạo đức':'🤝','GDCD':'⚖️','Tin học':'💻','Công nghệ':'⚙️','Ngoại ngữ':'🌐','Âm nhạc':'🎵','Mĩ thuật':'🎨'};
  const topics = {
    'Toán':['Số và phép tính','Hình học','Đại lượng','Bài toán thực tế'],
    'Tiếng Việt':['Đọc hiểu','Từ và câu','Chính tả','Viết'],
    'Ngữ văn':['Đọc hiểu văn bản','Tiếng Việt','Viết','Thể loại văn học'],
    'Tự nhiên và Xã hội':['Con người','Thực vật và động vật','Môi trường','Cộng đồng'],
    'Khoa học':['Con người và sức khỏe','Vật chất và năng lượng','Sinh vật','Môi trường'],
    'Khoa học tự nhiên':['Chất và sự biến đổi','Năng lượng','Sinh học','Trái Đất'],
    'Lịch sử và Địa lí':['Lịch sử Việt Nam','Lịch sử thế giới','Địa lí Việt Nam','Địa lí thế giới'],
    'Đạo đức':['Trách nhiệm','Tôn trọng','Yêu thương','Ứng xử'],
    'GDCD':['Đạo đức','Pháp luật','Quyền và nghĩa vụ','Công dân'],
    'Tin học':['Máy tính','Internet','Dữ liệu','Thuật toán'],
    'Công nghệ':['Thiết kế','Kĩ thuật','Gia đình','An toàn'],
    'Ngoại ngữ':['Từ vựng','Ngữ pháp','Giao tiếp','Đọc hiểu'],
    'Âm nhạc':['Giai điệu','Nhịp điệu','Nhạc cụ','Thưởng thức'],
    'Mĩ thuật':['Màu sắc','Bố cục','Hình ảnh','Sáng tạo']
  };
  window.subjects = subjects;
  window.icons = icons;
  window.topics = topics;
  window.bank = Object.create(null);
  window.StudyKnowledge = {
    subjects,
    icons,
    topics,
    getBank() { return window.bank; },
    getQuestions(grade, subject) { return (window.bank[`${grade}|${subject}`] || []).slice(); },
    search(term, grade) {
      const query = String(term || '').trim().toLocaleLowerCase('vi');
      return Object.entries(window.bank).flatMap(([key, items]) => {
        const [g, subject] = key.split('|');
        if (grade && String(grade) !== g) return [];
        return items.filter(q => !query || [q[0], q[4], subject].join(' ').toLocaleLowerCase('vi').includes(query))
          .map(q => ({grade:g, subject, prompt:q[0], options:q[1], answerIndex:q[2], difficulty:q[3], topic:q[4]}));
      });
    }
  };

  function showLoadError(message) {
    const host = document.createElement('section');
    host.style.cssText = 'margin:16px auto;max-width:900px;padding:18px;border:1px solid #f59e0b;border-radius:14px;background:#fffbeb;color:#78350f;font:16px/1.6 system-ui,sans-serif';
    host.innerHTML = '<h2>Không tải được dữ liệu học tập</h2><p></p><p>Hãy chạy website qua máy chủ cục bộ hoặc GitHub Pages thay vì mở trực tiếp bằng file://. Xem hướng dẫn trong README.md.</p>';
    host.querySelector('p').textContent = message;
    document.body.appendChild(host);
  }
  function loadScript(relativePath) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL(relativePath, projectRoot).href;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Không tải được ${relativePath}`));
      document.body.appendChild(script);
    });
  }
  async function boot() {
    const results = await Promise.all(Array.from({length:9}, async (_,i) => {
      const grade = i + 1;
      const url = new URL(`data/questions/grade-${grade}.json`, projectRoot);
      const response = await fetch(url.href);
      if (!response.ok) throw new Error(`HTTP ${response.status} khi tải data/questions/grade-${grade}.json`);
      const data = await response.json();
      if (!Array.isArray(data.subjects)) throw new Error(`Tệp lớp ${grade} thiếu danh sách môn`);
      return data;
    }));
    for (const gradeData of results) {
      for (const subjectData of gradeData.subjects) {
        const items = Array.isArray(subjectData.questions) ? subjectData.questions : [];
        window.bank[`${gradeData.grade}|${subjectData.name}`] = items.map(q => [
          String(q.prompt ?? ''),
          Array.isArray(q.options) ? q.options.map(String) : [],
          Number(q.answerIndex),
          String(q.difficulty || 'medium'),
          String(q.topic || '')
        ]);
      }
    }
    window.__studyDataLoaded = {grades:results.length, subjects:Object.keys(window.bank).length, questions:Object.values(window.bank).reduce((n,a)=>n+a.length,0)};
    // The original core relies on classic-script globals and inline onclick handlers; load sequentially to preserve order.
    const modules = [
      'assets/js/app.js',
      'assets/js/question-audit.js',
      'assets/js/progress.js',
      'assets/js/flashcards.js',
      'assets/js/navigation.js',
      'assets/js/quiz.js',
      'assets/js/planner.js',
      'assets/js/storage.js'
    ];
    for (const module of modules) await loadScript(module);
    document.documentElement.dataset.dataReady = 'true';
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register(new URL('sw.js', projectRoot).href).catch(err => console.warn('Không đăng ký được service worker:', err));
    }
  }
  boot().catch(error => {
    console.error('Study app boot failed:', error);
    showLoadError(error.message || 'Có lỗi khi nạp JSON hoặc JavaScript.');
  });
})();
