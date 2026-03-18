import "dotenv/config";
import cors from "cors";
import express from "express";
import { analyzeRoute } from "./routes/analyze.js";
import { authRoute } from "./routes/auth.js";
import { reportsRoute } from "./routes/reports.js";

const app = express();
const port = process.env.PORT || 8080;

const configuredOrigins = (process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowlist = new Set([
  "http://localhost",
  "http://localhost:4173",
  "capacitor://localhost",
  "http://192.168.68.116:4173",
  "http://pinkrainbow.tplinkdns.com:4173",
  ...configuredOrigins
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowlist.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  }
}));
app.use(express.json({ limit: "3mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "blood-insight-server", origins: [...allowlist] });
});

app.use("/api/auth", authRoute);
app.use("/api/analyze", analyzeRoute);
app.use("/api/reports", reportsRoute);

app.listen(port, () => {
  console.log(`Blood Insight server listening on ${port}`);
});
