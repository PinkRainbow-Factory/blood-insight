import { promises as fs } from "fs";
import path from "path";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const dataDir = path.resolve(process.cwd(), "data");
const dataFile = path.join(dataDir, "users.json");

function buildDefaultSettings() {
  return {
    provider: "gemini",
    models: {
      openai: "gpt-5",
      gemini: "gemini-3-flash"
    },
    apiKeys: {
      openai: "",
      gemini: ""
    }
  };
}

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify({ users: [], sessions: [] }, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw);
}

async function writeStore(store) {
  await ensureStore();
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2), "utf8");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeName(name) {
  return String(name || "").trim();
}

function createPasswordHash(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, passwordHash, passwordSalt) {
  const candidate = Buffer.from(scryptSync(password, passwordSalt, 64).toString("hex"), "hex");
  const stored = Buffer.from(passwordHash, "hex");
  if (candidate.length !== stored.length) {
    return false;
  }
  return timingSafeEqual(candidate, stored);
}

function buildSession(store, userId) {
  const token = randomBytes(32).toString("hex");
  store.sessions = store.sessions.filter((session) => session.userId !== userId);
  store.sessions.push({
    token,
    userId,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString()
  });
  return token;
}

function maskEmail(email) {
  const [localPart = "", domain = ""] = String(email || "").split("@");
  if (!localPart || !domain) {
    return email;
  }
  if (localPart.length <= 2) {
    return `${localPart[0] || "*"}*@${domain}`;
  }
  return `${localPart.slice(0, 2)}${"*".repeat(Math.max(localPart.length - 2, 1))}@${domain}`;
}

export function toPublicUser(user) {
  const settings = user?.settings || buildDefaultSettings();
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    settings: {
      provider: settings.provider || "gemini",
      openaiModel: settings.models?.openai || "gpt-5",
      geminiModel: settings.models?.gemini || "gemini-3-flash",
      hasOpenaiKey: Boolean(settings.apiKeys?.openai),
      hasGeminiKey: Boolean(settings.apiKeys?.gemini)
    }
  };
}

export async function createUser({ name, email, password }) {
  const cleanName = normalizeName(name);
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || "");

  if (!cleanName || !cleanEmail || !cleanPassword) {
    throw new Error("Name, email, and password are required");
  }

  if (cleanPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const store = await readStore();
  if (store.users.some((user) => user.email === cleanEmail)) {
    throw new Error("An account with this email already exists");
  }

  const passwordBundle = createPasswordHash(cleanPassword);
  const user = {
    id: `user_${Date.now()}_${randomBytes(4).toString("hex")}`,
    name: cleanName,
    email: cleanEmail,
    passwordHash: passwordBundle.hash,
    passwordSalt: passwordBundle.salt,
    createdAt: new Date().toISOString(),
    settings: buildDefaultSettings()
  };

  store.users.push(user);
  const token = buildSession(store, user.id);
  await writeStore(store);

  return {
    token,
    user: toPublicUser(user)
  };
}

export async function loginUser({ email, password }) {
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || "");

  if (!cleanEmail || !cleanPassword) {
    throw new Error("Email and password are required");
  }

  const store = await readStore();
  const user = store.users.find((entry) => entry.email === cleanEmail);
  if (!user || !verifyPassword(cleanPassword, user.passwordHash, user.passwordSalt)) {
    throw new Error("Invalid email or password");
  }

  const token = buildSession(store, user.id);
  await writeStore(store);

  return {
    token,
    user: toPublicUser(user)
  };
}

export async function findLoginIds({ name }) {
  const cleanName = normalizeName(name);
  if (!cleanName) {
    throw new Error("이름을 입력해 주세요.");
  }

  const store = await readStore();
  const matches = store.users
    .filter((user) => user.name === cleanName)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map((user) => ({
      name: user.name,
      emailMask: maskEmail(user.email),
      createdAt: user.createdAt
    }));

  if (!matches.length) {
    throw new Error("입력한 이름으로 가입된 계정을 찾지 못했습니다.");
  }

  return { matches };
}

export async function resetUserPassword({ name, email, newPassword }) {
  const cleanName = normalizeName(name);
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(newPassword || "");

  if (!cleanName || !cleanEmail || !cleanPassword) {
    throw new Error("이름, 이메일, 새 비밀번호를 모두 입력해 주세요.");
  }

  if (cleanPassword.length < 6) {
    throw new Error("비밀번호는 6자 이상이어야 합니다.");
  }

  const store = await readStore();
  const user = store.users.find((entry) => entry.name === cleanName && entry.email === cleanEmail);
  if (!user) {
    throw new Error("입력한 이름과 이메일이 일치하는 계정을 찾지 못했습니다.");
  }

  const passwordBundle = createPasswordHash(cleanPassword);
  user.passwordHash = passwordBundle.hash;
  user.passwordSalt = passwordBundle.salt;
  store.sessions = store.sessions.filter((session) => session.userId !== user.id);
  await writeStore(store);

  return { ok: true };
}

export async function getUserByToken(token) {
  if (!token) {
    return null;
  }

  const store = await readStore();
  const session = store.sessions.find((entry) => entry.token === token);
  if (!session) {
    return null;
  }

  session.lastSeenAt = new Date().toISOString();
  await writeStore(store);
  return store.users.find((user) => user.id === session.userId) || null;
}

export async function clearSession(token) {
  if (!token) {
    return;
  }
  const store = await readStore();
  store.sessions = store.sessions.filter((session) => session.token !== token);
  await writeStore(store);
}

export async function updateUserAiSettings(userId, { provider, openaiApiKey, geminiApiKey, openaiModel, geminiModel }) {
  const store = await readStore();
  const user = store.users.find((entry) => entry.id === userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.settings = user.settings || buildDefaultSettings();
  user.settings.models = user.settings.models || { openai: "gpt-5", gemini: "gemini-3-flash" };
  user.settings.apiKeys = user.settings.apiKeys || { openai: "", gemini: "" };

  if (provider === "openai" || provider === "gemini") {
    user.settings.provider = provider;
  }

  if (typeof openaiApiKey === "string") {
    user.settings.apiKeys.openai = openaiApiKey.trim();
  }

  if (typeof geminiApiKey === "string") {
    user.settings.apiKeys.gemini = geminiApiKey.trim();
  }

  if (typeof openaiModel === "string" && openaiModel.trim()) {
    user.settings.models.openai = openaiModel.trim();
  }

  if (typeof geminiModel === "string" && geminiModel.trim()) {
    user.settings.models.gemini = geminiModel.trim();
  }

  await writeStore(store);
  return user;
}