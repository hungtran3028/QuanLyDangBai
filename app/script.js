const statusLabels = {
  all: "Tất cả",
  blockers: "Cần xử lý",
  missing_metadata: "Thiếu metadata",
  ready_for_review: "Chờ duyệt",
  approved: "Đã duyệt",
  scheduled: "Hẹn giờ",
  publishing: "Đang đăng",
  published: "Đã đăng",
  failed: "Lỗi",
};

const viewTitles = {
  dashboard: "Tổng quan vận hành",
  detail: "Chi tiết bài viết",
  history: "Lịch sử đăng",
  media: "Thư viện ảnh",
  prompt: "Gợi ý nội dung AI",
  facebook: "Facebook Page",
};

const viewFiles = {
  dashboard: "/views/dashboard.html",
  detail: "/views/post-detail.html",
  history: "/views/history.html",
  media: "/views/media-library.html",
  prompt: "/views/prompt-helper.html",
  facebook: "/views/facebook.html",
};

let posts = [];
let albums = [];
let selectedSlug = null;
let selectedAlbum = "";
let selectedPostCache = null;
let activeStatus = "all";
let currentView = "dashboard";
let facebookStatus = null;
let aiConfig = null;
let aiModels = [];
let currentAiDraft = null;

const viewRoot = document.getElementById("viewRoot");
const viewTitle = document.getElementById("viewTitle");
const refreshBtn = document.getElementById("refreshBtn");
const topPageSelect = document.getElementById("topPageSelect");
const toast = document.getElementById("toast");

refreshBtn.addEventListener("click", loadAll);
topPageSelect.addEventListener("change", selectFacebookPage);
window.addEventListener("hashchange", route);

loadAll().then(route);

async function route() {
  const { view, slug } = parseRoute();
  currentView = view;
  if (slug) selectedSlug = slug;
  viewTitle.textContent = viewTitles[view] || "Dashboard";
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.view === view);
  });
  viewRoot.innerHTML = await fetch(viewFiles[view] || viewFiles.dashboard).then((response) => response.text());
  mountCurrentView();
  renderCurrentView();
}

function parseRoute() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [name, slug] = raw.split("/");
  if (name === "detail") return { view: "detail", slug };
  if (viewFiles[name]) return { view: name, slug };
  return { view: "dashboard" };
}

async function loadAll() {
  try {
    const [postResult, facebookResult, albumResult] = await Promise.all([
      requestJson("/api/posts"),
      requestJson("/api/facebook/status"),
      requestJson("/api/student-photos/albums"),
    ]);
    posts = postResult.posts || [];
    facebookStatus = facebookResult;
    albums = albumResult.albums || [];
    if (!selectedAlbum && albums.length > 0) selectedAlbum = albums[0].id;
    if (!selectedSlug && posts.length > 0) selectedSlug = posts[0].slug;
    await refreshSelectedPost();
    renderTopFacebook();
    renderCurrentView();
  } catch (error) {
    showToast(error.message);
  }
}

async function refreshSelectedPost() {
  if (!selectedSlug || !posts.some((post) => post.slug === selectedSlug)) {
    selectedPostCache = null;
    return;
  }
  const { post } = await requestJson(`/api/posts/${selectedSlug}`);
  selectedPostCache = post;
}

function mountCurrentView() {
  if (currentView === "dashboard") mountDashboardView();
  if (currentView === "detail") mountDetailView();
  if (currentView === "prompt") mountPromptView();
  if (currentView === "facebook") mountFacebookView();
  if (currentView === "media") mountMediaView();
}

function renderCurrentView() {
  renderTopFacebook();
  if (currentView === "dashboard") renderDashboardView();
  if (currentView === "detail") renderPostDetail();
  if (currentView === "prompt") renderPromptView();
  if (currentView === "facebook") renderFacebookView();
  if (currentView === "media") renderMediaView();
  if (currentView === "history") renderHistoryView();
}

function mountDashboardView() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      activeStatus = tab.dataset.status;
      renderDashboardView();
    });
  });
  document.querySelectorAll(".summary-card").forEach((card) => {
    card.addEventListener("click", () => {
      activeStatus = card.dataset.statusFilter;
      renderDashboardView();
    });
  });
  bind("metadataBtn", "click", () => runPostAction("metadata"));
  bind("approveBtn", "click", () => runPostAction("approve"));
  bind("publishBtn", "click", () => runPostAction("publish-now"));
  bind("publishAgainBtn", "click", () => runPostAction("publish-again"));
  bind("retryBtn", "click", () => runPostAction("retry"));
  bind("copyBtn", "click", copyCaption);
  bind("saveContentBtn", "click", saveContent);
  const search = byId("postSearch");
  if (search) search.addEventListener("input", renderList);
  const scheduleForm = byId("scheduleForm");
  if (scheduleForm) scheduleForm.addEventListener("submit", saveSchedule);
}

function mountDetailView() {
  bind("metadataBtn", "click", () => runPostAction("metadata"));
  bind("approveBtn", "click", () => runPostAction("approve"));
  bind("publishBtn", "click", () => runPostAction("publish-now"));
  bind("publishAgainBtn", "click", () => runPostAction("publish-again"));
  bind("retryBtn", "click", () => runPostAction("retry"));
  bind("copyBtn", "click", copyCaption);
  bind("saveContentBtn", "click", saveContent);
  const scheduleForm = byId("scheduleForm");
  if (scheduleForm) scheduleForm.addEventListener("submit", saveSchedule);
}

function mountPromptView() {
  ["promptTemplate", "promptCourse", "promptAudience", "promptGoal", "promptLength", "promptTone", "promptImageType", "promptStudentPhotos"].forEach((id) => {
    bind(id, "change", updatePromptSuggestion);
  });
  bind("promptNotes", "input", updatePromptSuggestion);
  bind("copyPromptBtn", "click", copyPromptSuggestion);
  bind("aiProvider", "change", () => {
    toggleAiProviderFields();
    renderAiConfigStatus();
  });
  bind("saveAiConfigBtn", "click", saveAiConfig);
  bind("testAiConfigBtn", "click", testAiConfig);
  bind("refreshAiModelsBtn", "click", testAiConfig);
  bind("generateAiDraftBtn", "click", generateAiDraft);
  bind("copyDraftBtn", "click", copyAiDraft);
  bind("applyDraftBtn", "click", applyAiDraft);
  loadAiConfig();
}

function mountFacebookView() {
  bind("pageSelect", "change", selectFacebookPage);
}

function mountMediaView() {
  bind("albumSelect", "change", async () => {
    selectedAlbum = byId("albumSelect").value;
    await renderStudentPhotos();
  });
}

function renderDashboardView() {
  renderSummary();
  renderList();
  renderScheduleList();
  renderPostDetail();
}

function renderSummary() {
  setText("summaryBlockers", posts.filter((post) => hasBlockers(post)).length);
  setText("summaryReady", posts.filter((post) => post.status === "approved" && !hasBlockers(post)).length);
  setText("summaryScheduled", posts.filter((post) => post.status === "scheduled").length);
  setText("summaryPublished", posts.filter((post) => post.status === "published").length);
  document.querySelectorAll(".summary-card").forEach((card) => {
    card.classList.toggle("ring-2", card.dataset.statusFilter === activeStatus);
    card.classList.toggle("ring-primary-container", card.dataset.statusFilter === activeStatus);
  });
  document.querySelectorAll(".tab").forEach((tab) => {
    const active = tab.dataset.status === activeStatus;
    tab.className = active
      ? "tab px-sm py-xs rounded bg-surface-tint text-on-primary font-label-sm text-label-sm whitespace-nowrap"
      : "tab px-sm py-xs rounded bg-surface-container-lowest border border-outline-variant text-on-surface-variant font-label-sm text-label-sm whitespace-nowrap hover:bg-surface-container-high transition-colors";
  });
}

function renderList() {
  const postList = byId("postList");
  if (!postList) return;
  const query = String(byId("postSearch")?.value || "").toLowerCase();
  const visiblePosts = posts.filter((post) => {
    const statusMatch = activeStatus === "all" || (activeStatus === "blockers" ? hasBlockers(post) : post.status === activeStatus);
    const textMatch = !query || `${post.title} ${post.slug}`.toLowerCase().includes(query);
    return statusMatch && textMatch;
  });
  postList.innerHTML = "";
  if (visiblePosts.length === 0) {
    postList.innerHTML = `<div class="text-center border border-dashed border-outline-variant rounded p-md text-on-surface-variant">Không có bài trong nhóm ${statusLabels[activeStatus]}.</div>`;
    return;
  }
  visiblePosts.forEach((post) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = post.slug === selectedSlug
      ? "bg-surface-container-high border border-primary rounded p-sm cursor-pointer hover:bg-surface-container transition-colors relative text-left"
      : "bg-surface-container-lowest border border-outline-variant rounded p-sm cursor-pointer hover:bg-surface-container-low transition-colors text-left";
    button.addEventListener("click", () => selectPost(post.slug));
    const failedChecks = (post.checks || []).filter((check) => !check.ok && !check.ignored).length;
    button.innerHTML = `
      ${post.slug === selectedSlug ? '<div class="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l"></div>' : ""}
      <div class="${post.slug === selectedSlug ? "pl-sm" : ""}">
        <div class="flex justify-between items-start mb-xs">
          <span class="font-label-sm text-label-sm ${post.slug === selectedSlug ? "text-primary" : "text-on-surface-variant"} uppercase">FB Page</span>
          <span class="font-body-sm text-body-sm text-on-surface-variant">${post.scheduled_at ? `Hẹn giờ: ${formatDate(post.scheduled_at)}` : statusLabels[post.status] || post.status}</span>
        </div>
        <h3 class="font-body-md text-body-md ${post.slug === selectedSlug ? "font-semibold" : ""} text-on-surface mb-sm line-clamp-2">${escapeHtml(post.title)}</h3>
        <div class="flex gap-xs flex-wrap">
          ${renderStatusChip(post, failedChecks)}
          <span class="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm border border-outline-variant">${(post.media || []).length || 1} ảnh</span>
        </div>
      </div>
    `;
    postList.appendChild(button);
  });
}

function renderStatusChip(post, failedChecks) {
  if (failedChecks) {
    return `<span class="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-error-container text-error font-label-sm text-label-sm border border-error/30"><span class="material-symbols-outlined text-[14px]">error</span>${failedChecks} chặn</span>`;
  }
  if (post.status === "scheduled") {
    return `<span class="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-[#e0f2fe] text-[#0369a1] font-label-sm text-label-sm border border-[#bae6fd]"><span class="material-symbols-outlined text-[14px]">schedule</span>Hẹn giờ</span>`;
  }
  if (post.status === "missing_metadata") {
    return `<span class="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] font-label-sm text-label-sm border border-[#fcd34d]"><span class="material-symbols-outlined text-[14px]">warning</span>Thiếu Metadata</span>`;
  }
  return `<span class="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-tertiary-fixed text-tertiary font-label-sm text-label-sm border border-tertiary-fixed-dim"><span class="material-symbols-outlined text-[14px]">check_circle</span>${statusLabels[post.status] || post.status}</span>`;
}

function renderScheduleList() {
  const scheduleList = byId("scheduleList");
  if (!scheduleList) return;
  const scheduled = posts
    .filter((post) => post.status === "scheduled" && post.scheduled_at)
    .sort((a, b) => Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at))
    .slice(0, 5);
  scheduleList.innerHTML = "";
  if (scheduled.length === 0) {
    scheduleList.innerHTML = `<div class="text-center border border-dashed border-outline-variant rounded p-sm text-on-surface-variant">Chưa có bài hẹn giờ.</div>`;
    return;
  }
  scheduled.forEach((post) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "bg-surface-container-lowest border border-outline-variant rounded p-sm text-left hover:bg-surface-container-low transition-colors";
    item.addEventListener("click", () => selectPost(post.slug));
    item.innerHTML = `<strong class="block font-body-md text-body-md">${escapeHtml(post.title)}</strong><span class="font-body-sm text-body-sm text-on-surface-variant">${formatDate(post.scheduled_at)}</span>`;
    scheduleList.appendChild(item);
  });
}

async function selectPost(slug) {
  selectedSlug = slug;
  currentAiDraft = null;
  window.history.replaceState(null, "", "#/detail/" + slug);
  await refreshSelectedPost();
  await route();
}

function renderPostDetail() {
  const emptyDetail = byId("emptyDetail");
  const postDetail = byId("postDetail");
  if (!emptyDetail || !postDetail) return;
  if (!selectedPostCache) {
    emptyDetail.hidden = false;
    postDetail.hidden = true;
    setText("detailStatus", "Chưa chọn bài");
    setText("detailTitle", "Chọn một bài để xem chi tiết");
    setText("detailSlug", "");
    return;
  }

  const post = selectedPostCache;
  emptyDetail.hidden = true;
  postDetail.hidden = false;
  setText("detailStatus", statusLabels[post.status] || post.status);
  setText("detailTitle", post.title);
  setText("detailSlug", post.slug);
  setValue("titleEditor", post.title || "");
  setValue("captionEditor", post.caption || "");
  setValue("scheduleAt", post.scheduled_at ? toLocalInput(post.scheduled_at) : "");
  renderMedia(post);
  renderChecks(post);
  renderPublishMeta(post);
  updateActionButtons(post);
}

function renderMedia(post) {
  const grid = byId("mediaGrid");
  if (!grid) return;
  const media = post.metadata?.media || post.media || [];
  setText("mediaCount", `Media (${media.length})`);
  grid.innerHTML = "";
  if (media.length === 0) {
    grid.innerHTML = `<div class="col-span-4 relative aspect-square bg-surface-container rounded border border-dashed border-outline-variant flex items-center justify-center text-outline"><span class="material-symbols-outlined text-[32px]">add</span></div>`;
    return;
  }
  media.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "relative aspect-square bg-surface-variant rounded border border-outline-variant overflow-hidden group";
    card.innerHTML = `
      <img alt="${escapeHtml(item.title || item.id)}" class="w-full h-full object-cover" src="${mediaUrl(item.path)}" />
      <div class="absolute inset-0 bg-inverse-surface/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
        <div class="flex gap-2">
          <button class="w-6 h-6 rounded bg-surface text-on-surface flex items-center justify-center hover:bg-surface-container" type="button" data-action="up" ${index === 0 ? "disabled" : ""}><span class="material-symbols-outlined text-[16px]">arrow_back</span></button>
          <button class="w-6 h-6 rounded bg-surface text-on-surface flex items-center justify-center hover:bg-surface-container" type="button" data-action="down" ${index === media.length - 1 ? "disabled" : ""}><span class="material-symbols-outlined text-[16px]">arrow_forward</span></button>
        </div>
        <button class="w-6 h-6 rounded bg-error-container text-error flex items-center justify-center hover:bg-error hover:text-on-error" type="button" data-action="remove"><span class="material-symbols-outlined text-[16px]">delete</span></button>
      </div>
      <div class="absolute top-1 left-1 w-5 h-5 rounded-full bg-surface text-on-surface font-label-sm text-label-sm flex items-center justify-center border border-outline-variant">${index + 1}</div>
    `;
    card.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => updateMediaOrder(post, index, button.dataset.action)));
    grid.appendChild(card);
  });
  while (grid.children.length < 4) {
    const placeholder = document.createElement("a");
    placeholder.href = "#/media";
    placeholder.className = "relative aspect-square bg-surface-container rounded border border-dashed border-outline-variant flex items-center justify-center cursor-pointer hover:bg-surface-container-high transition-colors";
    placeholder.innerHTML = `<span class="material-symbols-outlined text-outline text-[32px]">add</span>`;
    grid.appendChild(placeholder);
  }
}

function renderChecks(post) {
  const list = byId("checksList");
  if (!list) return;
  list.innerHTML = "";
  (post.checks || []).forEach((check) => {
    const row = document.createElement("div");
    const bad = !check.ok && !check.ignored;
    row.className = bad
      ? "flex items-center justify-between p-xs rounded bg-error-container/30 border border-error-container mt-xs"
      : "flex items-center justify-between p-xs rounded hover:bg-surface-container-low transition-colors";
    row.innerHTML = `
      <div class="flex items-center gap-sm ${bad ? "text-error" : ""}">
        <span class="material-symbols-outlined ${bad ? "" : "text-tertiary-container"} text-[20px]">${bad ? "error" : "check_circle"}</span>
        <span class="font-body-sm text-body-sm">${escapeHtml(check.label)}</span>
      </div>
      ${!check.ok ? `<button class="px-2 py-1 rounded bg-surface-container-lowest border border-outline-variant text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container transition-colors" type="button">${check.ignored ? "Kiểm tra lại" : "Bỏ qua"}</button>` : `<span class="font-label-sm text-label-sm text-on-surface-variant">OK</span>`}
    `;
    const button = row.querySelector("button");
    if (button) button.addEventListener("click", () => toggleIgnoredCheck(check.key, !check.ignored));
    list.appendChild(row);
  });
}

function renderPublishMeta(post) {
  setText("scheduledAt", post.scheduled_at ? `Hẹn giờ: ${formatDate(post.scheduled_at)}` : "");
  setText("publishedAt", post.published_at ? `Đã đăng: ${formatDate(post.published_at)}` : "");
  setText("facebookPostId", post.facebook_post_id ? `Facebook ID: ${post.facebook_post_id}${post.facebook_page_name ? ` · Page: ${post.facebook_page_name}` : ""}` : "");
  const errorBox = byId("publishError");
  if (errorBox) {
    errorBox.hidden = !post.publish_error;
    errorBox.textContent = post.publish_error || "";
  }
  renderPublishHistory(post.metadata?.publish_history || []);
}

function renderPublishHistory(history) {
  const section = byId("historySection");
  const list = byId("publishHistory");
  if (!section || !list) return;
  section.hidden = history.length === 0;
  list.innerHTML = "";
  history.slice().reverse().forEach((entry) => {
    const item = document.createElement("li");
    item.className = "bg-surface-container-low rounded p-sm";
    item.innerHTML = `<strong>${escapeHtml(entry.facebook_page_name || entry.facebook_page_id || "Facebook Page")}</strong><span class="block font-body-sm text-body-sm text-on-surface-variant">${formatDate(entry.published_at)} · ${escapeHtml(entry.facebook_post_id || "")} · ${(entry.media || []).length || 1} ảnh</span>`;
    list.appendChild(item);
  });
}

function updateActionButtons(post) {
  const hasFailedChecks = (post.checks || []).some((check) => !check.ok && !check.ignored);
  const isReady = post.readiness?.ok && !hasFailedChecks;
  const metadataBtn = byId("metadataBtn");
  const approveBtn = byId("approveBtn");
  const publishBtn = byId("publishBtn");
  const publishAgainBtn = byId("publishAgainBtn");
  const retryBtn = byId("retryBtn");
  if (metadataBtn) metadataBtn.hidden = post.status !== "missing_metadata";
  if (approveBtn) approveBtn.disabled = !isReady || post.status === "missing_metadata" || post.status === "published";
  if (publishBtn) publishBtn.disabled = !isReady || post.status !== "approved";
  if (publishAgainBtn) {
    publishAgainBtn.hidden = post.status !== "published";
    publishAgainBtn.disabled = !isReady;
  }
  if (retryBtn) retryBtn.hidden = post.status !== "failed";
}

function renderPromptView() {
  updatePromptSuggestion();
  renderAiConfig();
  renderAiDraft();
}

function renderFacebookView() {
  renderFacebook(facebookStatus || {});
}

function renderMediaView() {
  renderAlbums();
  renderStudentPhotos();
}

function renderHistoryView() {
  const root = byId("historyView");
  if (!root) return;
  if (!selectedPostCache) {
    root.innerHTML = `<div class="text-on-surface-variant">Chọn một bài trong Dashboard để xem lịch sử đăng.</div>`;
    return;
  }
  const history = selectedPostCache.metadata?.publish_history || [];
  if (history.length === 0) {
    root.innerHTML = `<div class="text-on-surface-variant">Bài "${escapeHtml(selectedPostCache.title)}" chưa có lịch sử đăng.</div>`;
    return;
  }
  root.innerHTML = `<ul class="flex flex-col gap-sm">${history.slice().reverse().map((entry) => `<li class="bg-surface-container-low rounded p-sm"><strong>${escapeHtml(entry.facebook_page_name || entry.facebook_page_id || "Facebook Page")}</strong><span class="block text-on-surface-variant">${formatDate(entry.published_at)} · ${escapeHtml(entry.facebook_post_id || "")}</span></li>`).join("")}</ul>`;
}

function renderTopFacebook() {
  const status = facebookStatus || {};
  const connectionStatus = document.getElementById("connectionStatus");
  if (connectionStatus) {
    const label = status.connected ? (status.selected_page_name || status.page_name || "Đã kết nối") : "Chưa kết nối Page";
    connectionStatus.querySelector("span:last-child").textContent = label;
  }
  renderPageOptions(status.pages || [], topPageSelect);
}

function renderFacebook(status) {
  if (!status.configured) {
    setText("facebookTitle", "Chưa cấu hình Meta API");
    setText("facebookMeta", "Điền META_APP_ID và META_APP_SECRET trong .env.");
    byId("connectFacebook")?.classList.add("opacity-60", "pointer-events-none");
    renderPageOptions([], byId("pageSelect"));
    return;
  }
  byId("connectFacebook")?.classList.remove("opacity-60", "pointer-events-none");
  if (status.connected) {
    setText("facebookTitle", `Đã kết nối ${status.selected_page_name || status.page_name || "Facebook Page"}`);
    setText("facebookMeta", `${status.pages.length} fanpage khả dụng. Đang chọn Page ID: ${status.selected_page_id || status.page_id}. Cập nhật: ${formatDate(status.updated_at)}.`);
    renderPageOptions(status.pages || [], byId("pageSelect"));
  } else {
    setText("facebookTitle", "Chưa kết nối Facebook Page");
    setText("facebookMeta", "Bấm kết nối để lấy danh sách fanpage và Page Access Token.");
    renderPageOptions([], byId("pageSelect"));
  }
}

function renderPageOptions(pages, select) {
  if (!select) return;
  select.innerHTML = "";
  select.disabled = pages.length === 0;
  if (pages.length === 0) {
    const option = document.createElement("option");
    option.textContent = "Chọn fanpage";
    select.appendChild(option);
    return;
  }
  pages.forEach((page) => {
    const option = document.createElement("option");
    option.value = page.id;
    option.textContent = page.name;
    option.selected = Boolean(page.selected);
    select.appendChild(option);
  });
}

function renderAlbums() {
  const albumSelect = byId("albumSelect");
  if (!albumSelect) return;
  albumSelect.innerHTML = "";
  if (albums.length === 0) {
    albumSelect.innerHTML = `<option value="">Chưa có album</option>`;
    albumSelect.disabled = true;
    return;
  }
  albumSelect.disabled = false;
  albums.forEach((album) => {
    const option = document.createElement("option");
    option.value = album.id;
    option.textContent = `${album.title} (${album.photo_count})`;
    option.selected = album.id === selectedAlbum;
    albumSelect.appendChild(option);
  });
}

async function renderStudentPhotos() {
  const grid = byId("studentPhotoGrid");
  if (!grid) return;
  if (!selectedAlbum) {
    grid.innerHTML = `<div class="col-span-full text-center border border-dashed border-outline-variant rounded p-md text-on-surface-variant">Chưa có album ảnh học viên.</div>`;
    return;
  }
  const { photos } = await requestJson(`/api/student-photos/albums/${selectedAlbum}/photos`);
  if (!photos.length) {
    grid.innerHTML = `<div class="col-span-full text-center border border-dashed border-outline-variant rounded p-md text-on-surface-variant">Album này chưa có ảnh.</div>`;
    return;
  }
  grid.innerHTML = "";
  photos.forEach((photo) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bg-surface-container-lowest border border-outline-variant rounded p-xs text-left hover:bg-surface-container-low transition-colors disabled:opacity-60";
    button.disabled = !selectedSlug;
    button.title = selectedSlug ? "Thêm vào bộ ảnh" : "Chọn bài viết trước";
    button.innerHTML = `<img src="${photo.url}" alt="${escapeHtml(photo.title)}" class="w-full aspect-square object-cover rounded mb-xs" /><span class="font-label-sm text-label-sm text-on-surface">${escapeHtml(photo.title)}</span>`;
    button.addEventListener("click", () => addStudentPhoto(photo));
    grid.appendChild(button);
  });
}

async function saveSchedule(event) {
  event.preventDefault();
  if (!selectedSlug) return;
  const value = byId("scheduleAt")?.value;
  if (!value) {
    showToast("Chọn thời gian hẹn giờ trước.");
    return;
  }
  await requestJson(`/api/posts/${selectedSlug}/schedule`, {
    method: "POST",
    body: JSON.stringify({ scheduled_at: new Date(value).toISOString() }),
  });
  await loadAll();
  showToast("Đã lưu lịch đăng.");
}

async function addStudentPhoto(photo) {
  if (!selectedSlug) return;
  const { post } = await requestJson(`/api/posts/${selectedSlug}`);
  const media = [...(post.metadata.media || [])];
  if (media.some((item) => item.path === photo.path)) {
    showToast("Ảnh này đã có trong bộ ảnh.");
    return;
  }
  media.push({
    id: photo.id,
    type: "student_photo",
    path: photo.path,
    album: photo.album,
    role: media.length === 0 ? "cover" : "slide",
    order: media.length + 1,
    title: photo.title,
  });
  await saveMedia(media);
  showToast("Đã thêm ảnh học viên vào bộ ảnh.");
}

async function updateMediaOrder(post, index, action) {
  const media = [...(post.metadata.media || [])];
  if (action === "remove") media.splice(index, 1);
  if (action === "up" && index > 0) [media[index - 1], media[index]] = [media[index], media[index - 1]];
  if (action === "down" && index < media.length - 1) [media[index + 1], media[index]] = [media[index], media[index + 1]];
  await saveMedia(media.map((item, itemIndex) => ({ ...item, order: itemIndex + 1, role: itemIndex === 0 ? "cover" : "slide" })));
}

async function saveMedia(media) {
  await requestJson(`/api/posts/${selectedSlug}/media`, {
    method: "PATCH",
    body: JSON.stringify({ media }),
  });
  await loadAll();
}

async function saveContent() {
  if (!selectedSlug) return;
  await requestJson(`/api/posts/${selectedSlug}/content`, {
    method: "PATCH",
    body: JSON.stringify({
      title: byId("titleEditor").value,
      caption: byId("captionEditor").value,
    }),
  });
  await loadAll();
  showToast("Đã lưu nội dung bài viết.");
}

async function toggleIgnoredCheck(checkKey, ignored) {
  if (!selectedSlug) return;
  await requestJson(`/api/posts/${selectedSlug}/checks/${encodeURIComponent(checkKey)}`, {
    method: "PATCH",
    body: JSON.stringify({ ignored }),
  });
  await loadAll();
  showToast(ignored ? "Đã bỏ qua lỗi này." : "Đã bật kiểm tra lại.");
}

async function runPostAction(action) {
  if (!selectedSlug) return;
  const endpoint = {
    metadata: "metadata",
    approve: "approve",
    "publish-now": "publish-now",
    "publish-again": "publish-again",
    retry: "retry",
  }[action];
  try {
    await requestJson(`/api/posts/${selectedSlug}/${endpoint}`, { method: "POST" });
    await loadAll();
    showToast({
      metadata: "Đã tạo metadata.",
      approve: "Đã duyệt bài.",
      "publish-now": "Đã gửi bài lên Facebook.",
      "publish-again": "Đã đăng bài sang fanpage đang chọn.",
      retry: "Đã đưa bài về trạng thái đã duyệt.",
    }[action]);
  } catch (error) {
    showToast(error.message);
    await refreshSelectedPost();
    renderCurrentView();
  }
}

async function selectFacebookPage() {
  const pageId = (byId("pageSelect") || topPageSelect)?.value;
  if (!pageId) return;
  await requestJson("/api/facebook/select-page", {
    method: "POST",
    body: JSON.stringify({ page_id: pageId }),
  });
  await loadAll();
  showToast("Đã chọn fanpage đăng bài.");
}

async function copyCaption() {
  try {
    await navigator.clipboard.writeText(byId("captionEditor")?.value || "");
    showToast("Đã copy caption.");
  } catch {
    showToast("Không copy được caption.");
  }
}

async function copyPromptSuggestion() {
  try {
    await navigator.clipboard.writeText(byId("promptSuggestion")?.value || "");
    showToast("Đã copy prompt cho chatbox.");
  } catch {
    showToast("Không copy được prompt.");
  }
}

function updatePromptSuggestion() {
  const output = byId("promptSuggestion");
  if (!output) return;
  const post = selectedPostCache || { title: "bài viết mới", slug: "ten-bai-viet", caption: "", checks: [], media: [] };
  output.value = buildPromptSuggestion(byId("promptTemplate")?.value || "new-post", post, getPromptOptions());
}

function getPromptOptions() {
  return {
    course: byId("promptCourse")?.value === "auto" ? "" : byId("promptCourse")?.value,
    audience: byId("promptAudience")?.value,
    goal: byId("promptGoal")?.value,
    length: byId("promptLength")?.value,
    tone: byId("promptTone")?.value,
    imageType: byId("promptImageType")?.value,
    studentPhotos: byId("promptStudentPhotos")?.value,
    notes: (byId("promptNotes")?.value || "").trim(),
  };
}

function buildPromptSuggestion(type, post, options = {}) {
  const title = String(post.title || "").trim() || "bài viết mới";
  const slug = String(post.slug || "").trim() || "ten-bai-viet";
  const caption = String(post.caption || "").trim();
  const topic = options.course || title;
  const failedChecks = (post.checks || [])
    .filter((check) => !check.ok && !check.ignored)
    .map((check) => `- ${check.label}`)
    .join("\n") || "- Không có lỗi đang chặn.";
  const typeInstruction = getPromptTypeInstruction(type);

  if (type === "fix-publish") {
    return [
      `Hãy giúp tôi sửa bài "${title}" để có thể đăng Facebook/Zalo.`,
      "",
      "Các lỗi/check hiện tại:",
      failedChecks,
      "",
      "Nội dung hiện tại:",
      caption || "(chưa có nội dung)",
      "",
      "Yêu cầu: sửa caption rõ ràng, đúng thương hiệu, giữ địa chỉ và hotline.",
    ].join("\n");
  }

  return [
    "Đóng vai một chuyên gia Content Marketing giáo dục tại Trung Tâm Tin Học Sao Việt.",
    "",
    `Hãy tạo một bài đăng Facebook/Zalo hoàn chỉnh cho chủ đề: "${topic}".`,
    "",
    "Thông số:",
    `- Kiểu bài: ${typeInstruction.label}`,
    `- Đối tượng: ${options.audience || "người học tại Biên Hòa, Đồng Nai"}`,
    `- Mục tiêu: ${options.goal || "tư vấn đăng ký học và nhắn tin để được xếp lớp"}`,
    `- Độ dài: ${options.length || "vừa đủ, dễ đọc trên Facebook/Zalo"}`,
    `- Giọng văn: ${options.tone || "thân thiện, rõ ràng, chuyên nghiệp"}`,
    `- Hình ảnh: ${options.imageType || "banner vuông Facebook/Zalo 1200x1200"}`,
    `- Ảnh học viên: ${options.studentPhotos || "có thể dùng ảnh học viên thật trong album nếu phù hợp"}`,
    options.notes ? `- Ghi chú thêm: ${options.notes}` : "",
    "",
    typeInstruction.detail,
    "",
    "Thông tin bắt buộc:",
    "- Trung Tâm Tin Học Sao Việt Biên Hòa",
    "- Địa chỉ: 91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai",
    "- Hotline: 093 11 44 858",
    "- Slogan: Chuyên nghiệp - Tận tâm - Học thành nghề",
    "",
    "Yêu cầu lưu file:",
    `- Lưu bài trong outputs/bai-viet/${slug}/`,
    `- Ảnh chính đặt theo slug: ${slug}.png`,
    `- Copy ảnh cuối vào outputs/images/${slug}.png`,
    "",
    caption ? `Nội dung tham khảo hiện tại:\n${caption}` : "",
  ].filter(Boolean).join("\n");
}

function getPromptTypeInstruction(type) {
  return {
    "new-post": { label: "Bài đầy đủ: caption + ảnh", detail: "Viết caption, hashtag, chữ ngắn cho banner và prompt tạo ảnh AI." },
    enrollment: { label: "Tuyển sinh/chiêu sinh", detail: "Tập trung vào lợi ích khóa học, ai nên học, học được gì, lịch tư vấn và lời mời nhắn tin đăng ký." },
    opening: { label: "Khai giảng/lịch học", detail: "Tập trung vào lịch khai giảng, đối tượng phù hợp, nội dung học chính, cách liên hệ giữ chỗ." },
    tips: { label: "Mẹo học tập/thủ thuật", detail: "Chia sẻ giá trị trước: nêu mẹo cụ thể, ví dụ dễ hiểu, cuối bài mời học thêm tại trung tâm." },
    "student-work": { label: "Học viên/thành quả lớp học", detail: "Tập trung vào không khí lớp học, quá trình thực hành, sự tiến bộ của học viên." },
    promo: { label: "Ưu đãi/thông báo", detail: "Viết như thông báo rõ ràng, không tự bịa giảm giá hay cam kết." },
    "revise-caption": { label: "Sửa lại nội dung bài", detail: "Giữ ý chính, làm câu chữ mượt hơn và phù hợp Facebook/Zalo." },
    "image-prompt": { label: "Chỉ tạo prompt hình ảnh", detail: "Chỉ tập trung tạo prompt ảnh AI đúng thương hiệu." },
    "fix-publish": { label: "Sửa lỗi trước khi đăng", detail: "Ưu tiên sửa lỗi/check đang chặn." },
  }[type] || { label: "Bài đầy đủ: caption + ảnh", detail: "Viết caption, hashtag, chữ ngắn cho banner và prompt tạo ảnh AI." };
}

async function loadAiConfig() {
  try {
    const result = await requestJson("/api/ai/config");
    aiConfig = result.config || null;
    aiModels = [];
    renderAiConfig();
  } catch (error) {
    setText("aiConfigStatus", error.message);
  }
}

function renderAiConfig() {
  if (!byId("aiProvider")) return;
  if (!aiConfig) {
    setText("aiConfigStatus", "Chưa tải cấu hình AI.");
    toggleAiProviderFields();
    renderAiDraft();
    return;
  }
  const provider = byId("aiProvider");
  const apiKey = byId("aiApiKey");
  const baseUrl = byId("aiBaseUrl");
  const endpointStyle = byId("aiEndpointStyle");
  const model = byId("aiModel");
  if (!provider.dataset.loaded) {
    provider.value = aiConfig.provider || "gemini";
    if (apiKey) apiKey.placeholder = aiConfig.api_key_masked ? `Đã lưu ${aiConfig.api_key_masked}` : "Nhập key để lưu hoặc đổi key";
    if (baseUrl) baseUrl.value = aiConfig.base_url || "";
    if (endpointStyle) endpointStyle.value = aiConfig.endpoint_style || "openai";
    if (model) model.value = aiConfig.model || "";
    provider.dataset.loaded = "true";
  }
  renderAiConfigStatus();
  renderAiModelOptions();
  toggleAiProviderFields();
  renderAiDraft();
}

function renderAiConfigStatus(message) {
  const status = byId("aiConfigStatus");
  if (!status) return;
  if (message) {
    status.textContent = message;
    return;
  }
  const provider = byId("aiProvider")?.value || aiConfig?.provider || "gemini";
  const savedKey = aiConfig?.api_key_masked ? `Key ${aiConfig.api_key_masked}` : "Chưa lưu key";
  const model = byId("aiModel")?.value || aiConfig?.model || "chưa chọn model";
  status.textContent = `${provider === "gemini" ? "Gemini" : "Custom Provider"} · ${savedKey} · ${model}`;
}

function toggleAiProviderFields() {
  const provider = byId("aiProvider")?.value || "gemini";
  document.querySelectorAll(".custom-ai-field").forEach((field) => {
    field.hidden = provider === "gemini";
  });
  const endpointStyle = byId("aiEndpointStyle");
  if (endpointStyle && provider === "gemini") endpointStyle.value = "gemini";
  const baseUrl = byId("aiBaseUrl");
  if (baseUrl && provider === "gemini" && !baseUrl.value) {
    baseUrl.value = "https://generativelanguage.googleapis.com/v1beta";
  }
}

function getAiFormConfig() {
  const provider = byId("aiProvider")?.value || "gemini";
  return {
    provider,
    api_key: byId("aiApiKey")?.value.trim() || "",
    base_url: byId("aiBaseUrl")?.value.trim() || (provider === "gemini" ? "https://generativelanguage.googleapis.com/v1beta" : ""),
    endpoint_style: provider === "gemini" ? "gemini" : (byId("aiEndpointStyle")?.value || "openai"),
    model: byId("aiModel")?.value.trim() || "",
  };
}

async function saveAiConfig() {
  const button = byId("saveAiConfigBtn");
  setButtonBusy(button, true);
  try {
    const result = await requestJson("/api/ai/config", {
      method: "POST",
      body: JSON.stringify(getAiFormConfig()),
    });
    aiConfig = result.config;
    const apiKey = byId("aiApiKey");
    if (apiKey) {
      apiKey.value = "";
      apiKey.placeholder = aiConfig.api_key_masked ? `Đã lưu ${aiConfig.api_key_masked}` : "Nhập key để lưu hoặc đổi key";
    }
    renderAiConfigStatus("Đã lưu cấu hình AI vào .env.");
    showToast("Đã lưu cấu hình AI vào .env.");
  } catch (error) {
    renderAiConfigStatus(error.message);
    showToast(error.message);
  } finally {
    setButtonBusy(button, false);
  }
}

async function testAiConfig() {
  const button = byId("testAiConfigBtn");
  setButtonBusy(button, true);
  try {
    const result = await requestJson("/api/ai/test", {
      method: "POST",
      body: JSON.stringify(getAiFormConfig()),
    });
    aiModels = result.models || [];
    aiConfig = result.config || aiConfig;
    if (!byId("aiModel")?.value && result.model) setValue("aiModel", result.model);
    renderAiModelOptions();
    renderAiConfigStatus(`Kết nối OK · Dò được ${aiModels.length} model.`);
    showToast("Kết nối AI OK.");
  } catch (error) {
    renderAiConfigStatus(error.message);
    showToast(error.message);
  } finally {
    setButtonBusy(button, false);
  }
}

function renderAiModelOptions() {
  const list = byId("aiModelList");
  if (!list) return;
  list.innerHTML = "";
  aiModels.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.label = item.label || item.id;
    list.appendChild(option);
  });
}

async function generateAiDraft() {
  const button = byId("generateAiDraftBtn");
  setButtonBusy(button, true);
  try {
    const payload = {
      slug: selectedSlug,
      template: byId("promptTemplate")?.value || "new-post",
      options: getPromptOptions(),
      prompt: byId("promptSuggestion")?.value || "",
    };
    const result = await requestJson("/api/ai/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    currentAiDraft = result.draft;
    if (result.post) selectedPostCache = result.post;
    renderAiDraft();
    showToast("Đã tạo draft AI.");
  } catch (error) {
    showToast(error.message);
  } finally {
    setButtonBusy(button, false);
  }
}

function renderAiDraft() {
  const activeDraft = currentAiDraft && (!currentAiDraft.source_slug || currentAiDraft.source_slug === selectedSlug)
    ? currentAiDraft
    : null;
  const draft = activeDraft || selectedPostCache?.metadata?.ai_drafts?.slice(-1)?.[0] || null;
  if (!byId("aiDraftTitle")) return;
  setValue("aiDraftTitle", draft?.title || "");
  setValue("aiDraftCaption", draft?.caption || "");
  setValue("aiDraftImagePrompt", draft?.image_prompt || "");
  setValue("aiDraftHashtags", (draft?.hashtags || []).join(" "));
  const hasDraft = Boolean(draft);
  const copyButton = byId("copyDraftBtn");
  const applyButton = byId("applyDraftBtn");
  if (copyButton) copyButton.disabled = !hasDraft;
  if (applyButton) applyButton.disabled = !hasDraft || !selectedSlug || Boolean(draft?.applied_at);
}

async function copyAiDraft() {
  const draft = currentAiDraft || selectedPostCache?.metadata?.ai_drafts?.slice(-1)?.[0];
  if (!draft) return;
  try {
    await navigator.clipboard.writeText([
      draft.title,
      "",
      draft.caption,
      "",
      "Prompt hình ảnh:",
      draft.image_prompt,
      "",
      (draft.hashtags || []).join(" "),
    ].join("\n"));
    showToast("Đã copy draft AI.");
  } catch {
    showToast("Không copy được draft AI.");
  }
}

async function applyAiDraft() {
  const draft = currentAiDraft || selectedPostCache?.metadata?.ai_drafts?.slice(-1)?.[0];
  if (!selectedSlug || !draft) return;
  await requestJson(`/api/posts/${selectedSlug}/ai-drafts/${encodeURIComponent(draft.id)}/apply`, { method: "POST" });
  currentAiDraft = null;
  await loadAll();
  showToast("Đã áp dụng draft vào bài viết.");
}

function setButtonBusy(button, busy) {
  if (!button) return;
  button.disabled = busy;
  button.classList.toggle("opacity-60", busy);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Yêu cầu thất bại.");
  return payload;
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function byId(id) {
  return document.getElementById(id);
}

function bind(id, event, handler) {
  const element = byId(id);
  if (element) element.addEventListener(event, handler);
}

function setText(id, value) {
  const element = byId(id);
  if (element) element.textContent = String(value || "");
}

function setValue(id, value) {
  const element = byId(id);
  if (element) element.value = value;
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toLocalInput(value) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]
  ));
}

function hasBlockers(post) {
  return post.status === "missing_metadata" || post.status === "failed" || (post.checks || []).some((check) => !check.ok && !check.ignored);
}

function mediaUrl(mediaPath) {
  if (!mediaPath) return "";
  if (mediaPath.startsWith("outputs/")) return `/${mediaPath}`;
  if (mediaPath.startsWith("assets/student-photos/")) return `/${mediaPath}`;
  return mediaPath;
}
