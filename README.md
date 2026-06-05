# Content Studio Sao Việt

Ứng dụng quản lý bài viết, hình ảnh và quy trình đăng Facebook Page cho **Trung Tâm Tin Học Sao Việt Biên Hòa**.

Dự án này không chỉ là nơi lưu bài viết. Nó là một workspace vận hành nội dung: tạo bài theo đúng thương hiệu, quản lý ảnh AI và ảnh học viên, kiểm tra metadata, duyệt bài, hẹn giờ, đăng ngay, đăng lại sang fanpage khác và lưu lịch sử đăng.

## Thông Tin Chính Thức

- Tên thương hiệu: Trung Tâm Tin Học Sao Việt Biên Hòa
- Địa chỉ: 91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai
- Hotline: 093 11 44 858
- Slogan: Chuyên nghiệp - Tận tâm - Học thành nghề
- App chạy qua Tailscale Serve, cấu hình bằng biến `APP_BASE_URL`
- Facebook OAuth callback dùng dạng: `https://<ten-may-tailnet>.ts.net/api/facebook/callback`

## Tính Năng Chính

- Dashboard theo dõi trạng thái bài viết trong `outputs/bai-viet/`.
- Tự đọc `bai-viet.md`, ảnh trong thư mục bài và `post.json`.
- Tạo metadata cho bài cũ chưa có `post.json`.
- Kiểm tra điều kiện trước khi duyệt và đăng: metadata, nội dung, hotline, địa chỉ, slug và từ ngữ bị chặn.
- Sửa caption, tiêu đề nội bộ và media ngay trong giao diện.
- Quản lý nhiều ảnh cho một bài: ảnh AI, ảnh trong kho tổng hợp, ảnh học viên thật.
- Kết nối Facebook Page bằng OAuth, chọn fanpage đăng bài.
- Đăng ngay, đăng lại sang fanpage khác, hẹn giờ đăng tự động.
- Lưu lịch sử đăng, fanpage đã đăng, thời gian đăng, media đã dùng và lỗi nếu có.
- Prompt Generator hỗ trợ tạo prompt nội dung, cấu hình Gemini hoặc Custom Provider tương thích OpenAI/Gemini.
- Media Library đọc ảnh học viên theo album trong `assets/student-photos/`.

## Yêu Cầu Máy

- Node.js 18 trở lên.
- npm.
- Tailscale đã cài và đã đăng nhập.
- Quyền bật Tailscale Serve cho user hiện tại, hoặc có `sudo`.
- Meta App có quyền phù hợp để quản lý Page nếu muốn đăng Facebook.

## Cấu Trúc Dự Án

```text
.
├── app/
│   ├── index.html
│   ├── script.js
│   ├── styles.css
│   └── views/
│       ├── dashboard.html
│       ├── facebook.html
│       ├── history.html
│       ├── media-library.html
│       ├── post-detail.html
│       └── prompt-helper.html
├── assets/
│   ├── brand/
│   │   └── logo-primary.png
│   └── student-photos/
├── docs/
│   ├── brand-profile.md
│   ├── content-plan.md
│   ├── content-production-workflow.md
│   └── design-prompt-playbook.md
├── outputs/
│   ├── bai-viet/
│   └── images/
├── server/
│   └── server.js
├── chay-du-an.sh
├── .env.example
├── package.json
└── README.md
```

## Cài Đặt Lần Đầu

1. Cài dependencies:

```bash
npm install
```

2. Tạo file `.env`:

```bash
cp .env.example .env
```

3. Sửa `.env` theo cấu hình thật:

```env
PORT=3000
APP_BASE_URL=https://<ten-may-tailnet>.ts.net
```

`APP_BASE_URL` phải là URL Tailscale Serve thật của máy đang chạy app. Không dùng URL localhost cho luồng Facebook OAuth.

4. Nếu cần đăng Facebook, điền:

```env
META_APP_ID=
META_APP_SECRET=
FACEBOOK_PAGE_ID=
META_API_VERSION=v20.0
META_OAUTH_SCOPES=pages_show_list,pages_read_engagement,pages_manage_posts
META_LOGIN_CONFIG_ID=
```

5. Nếu dùng AI Prompt Generator, điền hoặc cấu hình trong giao diện:

```env
AI_PROVIDER=gemini
AI_API_KEY=
AI_API_BASE_URL=
AI_MODEL=
AI_ENDPOINT_STYLE=gemini
AI_API_TIMEOUT_MS=30000
```

## Cách Chạy Đúng Chuẩn

Cách khuyến nghị là dùng script có sẵn:

```bash
./chay-du-an.sh
```

Script này sẽ:

- Tạo `.env` từ `.env.example` nếu chưa có.
- Đảm bảo `PORT=3000`.
- Dùng `APP_BASE_URL` trong `.env` làm URL public của app.
- Cài `npm install` nếu chưa có `node_modules`.
- Bật Tailscale Serve:

```bash
tailscale serve --bg --yes 3000
```

- Mở app tại URL Tailscale đã cấu hình trong `APP_BASE_URL`.

Giữ cửa sổ terminal mở trong lúc dùng app. Dừng server bằng `Ctrl+C`.

## Chạy Thủ Công

Nếu không dùng script, chạy theo thứ tự:

```bash
npm install
```

```bash
tailscale serve --bg --yes 3000
```

```bash
npm start
```

Sau đó mở URL Tailscale đã cấu hình trong `APP_BASE_URL`.

Chỉ mở `http://localhost:3000` để kiểm tra nội bộ. Khi dùng Facebook OAuth, phải dùng URL Tailscale.

## Lệnh NPM

```bash
npm start
```

Chạy server bằng `node server/server.js`.

```bash
npm run dev
```

Chạy server với `node --watch` để tự reload khi sửa code.

```bash
npm test
```

Chạy Node test runner. Hiện repo chưa có test tự động đáng kể, nên lệnh này chủ yếu là điểm móc cho test sau này.

## Quy Trình Tạo Bài Viết

Trước khi tạo bất kỳ bài viết, prompt ảnh, ảnh AI hoặc artifact nội dung nào, phải đọc:

```text
docs/content-production-workflow.md
```

Các quy tắc bắt buộc:

- Luôn tạo đủ bài viết và ảnh phù hợp khi người dùng yêu cầu một bài đăng.
- Ảnh bài đăng phải tạo bằng AI, không dựng bằng code.
- Luôn dùng `assets/brand/logo-primary.png` làm logo tham chiếu khi tạo ảnh.
- Ảnh phải có địa chỉ `91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai`.
- Ảnh phải có hotline `093 11 44 858`.
- Lưu bài dưới `outputs/bai-viet/<slug>/`.
- Ảnh chính đặt tên `<slug>.png`.
- Copy ảnh chính vào `outputs/images/<slug>.png`.
- Bài Facebook/Zalo dùng icon/emoji sinh động, có chủ đích, vẫn chuyên nghiệp.

## Cấu Trúc Một Bài Viết

Mỗi bài nằm trong một thư mục riêng:

```text
outputs/bai-viet/<slug>/
├── bai-viet.md
├── <slug>.png
├── <slug>-2.png
├── <slug>-3.png
└── post.json
```

Trong đó:

- `bai-viet.md`: nội dung gốc, caption, hashtag, chữ banner, prompt thiết kế.
- `<slug>.png`: ảnh chính của bài.
- `<slug>-2.png`, `<slug>-3.png`: ảnh phụ hoặc biến thể nếu có.
- `post.json`: metadata để app quản lý duyệt, media, hẹn giờ, đăng và lịch sử.

Ảnh chính cũng phải có bản sao:

```text
outputs/images/<slug>.png
```

## Metadata `post.json`

Ví dụ tối thiểu:

```json
{
  "slug": "khoa-hoc-excel-co-ban",
  "title": "Khóa học Excel cơ bản",
  "caption": "Nội dung đăng Facebook/Zalo...",
  "image_path": "outputs/bai-viet/khoa-hoc-excel-co-ban/khoa-hoc-excel-co-ban.png",
  "archive_image_path": "outputs/images/khoa-hoc-excel-co-ban.png",
  "media": [
    {
      "id": "cover",
      "type": "ai_image",
      "path": "outputs/bai-viet/khoa-hoc-excel-co-ban/khoa-hoc-excel-co-ban.png",
      "archive_path": "outputs/images/khoa-hoc-excel-co-ban.png",
      "album": null,
      "role": "cover",
      "order": 1,
      "title": "khoa-hoc-excel-co-ban.png",
      "approved_for_use": true
    }
  ],
  "status": "ready_for_review",
  "scheduled_at": null,
  "published_at": null,
  "facebook_post_id": null,
  "facebook_page_id": null,
  "facebook_page_name": null,
  "publish_history": [],
  "publish_error": null,
  "ignored_checks": [],
  "ai_drafts": [],
  "created_at": "2026-06-05T00:00:00.000Z",
  "updated_at": "2026-06-05T00:00:00.000Z"
}
```

`image_path` và `archive_image_path` vẫn được giữ để tương thích bài cũ. App hiện ưu tiên mảng `media` để đăng một hoặc nhiều ảnh.

## Trạng Thái Bài Viết

- `missing_metadata`: có thư mục bài nhưng chưa có `post.json`.
- `ready_for_review`: đã có metadata, đang chờ duyệt.
- `approved`: đã duyệt, có thể đăng ngay hoặc hẹn giờ.
- `scheduled`: đã hẹn giờ, scheduler sẽ tự đăng khi đến giờ.
- `publishing`: server đang đăng lên Facebook.
- `published`: đã đăng thành công.
- `failed`: đăng lỗi, cần xem `publish_error` và thử lại.

## Kiểm Tra Trước Khi Đăng

App kiểm tra các điều kiện sau:

- Có `post.json`.
- Có `bai-viet.md`.
- Caption có hotline `093 11 44 858`.
- Caption hoặc metadata có địa chỉ `91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai`.
- Slug hợp lệ.
- Không dùng các cụm bị chặn: `duy nhất`, `số một`, `100%`, `nhất`.

Nếu kiểm tra bị chặn nhưng người vận hành chấp nhận rủi ro, có thể bấm bỏ qua trên giao diện. Các mã bỏ qua được lưu vào `ignored_checks`.

## Cách Dùng Giao Diện

### Dashboard

Dashboard là màn hình chính.

Bạn có thể:

- Xem tổng số bài cần xử lý, sẵn sàng đăng, đã hẹn giờ, đã đăng.
- Lọc bài theo trạng thái.
- Tìm bài theo tên hoặc slug.
- Chọn một bài để xem chi tiết.
- Tạo metadata cho bài thiếu `post.json`.
- Duyệt bài.
- Đăng ngay.
- Đăng lại nếu bài lỗi.
- Hẹn giờ đăng.
- Copy caption.
- Sửa caption và tiêu đề nội bộ.

Luồng thường dùng:

1. Chọn bài trong danh sách.
2. Kiểm tra ảnh, caption và metadata.
3. Nếu thiếu metadata, bấm tạo metadata.
4. Sửa caption nếu cần.
5. Xử lý các lỗi kiểm tra.
6. Bấm duyệt.
7. Chọn đăng ngay hoặc hẹn giờ.

### Post Detail

Màn hình này dùng để xem và chỉnh một bài rõ hơn Dashboard.

Bạn có thể:

- Xem media đang gắn với bài.
- Thêm ảnh học viên từ Media Library.
- Sửa tiêu đề nội bộ.
- Sửa caption Facebook/Zalo.
- Copy caption.
- Xem danh sách kiểm tra.
- Xem lịch hẹn, thời điểm đăng, Facebook Post ID.
- Xem lỗi đăng nếu có.
- Xem lịch sử đăng của bài.

### Media Library

Media Library đọc dữ liệu từ:

```text
assets/student-photos/
├── albums.json
├── tin-hoc/
│   ├── photos.json
│   └── *.jpg
├── ky-thuat/
├── ke-toan/
└── tre-em/
```

Cách dùng:

1. Chọn bài cần xử lý trước ở Dashboard hoặc Post Detail.
2. Vào Media Library.
3. Chọn album.
4. Chọn ảnh học viên phù hợp để thêm vào bài.
5. Quay lại bài để kiểm tra thứ tự media.

Ảnh học viên có `approved_for_use` trong `photos.json`. Khi đăng, app vẫn có thể gắn ảnh vào media, nhưng người vận hành nên ưu tiên ảnh đã được duyệt sử dụng.

### Prompt Generator

Prompt Generator có hai nhóm chức năng:

- Tạo prompt nội dung theo mẫu: tuyển sinh, khai giảng, mẹo học tập, bài học viên, ưu đãi, sửa caption, prompt ảnh.
- Cấu hình AI provider và tạo draft caption/image prompt.

Các provider hỗ trợ:

- `gemini`: dùng Gemini API.
- `custom`: dùng provider tự cấu hình, có thể chọn endpoint kiểu OpenAI-compatible hoặc Gemini-compatible.

Cách cấu hình:

1. Vào Prompt Generator.
2. Chọn Provider.
3. Nhập API Key.
4. Nếu dùng Custom Provider, nhập Base URL và Endpoint.
5. Bấm `Dò model` hoặc nhập model thủ công.
6. Bấm `Test`.
7. Bấm `Lưu .env`.

Khi tạo draft AI cho bài đang chọn:

1. Chọn bài ở Dashboard.
2. Vào Prompt Generator.
3. Chọn kiểu bài, khóa học, đối tượng, mục tiêu, độ dài, tone, kiểu ảnh.
4. Bấm tạo draft.
5. Kiểm tra draft.
6. Copy hoặc áp dụng draft vào bài.

Lưu ý: Prompt Generator tạo nội dung và prompt ảnh. Ảnh bài đăng vẫn phải được tạo bằng công cụ AI tạo ảnh và lưu đúng workflow.

### Facebook Page

Màn hình Facebook dùng để kết nối và chọn fanpage.

Cách kết nối:

1. Đảm bảo `.env` có `META_APP_ID` và `META_APP_SECRET`.
2. Đảm bảo app đang chạy qua URL Tailscale đã cấu hình trong `APP_BASE_URL`.
3. Trong Meta App, cấu hình redirect URI:

```text
https://<ten-may-tailnet>.ts.net/api/facebook/callback
```

4. Vào màn hình Facebook.
5. Bấm kết nối Page.
6. Đăng nhập Facebook và cấp quyền.
7. Sau khi quay lại app, chọn fanpage muốn đăng.

Token Page được mã hóa và lưu trong:

```text
.data/facebook-connection.json
```

Không commit thư mục `.data/`.

## Đăng Bài Lên Facebook

Điều kiện để đăng:

- Đã kết nối Facebook Page.
- Đã chọn fanpage.
- Bài không còn lỗi kiểm tra chưa xử lý.
- Bài ở trạng thái `approved` nếu đăng ngay.
- Bài có ít nhất một media hợp lệ.

Đăng một ảnh:

- App gọi Graph API endpoint `/photos` với caption.

Đăng nhiều ảnh:

- App upload từng ảnh ở trạng thái unpublished.
- Sau đó tạo feed post với `attached_media`.

Sau khi đăng thành công, app cập nhật:

- `status: "published"`
- `published_at`
- `facebook_post_id`
- `facebook_page_id`
- `facebook_page_name`
- `publish_history`

Nếu đăng lỗi, app cập nhật:

- `status: "failed"`
- `publish_error`

## Hẹn Giờ Đăng

Khi bài ở trạng thái phù hợp và không còn lỗi kiểm tra:

1. Chọn ngày giờ trong form hẹn giờ.
2. Lưu lịch.
3. Bài chuyển sang `scheduled`.

Server có scheduler chạy mỗi 60 giây. Khi `scheduled_at` đến hạn, server tự đăng bài.

Lưu ý:

- Terminal chạy server phải còn mở.
- Tailscale Serve phải còn hoạt động.
- Facebook token phải còn hợp lệ.

## Xử Lý Lỗi Thường Gặp

### Không mở được URL Tailscale

Kiểm tra Tailscale:

```bash
tailscale status
```

Bật lại serve:

```bash
tailscale serve --bg --yes 3000
```

Chạy lại server:

```bash
npm start
```

### OAuth Facebook báo sai callback

Đảm bảo:

- `.env` có `APP_BASE_URL` là URL Tailscale thật của app.
- Meta App có redirect URI dạng `https://<ten-may-tailnet>.ts.net/api/facebook/callback`.
- Không dùng localhost callback.

### Bài không duyệt hoặc không đăng được

Mở bài và kiểm tra danh sách lỗi:

- Thiếu `post.json`: bấm tạo metadata.
- Thiếu `bai-viet.md`: tạo lại file nội dung.
- Thiếu hotline: thêm `093 11 44 858` vào caption.
- Thiếu địa chỉ: thêm `91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai`.
- Có từ bị chặn: sửa caption hoặc bấm bỏ qua nếu thật sự cần.
- Thiếu ảnh: kiểm tra `media` và file ảnh thật sự tồn tại.

### AI không tạo draft

Kiểm tra:

- `AI_API_KEY` đã có chưa.
- Provider đúng chưa.
- Base URL đúng chưa nếu dùng Custom Provider.
- Model có hỗ trợ tạo nội dung không.
- Timeout có quá thấp không.

### Đăng Facebook thất bại

Kiểm tra:

- Page đã được chọn chưa.
- Token Page còn hợp lệ không.
- App có quyền `pages_show_list`, `pages_read_engagement`, `pages_manage_posts` không.
- File ảnh trong `media` có tồn tại không.
- Caption có nội dung hợp lệ không.

Sau khi sửa, dùng nút đăng lại hoặc duyệt lại rồi đăng.

## Quy Tắc Bảo Mật

- Không commit `.env`.
- Không commit `.data/`.
- Không đưa API key, Meta App Secret, Page token vào README, bài viết hoặc ảnh chụp màn hình.
- Không đưa URL Tailscale cá nhân hoặc callback thật lên README công khai.
- Token Facebook được lưu phía server, không đưa ra frontend.
- Khi chia sẻ log lỗi, kiểm tra để không lộ key/token.

## Tài Liệu Quan Trọng

- `docs/content-production-workflow.md`: workflow bắt buộc khi tạo bài và ảnh.
- `docs/brand-profile.md`: thông tin thương hiệu, khóa học, giọng văn.
- `docs/content-plan.md`: định hướng nội dung.
- `docs/design-prompt-playbook.md`: hướng dẫn prompt thiết kế ảnh.
- `outputs/bai-viet/README.md`: quy ước lưu bài và metadata.
- `assets/student-photos/README.md`: quy ước thư viện ảnh học viên.
- `openspec/AGENTS.md`: đọc khi làm proposal/spec/thay đổi lớn.

## Checklist Vận Hành Nhanh

Trước khi tạo bài:

- Đọc `docs/content-production-workflow.md`.
- Xác định chủ đề, mục tiêu, kênh đăng và đối tượng.
- Dùng đúng thương hiệu, hotline, địa chỉ, slogan.

Trước khi tạo ảnh:

- Dùng `assets/brand/logo-primary.png` làm logo tham chiếu.
- Prompt có hotline và địa chỉ.
- Ảnh tạo bằng AI.
- Không có watermark, QR code, chữ sai, logo giả.

Trước khi đăng:

- Có `bai-viet.md`.
- Có ảnh chính trong `outputs/bai-viet/<slug>/<slug>.png`.
- Có ảnh archive trong `outputs/images/<slug>.png`.
- Có `post.json`.
- Caption có hotline và địa chỉ.
- Bài đã duyệt.
- Chọn đúng fanpage.

## Ghi Chú Cho Người Phát Triển

Backend nằm trong `server/server.js`, dùng Express và Node built-in APIs. Frontend là HTML/CSS/JS tĩnh trong `app/`, các màn hình con nằm ở `app/views/`.

Các API chính:

- `GET /api/health`
- `GET /api/posts`
- `GET /api/posts/:slug`
- `POST /api/posts/:slug/metadata`
- `PATCH /api/posts/:slug/content`
- `PATCH /api/posts/:slug/media`
- `POST /api/posts/:slug/approve`
- `POST /api/posts/:slug/schedule`
- `POST /api/posts/:slug/publish-now`
- `POST /api/posts/:slug/publish-again`
- `POST /api/posts/:slug/retry`
- `GET /api/facebook/status`
- `GET /api/facebook/connect`
- `GET /api/facebook/callback`
- `POST /api/facebook/select-page`
- `GET /api/student-photos/albums`
- `GET /api/student-photos/albums/:albumId/photos`
- `GET /api/ai/config`
- `POST /api/ai/config`
- `POST /api/ai/test`
- `GET /api/ai/models`
- `POST /api/ai/generate`
- `POST /api/posts/:slug/ai-drafts/:draftId/apply`

Khi sửa tính năng lớn, thêm proposal/spec theo OpenSpec trước. Khi chỉ cập nhật nội dung hoặc README, không cần tạo proposal.
