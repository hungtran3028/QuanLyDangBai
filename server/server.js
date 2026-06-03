const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");

const express = require("express");

const ROOT_DIR = path.resolve(__dirname, "..");
const APP_DIR = path.join(ROOT_DIR, "app");
const POSTS_DIR = path.join(ROOT_DIR, "outputs", "bai-viet");
const IMAGES_DIR = path.join(ROOT_DIR, "outputs", "images");
const DATA_DIR = path.join(ROOT_DIR, ".data");
const FACEBOOK_STATE_FILE = path.join(DATA_DIR, "facebook-connection.json");
const FACEBOOK_OAUTH_STATE_FILE = path.join(DATA_DIR, "facebook-oauth-state.json");

const BRAND = {
  address: "91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai",
  phone: "093 11 44 858",
};

const STATUSES = new Set([
  "ready_for_review",
  "missing_metadata",
  "approved",
  "scheduled",
  "publishing",
  "published",
  "failed",
]);

loadEnvFile();

const app = express();
const port = Number(process.env.PORT || 3000);
const schedulerMs = 60 * 1000;
let schedulerRunning = false;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(APP_DIR));
app.use("/outputs", express.static(path.join(ROOT_DIR, "outputs")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/posts", async (_req, res) => {
  try {
    res.json({ posts: await listPosts() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/posts/:slug", async (req, res) => {
  try {
    const post = await readPost(req.params.slug);
    if (!post) {
      res.status(404).json({ error: "Khong tim thay bai viet." });
      return;
    }
    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/posts/:slug/metadata", async (req, res) => {
  try {
    const post = await ensureMetadata(req.params.slug);
    res.json({ post });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.patch("/api/posts/:slug", async (req, res) => {
  try {
    const { status, scheduled_at } = req.body || {};
    const post = await readPost(req.params.slug);
    if (!post) {
      res.status(404).json({ error: "Khong tim thay bai viet." });
      return;
    }
    if (post.status === "missing_metadata") {
      res.status(400).json({ error: "Bai viet chua co post.json. Hay tao metadata truoc." });
      return;
    }

    const next = { ...post.metadata };
    if (status !== undefined) {
      if (!STATUSES.has(status) || status === "missing_metadata" || status === "publishing") {
        res.status(400).json({ error: "Trang thai khong hop le." });
        return;
      }
      next.status = status;
    }
    if (scheduled_at !== undefined) {
      next.scheduled_at = scheduled_at || null;
      if (next.scheduled_at && Number.isNaN(Date.parse(next.scheduled_at))) {
        res.status(400).json({ error: "Thoi gian hen gio khong hop le." });
        return;
      }
    }
    next.updated_at = new Date().toISOString();
    await writeMetadata(req.params.slug, next);
    res.json({ post: await readPost(req.params.slug) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/posts/:slug/approve", async (req, res) => {
  try {
    const post = await requirePublishableCandidate(req.params.slug, { allowApproved: false });
    const next = {
      ...post.metadata,
      status: "approved",
      publish_error: null,
      updated_at: new Date().toISOString(),
    };
    await writeMetadata(req.params.slug, next);
    res.json({ post: await readPost(req.params.slug) });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, checks: error.checks });
  }
});

app.post("/api/posts/:slug/schedule", async (req, res) => {
  try {
    const post = await requirePublishableCandidate(req.params.slug, { allowApproved: true });
    const scheduledAt = req.body?.scheduled_at;
    if (!scheduledAt || Number.isNaN(Date.parse(scheduledAt))) {
      res.status(400).json({ error: "Can scheduled_at hop le." });
      return;
    }
    const next = {
      ...post.metadata,
      status: "scheduled",
      scheduled_at: scheduledAt,
      publish_error: null,
      updated_at: new Date().toISOString(),
    };
    await writeMetadata(req.params.slug, next);
    res.json({ post: await readPost(req.params.slug) });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, checks: error.checks });
  }
});

app.post("/api/posts/:slug/publish-now", async (req, res) => {
  try {
    const result = await publishPost(req.params.slug, { requireApproved: true, allowPublished: false });
    res.json({ post: result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, checks: error.checks });
  }
});

app.post("/api/posts/:slug/publish-again", async (req, res) => {
  try {
    const result = await publishPost(req.params.slug, { requireApproved: true, allowPublished: true });
    res.json({ post: result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, checks: error.checks });
  }
});

app.post("/api/posts/:slug/retry", async (req, res) => {
  try {
    const post = await readPost(req.params.slug);
    if (!post || post.status !== "failed") {
      res.status(400).json({ error: "Chi bai loi moi duoc dang lai." });
      return;
    }
    const next = { ...post.metadata, status: "approved", publish_error: null, updated_at: new Date().toISOString() };
    await writeMetadata(req.params.slug, next);
    res.json({ post: await readPost(req.params.slug) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/facebook/status", async (_req, res) => {
  try {
    const connection = await readFacebookConnection();
    const selectedPage = getSelectedPage(connection);
    res.json({
      configured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
      connected: Boolean(connection?.pages?.length || connection?.encrypted_page_token),
      selected_page_id: selectedPage?.id || null,
      selected_page_name: selectedPage?.name || null,
      page_id: selectedPage?.id || process.env.FACEBOOK_PAGE_ID || null,
      page_name: selectedPage?.name || connection?.page_name || null,
      pages: getSafePages(connection),
      updated_at: connection?.updated_at || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/facebook/select-page", async (req, res) => {
  try {
    const pageId = String(req.body?.page_id || "");
    const connection = await readFacebookConnection();
    const pages = getStoredPages(connection);
    const page = pages.find((item) => item.id === pageId);
    if (!page) {
      res.status(404).json({ error: "Khong tim thay fanpage trong ket noi hien tai." });
      return;
    }
    const next = {
      ...connection,
      selected_page_id: page.id,
      page_id: page.id,
      page_name: page.name,
      updated_at: new Date().toISOString(),
    };
    await writeFacebookConnection(next);
    res.json({
      selected_page_id: page.id,
      selected_page_name: page.name,
      pages: getSafePages(next),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/facebook/connect", async (req, res) => {
  const required = ["META_APP_ID", "META_APP_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    res.status(400).send(`Thieu cau hinh: ${missing.join(", ")}`);
    return;
  }

  const state = crypto.randomBytes(16).toString("hex");
  await writeOAuthState(state);
  const redirectUri = getFacebookRedirectUri(req);
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: redirectUri,
    state,
  });
  if (process.env.META_LOGIN_CONFIG_ID) {
    params.set("config_id", process.env.META_LOGIN_CONFIG_ID);
  } else {
    params.set("scope", getFacebookScopes());
  }
  res.redirect(`https://www.facebook.com/${getMetaVersion()}/dialog/oauth?${params.toString()}`);
});

app.get("/api/facebook/callback", async (req, res) => {
  try {
    if (!req.query.code) {
      res.status(400).send("Facebook OAuth callback thieu code.");
      return;
    }
    const expectedState = await readOAuthState();
    if (!req.query.state || req.query.state !== expectedState) {
      res.status(400).send("Facebook OAuth state khong hop le.");
      return;
    }
    const redirectUri = getFacebookRedirectUri(req);
    const shortToken = await exchangeCodeForUserToken(req.query.code, redirectUri);
    const longToken = await exchangeForLongLivedUserToken(shortToken);
    const pages = await resolvePageTokens(longToken);
    const selectedPage = pickSelectedPage(pages);
    await writeFacebookConnection({
      selected_page_id: selectedPage.id,
      page_id: selectedPage.id,
      page_name: selectedPage.name,
      pages: pages.map((page) => ({
        id: page.id,
        name: page.name,
        encrypted_page_token: encryptSecret(page.access_token),
      })),
      updated_at: new Date().toISOString(),
    });
    res.redirect("/?facebook=connected");
  } catch (error) {
    res.status(500).send(`Ket noi Facebook that bai: ${escapeHtml(error.message)}`);
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(APP_DIR, "index.html"));
});

app.listen(port, () => {
  console.log(`Content Studio Sao Viet dang chay tai http://localhost:${port}`);
});

setInterval(runScheduler, schedulerMs);
runScheduler().catch((error) => console.error("Scheduler loi:", error.message));

function loadEnvFile() {
  const envPath = path.join(ROOT_DIR, ".env");
  if (!fsSync.existsSync(envPath)) return;
  const content = fsSync.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const rawValue = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) {
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}

async function listPosts() {
  await fs.mkdir(POSTS_DIR, { recursive: true });
  const entries = await fs.readdir(POSTS_DIR, { withFileTypes: true });
  const posts = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const post = await readPost(entry.name);
    if (post) posts.push(toPostSummary(post));
  }
  return posts.sort((a, b) => (b.updated_at || b.created_at || "").localeCompare(a.updated_at || a.created_at || ""));
}

async function readPost(slug) {
  if (!isSafeSlug(slug)) return null;
  const dir = path.join(POSTS_DIR, slug);
  if (!(await exists(dir))) return null;
  const mdPath = path.join(dir, "bai-viet.md");
  const markdown = (await exists(mdPath)) ? await fs.readFile(mdPath, "utf8") : "";
  const imagePath = await findPostImage(slug, dir);
  const archiveImagePath = path.join(IMAGES_DIR, `${slug}.png`);
  const metadataPath = path.join(dir, "post.json");
  const hasMetadata = await exists(metadataPath);
  let metadata = null;

  if (hasMetadata) {
    metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
  } else {
    metadata = buildDefaultMetadata(slug, markdown, imagePath, archiveImagePath, "missing_metadata");
  }

  const normalized = normalizeMetadata(slug, metadata, markdown, imagePath, archiveImagePath, hasMetadata);
  const checks = await validatePost({ slug, markdown, metadata: normalized, imagePath, archiveImagePath });
  const title = normalized.title || extractTitle(markdown) || slug;
  const caption = normalized.caption || extractCaption(markdown);

  return {
    slug,
    title,
    caption,
    markdown,
    status: normalized.status,
    metadata: normalized,
    checks,
    paths: {
      markdown: relativePath(mdPath),
      image: imagePath ? relativePath(imagePath) : null,
      archive_image: relativePath(archiveImagePath),
      metadata: hasMetadata ? relativePath(metadataPath) : null,
    },
    urls: {
      image: imagePath ? `/outputs/bai-viet/${encodeURIComponent(slug)}/${encodeURIComponent(path.basename(imagePath))}` : null,
      archive_image: `/outputs/images/${encodeURIComponent(slug)}.png`,
    },
    created_at: normalized.created_at || null,
    updated_at: normalized.updated_at || null,
    scheduled_at: normalized.scheduled_at || null,
    published_at: normalized.published_at || null,
    facebook_post_id: normalized.facebook_post_id || null,
    facebook_page_id: normalized.facebook_page_id || null,
    facebook_page_name: normalized.facebook_page_name || null,
    publish_history: normalizePublishHistory(metadata),
    publish_error: normalized.publish_error || null,
  };
}

function toPostSummary(post) {
  return {
    slug: post.slug,
    title: post.title,
    status: post.status,
    checks: post.checks,
    paths: post.paths,
    urls: post.urls,
    scheduled_at: post.scheduled_at,
    published_at: post.published_at,
    facebook_post_id: post.facebook_post_id,
    facebook_page_id: post.facebook_page_id,
    facebook_page_name: post.facebook_page_name,
    publish_history: post.metadata.publish_history || [],
    publish_error: post.publish_error,
    created_at: post.created_at,
    updated_at: post.updated_at,
  };
}

async function ensureMetadata(slug) {
  const post = await readPost(slug);
  if (!post) {
    const error = new Error("Khong tim thay bai viet.");
    error.status = 404;
    throw error;
  }
  const existing = await exists(path.join(POSTS_DIR, slug, "post.json"));
  if (existing) return post;

  const next = buildDefaultMetadata(
    slug,
    post.markdown,
    post.paths.image ? path.join(ROOT_DIR, post.paths.image) : null,
    path.join(IMAGES_DIR, `${slug}.png`),
    "ready_for_review",
  );
  await writeMetadata(slug, next);
  return readPost(slug);
}

function buildDefaultMetadata(slug, markdown, imagePath, archiveImagePath, status) {
  const now = new Date().toISOString();
  return {
    slug,
    title: extractTitle(markdown) || slug,
    caption: cleanCaptionForFacebook(extractCaption(markdown)),
    image_path: imagePath ? relativePath(imagePath) : `outputs/bai-viet/${slug}/${slug}.png`,
    archive_image_path: relativePath(archiveImagePath),
    status,
    scheduled_at: null,
    published_at: null,
    facebook_post_id: null,
    facebook_page_id: null,
    facebook_page_name: null,
    publish_history: [],
    publish_error: null,
    created_at: now,
    updated_at: now,
  };
}

function normalizeMetadata(slug, metadata, markdown, imagePath, archiveImagePath, hasMetadata) {
  return {
    slug,
    title: metadata.title || extractTitle(markdown) || slug,
    caption: cleanCaptionForFacebook(metadata.caption || extractCaption(markdown)),
    image_path: metadata.image_path || (imagePath ? relativePath(imagePath) : `outputs/bai-viet/${slug}/${slug}.png`),
    archive_image_path: metadata.archive_image_path || relativePath(archiveImagePath),
    status: hasMetadata ? (STATUSES.has(metadata.status) ? metadata.status : "ready_for_review") : "missing_metadata",
    scheduled_at: metadata.scheduled_at || null,
    published_at: metadata.published_at || null,
    facebook_post_id: metadata.facebook_post_id || null,
    facebook_page_id: metadata.facebook_page_id || null,
    facebook_page_name: metadata.facebook_page_name || null,
    publish_history: normalizePublishHistory(metadata),
    publish_error: metadata.publish_error || null,
    created_at: metadata.created_at || null,
    updated_at: metadata.updated_at || null,
  };
}

async function writeMetadata(slug, metadata) {
  const dir = path.join(POSTS_DIR, slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "post.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
}

async function findPostImage(slug, dir) {
  const preferred = path.join(dir, `${slug}.png`);
  if (await exists(preferred)) return preferred;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const image = entries.find((entry) => entry.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(entry.name));
  return image ? path.join(dir, image.name) : null;
}

async function validatePost({ slug, markdown, metadata, imagePath, archiveImagePath }) {
  const caption = metadata.caption || extractCaption(markdown);
  const checks = [
    { key: "metadata", label: "Co post.json", ok: metadata.status !== "missing_metadata" },
    { key: "markdown", label: "Co bai-viet.md", ok: Boolean(markdown.trim()) },
    { key: "image", label: "Co anh trong thu muc bai viet", ok: Boolean(imagePath && (await exists(imagePath))) },
    { key: "archive_image", label: "Co anh trong outputs/images", ok: await exists(archiveImagePath) },
    { key: "phone", label: `Caption co hotline ${BRAND.phone}`, ok: caption.includes(BRAND.phone) },
    {
      key: "address",
      label: `Caption hoac metadata co dia chi ${BRAND.address}`,
      ok: caption.includes(BRAND.address) || JSON.stringify(metadata).includes(BRAND.address),
    },
    { key: "slug", label: "Slug hop le", ok: isSafeSlug(slug) },
  ];
  return checks;
}

async function requirePublishableCandidate(slug, options) {
  const post = await readPost(slug);
  if (!post) {
    const error = new Error("Khong tim thay bai viet.");
    error.status = 404;
    throw error;
  }
  const failures = post.checks.filter((check) => !check.ok);
  if (failures.length > 0) {
    const error = new Error("Bai viet chua dat dieu kien.");
    error.status = 400;
    error.checks = post.checks;
    throw error;
  }
  if (options.allowApproved && !["approved", "scheduled"].includes(post.status)) {
    const error = new Error("Bai viet phai o trang thai approved.");
    error.status = 400;
    throw error;
  }
  return post;
}

async function publishPost(slug, { requireApproved, allowPublished }) {
  const post = await readPost(slug);
  if (!post) {
    const error = new Error("Khong tim thay bai viet.");
    error.status = 404;
    throw error;
  }
  if (requireApproved && post.status !== "approved" && !(allowPublished && post.status === "published")) {
    const error = new Error("Chi bai da duyet moi duoc dang.");
    error.status = 400;
    throw error;
  }
  const failures = post.checks.filter((check) => !check.ok);
  if (failures.length > 0) {
    const error = new Error("Bai viet chua dat dieu kien dang.");
    error.status = 400;
    error.checks = post.checks;
    throw error;
  }

  const connection = await readFacebookConnection();
  const selectedPage = getSelectedPage(connection);
  if (allowPublished && wasPublishedToPage(post.metadata, selectedPage?.id)) {
    const error = new Error("Bai nay da dang len fanpage dang chon. Hay chon fanpage khac de dang lai.");
    error.status = 400;
    throw error;
  }

  const previousStatus = post.status;
  await writeMetadata(slug, { ...post.metadata, status: "publishing", publish_error: null, updated_at: new Date().toISOString() });

  try {
    const facebookPostId = await publishToFacebook(post);
    const publishedAt = new Date().toISOString();
    const historyEntry = {
      facebook_post_id: facebookPostId,
      facebook_page_id: selectedPage?.id || null,
      facebook_page_name: selectedPage?.name || null,
      published_at: publishedAt,
    };
    const next = {
      ...post.metadata,
      status: "published",
      published_at: publishedAt,
      facebook_post_id: facebookPostId,
      facebook_page_id: selectedPage?.id || null,
      facebook_page_name: selectedPage?.name || null,
      publish_history: [...(post.metadata.publish_history || []), historyEntry],
      publish_error: null,
      updated_at: publishedAt,
    };
    await writeMetadata(slug, next);
    return readPost(slug);
  } catch (error) {
    const failedPost = await readPost(slug);
    const next = {
      ...failedPost.metadata,
      status: allowPublished && previousStatus === "published" ? "published" : "failed",
      publish_error: error.message,
      updated_at: new Date().toISOString(),
    };
    await writeMetadata(slug, next);
    error.status = error.status || 502;
    throw error;
  }
}

async function publishToFacebook(post) {
  const connection = await readFacebookConnection();
  const selectedPage = getSelectedPage(connection);
  if (!selectedPage?.encrypted_page_token) {
    const error = new Error("Chua ket noi Facebook Page.");
    error.status = 400;
    throw error;
  }
  const token = decryptSecret(selectedPage.encrypted_page_token);
  const imagePath = path.join(ROOT_DIR, post.paths.image);
  const imageBuffer = await fs.readFile(imagePath);
  const mime = getImageMime(imagePath);
  const form = new FormData();
  form.append("caption", cleanCaptionForFacebook(post.caption));
  form.append("access_token", token);
  form.append("source", new Blob([imageBuffer], { type: mime }), path.basename(imagePath));

  const response = await fetch(`https://graph.facebook.com/${getMetaVersion()}/${selectedPage.id}/photos`, {
    method: "POST",
    body: form,
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.message || "Dang Facebook that bai.");
  }
  return body.post_id || body.id;
}

async function runScheduler() {
  if (schedulerRunning) return;
  schedulerRunning = true;
  try {
    const posts = await listPosts();
    const due = posts.filter((post) => post.status === "scheduled" && post.scheduled_at && Date.parse(post.scheduled_at) <= Date.now());
    for (const post of due) {
      try {
        await publishPost(post.slug, { requireApproved: false });
      } catch (error) {
        console.error(`Dang bai hen gio that bai (${post.slug}):`, error.message);
      }
    }
  } finally {
    schedulerRunning = false;
  }
}

async function exchangeCodeForUserToken(code, redirectUri) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
    redirect_uri: redirectUri,
    code,
  });
  const response = await fetch(`https://graph.facebook.com/${getMetaVersion()}/oauth/access_token?${params.toString()}`);
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message || "Khong lay duoc user token.");
  return body.access_token;
}

async function exchangeForLongLivedUserToken(accessToken) {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
    fb_exchange_token: accessToken,
  });
  const response = await fetch(`https://graph.facebook.com/${getMetaVersion()}/oauth/access_token?${params.toString()}`);
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message || "Khong doi duoc long-lived token.");
  return body.access_token;
}

async function resolvePageTokens(userToken) {
  const params = new URLSearchParams({
    access_token: userToken,
    fields: "id,name,access_token",
  });
  let url = `https://graph.facebook.com/${getMetaVersion()}/me/accounts?${params.toString()}`;
  const pages = [];
  while (url) {
    const response = await fetch(url);
    const body = await response.json();
    if (!response.ok) throw new Error(body?.error?.message || "Khong lay duoc danh sach Page.");
    pages.push(...(body.data || []).filter((item) => item.id && item.name && item.access_token));
    url = body.paging?.next || "";
  }
  if (pages.length === 0) {
    throw new Error("Tai khoan Facebook chua cap quyen quan ly fanpage nao cho ung dung.");
  }
  return pages;
}

async function readFacebookConnection() {
  if (!(await exists(FACEBOOK_STATE_FILE))) return null;
  return JSON.parse(await fs.readFile(FACEBOOK_STATE_FILE, "utf8"));
}

async function writeFacebookConnection(connection) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FACEBOOK_STATE_FILE, `${JSON.stringify(connection, null, 2)}\n`, { mode: 0o600 });
}

function getStoredPages(connection) {
  if (!connection) return [];
  if (Array.isArray(connection.pages) && connection.pages.length > 0) return connection.pages;
  if (connection.page_id && connection.page_name && connection.encrypted_page_token) {
    return [
      {
        id: connection.page_id,
        name: connection.page_name,
        encrypted_page_token: connection.encrypted_page_token,
      },
    ];
  }
  return [];
}

function getSelectedPage(connection) {
  const pages = getStoredPages(connection);
  if (pages.length === 0) return null;
  return (
    pages.find((page) => page.id === connection?.selected_page_id) ||
    pages.find((page) => page.id === process.env.FACEBOOK_PAGE_ID) ||
    pages[0]
  );
}

function getSafePages(connection) {
  return getStoredPages(connection).map((page) => ({
    id: page.id,
    name: page.name,
    selected: page.id === getSelectedPage(connection)?.id,
  }));
}

function pickSelectedPage(pages) {
  const configured = pages.find((page) => page.id === process.env.FACEBOOK_PAGE_ID);
  return configured || pages[0];
}

function normalizePublishHistory(metadata) {
  if (Array.isArray(metadata.publish_history)) return metadata.publish_history;
  if (metadata.facebook_post_id) {
    return [
      {
        facebook_post_id: metadata.facebook_post_id,
        facebook_page_id: metadata.facebook_page_id || metadata.page_id || null,
        facebook_page_name: metadata.facebook_page_name || metadata.page_name || null,
        published_at: metadata.published_at || metadata.updated_at || null,
      },
    ];
  }
  return [];
}

function wasPublishedToPage(metadata, pageId) {
  if (!pageId) return false;
  return normalizePublishHistory(metadata).some((entry) => entry.facebook_page_id === pageId);
}

async function writeOAuthState(state) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    FACEBOOK_OAUTH_STATE_FILE,
    `${JSON.stringify({ state, created_at: new Date().toISOString() }, null, 2)}\n`,
    { mode: 0o600 },
  );
}

async function readOAuthState() {
  if (!(await exists(FACEBOOK_OAUTH_STATE_FILE))) return null;
  const state = JSON.parse(await fs.readFile(FACEBOOK_OAUTH_STATE_FILE, "utf8"));
  return state.state || null;
}

function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

function decryptSecret(value) {
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64")), decipher.final()]).toString("utf8");
}

function getEncryptionKey() {
  const seed = process.env.META_APP_SECRET || "local-development-secret";
  return crypto.createHash("sha256").update(seed).digest();
}

function getFacebookRedirectUri(req) {
  const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
  return `${baseUrl.replace(/\/$/, "")}/api/facebook/callback`;
}

function getMetaVersion() {
  return process.env.META_API_VERSION || "v20.0";
}

function getFacebookScopes() {
  return process.env.META_OAUTH_SCOPES || "pages_show_list,pages_read_engagement,pages_manage_posts";
}

function getImageMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

function extractTitle(markdown) {
  const h1 = markdown.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  const labeled = markdown.match(/(?:^|\n)Tiêu đề(?: SEO)?:\s*\n([^\n]+)/i);
  return labeled ? labeled[1].trim() : "";
}

function extractCaption(markdown) {
  if (!markdown.trim()) return "";
  const sections = [
    /##\s*Phiên bản Facebook\/Zalo\s*\n([\s\S]*?)(?=\n##\s+|$)/i,
    /Nội dung:\s*\n([\s\S]*?)(?=\n(?:Hashtag|Ghi chú kênh|Mục tiêu nội dung|##)\s*:?\s*\n|$)/i,
  ];
  for (const pattern of sections) {
    const match = markdown.match(pattern);
    if (match?.[1]?.trim()) return cleanupCaption(match[1]);
  }
  return cleanupCaption(markdown);
}

function cleanupCaption(text) {
  const withoutInternalSections = String(text || "")
    .replace(/##\s*Prompt thiết kế[\s\S]*$/i, "")
    .replace(/##\s*Chữ ngắn cho banner[\s\S]*$/i, "");
  return cleanCaptionForFacebook(withoutInternalSections);
}

function cleanCaptionForFacebook(text) {
  return String(text || "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function relativePath(filePath) {
  return path.relative(ROOT_DIR, filePath).split(path.sep).join("/");
}

function isSafeSlug(slug) {
  return /^[a-z0-9][a-z0-9-]*$/.test(slug);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}
