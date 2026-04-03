import { Capacitor, CapacitorHttp } from "@capacitor/core";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const DEFAULT_TIMEOUT_MS = 45000;
const TIMEOUT_MESSAGE = "요청 시간이 길어지고 있습니다. 네트워크 또는 AI 응답 상태를 확인한 뒤 다시 시도해 주세요.";

function parseNativeData(data) {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data || {};
}

async function request(path, { method = "GET", body, token } = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  if (Capacitor.isNativePlatform()) {
    const response = await Promise.race([
      CapacitorHttp.request({
        url,
        method,
        headers,
        data: body
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(TIMEOUT_MESSAGE)), DEFAULT_TIMEOUT_MS);
      })
    ]);

    const data = parseNativeData(response.data);
    if (response.status < 200 || response.status >= 300) {
      throw new Error(data.message || data.error || "Request failed");
    }
    return data;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: controller.signal
  }).catch((error) => {
    if (error?.name === "AbortError") {
      throw new Error(TIMEOUT_MESSAGE);
    }
    throw error;
  }).finally(() => {
    clearTimeout(timer);
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }
  return data;
}

export async function signupUser(payload) {
  return request("/api/auth/signup", { method: "POST", body: payload });
}

export async function loginUser(payload) {
  return request("/api/auth/login", { method: "POST", body: payload });
}

export async function findLoginId(payload) {
  return request("/api/auth/find-id", { method: "POST", body: payload });
}

export async function resetPassword(payload) {
  return request("/api/auth/reset-password", { method: "POST", body: payload });
}

export async function fetchSession(token) {
  return request("/api/auth/me", { token });
}

export async function logoutUser(token) {
  return request("/api/auth/logout", { method: "POST", token });
}

export async function saveAiSettings({ token, provider, openaiApiKey, geminiApiKey, openaiModel, geminiModel }) {
  return request("/api/auth/settings/ai", {
    method: "PUT",
    token,
    body: {
      provider,
      openaiApiKey,
      geminiApiKey,
      openaiModel,
      geminiModel
    }
  });
}

export async function analyzeViaProxy({ provider, profile, disease, labs, token }) {
  return request("/api/analyze/blood-report", {
    method: "POST",
    token,
    body: {
      provider,
      profile,
      disease,
      labs
    }
  });
}

export async function explainCustomMetricViaProxy({ provider, profile, disease, metric, token }) {
  return request("/api/analyze/custom-metric", {
    method: "POST",
    token,
    body: {
      provider,
      profile,
      disease,
      metric
    }
  });
}

export async function saveReportRecord({ record, token }) {
  return request("/api/reports", {
    method: "POST",
    token,
    body: record
  });
}

export async function listReportHistory(token) {
  return request("/api/reports", { token });
}
