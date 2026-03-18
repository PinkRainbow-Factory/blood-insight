import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { createUser, loginUser, clearSession, toPublicUser, updateUserAiSettings } from "../services/userStore.js";

export const authRoute = express.Router();

authRoute.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const session = await createUser({ name, email, password });
    res.status(201).json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account";
    const status = message.includes("already") || message.includes("required") || message.includes("least") ? 400 : 500;
    res.status(status).json({ error: "signup_failed", message });
  }
});

authRoute.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const session = await loginUser({ email, password });
    res.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to login";
    const status = message.includes("Invalid") || message.includes("required") ? 401 : 500;
    res.status(status).json({ error: "login_failed", message });
  }
});

authRoute.get("/me", requireAuth, async (req, res) => {
  res.json({ user: toPublicUser(req.user) });
});

authRoute.post("/logout", requireAuth, async (req, res) => {
  await clearSession(req.authToken);
  res.json({ ok: true });
});

authRoute.put("/settings/ai", requireAuth, async (req, res) => {
  try {
    const { provider, openaiApiKey, geminiApiKey, openaiModel, geminiModel } = req.body || {};
    const user = await updateUserAiSettings(req.user.id, {
      provider,
      openaiApiKey,
      geminiApiKey,
      openaiModel,
      geminiModel
    });
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    res.status(500).json({
      error: "settings_failed",
      message: error instanceof Error ? error.message : "Unable to update settings"
    });
  }
});
