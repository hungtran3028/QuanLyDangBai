# Workflow Tạo Bài Đăng Sao Việt

Tài liệu này là quy trình chuẩn cho toàn bộ dự án khi tạo bài đăng cho Trung Tâm Tin Học Sao Việt Biên Hòa.

## 1. Mục tiêu

Khi người dùng yêu cầu tạo bài đăng, luôn tạo đủ:

- Bài viết hoàn chỉnh.
- Hashtag.
- Chữ ngắn cho banner.
- Prompt thiết kế hình ảnh.
- Hình ảnh được tạo bằng AI.
- Thư mục lưu trữ đúng chuẩn trong `outputs/bai-viet/`.

## 2. Nguyên tắc bắt buộc

- Luôn dùng đúng thương hiệu: `Trung Tâm Tin Học Sao Việt Biên Hòa`.
- Luôn dùng đúng hotline: `093 11 44 858`.
- Luôn dùng đúng địa chỉ: `91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai`.
- Slogan chính thức: `Chuyên nghiệp - Tận tâm - Học thành nghề`.
- Giọng văn: gần gũi, rõ ràng, dễ hiểu, nhấn mạnh học thực hành và lợi ích thực tế.
- Với bài đăng Facebook/Zalo, dùng icon/emoji sinh động để bài viết dễ đọc, thú vị và nổi bật hơn.
- Icon cần dùng có chủ đích: mở bài, nhóm lợi ích, đối tượng phù hợp, CTA, địa chỉ/hotline.
- Không lạm dụng icon quá dày; tránh làm bài viết rối hoặc thiếu chuyên nghiệp.
- Không nói quá, không cam kết tuyệt đối.
- Không tự thêm thương hiệu, hotline, địa chỉ hoặc ưu đãi không được yêu cầu.

## 3. Nguyên tắc hình ảnh

- Hình ảnh phải được tạo bằng AI.
- Không dựng banner bằng code, Pillow, canvas, SVG hay HTML/CSS nếu mục tiêu là ảnh bài đăng.
- Luôn dùng logo Sao Việt chuẩn trong `assets/brand/logo-primary.png` làm ảnh tham chiếu khi tạo hình.
- Logo trong ảnh phải rõ, đúng màu, đúng hình, không bị vẽ lại, biến dạng, đổi màu hoặc thay bằng logo giả.
- Nếu AI tạo sai logo hoặc chữ quá lỗi, tạo lại ảnh bằng AI với prompt nhấn mạnh giữ logo chuẩn.
- Không dùng watermark, QR code, bố cục rối, chữ quá nhỏ.
- Với chữ tiếng Việt trên ảnh, ưu tiên câu ngắn, dễ đọc trên điện thoại.
- Mọi ảnh bài đăng phải có địa chỉ `91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai` và hotline `093 11 44 858` rõ ràng, dễ đọc.

## 4. Cấu trúc lưu bài

Mỗi bài viết được lưu trong một thư mục riêng:

```text
outputs/bai-viet/
  ten-bai-viet-khong-dau/
    bai-viet.md
    ten-bai-viet-khong-dau.png
```

Quy ước:

- `bai-viet.md`: nội dung bài viết, hashtag, chữ ngắn cho banner, prompt thiết kế.
- `ten-bai-viet-khong-dau.png`: ảnh chính của bài viết, đặt tên tương đương thư mục/bài viết.
- `ten-bai-viet-khong-dau-2.png`, `ten-bai-viet-khong-dau-3.png`: các phiên bản ảnh khác nếu cần tạo lại hoặc làm biến thể.

Tên thư mục dùng tiếng Việt không dấu, chữ thường, nối bằng dấu gạch ngang.

Ví dụ:

```text
outputs/bai-viet/khai-giang-khoa-ke-toan-tong-hop/
```

Ngoài ảnh trong thư mục bài viết, luôn lưu thêm một bản ảnh vào kho tổng hợp hình:

```text
outputs/images/ten-bai-viet-khong-dau.png
```

Thư mục `outputs/images/` được gọi là **tổng hợp hình**. Đây là nơi gom tất cả ảnh cuối cùng đã tạo để dễ tìm, đăng lại hoặc tái sử dụng.

## 5. Quy trình thực hiện

### Bước 1: Xác định yêu cầu

Từ yêu cầu của người dùng, xác định:

- Chủ đề hoặc khóa học.
- Mục tiêu bài đăng: tuyển sinh, khai giảng, mẹo kiến thức, câu chuyện học viên, SEO địa phương, video ngắn.
- Kênh đăng nếu có: Facebook, Zalo, website, TikTok/Reels.
- Đối tượng nếu có: học sinh, sinh viên, người đi làm, phụ huynh, doanh nghiệp, người mới bắt đầu.

Nếu người dùng không nói rõ, chọn mặc định:

- Dạng bài: Facebook/Zalo.
- Mục tiêu: tuyển sinh hoặc khai giảng, tùy nội dung yêu cầu.
- Giọng văn: gần gũi, thực tế, rõ CTA.

### Bước 2: Viết bài

Bài viết nên có cấu trúc:

```text
# Tên bài

## Phiên bản Facebook/Zalo

Nội dung chính...

## Hashtag

#TinHocSaoViet ...

## Chữ ngắn cho banner

...

## Prompt thiết kế

...
```

Nội dung chính cần có:

- Mở bài nêu vấn đề hoặc nhu cầu.
- Giới thiệu khóa học/dịch vụ.
- Đối tượng phù hợp.
- Nội dung hoặc lợi ích học được.
- Điểm nổi bật tại Sao Việt.
- CTA liên hệ.
- Thông tin trung tâm.

Với bài Facebook/Zalo, nên trình bày có icon như:

```text
🎯 Khóa học phù hợp cho:
- ...

📌 Học viên sẽ được học:
- ...

✨ Điểm nổi bật:
- ...

📍 Địa chỉ: ...
☎️ Hotline: ...
```

Ưu tiên icon phổ biến, dễ hiểu như: `🎯`, `📌`, `✨`, `✅`, `💻`, `📚`, `📍`, `☎️`, `👉`, `🌟`. Không dùng icon gây cảm giác quá trẻ con nếu bài hướng đến người đi làm hoặc doanh nghiệp.

### Bước 3: Tạo prompt hình ảnh

Prompt hình ảnh phải gồm:

- Loại ảnh: banner vuông Facebook/Zalo, poster dọc, cover reels, infographic.
- Tên khóa học/chủ đề.
- Thương hiệu Sao Việt.
- Yêu cầu dùng logo chuẩn từ `assets/brand/logo-primary.png`.
- Visual chính phù hợp khóa học.
- Màu sắc thương hiệu.
- Chữ trên ảnh.
- Địa chỉ bắt buộc trên ảnh: `91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai`.
- Các điều cần tránh.

Prompt mẫu:

```text
Thiết kế banner vuông cho Facebook/Zalo về khóa "[TÊN KHÓA]" của Trung Tâm Tin Học Sao Việt Biên Hòa.
Dùng logo Sao Việt chuẩn từ assets/brand/logo-primary.png làm logo chính trong ảnh, đặt ở góc trên hoặc header, rõ nét, không vẽ lại, không đổi màu, không bóp méo.
Phong cách hiện đại, giáo dục, sáng, rõ ràng, dễ đọc trên điện thoại.
Màu sắc: xanh dương, trắng, navy, điểm nhấn vàng/cam theo tinh thần logo Sao Việt.
Visual chính: [MÔ TẢ VISUAL].
Chữ trên ảnh: "[DÒNG 1]", "[DÒNG 2]", "Hotline: 093 11 44 858", "Địa chỉ: 91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai".
Tránh watermark, QR code, bố cục rối, chữ quá nhỏ, logo giả, hotline khác, địa chỉ khác hoặc thiếu địa chỉ.
```

### Bước 4: Tạo hình bằng AI

Quy trình tạo ảnh:

1. Mở hoặc đưa logo `assets/brand/logo-primary.png` vào ngữ cảnh làm ảnh tham chiếu.
2. Gọi công cụ tạo ảnh AI với prompt đã chuẩn hóa.
3. Kiểm tra ảnh tạo ra:
   - Có logo Sao Việt đúng chưa?
   - Logo có bị sai màu, sai hình, méo hoặc thay bằng logo giả không?
   - Hotline có đúng `093 11 44 858` không?
   - Địa chỉ có đúng `91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai` không?
   - Bố cục có đọc được trên điện thoại không?
   - Có watermark, QR code hoặc chữ lạ không?
4. Nếu chưa đạt, tạo lại bằng AI và nhấn mạnh lỗi cần sửa.
5. Lưu ảnh cuối cùng vào `hinh-anh.png`.
6. Đặt tên ảnh theo slug bài viết, ví dụ `khai-giang-khoa-ke-toan-tong-hop.png`.
7. Lưu ảnh ở cả hai nơi:
   - Trong thư mục bài viết: `outputs/bai-viet/<slug>/<slug>.png`
   - Trong tổng hợp hình: `outputs/images/<slug>.png`

## 6. Kiểm tra trước khi hoàn tất

Trước khi báo hoàn thành, kiểm tra:

- Đã có thư mục đúng trong `outputs/bai-viet/`.
- Đã có `bai-viet.md`.
- Đã có ảnh chính đặt tên theo slug bài viết trong thư mục bài viết.
- Đã có bản sao ảnh chính trong `outputs/images/`.
- Bài viết có đủ CTA, hotline, địa chỉ khi cần.
- Ảnh được tạo bằng AI, không phải dựng bằng code.
- Ảnh có logo Sao Việt chuẩn.
- Ảnh có địa chỉ `91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai` rõ ràng, không sai hoặc thiếu.
- Không để ảnh chỉ nằm trong thư mục tạm hoặc thư mục mặc định của công cụ tạo ảnh.

## 7. Cách phản hồi cho người dùng

Khi hoàn tất, trả lời ngắn gọn:

- Đường dẫn bài viết.
- Đường dẫn hình ảnh.
- Hiển thị ảnh bằng Markdown nếu có thể.
- Ghi chú nếu ảnh cần tạo lại hoặc còn điểm chưa chắc chắn.

Ví dụ:

```text
Đã tạo và lưu bài đăng:

- Bài viết: outputs/bai-viet/ten-bai/bai-viet.md
- Hình ảnh: outputs/bai-viet/ten-bai/hinh-anh.png
```

## 8. Các nguồn kiến thức trong dự án

Khi tạo nội dung, ưu tiên tham khảo:

- `docs/brand-profile.md`: thông tin thương hiệu.
- `docs/content-plan.md`: trụ cột nội dung và kế hoạch đăng bài.
- `docs/design-prompt-playbook.md`: quy tắc prompt thiết kế.
- `outputs/bai-viet/README.md`: quy ước lưu bài viết.
- `assets/brand/logo-primary.png`: logo chuẩn để dùng trong hình ảnh AI.
