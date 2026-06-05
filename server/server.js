const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");

const express = require("express");

const ROOT_DIR = path.resolve(__dirname, "..");
const APP_DIR = path.join(ROOT_DIR, "app");
const POSTS_DIR = path.join(ROOT_DIR, "outputs", "bai-viet");
const IMAGES_DIR = path.join(ROOT_DIR, "outputs", "images");
const BRAND_ASSETS_DIR = path.join(ROOT_DIR, "assets", "brand");
const STUDENT_PHOTOS_DIR = path.join(ROOT_DIR, "assets", "student-photos");
const DATA_DIR = path.join(ROOT_DIR, ".data");
const FACEBOOK_STATE_FILE = path.join(DATA_DIR, "facebook-connection.json");
const FACEBOOK_OAUTH_STATE_FILE = path.join(DATA_DIR, "facebook-oauth-state.json");

const BRAND = {
  address: "91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai",
  phone: "093 11 44 858",
};

const BANNED_TERMS = ["duy nhất", "số một", "100%", "nhất"];

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
app.use("/assets/brand", express.static(BRAND_ASSETS_DIR));
app.use("/assets/student-photos", express.static(STUDENT_PHOTOS_DIR));

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

app.get("/api/student-photos/albums", async (_req, res) => {
  try {
    res.json({ albums: await listStudentPhotoAlbums() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/student-photos/albums/:albumId/photos", async (req, res) => {
  try {
    res.json({ photos: await listStudentPhotos(req.params.albumId) });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.patch("/api/posts/:slug/media", async (req, res) => {
  try {
    const post = await readPost(req.params.slug);
    if (!post) {
      res.status(404).json({ error: "Khong tim thay bai viet." });
      return;
    }
    if (post.status === "missing_metadata") {
      res.status(400).json({ error: "Bai viet chua co post.json. Hay tao metadata truoc." });
      return;
    }

    const media = await normalizeMediaItems(req.params.slug, req.body?.media || [], {
      markdown: post.markdown,
      imagePath: post.paths.image ? path.join(ROOT_DIR, post.paths.image) : null,
      archiveImagePath: post.paths.archive_image ? path.join(ROOT_DIR, post.paths.archive_image) : null,
    });
    const next = { ...post.metadata, media, updated_at: new Date().toISOString() };
    await writeMetadata(req.params.slug, next);
    res.json({ post: await readPost(req.params.slug) });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.patch("/api/posts/:slug/content", async (req, res) => {
  try {
    const post = await readPost(req.params.slug);
    if (!post) {
      res.status(404).json({ error: "Khong tim thay bai viet." });
      return;
    }

    const title = String(req.body?.title || "").trim();
    const caption = String(req.body?.caption || "").trim();
    if (!caption) {
      res.status(400).json({ error: "Noi dung bai viet khong duoc de trong." });
      return;
    }

    const next = {
      ...post.metadata,
      title: title || post.title,
      caption: cleanCaptionForFacebook(caption),
      status: post.status === "missing_metadata" ? "ready_for_review" : post.status,
      updated_at: new Date().toISOString(),
    };
    await writeMetadata(req.params.slug, next);
    res.json({ post: await readPost(req.params.slug) });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.patch("/api/posts/:slug/checks/:checkKey", async (req, res) => {
  try {
    const post = await readPost(req.params.slug);
    if (!post) {
      res.status(404).json({ error: "Khong tim thay bai viet." });
      return;
    }
    if (post.status === "missing_metadata") {
      res.status(400).json({ error: "Hay tao hoac luu metadata truoc khi bo qua loi." });
      return;
    }

    const key = req.params.checkKey;
    const ignored = new Set(post.metadata.ignored_checks || []);
    if (req.body?.ignored === false) {
      ignored.delete(key);
    } else {
      ignored.add(key);
    }
    const next = {
      ...post.metadata,
      ignored_checks: [...ignored],
      updated_at: new Date().toISOString(),
    };
    await writeMetadata(req.params.slug, next);
    res.json({ post: await readPost(req.params.slug) });
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

app.get("/api/ai/config", (_req, res) => {
  try {
    res.json({ config: getSafeAiConfig(getAiConfig()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/config", async (req, res) => {
  try {
    const saved = await saveAiConfig(req.body || {});
    res.json({ config: getSafeAiConfig(saved) });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.post("/api/ai/test", async (req, res) => {
  try {
    const config = mergeAiConfig(req.body || {});
    const result = await testAiProvider(config);
    res.json({ ok: true, ...result, config: getSafeAiConfig({ ...config, model: result.model || config.model }) });
  } catch (error) {
    res.status(error.status || 500).json({ error: sanitizeAiError(error, req.body?.api_key) });
  }
});

app.get("/api/ai/models", async (req, res) => {
  try {
    const config = mergeAiConfig(req.query || {});
    const models = await listAiModels(config);
    res.json({ models, config: getSafeAiConfig(config) });
  } catch (error) {
    res.status(error.status || 500).json({ error: sanitizeAiError(error, req.query?.api_key) });
  }
});

app.post("/api/ai/generate", async (req, res) => {
  try {
    const config = getAiConfig();
    assertAiConfigured(config);
    const slug = String(req.body?.slug || "").trim();
    const post = slug ? await readPost(slug) : null;
    if (slug && !post) {
      res.status(404).json({ error: "Khong tim thay bai viet." });
      return;
    }
    const prompt = buildAiDraftPrompt({
      post,
      prompt: req.body?.prompt,
      template: req.body?.template,
      options: req.body?.options || {},
    });
    const raw = await generateAiText(config, prompt);
    const draft = normalizeAiDraft(raw, {
      provider: config.provider,
      model: config.model,
      slug: post?.slug || null,
      options: req.body?.options || {},
    });
    if (post) {
      const updated = await appendAiDraft(post.slug, draft);
      res.json({ draft, post: updated });
      return;
    }
    res.json({ draft });
  } catch (error) {
    res.status(error.status || 500).json({ error: sanitizeAiError(error) });
  }
});

app.post("/api/posts/:slug/ai-drafts/:draftId/apply", async (req, res) => {
  try {
    const post = await applyAiDraft(req.params.slug, req.params.draftId);
    res.json({ post });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
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

function getAiConfig() {
  const provider = normalizeAiProvider(process.env.AI_PROVIDER);
  const endpointStyle = normalizeAiEndpointStyle(process.env.AI_ENDPOINT_STYLE, provider);
  return {
    provider,
    apiKey: process.env.AI_API_KEY || "",
    baseUrl: normalizeBaseUrl(process.env.AI_API_BASE_URL || getDefaultAiBaseUrl(provider)),
    model: process.env.AI_MODEL || "",
    endpointStyle,
    timeoutMs: normalizeTimeout(process.env.AI_API_TIMEOUT_MS),
  };
}

function mergeAiConfig(input = {}) {
  const current = getAiConfig();
  const provider = normalizeAiProvider(input.provider || current.provider);
  const endpointStyle = normalizeAiEndpointStyle(input.endpoint_style || input.endpointStyle || current.endpointStyle, provider);
  return {
    provider,
    apiKey: String(input.api_key || input.apiKey || current.apiKey || "").trim(),
    baseUrl: normalizeBaseUrl(String(input.base_url || input.baseUrl || current.baseUrl || getDefaultAiBaseUrl(provider)).trim()),
    model: String(input.model || current.model || "").trim(),
    endpointStyle,
    timeoutMs: normalizeTimeout(input.timeout_ms || input.timeoutMs || current.timeoutMs),
  };
}

function getSafeAiConfig(config) {
  const missing = [];
  if (!config.apiKey) missing.push("AI_API_KEY");
  if (config.provider === "custom" && !config.baseUrl) missing.push("AI_API_BASE_URL");
  if (config.provider === "custom" && !config.model) missing.push("AI_MODEL");
  return {
    provider: config.provider,
    configured: missing.length === 0,
    api_key_masked: maskSecret(config.apiKey),
    has_api_key: Boolean(config.apiKey),
    base_url: config.baseUrl,
    model: config.model,
    endpoint_style: config.endpointStyle,
    timeout_ms: config.timeoutMs,
    missing,
  };
}

async function saveAiConfig(input) {
  const provider = normalizeAiProvider(input.provider);
  const endpointStyle = normalizeAiEndpointStyle(input.endpoint_style || input.endpointStyle, provider);
  const current = getAiConfig();
  const apiKeyInput = String(input.api_key || input.apiKey || "").trim();
  const apiKey = apiKeyInput || current.apiKey;
  const baseUrl = normalizeBaseUrl(String(input.base_url || input.baseUrl || getDefaultAiBaseUrl(provider)).trim());
  const config = {
    provider,
    apiKey,
    baseUrl,
    model: String(input.model || "").trim(),
    endpointStyle,
    timeoutMs: normalizeTimeout(input.timeout_ms || input.timeoutMs),
  };
  if (!config.apiKey) {
    const error = new Error("Can nhap API key truoc khi luu cau hinh AI.");
    error.status = 400;
    throw error;
  }
  if (config.provider === "custom" && !config.baseUrl) {
    const error = new Error("Custom Provider can co Base URL.");
    error.status = 400;
    throw error;
  }
  if (config.provider === "custom" && !config.model) {
    const error = new Error("Custom Provider can chon hoac nhap model.");
    error.status = 400;
    throw error;
  }

  await writeEnvValues({
    AI_PROVIDER: config.provider,
    AI_API_KEY: config.apiKey,
    AI_API_BASE_URL: config.baseUrl,
    AI_MODEL: config.model,
    AI_ENDPOINT_STYLE: config.endpointStyle,
    AI_API_TIMEOUT_MS: String(config.timeoutMs),
  });
  Object.assign(process.env, {
    AI_PROVIDER: config.provider,
    AI_API_KEY: config.apiKey,
    AI_API_BASE_URL: config.baseUrl,
    AI_MODEL: config.model,
    AI_ENDPOINT_STYLE: config.endpointStyle,
    AI_API_TIMEOUT_MS: String(config.timeoutMs),
  });
  return config;
}

async function writeEnvValues(values) {
  const envPath = path.join(ROOT_DIR, ".env");
  const existing = (await exists(envPath)) ? await fs.readFile(envPath, "utf8") : "";
  const keys = new Set(Object.keys(values));
  const seen = new Set();
  const lines = existing.split(/\r?\n/).filter((line, index, list) => index < list.length - 1 || line !== "");
  const next = lines.map((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (!match || !keys.has(match[1])) return line;
    seen.add(match[1]);
    return `${match[1]}=${formatEnvValue(values[match[1]])}`;
  });
  for (const key of keys) {
    if (!seen.has(key)) next.push(`${key}=${formatEnvValue(values[key])}`);
  }
  await fs.writeFile(envPath, `${next.join("\n").replace(/\n*$/, "")}\n`, { mode: 0o600 });
}

function formatEnvValue(value) {
  const text = String(value || "");
  return /[\s"'`$\\]/.test(text) ? JSON.stringify(text) : text;
}

function normalizeAiProvider(value) {
  return String(value || "gemini").toLowerCase() === "custom" ? "custom" : "gemini";
}

function normalizeAiEndpointStyle(value, provider) {
  if (provider === "gemini") return "gemini";
  const style = String(value || "openai").toLowerCase();
  return style === "gemini" ? "gemini" : "openai";
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function normalizeTimeout(value) {
  const parsed = Number(value || 30000);
  if (!Number.isFinite(parsed)) return 30000;
  return Math.min(Math.max(parsed, 5000), 120000);
}

function getDefaultAiBaseUrl(provider) {
  return provider === "gemini" ? "https://generativelanguage.googleapis.com/v1beta" : "";
}

function maskSecret(value) {
  const text = String(value || "");
  if (!text) return "";
  if (text.length <= 8) return "********";
  return `${"*".repeat(Math.min(8, text.length - 4))}${text.slice(-4)}`;
}

function assertAiConfigured(config) {
  if (!config.apiKey) {
    const error = new Error("Chua cau hinh API key AI.");
    error.status = 400;
    throw error;
  }
  if (config.provider === "custom" && !config.model) {
    const error = new Error("Chua chon model cho Custom Provider.");
    error.status = 400;
    throw error;
  }
}

async function testAiProvider(config) {
  assertAiConfigured(config);
  const models = await listAiModels(config);
  const model = config.model || models[0]?.id || "";
  if (!model) {
    const error = new Error("Khong tim thay model nao ho tro tao noi dung.");
    error.status = 400;
    throw error;
  }
  if (config.provider === "custom" && config.endpointStyle === "openai") {
    await generateAiText({ ...config, model }, "Return only this JSON object: {\"ok\":true}");
  }
  return { models, model };
}

async function listAiModels(config) {
  assertAiConfigured(config);
  if (config.provider === "gemini" || config.endpointStyle === "gemini") return listGeminiModels(config);
  return listOpenAiModels(config);
}

async function listGeminiModels(config) {
  const response = await fetchWithTimeout(`${config.baseUrl}/models?key=${encodeURIComponent(config.apiKey)}`, {}, config.timeoutMs);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw providerError(body?.error?.message || "Khong lay duoc danh sach model Gemini.", response.status);
  return (body.models || [])
    .filter((model) => (model.supportedGenerationMethods || []).includes("generateContent"))
    .map((model) => ({
      id: model.name,
      label: model.displayName || model.name,
      description: model.description || "",
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

async function listOpenAiModels(config) {
  const response = await fetchWithTimeout(`${config.baseUrl}/models`, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
  }, config.timeoutMs);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw providerError(body?.error?.message || "Provider khong tra ve danh sach model.", response.status);
  return (body.data || body.models || [])
    .map((model) => ({
      id: String(model.id || model.name || "").trim(),
      label: String(model.id || model.name || "").trim(),
      description: model.description || "",
    }))
    .filter((model) => model.id)
    .sort((a, b) => a.label.localeCompare(b.label));
}

async function generateAiText(config, prompt) {
  assertAiConfigured(config);
  if (config.provider === "gemini" || config.endpointStyle === "gemini") return generateGeminiText(config, prompt);
  return generateOpenAiText(config, prompt);
}

async function generateGeminiText(config, prompt) {
  const model = normalizeGeminiModel(config.model || "models/gemini-1.5-flash");
  const response = await fetchWithTimeout(`${config.baseUrl}/${model}:generateContent?key=${encodeURIComponent(config.apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
  }, config.timeoutMs);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw providerError(body?.error?.message || "Gemini tao noi dung that bai.", response.status);
  const text = (body.candidates?.[0]?.content?.parts || []).map((part) => part.text || "").join("\n").trim();
  if (!text) throw providerError("Gemini khong tra ve noi dung.", 502);
  return text;
}

async function generateOpenAiText(config, prompt) {
  const response = await fetchWithTimeout(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: "You generate Vietnamese education marketing drafts and return valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  }, config.timeoutMs);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw providerError(body?.error?.message || "Custom Provider tao noi dung that bai.", response.status);
  const text = body.choices?.[0]?.message?.content || body.output_text || "";
  if (!text.trim()) throw providerError("Custom Provider khong tra ve noi dung.", 502);
  return text.trim();
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") throw providerError("Ket noi AI qua thoi gian cho.", 408);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function providerError(message, status) {
  const error = new Error(message);
  error.status = status >= 400 && status < 600 ? status : 502;
  return error;
}

function sanitizeAiError(error, apiKey) {
  let message = String(error?.message || "AI provider bi loi.");
  const secrets = [apiKey, process.env.AI_API_KEY].filter(Boolean).map((secret) => String(secret));
  for (const secret of secrets) {
    message = message.split(secret).join("[API_KEY]");
  }
  return message;
}

function normalizeGeminiModel(model) {
  const value = String(model || "").trim();
  if (!value) return "models/gemini-1.5-flash";
  return value.startsWith("models/") ? value : `models/${value}`;
}

function buildAiDraftPrompt({ post, prompt, template, options }) {
  const selected = post || { title: "bai viet moi", slug: "bai-viet-moi", caption: "", checks: [], metadata: {} };
  return [
    String(prompt || "").trim(),
    "",
    "Tra ve duy nhat JSON hop le theo schema:",
    `{"title":"...","caption":"...","image_prompt":"...","hashtags":["..."]}`,
    "",
    "Quy tac thuong hieu bat buoc:",
    "- Trung Tam Tin Hoc Sao Viet Bien Hoa",
    `- Dia chi phai xuat hien trong caption hoac image_prompt: ${BRAND.address}`,
    `- Hotline phai xuat hien trong caption: ${BRAND.phone}`,
    "- Khong dung cac cum tu cam: duy nhat, so mot, 100%, nhat.",
    "- Noi dung phu hop Facebook/Zalo, tieng Viet tu nhien, ro rang, khong tu bia uu dai.",
    "",
    "Ngu canh bai dang:",
    `- Slug: ${selected.slug}`,
    `- Tieu de hien tai: ${selected.title || ""}`,
    `- Caption hien tai: ${selected.caption || ""}`,
    `- Kieu prompt: ${template || "new-post"}`,
    `- Tuy chon: ${JSON.stringify(options || {})}`,
  ].filter(Boolean).join("\n");
}

function normalizeAiDraft(rawText, context) {
  const jsonText = extractJsonText(rawText);
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    const error = new Error("AI khong tra ve JSON hop le.");
    error.status = 502;
    throw error;
  }
  const title = String(parsed.title || "").trim();
  const caption = cleanCaptionForFacebook(parsed.caption || "");
  const imagePrompt = String(parsed.image_prompt || parsed.imagePrompt || "").trim();
  if (!title || !caption || !imagePrompt) {
    const error = new Error("Draft AI thieu title, caption hoac image_prompt.");
    error.status = 502;
    throw error;
  }
  return {
    id: crypto.randomBytes(8).toString("hex"),
    title,
    caption,
    image_prompt: imagePrompt,
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    provider: context.provider,
    model: context.model || null,
    source_slug: context.slug,
    options: context.options || {},
    created_at: new Date().toISOString(),
    applied_at: null,
  };
}

function extractJsonText(text) {
  const raw = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  return first >= 0 && last > first ? raw.slice(first, last + 1) : raw;
}

async function appendAiDraft(slug, draft) {
  const post = await readPost(slug);
  if (!post) {
    const error = new Error("Khong tim thay bai viet.");
    error.status = 404;
    throw error;
  }
  const next = {
    ...post.metadata,
    ai_drafts: [...(post.metadata.ai_drafts || []), draft],
    updated_at: new Date().toISOString(),
  };
  await writeMetadata(slug, next);
  return readPost(slug);
}

async function applyAiDraft(slug, draftId) {
  const post = await readPost(slug);
  if (!post) {
    const error = new Error("Khong tim thay bai viet.");
    error.status = 404;
    throw error;
  }
  const drafts = post.metadata.ai_drafts || [];
  const draft = drafts.find((item) => item.id === draftId);
  if (!draft) {
    const error = new Error("Khong tim thay AI draft.");
    error.status = 404;
    throw error;
  }
  const appliedAt = new Date().toISOString();
  const next = {
    ...post.metadata,
    title: draft.title,
    caption: cleanCaptionForFacebook(draft.caption),
    status: post.status === "missing_metadata" ? "ready_for_review" : post.status,
    ai_drafts: drafts.map((item) => item.id === draftId ? { ...item, applied_at: appliedAt } : item),
    updated_at: appliedAt,
  };
  await writeMetadata(slug, next);
  return readPost(slug);
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
  const postImages = await listPostImages(slug, dir);
  const imagePath = postImages[0] || null;
  const archiveImagePath = path.join(IMAGES_DIR, `${slug}.png`);
  const metadataPath = path.join(dir, "post.json");
  const hasMetadata = await exists(metadataPath);
  let metadata = null;

  if (hasMetadata) {
    metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
  } else {
    metadata = buildDefaultMetadata(slug, markdown, imagePath, archiveImagePath, "missing_metadata");
  }

  const normalized = await normalizeMetadata(slug, metadata, markdown, imagePath, archiveImagePath, hasMetadata, postImages);
  const checks = applyIgnoredChecks(await validatePost({ slug, markdown, metadata: normalized }), normalized.ignored_checks);
  const failedChecks = checks.filter((check) => !check.ok && !check.ignored);
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
    readiness: {
      ok: failedChecks.length === 0,
      failed_count: failedChecks.length,
      blocker_keys: failedChecks.map((check) => check.key),
      next_action: getNextAction(normalized.status, failedChecks),
    },
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
    readiness: post.readiness,
    paths: post.paths,
    urls: post.urls,
    scheduled_at: post.scheduled_at,
    published_at: post.published_at,
    facebook_post_id: post.facebook_post_id,
    facebook_page_id: post.facebook_page_id,
    facebook_page_name: post.facebook_page_name,
    publish_history: post.metadata.publish_history || [],
    media: post.metadata.media || [],
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

  const next = { ...post.metadata, status: "ready_for_review", updated_at: new Date().toISOString() };
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
    media: buildLegacyMedia(slug, imagePath, archiveImagePath),
    status,
    scheduled_at: null,
    published_at: null,
    facebook_post_id: null,
    facebook_page_id: null,
    facebook_page_name: null,
    publish_history: [],
    publish_error: null,
    ignored_checks: [],
    ai_drafts: [],
    created_at: now,
    updated_at: now,
  };
}

async function normalizeMetadata(slug, metadata, markdown, imagePath, archiveImagePath, hasMetadata, postImages = []) {
  const media = await normalizeMediaItems(slug, metadata.media || buildLegacyMedia(slug, imagePath, archiveImagePath), {
    markdown,
    imagePath,
    archiveImagePath,
    postImages,
  });
  return {
    slug,
    title: metadata.title || extractTitle(markdown) || slug,
    caption: cleanCaptionForFacebook(metadata.caption || extractCaption(markdown)),
    image_path: metadata.image_path || (imagePath ? relativePath(imagePath) : `outputs/bai-viet/${slug}/${slug}.png`),
    archive_image_path: metadata.archive_image_path || relativePath(archiveImagePath),
    media,
    status: hasMetadata ? (STATUSES.has(metadata.status) ? metadata.status : "ready_for_review") : "missing_metadata",
    scheduled_at: metadata.scheduled_at || null,
    published_at: metadata.published_at || null,
    facebook_post_id: metadata.facebook_post_id || null,
    facebook_page_id: metadata.facebook_page_id || null,
    facebook_page_name: metadata.facebook_page_name || null,
    publish_history: normalizePublishHistory(metadata),
    publish_error: metadata.publish_error || null,
    ignored_checks: Array.isArray(metadata.ignored_checks) ? metadata.ignored_checks : [],
    ai_drafts: Array.isArray(metadata.ai_drafts) ? metadata.ai_drafts : [],
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
  const images = await listPostImages(slug, dir);
  return images[0] || null;
}

async function listPostImages(slug, dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(entry.name))
    .map((entry) => path.join(dir, entry.name))
    .sort((a, b) => comparePostImagePaths(slug, a, b));
}

function comparePostImagePaths(slug, a, b) {
  const aName = path.basename(a);
  const bName = path.basename(b);
  const aRank = getPostImageRank(slug, aName);
  const bRank = getPostImageRank(slug, bName);
  if (aRank !== bRank) return aRank - bRank;
  return aName.localeCompare(bName, "vi", { numeric: true, sensitivity: "base" });
}

function getPostImageRank(slug, fileName) {
  const base = fileName.replace(/\.(png|jpg|jpeg|webp)$/i, "");
  if (base === slug) return 0;
  const numbered = base.match(new RegExp(`^${escapeRegExp(slug)}-(\\d+)$`));
  if (numbered) return Number(numbered[1]);
  return 10000;
}

async function validatePost({ slug, markdown, metadata }) {
  const caption = metadata.caption || extractCaption(markdown);
  const bannedMatches = findBannedTerms(`${caption}\n${metadata.title || ""}\n${JSON.stringify(metadata.media || [])}`);
  const checks = [
    { key: "metadata", label: "Co post.json", ok: metadata.status !== "missing_metadata" },
    { key: "markdown", label: "Co bai-viet.md", ok: Boolean(markdown.trim()) },
    { key: "phone", label: `Caption co hotline ${BRAND.phone}`, ok: caption.includes(BRAND.phone) },
    {
      key: "address",
      label: `Caption hoac metadata co dia chi ${BRAND.address}`,
      ok: caption.includes(BRAND.address) || JSON.stringify(metadata).includes(BRAND.address),
    },
    {
      key: "banned_terms",
      label: bannedMatches.length > 0 ? `Khong dung tu cam: ${bannedMatches.join(", ")}` : "Khong co tu ngu bi chan",
      ok: bannedMatches.length === 0,
      details: bannedMatches,
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
  const failures = post.checks.filter((check) => !check.ok && !check.ignored);
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
  const failures = post.checks.filter((check) => !check.ok && !check.ignored);
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
    const mediaUsed = (post.metadata.media || []).map((item) => ({
      id: item.id,
      type: item.type,
      path: item.path,
      role: item.role,
      order: item.order,
    }));
    const historyEntry = {
      facebook_post_id: facebookPostId,
      facebook_page_id: selectedPage?.id || null,
      facebook_page_name: selectedPage?.name || null,
      published_at: publishedAt,
      media: mediaUsed,
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
  const media = (post.metadata.media || []).filter((item) => item.path).sort((a, b) => (a.order || 0) - (b.order || 0));
  if (media.length === 0) {
    const error = new Error("Bai viet chua co media de dang.");
    error.status = 400;
    throw error;
  }
  if (media.length > 1) {
    return publishMultiPhotoPost(selectedPage.id, token, post, media);
  }

  const imagePath = path.join(ROOT_DIR, media[0].path);
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

async function publishMultiPhotoPost(pageId, token, post, media) {
  const attachedMedia = [];
  for (const item of media) {
    const imagePath = path.join(ROOT_DIR, item.path);
    const imageBuffer = await fs.readFile(imagePath);
    const form = new FormData();
    form.append("published", "false");
    form.append("access_token", token);
    form.append("source", new Blob([imageBuffer], { type: getImageMime(imagePath) }), path.basename(imagePath));

    const response = await fetch(`https://graph.facebook.com/${getMetaVersion()}/${pageId}/photos`, {
      method: "POST",
      body: form,
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body?.error?.message || "Upload anh Facebook that bai.");
    }
    attachedMedia.push({ media_fbid: body.id });
  }

  const params = new URLSearchParams({
    message: cleanCaptionForFacebook(post.caption),
    access_token: token,
  });
  attachedMedia.forEach((item, index) => {
    params.append(`attached_media[${index}]`, JSON.stringify(item));
  });

  const response = await fetch(`https://graph.facebook.com/${getMetaVersion()}/${pageId}/feed`, {
    method: "POST",
    body: params,
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.message || "Dang nhieu anh Facebook that bai.");
  }
  return body.id;
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

async function listStudentPhotoAlbums() {
  await fs.mkdir(STUDENT_PHOTOS_DIR, { recursive: true });
  const albumMeta = await readJsonIfExists(path.join(STUDENT_PHOTOS_DIR, "albums.json"), { albums: [] });
  const entries = await fs.readdir(STUDENT_PHOTOS_DIR, { withFileTypes: true });
  const directoryAlbums = entries
    .filter((entry) => entry.isDirectory() && isSafeSlug(entry.name))
    .map((entry) => entry.name);
  const knownIds = new Set();
  const albums = [];

  for (const album of albumMeta.albums || []) {
    if (!album?.id || knownIds.has(album.id)) continue;
    knownIds.add(album.id);
    albums.push({
      id: album.id,
      title: album.title || album.id,
      description: album.description || "",
      photo_count: await countStudentPhotos(album.id),
    });
  }
  for (const id of directoryAlbums) {
    if (knownIds.has(id)) continue;
    albums.push({
      id,
      title: titleFromSlug(id),
      description: "",
      photo_count: await countStudentPhotos(id),
    });
  }
  return albums.sort((a, b) => a.title.localeCompare(b.title, "vi"));
}

async function listStudentPhotos(albumId) {
  if (!isSafeSlug(albumId)) {
    const error = new Error("Album khong hop le.");
    error.status = 400;
    throw error;
  }
  const albumDir = path.join(STUDENT_PHOTOS_DIR, albumId);
  if (!(await exists(albumDir))) return [];
  const meta = await readJsonIfExists(path.join(albumDir, "photos.json"), { photos: [] });
  const entries = await fs.readdir(albumDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(entry.name))
    .map((entry) => entry.name);
  const metaByFile = new Map((meta.photos || []).map((photo) => [photo.file, photo]));

  return files.map((file, index) => {
    const photo = metaByFile.get(file) || {};
    const id = photo.id || `${albumId}-${slugFromFile(file)}`;
    const relative = `assets/student-photos/${albumId}/${file}`;
    return {
      id,
      album: albumId,
      title: photo.title || file,
      description: photo.description || "",
      file,
      path: relative,
      url: `/assets/student-photos/${encodeURIComponent(albumId)}/${encodeURIComponent(file)}`,
      approved_for_use: Boolean(photo.approved_for_use),
      taken_at: photo.taken_at || null,
      order: Number(photo.order || index + 1),
    };
  }).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "vi"));
}

async function countStudentPhotos(albumId) {
  return (await listStudentPhotos(albumId)).length;
}

async function getStudentPhotoByPath(mediaPath) {
  const normalized = String(mediaPath || "").split(path.sep).join("/");
  const match = normalized.match(/^assets\/student-photos\/([a-z0-9-]+)\/([^/]+)$/);
  if (!match) return null;
  const photos = await listStudentPhotos(match[1]);
  return photos.find((photo) => photo.path === normalized) || null;
}

function buildLegacyMedia(slug, imagePath, archiveImagePath) {
  const resolvedPath = imagePath ? relativePath(imagePath) : `outputs/bai-viet/${slug}/${slug}.png`;
  const media = [
    {
      id: "cover",
      type: "ai_image",
      path: resolvedPath,
      role: "cover",
      order: 1,
    },
  ];
  if (archiveImagePath) {
    media[0].archive_path = relativePath(archiveImagePath);
  }
  return media;
}

async function normalizeMediaItems(slug, mediaItems, context) {
  const source = mergeDiscoveredPostImages(
    slug,
    Array.isArray(mediaItems) ? mediaItems : [],
    context.postImages || [],
    context.archiveImagePath,
  );
  const normalized = [];
  for (let index = 0; index < source.length; index += 1) {
    const item = source[index] || {};
    const itemPath = String(item.path || "").split(path.sep).join("/");
    if (!isAllowedMediaPath(itemPath)) continue;
    const type = item.type === "student_photo" ? "student_photo" : "ai_image";
    const studentPhoto = type === "student_photo" ? await getStudentPhotoByPath(itemPath) : null;
    normalized.push({
      id: item.id || `${type}-${index + 1}`,
      type,
      path: itemPath,
      archive_path: item.archive_path || null,
      album: item.album || studentPhoto?.album || null,
      role: item.role || (index === 0 ? "cover" : "slide"),
      order: Number(item.order || index + 1),
      title: item.title || studentPhoto?.title || path.basename(itemPath),
      approved_for_use: type === "student_photo" ? Boolean(studentPhoto?.approved_for_use) : true,
    });
  }
  return normalized.sort((a, b) => a.order - b.order);
}

function mergeDiscoveredPostImages(slug, mediaItems, postImages, archiveImagePath) {
  const discovered = postImages.map((imagePath, index) => {
    const relative = relativePath(imagePath);
    const existing = mediaItems.find((item) => String(item?.path || "").split(path.sep).join("/") === relative) || {};
    return {
      ...existing,
      id: existing.id || (index === 0 ? "cover" : `post-image-${index + 1}`),
      type: "ai_image",
      path: relative,
      archive_path: index === 0 && archiveImagePath ? relativePath(archiveImagePath) : existing.archive_path || null,
      role: index === 0 ? "cover" : "slide",
      order: index + 1,
      title: existing.title || path.basename(relative),
    };
  });

  const discoveredPaths = new Set(discovered.map((item) => item.path));
  const external = mediaItems
    .filter((item) => {
      const itemPath = String(item?.path || "").split(path.sep).join("/");
      return itemPath && !discoveredPaths.has(itemPath);
    })
    .map((item, index) => ({
      ...item,
      order: discovered.length + index + 1,
      role: discovered.length + index === 0 ? "cover" : item.role || "slide",
    }));

  if (discovered.length > 0 || external.length > 0) return [...discovered, ...external];
  return buildLegacyMedia(slug, null, archiveImagePath);
}

async function validateMediaItems(media) {
  const missingFiles = [];
  for (const item of media || []) {
    if (!item.path || !(await exists(path.join(ROOT_DIR, item.path)))) {
      missingFiles.push(item.path || item.id || "unknown");
    }
  }
  return {
    hasAnyMedia: Array.isArray(media) && media.length > 0,
    missingFiles,
  };
}

function applyIgnoredChecks(checks, ignoredChecks) {
  const ignored = new Set(Array.isArray(ignoredChecks) ? ignoredChecks : []);
  return checks.map((check) => ({
    ...check,
    ignored: ignored.has(check.key),
  }));
}

function isAllowedMediaPath(mediaPath) {
  return (
    /^outputs\/bai-viet\/[a-z0-9-]+\/[^/]+\.(png|jpg|jpeg|webp)$/i.test(mediaPath) ||
    /^outputs\/images\/[^/]+\.(png|jpg|jpeg|webp)$/i.test(mediaPath) ||
    /^assets\/student-photos\/[a-z0-9-]+\/[^/]+\.(png|jpg|jpeg|webp)$/i.test(mediaPath)
  );
}

function findBannedTerms(text) {
  const normalized = normalizeVietnameseText(text);
  const matches = [];
  for (const term of BANNED_TERMS) {
    const normalizedTerm = normalizeVietnameseText(term);
    const pattern = normalizedTerm === "100%"
      ? /100\s*%/
      : new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`, "i");
    if (pattern.test(normalized)) matches.push(term);
  }
  return [...new Set(matches)];
}

function normalizeVietnameseText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function getNextAction(status, failedChecks) {
  if (failedChecks.length > 0) return "Sửa lỗi trước khi duyệt/đăng";
  if (status === "missing_metadata") return "Tạo metadata";
  if (status === "ready_for_review") return "Duyệt bài";
  if (status === "approved") return "Đăng ngay hoặc hẹn giờ";
  if (status === "scheduled") return "Chờ tới lịch đăng";
  if (status === "published") return "Có thể đăng sang fanpage khác";
  if (status === "failed") return "Xem lỗi và thử lại";
  return "Kiểm tra bài";
}

async function readJsonIfExists(filePath, fallback) {
  if (!(await exists(filePath))) return fallback;
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function titleFromSlug(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function slugFromFile(file) {
  return path.basename(file, path.extname(file)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
