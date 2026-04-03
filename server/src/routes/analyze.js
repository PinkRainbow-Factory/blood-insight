import express from "express";
import { analyzeBloodReport } from "../services/analysisService.js";
import { attachUser } from "../middleware/auth.js";

export const analyzeRoute = express.Router();

function normalizeGeminiModel(model) {
  const raw = String(model || "").trim();
  if (!raw) {
    return "gemini-3-flash";
  }
  if (raw === "gemni-3-flash") {
    return "gemini-3-flash";
  }
  return raw;
}

function tryParseJsonBlock(text) {
  const raw = String(text || "").trim();
  if (!raw) {
    return null;
  }

  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const candidates = [raw, cleaned];
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(cleaned.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // continue
    }
  }

  return null;
}

async function fetchWithTimeout(url, options, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function buildCustomMetricPrompts({ profile, disease, metric }) {
  const systemPrompt = [
    "You are a medical lab explanation assistant.",
    "Return strict JSON only.",
    "Fields: meaning, highText, lowText, generalTip.",
    "Write concise Korean text that explains a custom blood test metric for a patient-facing health app.",
    "Do not diagnose. Explain the metric, how to interpret high/low values generally, and one practical guidance tip."
  ].join(" ");

  const userPrompt = JSON.stringify({
    profile: {
      mode: profile?.mode || "general",
      sex: profile?.sex || "",
      age: profile?.age || "",
      symptomSummary: profile?.symptomSummary || "",
      symptomTags: profile?.symptomTags || []
    },
    disease: disease ? { code: disease.code, name: disease.name, group: disease.group } : null,
    metric
  });

  return { systemPrompt, userPrompt };
}

async function explainCustomMetric({ provider, keys, models, profile, disease, metric }) {
  const { systemPrompt, userPrompt } = buildCustomMetricPrompts({ profile, disease, metric });

  const fallback = {
    meaning: `${metric.name || metric.code} 항목은 현재 입력한 값과 참고범위를 함께 보면서 의미를 읽는 커스텀 혈액검사 항목입니다.`,
    highText: `${metric.name || metric.code} 수치가 높다면 증상, 복약, 최근 검사 흐름과 함께 의료진에게 의미를 확인해 보세요.`,
    lowText: `${metric.name || metric.code} 수치가 낮다면 컨디션 변화와 함께 추세를 기록하고 상담 시 함께 보여주는 것이 좋습니다.`,
    generalTip: "검사표의 참고범위와 검사 날짜를 함께 기록하면 다음 리포트와 비교할 때 해설 품질이 좋아집니다."
  };

  if (provider === "openai") {
    const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keys.openai}`
      },
      body: JSON.stringify({
        model: models.openai,
        input: [
          { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
          { role: "user", content: [{ type: "input_text", text: userPrompt }] }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return tryParseJsonBlock(data.output_text) || fallback;
  }

  const geminiModel = normalizeGeminiModel(models.gemini);
  const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${keys.gemini}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const outputText = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  return tryParseJsonBlock(outputText) || fallback;
}

analyzeRoute.post("/blood-report", attachUser, async (req, res) => {
  try {
    const { provider, profile, disease, labs, userApiKeys } = req.body || {};

    if (!labs || typeof labs !== "object") {
      return res.status(400).json({ error: "labs payload is required" });
    }

    const preferredProvider = provider || req.user?.settings?.provider || "gemini";
    const keys = req.user
      ? {
          openai: userApiKeys?.openai || req.user?.settings?.apiKeys?.openai || "",
          gemini: userApiKeys?.gemini || req.user?.settings?.apiKeys?.gemini || ""
        }
      : {
          openai: userApiKeys?.openai || process.env.OPENAI_API_KEY || "",
          gemini: userApiKeys?.gemini || process.env.GEMINI_API_KEY || ""
        };

    if (!keys[preferredProvider]) {
      return res.status(400).json({
        error: "missing_api_key",
        message: req.user
          ? `설정에서 ${preferredProvider === "gemini" ? "Gemini" : "ChatGPT"} API 키를 먼저 저장해 주세요.`
          : `${preferredProvider === "gemini" ? "Gemini" : "ChatGPT"} API key is required`
      });
    }

    const result = await analyzeBloodReport({
      provider: preferredProvider,
      profile: profile || {},
      disease: disease || null,
      labs,
      keys,
      models: {
        openai: req.user?.settings?.models?.openai || process.env.OPENAI_MODEL || "gpt-5",
        gemini: normalizeGeminiModel(req.user?.settings?.models?.gemini || process.env.GEMINI_MODEL || "gemini-3-flash")
      }
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: "analysis_failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

analyzeRoute.post("/custom-metric", attachUser, async (req, res) => {
  try {
    const { provider, profile, disease, metric } = req.body || {};

    if (!metric?.code || !metric?.name) {
      return res.status(400).json({ error: "metric_required", message: "커스텀 수치 코드와 이름이 필요합니다." });
    }

    const preferredProvider = provider || req.user?.settings?.provider || "gemini";
    const keys = {
      openai: req.user?.settings?.apiKeys?.openai || "",
      gemini: req.user?.settings?.apiKeys?.gemini || ""
    };

    if (!keys[preferredProvider]) {
      return res.status(400).json({
        error: "missing_api_key",
        message: `설정에서 ${preferredProvider === "gemini" ? "Gemini" : "ChatGPT"} API 키를 먼저 저장해 주세요.`
      });
    }

    const result = await explainCustomMetric({
      provider: preferredProvider,
      keys,
      models: {
        openai: req.user?.settings?.models?.openai || process.env.OPENAI_MODEL || "gpt-5",
        gemini: req.user?.settings?.models?.gemini || process.env.GEMINI_MODEL || "gemini-3-flash"
      },
      profile: profile || {},
      disease: disease || null,
      metric
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: "custom_metric_analysis_failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
