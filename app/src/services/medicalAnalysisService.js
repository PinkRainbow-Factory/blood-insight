import { analyzeViaProxy, listReportHistory, saveReportRecord } from "./apiClient";

export async function requestMedicalAnalysis({ provider, profile, disease, labs, token }) {
  return analyzeViaProxy({ provider, profile, disease, labs, token });
}

export async function persistMedicalReport({ profile, disease, labs, analysis, provider, token }) {
  return saveReportRecord({
    token,
    record: {
      profile,
      disease,
      labs,
      provider,
      analysis
    }
  });
}

export async function loadMedicalReportHistory({ token }) {
  return listReportHistory(token);
}
