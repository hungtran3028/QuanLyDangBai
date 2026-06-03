const statusLabels = {
  all: "Tất cả",
  missing_metadata: "Thiếu metadata",
  ready_for_review: "Chờ duyệt",
  approved: "Đã duyệt",
  scheduled: "Hẹn giờ",
  publishing: "Đang đăng",
  published: "Đã đăng",
  failed: "Lỗi",
};

let posts = [];
let selectedSlug = null;
let activeStatus = "all";

const els = {
  postList: document.getElementById("postList"),
  detailStatus: document.getElementById("detailStatus"),
  detailTitle: document.getElementById("detailTitle"),
  detailSlug: document.getElementById("detailSlug"),
  emptyDetail: document.getElementById("emptyDetail"),
  postDetail: document.getElementById("postDetail"),
  postImage: document.getElementById("postImage"),
  checksList: document.getElementById("checksList"),
  metadataBtn: document.getElementById("metadataBtn"),
  approveBtn: document.getElementById("approveBtn"),
  publishBtn: document.getElementById("publishBtn"),
  publishAgainBtn: document.getElementById("publishAgainBtn"),
  retryBtn: document.getElementById("retryBtn"),
  scheduleForm: document.getElementById("scheduleForm"),
  scheduleAt: document.getElementById("scheduleAt"),
  scheduledAt: document.getElementById("scheduledAt"),
  publishedAt: document.getElementById("publishedAt"),
  facebookPostId: document.getElementById("facebookPostId"),
  publishError: document.getElementById("publishError"),
  historySection: document.getElementById("historySection"),
  publishHistory: document.getElementById("publishHistory"),
  captionPreview: document.getElementById("captionPreview"),
  copyBtn: document.getElementById("copyBtn"),
  toast: document.getElementById("toast"),
  refreshBtn: document.getElementById("refreshBtn"),
  facebookTitle: document.getElementById("facebookTitle"),
  facebookMeta: document.getElementById("facebookMeta"),
  connectFacebook: document.getElementById("connectFacebook"),
  pageSelect: document.getElementById("pageSelect"),
};

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activeStatus = tab.dataset.status;
    document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
    renderList();
  });
});

els.refreshBtn.addEventListener("click", loadAll);
els.metadataBtn.addEventListener("click", () => runPostAction("metadata"));
els.approveBtn.addEventListener("click", () => runPostAction("approve"));
els.publishBtn.addEventListener("click", () => runPostAction("publish-now"));
els.publishAgainBtn.addEventListener("click", () => runPostAction("publish-again"));
els.retryBtn.addEventListener("click", () => runPostAction("retry"));
els.copyBtn.addEventListener("click", copyCaption);
els.pageSelect.addEventListener("change", selectFacebookPage);

els.scheduleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selectedSlug) return;
  const value = els.scheduleAt.value;
  if (!value) {
    showToast("Chọn thời gian hẹn giờ trước.");
    return;
  }
  await requestJson(`/api/posts/${selectedSlug}/schedule`, {
    method: "POST",
    body: JSON.stringify({ scheduled_at: new Date(value).toISOString() }),
  });
  await loadAll();
  await selectPost(selectedSlug);
  showToast("Đã lưu lịch đăng.");
});

loadAll();

async function loadAll() {
  try {
    const [postResult, facebookResult] = await Promise.all([
      requestJson("/api/posts"),
      requestJson("/api/facebook/status"),
    ]);
    posts = postResult.posts;
    renderList();
    renderFacebook(facebookResult);
    if (selectedSlug && posts.some((post) => post.slug === selectedSlug)) {
      await selectPost(selectedSlug);
    }
  } catch (error) {
    showToast(error.message);
  }
}

function renderFacebook(status) {
  if (!status.configured) {
    els.facebookTitle.textContent = "Chưa cấu hình Meta API";
    els.facebookMeta.textContent = "Điền META_APP_ID và META_APP_SECRET trong .env.";
    els.connectFacebook.classList.add("disabled");
    renderPageOptions([]);
    return;
  }
  els.connectFacebook.classList.remove("disabled");
  if (status.connected) {
    els.facebookTitle.textContent = `Đã kết nối ${status.selected_page_name || status.page_name || "Facebook Page"}`;
    els.facebookMeta.textContent = `${status.pages.length} fanpage khả dụng. Đang chọn Page ID: ${status.selected_page_id || status.page_id}. Cập nhật: ${formatDate(status.updated_at)}.`;
    renderPageOptions(status.pages || []);
  } else {
    els.facebookTitle.textContent = "Chưa kết nối Facebook Page";
    els.facebookMeta.textContent = "Bấm kết nối để lấy danh sách fanpage và Page Access Token.";
    renderPageOptions([]);
  }
}

function renderPageOptions(pages) {
  els.pageSelect.innerHTML = "";
  els.pageSelect.disabled = pages.length === 0;
  if (pages.length === 0) {
    const option = document.createElement("option");
    option.textContent = "Chưa có fanpage";
    els.pageSelect.appendChild(option);
    return;
  }
  pages.forEach((page) => {
    const option = document.createElement("option");
    option.value = page.id;
    option.textContent = `${page.name} (${page.id})`;
    option.selected = Boolean(page.selected);
    els.pageSelect.appendChild(option);
  });
}

function renderList() {
  const visiblePosts = posts.filter((post) => activeStatus === "all" || post.status === activeStatus);
  els.postList.innerHTML = "";

  if (visiblePosts.length === 0) {
    els.postList.innerHTML = `<div class="empty-state">Không có bài trong nhóm ${statusLabels[activeStatus]}.</div>`;
    return;
  }

  visiblePosts.forEach((post) => {
    const failedChecks = post.checks.filter((check) => !check.ok).length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `post-row ${post.slug === selectedSlug ? "selected" : ""}`;
    button.addEventListener("click", () => selectPost(post.slug));
    button.innerHTML = `
      <span class="status-dot ${post.status}"></span>
      <span>
        <strong>${escapeHtml(post.title)}</strong>
        <small>${escapeHtml(post.slug)} · ${statusLabels[post.status] || post.status}</small>
      </span>
      ${failedChecks ? `<em>${failedChecks} lỗi</em>` : "<em>OK</em>"}
    `;
    els.postList.appendChild(button);
  });
}

async function selectPost(slug) {
  selectedSlug = slug;
  renderList();
  const { post } = await requestJson(`/api/posts/${slug}`);

  els.emptyDetail.hidden = true;
  els.postDetail.hidden = false;
  els.detailStatus.textContent = statusLabels[post.status] || post.status;
  els.detailTitle.textContent = post.title;
  els.detailSlug.textContent = post.slug;
  els.postImage.hidden = !post.urls.image;
  if (post.urls.image) els.postImage.src = `${post.urls.image}?v=${Date.now()}`;
  els.captionPreview.textContent = post.caption || "Chưa có caption.";
  els.scheduleAt.value = post.scheduled_at ? toLocalInput(post.scheduled_at) : "";

  els.checksList.innerHTML = "";
  post.checks.forEach((check) => {
    const item = document.createElement("li");
    item.className = check.ok ? "ok" : "bad";
    item.textContent = `${check.ok ? "OK" : "Lỗi"} - ${check.label}`;
    els.checksList.appendChild(item);
  });

  els.metadataBtn.hidden = post.status !== "missing_metadata";
  els.approveBtn.disabled = post.status === "missing_metadata" || post.status === "published";
  els.publishBtn.disabled = post.status !== "approved";
  els.publishAgainBtn.hidden = post.status !== "published";
  els.retryBtn.hidden = post.status !== "failed";
  els.scheduledAt.textContent = post.scheduled_at ? `Hẹn giờ: ${formatDate(post.scheduled_at)}` : "";
  els.publishedAt.textContent = post.published_at ? `Đã đăng: ${formatDate(post.published_at)}` : "";
  els.facebookPostId.textContent = post.facebook_post_id ? `Facebook ID: ${post.facebook_post_id}` : "";
  if (post.facebook_page_name) {
    els.facebookPostId.textContent = `${els.facebookPostId.textContent} · Page: ${post.facebook_page_name}`;
  }
  els.publishError.hidden = !post.publish_error;
  els.publishError.textContent = post.publish_error || "";
  renderPublishHistory(post.metadata.publish_history || []);
}

function renderPublishHistory(history) {
  els.historySection.hidden = history.length === 0;
  els.publishHistory.innerHTML = "";
  history
    .slice()
    .reverse()
    .forEach((entry) => {
      const item = document.createElement("li");
      item.innerHTML = `
        <strong>${escapeHtml(entry.facebook_page_name || entry.facebook_page_id || "Facebook Page")}</strong>
        <span>${formatDate(entry.published_at)} · ${escapeHtml(entry.facebook_post_id || "")}</span>
      `;
      els.publishHistory.appendChild(item);
    });
}

async function selectFacebookPage() {
  const pageId = els.pageSelect.value;
  if (!pageId) return;
  try {
    await requestJson("/api/facebook/select-page", {
      method: "POST",
      body: JSON.stringify({ page_id: pageId }),
    });
    await loadAll();
    showToast("Đã chọn fanpage đăng bài.");
  } catch (error) {
    showToast(error.message);
  }
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
    await selectPost(selectedSlug);
    showToast({
      metadata: "Đã tạo metadata.",
      approve: "Đã duyệt bài.",
      "publish-now": "Đã gửi bài lên Facebook.",
      "publish-again": "Đã đăng bài sang fanpage đang chọn.",
      retry: "Đã đưa bài về trạng thái đã duyệt.",
    }[action]);
  } catch (error) {
    showToast(error.message);
    await selectPost(selectedSlug);
  }
}

async function copyCaption() {
  try {
    await navigator.clipboard.writeText(els.captionPreview.textContent);
    showToast("Đã copy caption.");
  } catch {
    showToast("Không copy được caption.");
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Yêu cầu thất bại.");
  }
  return payload;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.hidden = true;
  }, 2600);
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
