# Content Studio Sao Việt

Dự án hỗ trợ tạo nội dung, lưu bài viết/hình ảnh và quản lý đăng bài lên Facebook Page cho Trung Tâm Tin Học Sao Việt Biên Hòa.

## Thông tin chính thức

- Địa chỉ: 91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai
- Số điện thoại: 093 11 44 858

## Cấu trúc

- `docs/brand-profile.md`: hồ sơ thương hiệu
- `docs/content-plan.md`: kế hoạch nội dung ban đầu
- `app/`: giao diện quản trị bài viết và đăng Facebook
- `server/server.js`: backend đọc bài đã lưu, duyệt, hẹn giờ và đăng Facebook
- `outputs/bai-viet/`: thư mục lưu từng bài viết, ảnh và `post.json`
- `outputs/images/`: kho tổng hợp hình ảnh cuối cùng

## Cách chạy

```bash
npm install
npm start
```

Mở `http://localhost:3000`.

## Cấu hình Facebook

Tạo file `.env` từ `.env.example` và điền:

```env
PORT=3000
APP_BASE_URL=http://localhost:3000
META_APP_ID=
META_APP_SECRET=
FACEBOOK_PAGE_ID=
META_API_VERSION=v20.0
```

Ứng dụng chỉ cần Meta/Facebook API để đăng bài. Nội dung và ảnh vẫn được tạo từ chatbox/Codex theo `docs/content-production-workflow.md`.

Token Facebook được lưu trong `.data/` và không đưa ra frontend.

`FACEBOOK_PAGE_ID` là fanpage mặc định nếu tài khoản kết nối có nhiều Page. Sau khi kết nối, có thể chọn fanpage đăng bài trực tiếp trong giao diện.
