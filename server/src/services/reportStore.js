import { promises as fs } from "fs";
import path from "path";

const dataDir = path.resolve(process.cwd(), "data");
const dataFile = path.join(dataDir, "labReports.json");

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify({ reports: [] }, null, 2), "utf8");
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

export async function saveReport(record) {
  const store = await readStore();
  const next = {
    id: `report_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...record
  };
  store.reports.unshift(next);
  await writeStore(store);
  return next;
}

export async function listReports({ userId } = {}) {
  const store = await readStore();
  return userId ? store.reports.filter((report) => report.userId === userId) : store.reports;
}

export async function getReportById({ id, userId } = {}) {
  const store = await readStore();
  const found = store.reports.find((report) => report.id === id) || null;
  if (!found) {
    return null;
  }
  if (userId && found.userId !== userId) {
    return null;
  }
  return found;
}
