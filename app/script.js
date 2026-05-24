const brand = {
  name: "Trung Tâm Tin Học Sao Việt Biên Hòa",
  address: "91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai",
  phone: "093 11 44 858",
  slogan: "Chuyên nghiệp - Tận tâm - Học thành nghề",
};

const postTypeNames = {
  enrollment: "Tuyển sinh khóa học",
  tips: "Mẹo kiến thức ngắn",
  story: "Câu chuyện học viên",
  local: "Bài địa phương/SEO",
  promotion: "Ưu đãi - khai giảng",
  video: "Kịch bản video ngắn",
};

const courseInsights = {
  "Excel cho người đi làm": {
    pain: "báo cáo mất nhiều thời gian, công thức hay sai và dữ liệu khó kiểm soát",
    outcome: "xử lý bảng tính nhanh hơn, biết dùng hàm, lọc dữ liệu và trình bày báo cáo rõ ràng",
    tools: "Excel, hàm thông dụng, PivotTable, biểu đồ, định dạng báo cáo",
    visual: "màn hình bảng tính Excel, biểu đồ doanh số, nhân viên văn phòng đang xử lý báo cáo",
    hashtags: ["ExcelChoNguoiDiLam", "HocExcelBienHoa", "ExcelVanPhong"],
  },
  "Tin học văn phòng": {
    pain: "chưa tự tin khi dùng Word, Excel, PowerPoint trong học tập và công việc",
    outcome: "nắm kỹ năng văn phòng nền tảng và biết áp dụng vào tình huống thực tế",
    tools: "Word, Excel, PowerPoint, quản lý file, thao tác máy tính cơ bản",
    visual: "lớp học máy tính sáng sủa, học viên thực hành Word Excel PowerPoint",
    hashtags: ["TinHocVanPhong", "WordExcelPowerPoint", "TinHocBienHoa"],
  },
  "MOS Word Excel PowerPoint": {
    pain: "cần chứng chỉ tin học để hoàn thiện hồ sơ học tập hoặc công việc",
    outcome: "ôn luyện theo lộ trình rõ ràng, làm quen dạng bài và tăng độ tự tin trước kỳ thi",
    tools: "Word, Excel, PowerPoint, bài luyện MOS, kỹ năng làm bài",
    visual: "chứng chỉ, màn hình luyện thi MOS, sinh viên học trên máy tính",
    hashtags: ["LuyenThiMOS", "MOSBienHoa", "ChungChiTinHoc"],
  },
  "AutoCAD 2D 3D": {
    pain: "muốn đọc bản vẽ, dựng hình và thao tác CAD phục vụ học tập hoặc công việc kỹ thuật",
    outcome: "biết dựng bản vẽ 2D, mô hình 3D cơ bản và làm việc theo quy trình kỹ thuật",
    tools: "AutoCAD 2D, AutoCAD 3D, bản vẽ kỹ thuật, layer, layout",
    visual: "bản vẽ kỹ thuật, giao diện AutoCAD, người học thao tác tại workstation",
    hashtags: ["AutoCADBienHoa", "HocAutoCAD", "BanVeKyThuat"],
  },
  "Canva và thiết kế cơ bản": {
    pain: "muốn tự thiết kế bài đăng, poster, slide nhưng chưa biết bố cục và phối màu",
    outcome: "tạo được ấn phẩm gọn, rõ, đẹp và phù hợp cho mạng xã hội hoặc công việc",
    tools: "Canva, bố cục, màu sắc, font chữ, thiết kế bài đăng",
    visual: "giao diện Canva, bảng màu, poster mạng xã hội, người học thiết kế trên laptop",
    hashtags: ["HocCanva", "ThietKeCoBan", "CanvaBienHoa"],
  },
  "AI ứng dụng văn phòng": {
    pain: "nghe nhiều về AI nhưng chưa biết dùng vào việc soạn thảo, báo cáo và lập kế hoạch",
    outcome: "biết dùng AI để viết nháp, tóm tắt, lên ý tưởng và tăng tốc công việc văn phòng",
    tools: "AI, prompt, soạn thảo, tóm tắt, lập kế hoạch, tự động hóa cơ bản",
    visual: "dashboard công việc, trợ lý AI, nhân viên văn phòng dùng laptop",
    hashtags: ["AIUngDung", "AIVanPhong", "HocAIBienHoa"],
  },
  "Tin học trẻ em": {
    pain: "phụ huynh muốn con dùng máy tính đúng cách, an toàn và có định hướng",
    outcome: "con làm quen máy tính, rèn tư duy công nghệ và tự tin hơn khi học tập",
    tools: "máy tính cơ bản, gõ phím, Word, PowerPoint, Internet an toàn",
    visual: "trẻ em học máy tính trong lớp sáng sủa, giáo viên hướng dẫn thân thiện",
    hashtags: ["TinHocTreEm", "KyNangSoChoTre", "HocTinHocChoBe"],
  },
  "Photoshop - Illustrator": {
    pain: "muốn chỉnh ảnh, thiết kế poster và làm sản phẩm đồ họa nhưng chưa biết bắt đầu",
    outcome: "hiểu công cụ nền tảng, biết chỉnh ảnh và thiết kế ấn phẩm theo yêu cầu thực tế",
    tools: "Photoshop, Illustrator, poster, chỉnh ảnh, vector, bố cục",
    visual: "giao diện thiết kế đồ họa, bảng màu, poster, học viên chỉnh ảnh trên máy",
    hashtags: ["HocPhotoshop", "HocIllustrator", "DoHoaBienHoa"],
  },
};

const openings = [
  "Bạn đang muốn cải thiện kỹ năng nhưng chưa biết bắt đầu từ đâu?",
  "Một kỹ năng tin học tốt có thể giúp việc học và công việc nhẹ hơn rất nhiều.",
  "Nếu mỗi lần mở máy tính bạn vẫn thấy lúng túng, đây là lúc nên học lại từ nền tảng.",
  "Không cần học lan man, chỉ cần một lộ trình đúng và nhiều giờ thực hành thật.",
];

const ctas = [
  "Inbox hoặc gọi hotline để được tư vấn lớp phù hợp.",
  "Liên hệ ngay để nhận lịch học gần nhất.",
  "Để lại số điện thoại, Sao Việt sẽ tư vấn lộ trình học phù hợp.",
  "Gọi Sao Việt để được tư vấn khóa học theo mục tiêu của bạn.",
];

const calendarTypes = [
  "Mẹo nhanh",
  "Tuyển sinh",
  "Câu chuyện học viên",
  "Bài địa phương",
  "Video ngắn",
  "Ưu đãi/khai giảng",
];

function getCourse(course) {
  return courseInsights[course] || courseInsights["Tin học văn phòng"];
}

function slugHashtag(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function buildHashtags(course, insight) {
  return ["TinHocSaoViet", "TinHocBienHoa", "DongNai", slugHashtag(course), ...insight.hashtags]
    .filter((tag, index, tags) => tags.indexOf(tag) === index)
    .map((tag) => `#${tag}`)
    .join(" ");
}

function buildContact() {
  return `${brand.name}
Địa chỉ: ${brand.address}
Hotline: ${brand.phone}`;
}

function createEnrollmentPost({ course, audience, goal, channel, variant }) {
  const insight = getCourse(course);
  const opening = openings[variant % openings.length];
  const cta = ctas[variant % ctas.length];

  return `Tiêu đề:
${course}: học thực hành để dùng được ngay

Nội dung:
${opening}

Khóa ${course} tại ${brand.name} phù hợp với ${audience} đang gặp tình trạng ${insight.pain}. Nội dung học tập trung vào thực hành, giáo viên hướng dẫn từng bước và bài tập bám sát nhu cầu thật.

Sau khóa học, học viên có thể:
- ${insight.outcome}
- Thực hành với ${insight.tools}
- Tự tin hơn khi áp dụng vào học tập, công việc hoặc thi chứng chỉ

Lời kêu gọi:
${cta}

${buildContact()}

Hashtag:
${buildHashtags(course, insight)}

Ghi chú kênh ${channel}:
${getChannelNote(channel)}

Mục tiêu nội dung: ${goal}.`;
}

function createTipsPost({ course, audience, goal, channel, variant }) {
  const insight = getCourse(course);
  const tips = [
    `Bắt đầu từ một tình huống thật: chọn việc bạn hay làm nhất rồi học đúng thao tác để giải quyết việc đó.`,
    `Ghi lại 3 lỗi thường gặp khi dùng ${course}, sau đó luyện lại từng lỗi bằng bài tập nhỏ.`,
    `Đừng chỉ xem hướng dẫn. Hãy mở máy và làm lại ngay, vì kỹ năng tin học chỉ chắc khi được thực hành.`,
    `Sau mỗi buổi học, hãy lưu một file mẫu để lần sau dùng lại cho công việc hoặc bài tập.`,
  ];
  const selected = tips.slice(variant % tips.length).concat(tips).slice(0, 3);

  return `Tiêu đề:
3 mẹo học ${course} hiệu quả hơn cho ${audience}

Mở bài:
Nhiều người học tin học bị chậm tiến bộ không phải vì khó, mà vì học quá nhiều lý thuyết và thiếu tình huống thực hành.

Mẹo áp dụng ngay:
1. ${selected[0]}
2. ${selected[1]}
3. ${selected[2]}

Gợi ý thực hành:
Với ${course}, hãy ưu tiên luyện ${insight.tools}. Đây là nhóm kỹ năng giúp giải quyết trực tiếp vấn đề ${insight.pain}.

Kết bài:
Nếu bạn muốn học theo lộ trình dễ hiểu, có người hướng dẫn và được thực hành trên máy, ${brand.name} có thể tư vấn lớp phù hợp.

${buildContact()}

Hashtag:
${buildHashtags(course, insight)}

Ghi chú kênh ${channel}:
${getChannelNote(channel)}

Mục tiêu nội dung: ${goal}.`;
}

function createStoryPost({ course, audience, goal, channel, variant }) {
  const insight = getCourse(course);
  const names = ["một học viên mới", "một bạn sinh viên", "một anh/chị đi làm", "một phụ huynh đăng ký cho con"];
  const character = names[variant % names.length];

  return `Tiêu đề:
Từ lúng túng đến tự tin hơn với ${course}

Câu chuyện:
Ban đầu, ${character} tìm đến ${brand.name} vì ${insight.pain}. Điều khó nhất không phải là thiếu máy tính, mà là không biết nên học phần nào trước và luyện như thế nào cho đúng.

Trong quá trình học, học viên được hướng dẫn theo từng bước nhỏ:
- Làm quen công cụ và thao tác nền tảng
- Thực hành bài tập giống tình huống thật
- Sửa lỗi trực tiếp trong lúc làm
- Tự hoàn thành một sản phẩm hoặc bài tập cuối khóa

Kết quả mong đợi:
Sau lộ trình, học viên có thể ${insight.outcome}. Quan trọng hơn là cảm giác tự tin khi mở máy và bắt tay vào việc.

Lời nhắn:
Nếu bạn cũng đang muốn học ${course} theo cách dễ hiểu, thực hành nhiều và có người kèm từng bước, hãy liên hệ Sao Việt để được tư vấn.

${buildContact()}

Hashtag:
${buildHashtags(course, insight)}

Ghi chú kênh ${channel}:
${getChannelNote(channel)}

Mục tiêu nội dung: ${goal}.`;
}

function createLocalPost({ course, audience, goal, channel }) {
  const insight = getCourse(course);

  return `Tiêu đề SEO:
Học ${course} tại Biên Hòa, Đồng Nai ở đâu thực hành dễ hiểu?

Mô tả ngắn:
Gợi ý khóa ${course} cho ${audience} tại ${brand.name}, phù hợp người cần học thực hành và muốn áp dụng vào công việc, học tập hoặc thi chứng chỉ.

Nội dung:
Nếu bạn đang tìm nơi học ${course} tại Biên Hòa, điều quan trọng không chỉ là học đủ bài mà còn phải được thực hành thường xuyên. Với nhiều học viên, khó khăn lớn nhất là ${insight.pain}.

Tại ${brand.name}, lộ trình học được thiết kế theo hướng dễ hiểu, bám sát nhu cầu thật và có giảng viên hướng dẫn trực tiếp. Học viên được thực hành với ${insight.tools}, từ đó từng bước ${insight.outcome}.

Khóa học phù hợp với:
- ${audience}
- Người mới bắt đầu hoặc cần củng cố nền tảng
- Người muốn học để áp dụng ngay vào học tập, công việc
- Người cần được tư vấn lộ trình rõ ràng trước khi đăng ký

Thông tin liên hệ:
${buildContact()}

Từ khóa gợi ý:
học ${course.toLowerCase()} tại Biên Hòa, học tin học Đồng Nai, trung tâm tin học Biên Hòa, ${course.toLowerCase()} thực hành

Hashtag:
${buildHashtags(course, insight)}

Ghi chú kênh ${channel}:
${getChannelNote(channel)}

Mục tiêu nội dung: ${goal}.`;
}

function createPromotionPost({ course, audience, goal, channel, variant }) {
  const insight = getCourse(course);
  const hooks = [
    "Lịch khai giảng mới đã sẵn sàng.",
    "Bạn đang chờ một lớp học thực hành, dễ hiểu và có người hướng dẫn sát sao?",
    "Đăng ký sớm để được tư vấn lớp phù hợp với thời gian của bạn.",
  ];

  return `Tiêu đề:
Khai giảng lớp ${course} tại Sao Việt Biên Hòa

Nội dung:
${hooks[variant % hooks.length]}

Khóa ${course} phù hợp với ${audience} muốn giải quyết vấn đề ${insight.pain}. Lớp học tập trung vào thực hành, giúp học viên từng bước ${insight.outcome}.

Điểm nổi bật:
- Học trực tiếp trên máy
- Giáo viên hướng dẫn dễ hiểu, theo sát quá trình thực hành
- Nội dung bám sát nhu cầu học tập và công việc
- Được tư vấn lịch học phù hợp trước khi đăng ký

CTA:
Liên hệ ngay để nhận lịch khai giảng và tư vấn lộ trình học ${course}.

${buildContact()}

Hashtag:
${buildHashtags(course, insight)}

Ghi chú kênh ${channel}:
${getChannelNote(channel)}

Mục tiêu nội dung: ${goal}.`;
}

function createVideoScript({ course, audience, goal, channel, variant }) {
  const insight = getCourse(course);
  const hooks = [
    `Bạn học ${course} mãi mà vẫn chưa dùng được vào việc thật?`,
    `3 dấu hiệu cho thấy bạn nên học lại ${course} từ nền tảng.`,
    `Nếu bạn là ${audience}, kỹ năng này có thể giúp bạn tiết kiệm rất nhiều thời gian.`,
  ];

  return `Kịch bản video 30-45 giây:

0-3s - Hook:
"${hooks[variant % hooks.length]}"

4-12s - Nêu vấn đề:
Nhiều người gặp tình trạng ${insight.pain}. Tự học thì dễ bị lan man, xem nhiều nhưng khi làm thật vẫn lúng túng.

13-28s - Giải pháp:
Tại ${brand.name}, khóa ${course} hướng dẫn theo từng bước, học đến đâu thực hành đến đó. Nội dung tập trung vào ${insight.tools}.

29-38s - Kết quả:
Sau khóa học, bạn có thể ${insight.outcome}.

39-45s - CTA:
"Inbox hoặc gọi ${brand.phone} để được tư vấn lớp phù hợp."

Caption đi kèm:
Muốn học ${course} theo cách dễ hiểu và thực hành nhiều? Liên hệ Sao Việt Biên Hòa để được tư vấn lịch học.

${buildContact()}

Hashtag:
${buildHashtags(course, insight)}

Ghi chú kênh ${channel}:
${getChannelNote(channel)}

Mục tiêu nội dung: ${goal}.`;
}

function getChannelNote(channel) {
  return {
    Facebook: "Ưu tiên mở bài có vấn đề rõ, đoạn ngắn, CTA inbox/gọi điện.",
    Zalo: "Rút gọn còn 5-7 dòng, nhấn mạnh lịch học, địa chỉ và hotline.",
    "Website SEO": "Giữ tiêu đề chứa khóa học + Biên Hòa/Đồng Nai, thêm từ khóa phụ tự nhiên.",
    "TikTok script": "Dùng hook mạnh trong 3 giây đầu, câu ngắn, dễ đọc khi dựng video.",
  }[channel];
}

function createPost(input) {
  const templates = {
    enrollment: createEnrollmentPost,
    tips: createTipsPost,
    story: createStoryPost,
    local: createLocalPost,
    promotion: createPromotionPost,
    video: createVideoScript,
  };

  return templates[input.postType](input);
}

function createImagePrompt(course, audience, postType) {
  const insight = getCourse(course);
  const typeLabel = postTypeNames[postType].toLowerCase();

  return `Thiết kế banner vuông cho Facebook/Zalo về "${course}" của ${brand.name}.
Mục đích: ${typeLabel}, phù hợp với ${audience}.
Phong cách: hiện đại, giáo dục, sáng, rõ ràng, dễ đọc trên điện thoại, đúng tinh thần thương hiệu Sao Việt.
Màu sắc: xanh dương, trắng, navy, điểm nhấn vàng/cam.
Visual chính: ${insight.visual}.
Chữ trên ảnh:
"${course}"
"Học thực hành - ứng dụng ngay"
"Hotline: ${brand.phone}"
Logo Sao Việt đặt ở phần đầu hoặc góc trên, không bóp méo logo.
Tránh: quá nhiều chữ, watermark, QR code, bố cục rối, chữ quá nhỏ.`;
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const courses = Object.keys(courseInsights);
  grid.innerHTML = "";

  for (let day = 1; day <= 30; day += 1) {
    const type = calendarTypes[(day - 1) % calendarTypes.length];
    const course = courses[(day - 1) % courses.length];
    const insight = getCourse(course);
    const card = document.createElement("article");
    card.className = "day-card";
    card.innerHTML = `<strong>Ngày ${day}</strong><span>${type}</span><p>${course}: ${insight.outcome}.</p>`;
    grid.appendChild(card);
  }
}

let variantIndex = 0;

function getFormInput() {
  return {
    postType: document.getElementById("postType").value,
    course: document.getElementById("course").value,
    audience: document.getElementById("audience").value,
    goal: document.getElementById("goal").value,
    channel: document.getElementById("channel").value,
    variant: variantIndex,
  };
}

function handleGenerate() {
  const input = getFormInput();

  document.getElementById("outputTitle").textContent = `${postTypeNames[input.postType]} - ${input.course}`;
  document.getElementById("output").textContent = createPost(input);
  document.getElementById("imagePrompt").textContent = createImagePrompt(input.course, input.audience, input.postType);
}

function handleVariant() {
  variantIndex += 1;
  handleGenerate();
}

async function handleCopy() {
  const copyBtn = document.getElementById("copyBtn");
  const text = document.getElementById("output").textContent;

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Đã copy";
    window.setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1200);
  } catch {
    copyBtn.textContent = "Không copy được";
    window.setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1600);
  }
}

document.getElementById("generateBtn").addEventListener("click", handleGenerate);
document.getElementById("variantBtn").addEventListener("click", handleVariant);
document.getElementById("copyBtn").addEventListener("click", handleCopy);
document.querySelectorAll("select").forEach((select) => {
  select.addEventListener("change", () => {
    variantIndex = 0;
    handleGenerate();
  });
});

renderCalendar();
handleGenerate();
