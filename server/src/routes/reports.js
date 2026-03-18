import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getReportById, listReports, saveReport } from "../services/reportStore.js";

export const reportsRoute = express.Router();

reportsRoute.use(requireAuth);

reportsRoute.get("/", async (req, res) => {
  try {
    const reports = await listReports({ userId: req.user.id });
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: "history_failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

reportsRoute.get("/:id", async (req, res) => {
  try {
    const report = await getReportById({ id: req.params.id, userId: req.user.id });
    if (!report) {
      return res.status(404).json({ error: "not_found", message: "Report not found" });
    }
    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: "history_failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

reportsRoute.post("/", async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.analysis) {
      return res.status(400).json({ error: "invalid_payload", message: "analysis is required" });
    }

    const saved = await saveReport({
      ...payload,
      userId: req.user.id
    });
    res.status(201).json({ report: saved });
  } catch (error) {
    res.status(500).json({ error: "save_failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
