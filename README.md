# Học Tập Lớp 1–9 — cấu trúc giai đoạn 2

Dự án đã được tách khỏi file HTML đơn ban đầu thành HTML, CSS, JavaScript, dữ liệu JSON và PWA.

## Cấu trúc

```text
hoc-tap-lop-1-9/
├── index.html
├── assets/
│   ├── css/  (base.css, layout.css, components.css, themes.css)
│   ├── js/   (app.js, navigation.js, knowledge.js, quiz.js, flashcards.js,
│   │          progress.js, planner.js, storage.js, question-audit.js)
│   └── images/
├── data/
│   ├── curriculum.json
│   ├── lessons.json
│   └── questions/grade-1.json ... grade-9.json
├── manifest.json
├── sw.js
└── README.md
```

## Chạy trên máy tính

Không nên mở `index.html` trực tiếp bằng `file://`, vì trình duyệt thường chặn `fetch()` đọc dữ liệu JSON. Mở terminal trong thư mục `hoc-tap-lop-1-9` rồi chạy:

```bash
python -m http.server 8000
```

Sau đó mở `http://localhost:8000/`.

## Đưa lên GitHub Pages

1. Tạo repository và tải toàn bộ nội dung trong thư mục này lên, giữ nguyên tên thư mục/tệp.
2. Vào **Settings → Pages**, chọn nhánh `main` và thư mục `/ (root)` rồi lưu.
3. Mở URL Pages sau khi GitHub hoàn tất triển khai. Service worker/PWA cần HTTPS hoặc localhost.

## Dữ liệu và đối chiếu

- Có **1,741 câu hỏi** được tách ra thành 9 tệp JSON, theo 77 bộ lớp–môn trong dữ liệu của file gốc.
- Các lựa chọn và chỉ số đáp án giữ theo dữ liệu ngân hàng sau bước mở rộng/loại trùng vốn có trong file gốc.
- Trường `reviewStatus` được đặt là `unverified`; việc có đáp án trong dữ liệu không đồng nghĩa câu đã được xác minh với đúng bài/trang SGK. Mục rà soát chỉ phát hiện dấu hiệu cấu trúc/lặp và không thay thế việc kiểm tra chuyên môn.
- `lessons.json` chứa các nhãn chủ đề đã suy ra từ câu hỏi; không tự tạo tên bài SGK hay lời giảng khi tài liệu gốc không cung cấp.
- Tiến độ, ghi chú và lịch sử vẫn lưu trên thiết bị/trình duyệt; dữ liệu có thể mất khi xóa dữ liệu trình duyệt. Dùng nút **Xuất bản sao lưu** trong website định kỳ.

## Các thay đổi chính

- Tách CSS ra 4 tệp và JavaScript ra các mô-đun.
- Tách câu hỏi ra khỏi logic hiển thị và lưu thành JSON theo lớp.
- Thêm giao diện dữ liệu `StudyKnowledge`, tiện ích phím `1–4` trong Quiz, liên kết điều hướng bằng hash và tóm tắt nhiệm vụ hôm nay.
- Thêm `manifest.json` và `sw.js` để có thể cài như PWA và dùng offline sau khi tải/cached dữ liệu lần đầu qua HTTPS/localhost.

## Kiểm tra nhanh

Sau khi mở website, thử chuyển mục Kiến thức, làm một bài Quiz, lật flashcard, ghi nhiệm vụ, tải/xuất sao lưu và tải lại trang. Nếu trình duyệt không cho phép lưu cục bộ, dùng website qua localhost/HTTPS và xuất bản sao lưu.
