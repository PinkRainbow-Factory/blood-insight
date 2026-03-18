import { getUserByToken } from "../services/userStore.js";

function extractBearerToken(headerValue = "") {
  if (!headerValue.startsWith("Bearer ")) {
    return "";
  }
  return headerValue.slice(7).trim();
}

export async function attachUser(req, _res, next) {
  try {
    req.authToken = extractBearerToken(req.headers.authorization || "");
    req.user = null;

    if (req.authToken) {
      req.user = await getUserByToken(req.authToken);
    }

    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAuth(req, res, next) {
  try {
    req.authToken = extractBearerToken(req.headers.authorization || "");
    if (!req.authToken) {
      return res.status(401).json({ error: "auth_required", message: "Login is required" });
    }

    req.user = await getUserByToken(req.authToken);
    if (!req.user) {
      return res.status(401).json({ error: "invalid_session", message: "Session expired. Please login again." });
    }

    next();
  } catch (error) {
    next(error);
  }
}
