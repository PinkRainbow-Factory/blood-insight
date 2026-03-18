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
