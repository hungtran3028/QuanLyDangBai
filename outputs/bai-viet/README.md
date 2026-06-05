# Quy Ước Lưu Bài Viết

Mỗi bài viết được lưu trong một thư mục riêng theo tên bài viết dạng không dấu.

Ví dụ:

```text
outputs/bai-viet/
  tin-hoc-tre-em/
    bai-viet.md
    hinh-anh.png
```

Quy ước file:

- `bai-viet.md`: nội dung bài viết, caption, hashtag, prompt thiết kế nếu có.
- `<slug>.png`: ảnh chính của bài viết.
- `<slug>-2.png`, `<slug>-3.png`: các phiên bản ảnh khác nếu có.
- `post.json`: metadata để ứng dụng quản lý duyệt, hẹn giờ và đăng Facebook.

Ảnh cuối cùng cũng cần được copy vào:

```text
outputs/images/<slug>.png
```

## Metadata `post.json`

Ví dụ:

```json
{
  "slug": "khai-giang-khoa-excel",
  "title": "Khai giảng khóa Excel",
  "caption": "Nội dung đăng Facebook...",
  "image_path": "outputs/bai-viet/khai-giang-khoa-excel/khai-giang-khoa-excel.png",
  "archive_image_path": "outputs/images/khai-giang-khoa-excel.png",
  "media": [
    {
      "id": "cover",
      "type": "ai_image",
      "path": "outputs/bai-viet/khai-giang-khoa-excel/khai-giang-khoa-excel.png",
      "archive_path": "outputs/images/khai-giang-khoa-excel.png",
      "role": "cover",
      "order": 1,
      "title": "Ảnh AI khai giảng Excel"
    },
    {
      "id": "tin-hoc-001",
      "type": "student_photo",
      "path": "assets/student-photos/tin-hoc/lop-tin-hoc-001.jpg",
      "album": "tin-hoc",
      "role": "slide",
      "order": 2,
      "title": "Ảnh lớp tin học thực tế",
      "approved_for_use": true
    }
  ],
  "ignored_checks": [],
  "status": "ready_for_review",
  "scheduled_at": null,
  "published_at": null,
  "facebook_post_id": null,
  "facebook_page_id": null,
  "facebook_page_name": null,
  "publish_history": [],
  "publish_error": null
}
```

`image_path` và `archive_image_path` vẫn được giữ để tương thích với bài cũ.
Từ nay app ưu tiên `media` để hỗ trợ một ảnh, nhiều ảnh AI, ảnh học viên thật hoặc bộ ảnh kết hợp.

Quy ước `media`:

- `type: "ai_image"`: ảnh AI/final post nằm trong `outputs/bai-viet/<slug>/` hoặc `outputs/images/`.
- `type: "student_photo"`: ảnh học viên thật nằm trong `assets/student-photos/<album>/`.
- `order`: thứ tự đăng ảnh trên Facebook.
- `role: "cover"`: ảnh đầu tiên trong bộ ảnh.
- Ảnh học viên trong album đều có thể được chọn vào bộ ảnh đăng bài.
- `ignored_checks`: danh sách mã kiểm tra đã được người vận hành bấm bỏ qua trên giao diện.

Thư viện ảnh học viên:

```text
assets/student-photos/
  albums.json
  tin-hoc/
    photos.json
    *.jpg
  ky-thuat/
    photos.json
  ke-toan/
    photos.json
  tre-em/
    photos.json
```

Mỗi ảnh thật nên được khai trong `photos.json` của album:

```json
{
  "photos": [
    {
      "id": "tin-hoc-001",
      "file": "lop-tin-hoc-001.jpg",
      "title": "Lớp tin học văn phòng",
      "approved_for_use": true,
      "taken_at": "2026-06-01",
      "order": 1
    }
  ]
}
```

Các trạng thái chính:

- `ready_for_review`: bài mới, chờ duyệt.
- `approved`: đã duyệt, có thể đăng hoặc hẹn giờ.
- `scheduled`: đã hẹn giờ.
- `published`: đã đăng Facebook.
- `failed`: đăng lỗi, cần kiểm tra và đăng lại.
