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

Các trạng thái chính:

- `ready_for_review`: bài mới, chờ duyệt.
- `approved`: đã duyệt, có thể đăng hoặc hẹn giờ.
- `scheduled`: đã hẹn giờ.
- `published`: đã đăng Facebook.
- `failed`: đăng lỗi, cần kiểm tra và đăng lại.
