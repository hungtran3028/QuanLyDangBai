# Requirements Document

## Introduction

Tính năng AI Image Generator Integration tự động hóa quy trình tạo hình ảnh cho bài đăng của Trung Tâm Tin Học Sao Việt Biên Hòa. Hệ thống cho phép nhân viên marketing và người tạo nội dung không có kỹ năng thiết kế có thể tạo ảnh nhanh chóng, đúng brand guideline, và tự động lưu trữ theo cấu trúc thư mục dự án hiện có.

## Glossary

- **User**: Nhân viên marketing hoặc người tạo nội dung của Sao Việt
- **AI_Image_Generator**: Hệ thống tích hợp API tạo ảnh AI (OpenAI DALL-E hoặc tương tự)
- **Brand_Logo**: Logo Sao Việt tại `assets/brand/logo-primary.png`
- **Image_Prompt**: Mô tả văn bản để tạo hình ảnh AI
- **Slug**: Tên bài viết dạng kebab-case (ví dụ: `khai-giang-khoa-ke-toan-tong-hop`)
- **Output_Directory**: Thư mục lưu trữ theo cấu trúc `outputs/bai-viet/<slug>/`
- **Image_Archive**: Thư mục tổng hợp hình `outputs/images/`
- **API_Key**: Khóa xác thực để gọi API tạo ảnh AI
- **Brand_Guideline**: Quy chuẩn thương hiệu bao gồm màu sắc, logo, địa chỉ, hotline
- **Generated_Image**: Hình ảnh được tạo bởi AI và đã lưu vào hệ thống

## Requirements

### Requirement 1: Nhập và Xử Lý Image Prompt

**User Story:** As a User, I want to nhập mô tả hình ảnh vào giao diện, so that hệ thống có thể tạo ảnh theo yêu cầu của tôi

#### Acceptance Criteria

1. THE AI_Image_Generator SHALL cung cấp giao diện nhập Image_Prompt
2. WHEN User nhập Image_Prompt, THE AI_Image_Generator SHALL chấp nhận văn bản tiếng Việt có dấu
3. THE AI_Image_Generator SHALL cho phép User nhập Slug cho bài viết
4. WHEN User nhập Slug, THE AI_Image_Generator SHALL tự động chuyển đổi sang định dạng kebab-case
5. THE AI_Image_Generator SHALL hiển thị preview của Image_Prompt đã được bổ sung Brand_Guideline

### Requirement 2: Tích Hợp Brand Guideline Tự Động

**User Story:** As a User, I want hệ thống tự động áp dụng brand guideline, so that mọi ảnh đều đúng chuẩn thương hiệu mà không cần tôi nhớ chi tiết

#### Acceptance Criteria

1. WHEN User tạo Image_Prompt, THE AI_Image_Generator SHALL tự động bổ sung thông tin Brand_Logo vào prompt
2. THE AI_Image_Generator SHALL tự động thêm địa chỉ "91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai" vào Image_Prompt
3. THE AI_Image_Generator SHALL tự động thêm hotline "093 11 44 858" vào Image_Prompt
4. THE AI_Image_Generator SHALL tự động áp dụng bảng màu thương hiệu (#5EB9F0, #343F52, #0077C8, #FAB758, #F0F8FE, #FFFFFF) vào Image_Prompt
5. THE AI_Image_Generator SHALL tự động thêm yêu cầu phong cách "hiện đại, giáo dục, sáng, rõ ràng, dễ đọc trên điện thoại" vào Image_Prompt

### Requirement 3: Sử Dụng Logo Làm Reference

**User Story:** As a User, I want hệ thống tự động sử dụng logo Sao Việt làm reference, so that ảnh được tạo luôn có logo đúng và nhất quán

#### Acceptance Criteria

1. WHEN AI_Image_Generator gọi API tạo ảnh, THE AI_Image_Generator SHALL đọc file Brand_Logo từ `assets/brand/logo-primary.png`
2. THE AI_Image_Generator SHALL gửi Brand_Logo như reference image đến API tạo ảnh
3. IF Brand_Logo không tồn tại, THEN THE AI_Image_Generator SHALL hiển thị thông báo lỗi và dừng quá trình tạo ảnh
4. THE AI_Image_Generator SHALL yêu cầu API giữ nguyên màu sắc và hình dạng của Brand_Logo trong Generated_Image

### Requirement 4: Gọi API Tạo Ảnh AI

**User Story:** As a User, I want hệ thống tự động gọi API tạo ảnh, so that tôi không phải thao tác thủ công trên các công cụ bên ngoài

#### Acceptance Criteria

1. WHEN User bấm nút tạo ảnh, THE AI_Image_Generator SHALL gọi API tạo ảnh với Image_Prompt đã được bổ sung Brand_Guideline
2. THE AI_Image_Generator SHALL sử dụng API_Key được cấu hình trong hệ thống
3. THE AI_Image_Generator SHALL hiển thị trạng thái "Đang tạo ảnh..." trong khi chờ API phản hồi
4. WHEN API trả về Generated_Image, THE AI_Image_Generator SHALL hiển thị preview ảnh cho User
5. IF API trả về lỗi, THEN THE AI_Image_Generator SHALL hiển thị thông báo lỗi chi tiết cho User

### Requirement 5: Lưu Ảnh Theo Cấu Trúc Thư Mục

**User Story:** As a User, I want hệ thống tự động lưu ảnh đúng cấu trúc thư mục, so that tôi có thể dễ dàng tìm và quản lý ảnh sau này

#### Acceptance Criteria

1. WHEN Generated_Image được tạo thành công, THE AI_Image_Generator SHALL tạo thư mục `outputs/bai-viet/<slug>/` nếu chưa tồn tại
2. THE AI_Image_Generator SHALL lưu Generated_Image vào `outputs/bai-viet/<slug>/<slug>.png`
3. THE AI_Image_Generator SHALL tạo thư mục `outputs/images/` nếu chưa tồn tại
4. THE AI_Image_Generator SHALL sao chép Generated_Image vào `outputs/images/<slug>.png`
5. THE AI_Image_Generator SHALL hiển thị đường dẫn đầy đủ của cả hai file ảnh đã lưu

### Requirement 6: Quản Lý API Key Bảo Mật

**User Story:** As a User, I want API key được lưu trữ bảo mật, so that thông tin nhạy cảm không bị lộ

#### Acceptance Criteria

1. THE AI_Image_Generator SHALL cho phép User cấu hình API_Key qua file môi trường hoặc giao diện cài đặt
2. THE AI_Image_Generator SHALL lưu API_Key ở định dạng mã hóa hoặc trong file `.env` không được commit vào Git
3. THE AI_Image_Generator SHALL không hiển thị API_Key dưới dạng plain text trong giao diện
4. WHEN API_Key chưa được cấu hình, THE AI_Image_Generator SHALL hiển thị hướng dẫn cấu hình cho User
5. THE AI_Image_Generator SHALL xác thực API_Key trước khi gọi API tạo ảnh

### Requirement 7: Kiểm Tra Chất Lượng Ảnh

**User Story:** As a User, I want xem trước và xác nhận ảnh trước khi lưu, so that tôi có thể tạo lại nếu ảnh không đạt yêu cầu

#### Acceptance Criteria

1. WHEN Generated_Image được tạo, THE AI_Image_Generator SHALL hiển thị preview ảnh với kích thước đầy đủ
2. THE AI_Image_Generator SHALL cung cấp nút "Lưu ảnh" và "Tạo lại" cho User
3. WHEN User bấm "Tạo lại", THE AI_Image_Generator SHALL gọi lại API với cùng Image_Prompt
4. WHEN User bấm "Lưu ảnh", THE AI_Image_Generator SHALL thực hiện lưu ảnh theo Requirement 5
5. THE AI_Image_Generator SHALL cho phép User tải ảnh về máy trước khi lưu vào thư mục dự án

### Requirement 8: Tích Hợp Vào Web App Hiện Có

**User Story:** As a User, I want tính năng tạo ảnh AI được tích hợp vào web app hiện có, so that tôi có thể sử dụng trong quy trình làm việc quen thuộc

#### Acceptance Criteria

1. THE AI_Image_Generator SHALL được tích hợp vào `app/index.html` như một section mới
2. THE AI_Image_Generator SHALL sử dụng cùng thiết kế giao diện với các section hiện có trong `app/styles.css`
3. WHEN User đang ở section "Tạo nội dung", THE AI_Image_Generator SHALL tự động điền Slug từ thông tin khóa học đã chọn
4. THE AI_Image_Generator SHALL tự động điền Image_Prompt từ phần "Prompt tạo banner đi kèm" hiện có
5. THE AI_Image_Generator SHALL cung cấp navigation link trong sidebar để truy cập nhanh

### Requirement 9: Xử Lý Lỗi và Thông Báo

**User Story:** As a User, I want nhận thông báo rõ ràng khi có lỗi, so that tôi biết cách khắc phục

#### Acceptance Criteria

1. IF API_Key không hợp lệ, THEN THE AI_Image_Generator SHALL hiển thị "API key không hợp lệ. Vui lòng kiểm tra lại cấu hình."
2. IF API trả về lỗi giới hạn quota, THEN THE AI_Image_Generator SHALL hiển thị "Đã vượt quá giới hạn sử dụng API. Vui lòng thử lại sau."
3. IF Brand_Logo không tồn tại, THEN THE AI_Image_Generator SHALL hiển thị "Không tìm thấy logo tại assets/brand/logo-primary.png"
4. IF việc lưu file thất bại, THEN THE AI_Image_Generator SHALL hiển thị "Không thể lưu ảnh. Vui lòng kiểm tra quyền ghi file."
5. WHEN có lỗi xảy ra, THE AI_Image_Generator SHALL ghi log chi tiết vào console để debug

### Requirement 10: Tối Ưu Chi Phí API

**User Story:** As a User, I want hệ thống sử dụng API một cách tiết kiệm, so that chi phí vận hành hợp lý

#### Acceptance Criteria

1. THE AI_Image_Generator SHALL cho phép User chọn kích thước ảnh (1024x1024, 1024x1792, 1792x1024) trước khi tạo
2. THE AI_Image_Generator SHALL hiển thị ước tính chi phí cho mỗi lần tạo ảnh
3. THE AI_Image_Generator SHALL lưu cache Generated_Image với Image_Prompt tương ứng
4. WHEN User tạo ảnh với Image_Prompt đã từng tạo trước đó, THE AI_Image_Generator SHALL hiển thị tùy chọn sử dụng ảnh đã cache
5. THE AI_Image_Generator SHALL ghi log số lần gọi API và tổng chi phí ước tính

### Requirement 11: Hỗ Trợ Nhiều Loại Ảnh

**User Story:** As a User, I want tạo được nhiều loại ảnh khác nhau, so that phù hợp với từng kênh đăng bài

#### Acceptance Criteria

1. THE AI_Image_Generator SHALL cho phép User chọn loại ảnh: "Banner vuông Facebook/Zalo", "Poster dọc TikTok/Reels", "Cover story"
2. WHEN User chọn "Banner vuông Facebook/Zalo", THE AI_Image_Generator SHALL sử dụng kích thước 1200x1200
3. WHEN User chọn "Poster dọc TikTok/Reels", THE AI_Image_Generator SHALL sử dụng kích thước 1080x1920
4. WHEN User chọn "Cover story", THE AI_Image_Generator SHALL sử dụng kích thước 1080x1920
5. THE AI_Image_Generator SHALL tự động điều chỉnh Image_Prompt phù hợp với loại ảnh đã chọn

### Requirement 12: Lưu Metadata Ảnh

**User Story:** As a User, I want hệ thống lưu thông tin về ảnh đã tạo, so that tôi có thể tra cứu lại prompt và thông tin tạo ảnh

#### Acceptance Criteria

1. WHEN Generated_Image được lưu, THE AI_Image_Generator SHALL tạo file `<slug>.json` trong cùng thư mục
2. THE AI_Image_Generator SHALL lưu Image_Prompt gốc vào file JSON
3. THE AI_Image_Generator SHALL lưu Image_Prompt đã bổ sung Brand_Guideline vào file JSON
4. THE AI_Image_Generator SHALL lưu timestamp, kích thước ảnh, và API model đã sử dụng vào file JSON
5. THE AI_Image_Generator SHALL lưu đường dẫn đến Brand_Logo đã sử dụng vào file JSON
