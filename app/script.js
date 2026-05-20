const brand = {
  name: "Trung Tâm Tin Học Sao Việt Biên Hòa",
  address: "91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai",
  phone: "093 11 44 858",
};

const topicPool = [
  "Mẹo Excel cho báo cáo công việc",
  "Tuyển sinh lớp Tin học văn phòng",
  "Cách trình bày văn bản Word chuyên nghiệp",
  "Lớp Excel cho người đi làm tại Biên Hòa",
  "Luyện thi MOS cho sinh viên",
  "AutoCAD cho kỹ thuật và xây dựng",
  "Canva cho thiết kế nội dung cơ bản",
  "AI ứng dụng trong công việc văn phòng",
  "Câu chuyện học viên sau khóa học",
  "Tư vấn lộ trình học tin học phù hợp",
];

function createPost({ course, audience, goal, channel }) {
  const headline = `${course}: học thực hành để dùng được trong công việc`;
  const intro = `Bạn đang cần cải thiện kỹ năng ${course.toLowerCase()} nhưng chưa biết bắt đầu từ đâu? ${brand.name} xây dựng lộ trình học dễ hiểu, tập trung vào thực hành và phù hợp với ${audience}.`;
  const benefits = [
    "Học theo tình huống thực tế, dễ áp dụng ngay",
    "Giảng viên hướng dẫn từng bước, phù hợp cả người mới bắt đầu",
    "Lịch học linh hoạt, đăng ký được tư vấn lộ trình phù hợp",
  ];

  const channelNote = {
    Facebook: "Bài đăng nên dùng đoạn mở đầu ngắn, lợi ích rõ và CTA gọi/inbox.",
    Zalo: "Bài Zalo nên ngắn hơn, tập trung lịch học và số điện thoại.",
    "Website SEO": "Bài SEO nên mở rộng thêm các từ khóa như Biên Hòa, Đồng Nai, học thực hành.",
    "TikTok script": "Kịch bản TikTok nên bắt đầu bằng vấn đề thường gặp trong công việc.",
  }[channel];

  return `Tiêu đề:
${headline}

Nội dung:
${intro}

Khóa học phù hợp nếu bạn muốn:
- ${benefits.join("\n- ")}

Lời kêu gọi:
Liên hệ ${brand.name} để được tư vấn lịch học phù hợp.
Hotline: ${brand.phone}
Địa chỉ: ${brand.address}

Hashtag:
#TinHocSaoViet #TinHocBienHoa #DongNai #${course.replace(/\s+/g, "")}

Ghi chú kênh ${channel}:
${channelNote}

Mục tiêu nội dung: ${goal}.`;
}

function createImagePrompt(course, audience) {
  return `Thiết kế banner vuông cho Facebook về khóa "${course}" của Trung Tâm Tin Học Sao Việt Biên Hòa. Phong cách hiện đại, giáo dục, rõ ràng, có hình ảnh lớp học máy tính hoặc người học đang thực hành trên laptop. Màu chủ đạo xanh dương, trắng, điểm nhấn vàng và xanh lá. Chữ trên ảnh: "${course}", "Học thực hành - ứng dụng ngay", "Hotline: ${brand.phone}". Không dùng quá nhiều chữ, bố cục gọn, dễ đọc trên điện thoại, phù hợp với ${audience}.`;
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  for (let day = 1; day <= 30; day += 1) {
    const topic = topicPool[(day - 1) % topicPool.length];
    const card = document.createElement("article");
    card.className = "day-card";
    card.innerHTML = `<strong>Ngày ${day}</strong><p>${topic}</p>`;
    grid.appendChild(card);
  }
}

function handleGenerate() {
  const course = document.getElementById("course").value;
  const audience = document.getElementById("audience").value;
  const goal = document.getElementById("goal").value;
  const channel = document.getElementById("channel").value;

  document.getElementById("outputTitle").textContent = `Bản nháp cho ${course}`;
  document.getElementById("output").textContent = createPost({
    course,
    audience,
    goal,
    channel,
  });
  document.getElementById("imagePrompt").textContent = createImagePrompt(course, audience);
}

document.getElementById("generateBtn").addEventListener("click", handleGenerate);
renderCalendar();
handleGenerate();
