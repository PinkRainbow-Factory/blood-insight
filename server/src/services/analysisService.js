import { buildMedicalSystemPrompt, buildMedicalUserPrompt } from "../prompts/medicalPrompt.js";
import { callOpenAIAnalysis } from "./openaiService.js";
import { callGeminiAnalysis } from "./geminiService.js";
import { runRulesEngine } from "./rulesEngine.js";

export async function analyzeBloodReport({ provider, keys, profile, disease, labs, models }) {
  const structured = runRulesEngine({ profile, disease, labs });
  const systemPrompt = buildMedicalSystemPrompt();
  const userPrompt = buildMedicalUserPrompt({
    profile,
    disease,
    metrics: structured.metrics,
    structuredSummary: structured.summary
  });

  const normalizedProvider = provider === "gemini" ? "gemini" : "openai";
  const aiResult = normalizedProvider === "gemini"
    ? await callGeminiAnalysis({
        apiKey: keys.gemini,
        model: models.gemini,
        systemPrompt,
        userPrompt,
        structured
      })
    : await callOpenAIAnalysis({
        apiKey: keys.openai,
        model: models.openai,
        systemPrompt,
        userPrompt,
        structured
      });

  return {
    provider: normalizedProvider,
    structured,
    aiResult
  };
}
