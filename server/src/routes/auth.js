import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createUser,
  loginUser,
  clearSession,
  findLoginIds,
  resetUserPassword,
  toPublicUser,
  updateUserAiSettings
} from "../services/userStore.js";

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

authRoute.post("/find-id", async (req, res) => {
  try {
    const { name } = req.body || {};
    const result = await findLoginIds({ name });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to find account";
    const status = message.includes("입력") || message.includes("찾지 못했습니다") ? 400 : 500;
    res.status(status).json({ error: "find_id_failed", message });
  }
});

authRoute.post("/reset-password", async (req, res) => {
  try {
    const { name, email, newPassword } = req.body || {};
    const result = await resetUserPassword({ name, email, newPassword });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reset password";
    const status = message.includes("입력") || message.includes("찾지 못했습니다") || message.includes("6자") ? 400 : 500;
    res.status(status).json({ error: "reset_password_failed", message });
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