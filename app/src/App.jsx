import { useEffect, useMemo, useState } from "react";
import { defaultProfile, diseaseCatalog, diseaseExpertGuides, diseasePlaybooks, metricDefinitions, sampleValues } from "./data";
import { fetchSession, findLoginId, loginUser, logoutUser, resetPassword, saveAiSettings, signupUser } from "./services/apiClient";
import { loadMedicalReportHistory, persistMedicalReport, requestMedicalAnalysis } from "./services/medicalAnalysisService";
import { cancelLabReminder, cancelMedicationReminder, registerNotificationActionListener, scheduleLabReminder, scheduleMedicationReminder } from "./services/notificationService";
import { extractLabMetricsFromImage, getSampleOcrPayload, ocrInstitutionPresets, ocrTemplates } from "./services/ocrService";
import { exportReportImage, exportReportPdf, openExportedFile, shareReport } from "./services/reportExportService";

const STORAGE_KEYS = {
  token: "bloodInsight.authToken",
  autoLogin: "bloodInsight.autoLogin",
  profile: "bloodInsight.profile",
  labs: "bloodInsight.labs",
  customLabs: "bloodInsight.customLabs",
  autoOpenExport: "bloodInsight.autoOpenExport"
};

const NAV_ITEMS = [
  { id: "dashboard", label: "메인" },
  { id: "profile", label: "프로필" },
  { id: "schedule", label: "일정" },
  { id: "labs", label: "수치 입력" },
  { id: "disease", label: "질환 해설" },
  { id: "report", label: "리포트" },
  { id: "history", label: "기록" },
  { id: "settings", label: "AI 설정" }
];

function safeParse(rawValue, fallback) {
  try {
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

function mapRecoveryErrorMessage(message, mode) {
  const text = String(message || "");

  if (text.includes("Name is required")) {
    return "??? ??? ???.";
  }

  if (text.includes("No account matches this name and email")) {
    return "??? ??? ???? ???? ??? ?? ?????.";
  }

  if (text.includes("No account matches this name")) {
    return "??? ???? ??? ??? ?? ?????.";
  }

  if (text.includes("Name, email, and new password are required")) {
    return "??, ???, ? ????? ?? ??? ???.";
  }

  if (text.includes("Password must be at least 6 characters")) {
    return "????? 6? ????? ???.";
  }

  return mode === "find_id"
    ? "??? ??? ???? ?????."
    : "???? ???? ???? ?????.";
}

function loadStoredProfile() {
  return { ...defaultProfile, ...safeParse(localStorage.getItem(STORAGE_KEYS.profile), defaultProfile) };
}

function loadStoredLabs() {
  return { ...sampleValues, ...safeParse(localStorage.getItem(STORAGE_KEYS.labs), sampleValues) };
}

function loadStoredCustomLabs() {
  return safeParse(localStorage.getItem(STORAGE_KEYS.customLabs), []);
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "");
}

function classifyMetric(metric, rawValue) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return "unknown";
  }
  if (!Number.isFinite(metric?.range?.low) || !Number.isFinite(metric?.range?.high)) {
    return "unknown";
  }
  if (value < metric.range.low) {
    return "low";
  }
  if (value > metric.range.high) {
    return "high";
  }
  return "normal";
}

function buildMarkerPosition(metric, rawValue) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return 10;
  }
  const spread = metric.range.high - metric.range.low || 1;
  const min = metric.range.low - spread * 0.6;
  const max = metric.range.high + spread * 0.6;
  const clamped = Math.min(max, Math.max(min, value));
  return ((clamped - min) / (max - min)) * 100;
}

function formatMetricValue(rawValue) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return "-";
  }
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function countAbnormal(labs) {
  return metricDefinitions.filter((metric) => {
    const status = classifyMetric(metric, labs[metric.code]);
    return status !== "normal" && status !== "unknown";
  }).length;
}

function reportList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function emptyMedicationDraft() {
  return {
    label: "",
    dose: "",
    note: "",
    time: "08:00",
    daysPreset: "daily",
    mealTiming: "after_meal",
    color: "rose"
  };
}

function renderReportItem(item, index) {
  if (typeof item === "string" || typeof item === "number") {
    return <div key={`${item}-${index}`} className="bullet-card">{String(item)}</div>;
  }

  if (item && typeof item === "object") {
    const title = item.title || item.test_code || `항목 ${index + 1}`;
    const body = [item.why_it_matters, item.care_tip, item.ask_doctor, item.text, item.summary]
      .filter(Boolean)
      .join(" ");

    return (
      <div key={`${title}-${index}`} className="bullet-card">
        <strong>{title}</strong>
        {body ? <div>{body}</div> : null}
      </div>
    );
  }

  return null;
}

function metricSeverityScore(metric, value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || !Number.isFinite(metric?.range?.low) || !Number.isFinite(metric?.range?.high)) {
    return 0;
  }

  if (numeric < metric.range.low) {
    return Math.min(100, ((metric.range.low - numeric) / Math.max(metric.range.low || 1, 1)) * 100);
  }

  if (numeric > metric.range.high) {
    return Math.min(100, ((numeric - metric.range.high) / Math.max(metric.range.high || 1, 1)) * 100);
  }

  return 0;
}

function extractNumericLabValue(source, code) {
  const raw = source?.[code];
  if (raw && typeof raw === "object") {
    const nested = Number(raw.value);
    return Number.isFinite(nested) ? nested : null;
  }

  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatTrendDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric"
  });
}

function symptomSeverityLabel(value) {
  return value === "high" ? "높음" : value === "medium" ? "보통" : "낮음";
}

function symptomOnsetLabel(value) {
  if (value === "today") return "오늘 시작";
  if (value === "within_week") return "1주 이내";
  if (value === "chronic") return "만성/반복";
  return "기간 미상";
}

function symptomSeverityTone(value) {
  return value === "high" ? "high" : value === "medium" ? "medium" : "calm";
}

function formatStatusLabel(status) {
  const labels = {
    normal: "정상 범위",
    high: "높음",
    low: "낮음",
    unknown: "범위 없음"
  };

  return labels[status] || "확인 필요";
}

const LAB_SECTION_OPTIONS = [
  { id: "all", label: "전체" },
  { id: "focus", label: "질환 포커스" },
  { id: "cbc", label: "CBC" },
  { id: "inflammation", label: "염증/면역" },
  { id: "liver", label: "간기능" },
  { id: "renal", label: "신장/전해질" },
  { id: "metabolic", label: "대사/내분비" },
  { id: "custom", label: "커스텀" }
];

const LAB_SECTION_CODE_MAP = {
  cbc: ["WBC", "RBC", "HGB", "HCT", "MCV", "MCH", "MCHC", "PLT", "NEUT", "LYM", "MONO", "EOS", "BASO", "ANC", "RETIC"],
  inflammation: ["WBC", "NEUT", "LYM", "MONO", "EOS", "BASO", "ANC", "CRP", "ESR", "FERRITIN", "LDH"],
  liver: ["AST", "ALT", "ALB", "TBIL", "DBIL", "ALP", "TOTAL_PROTEIN", "GGT"],
  renal: ["BUN", "CREAT", "NA", "K", "MG", "CALCIUM", "PHOSPHORUS", "TCO2", "URIC_ACID"],
  metabolic: ["GLU", "HBA1C", "TOTAL_CHOLESTEROL", "TRIGLYCERIDE", "HDL", "LDL", "TSH"]
};

const SYMPTOM_TAG_OPTIONS = [
  "피로", "발열", "출혈", "통증", "호흡곤란", "부종", "체중감소", "구토", "설사", "복통", "어지럼", "발진", "식욕저하", "기침"
];

function metricSectionCode(metricCode, focusCodes = [], customCodes = []) {
  if (focusCodes.includes(metricCode)) return "focus";
  if (customCodes.includes(metricCode)) return "custom";
  return Object.entries(LAB_SECTION_CODE_MAP).find(([, codes]) => codes.includes(metricCode))?.[0] || "all";
}

function resolveReferenceRange(match) {
  if (Number.isFinite(Number(match?.low)) && Number.isFinite(Number(match?.high))) {
    return { low: Number(match.low), high: Number(match.high), source: "ocr" };
  }

  const metric = metricDefinitions.find((item) => item.code === match?.code);
  if (metric && Number.isFinite(metric.range.low) && Number.isFinite(metric.range.high)) {
    return { low: metric.range.low, high: metric.range.high, source: "default" };
  }

  return null;
}

function classifyOcrReferenceStatus(match) {
  const value = Number(match?.value);
  const reference = resolveReferenceRange(match);
  if (!Number.isFinite(value) || !reference) {
    return "unknown";
  }
  if (value < reference.low) return "low";
  if (value > reference.high) return "high";
  return "normal";
}

function normalizeOcrPayload(payload) {
  return {
    ...payload,
    matches: (payload?.matches || []).map((match, index) => ({
      enabled: match.enabled ?? true,
    label: match.label || match.code || `항목 ${index + 1}`,
      code: (match.code || `OCR_${index + 1}`).toUpperCase(),
      value: match.value === "" || match.value === null || match.value === undefined ? "" : Number(match.value),
      unit: match.unit || "",
      low: match.low === "" || match.low === null || match.low === undefined ? "" : Number(match.low),
      high: match.high === "" || match.high === null || match.high === undefined ? "" : Number(match.high),
      confidence: Number.isFinite(Number(match.confidence)) ? Number(match.confidence) : 0.7
    }))
  };
}

function StatusPill({ status }) {
  const labels = {
    normal: "정상 범위",
    high: "높음",
    low: "낮음",
    borderline: "확인 필요",
    unknown: "범위 없음"
  };

  return <span className={`status-pill status-${status}`}>{labels[status] || "확인 필요"}</span>;
}

function App() {
  const [session, setSession] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [activeReportSection, setActiveReportSection] = useState("overview");
  const [activeDiseaseSection, setActiveDiseaseSection] = useState("overview");
  const [activeLabSection, setActiveLabSection] = useState("all");
  const [labViewMode, setLabViewMode] = useState("cards");
  const [labSearchQuery, setLabSearchQuery] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [recoveryForm, setRecoveryForm] = useState({ name: "", email: "", newPassword: "", confirmPassword: "" });
  const [autoLoginEnabled, setAutoLoginEnabled] = useState(() => localStorage.getItem(STORAGE_KEYS.autoLogin) !== "false");
  const [authError, setAuthError] = useState("");
  const [authInfo, setAuthInfo] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [profile, setProfile] = useState(loadStoredProfile);
  const [labs, setLabs] = useState(loadStoredLabs);
  const [customLabs, setCustomLabs] = useState(loadStoredCustomLabs);
  const [customLabDraft, setCustomLabDraft] = useState({ name: "", code: "", value: "", unit: "", low: "", high: "" });
  const [medicationScheduleDraft, setMedicationScheduleDraft] = useState(emptyMedicationDraft);
  const [medicationEditorOpen, setMedicationEditorOpen] = useState(false);
  const [editingMedicationIndex, setEditingMedicationIndex] = useState(-1);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedMetricCode, setSelectedMetricCode] = useState("");
  const [uploadedImage, setUploadedImage] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrMergedCodes, setOcrMergedCodes] = useState([]);
  const [settingsDraft, setSettingsDraft] = useState({ provider: "gemini", openaiApiKey: "", geminiApiKey: "", openaiModel: "gpt-5", geminiModel: "gemini-3-flash" });
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [medicationNotificationBusy, setMedicationNotificationBusy] = useState(false);
  const [medicationNotificationMessage, setMedicationNotificationMessage] = useState("");
  const [reportActionBusy, setReportActionBusy] = useState(false);
  const [reportActionMessage, setReportActionMessage] = useState("");
  const [reportActionLabel, setReportActionLabel] = useState("");
  const [historyCompareIds, setHistoryCompareIds] = useState([]);
  const [toast, setToast] = useState(null);
  const [autoOpenExport, setAutoOpenExport] = useState(() => localStorage.getItem(STORAGE_KEYS.autoOpenExport) === "true");

  const selectedDisease = useMemo(
    () => diseaseCatalog.find((disease) => disease.code === profile.diseaseCode) || null,
    [profile.diseaseCode]
  );

  const diseaseProtocol = useMemo(() => {
    if (!selectedDisease) {
      return diseasePlaybooks.default;
    }

    return {
      ...diseasePlaybooks.default,
      ...(diseasePlaybooks.groups?.[selectedDisease.group] || {}),
      ...(diseasePlaybooks.codes?.[selectedDisease.code] || {})
    };
  }, [selectedDisease]);
  const diseaseExpertGuide = useMemo(() => {
    if (!selectedDisease) {
      return null;
    }

    return {
      ...(diseaseExpertGuides.groups?.[selectedDisease.group] || {}),
      ...(diseaseExpertGuides.codes?.[selectedDisease.code] || {})
    };
  }, [selectedDisease]);

  const currentMetricMap = useMemo(
    () => ({
      ...labs,
      ...Object.fromEntries(customLabs.map((item) => [item.code, item.value]))
    }),
    [labs, customLabs]
  );
  const medicationItems = useMemo(
    () => String(profile.medications || "")
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5),
    [profile.medications]
  );
  const preferredDisplayName = profile.displayName || session?.user?.name || "사용자";
  const abnormalCount = useMemo(() => countAbnormal(labs), [labs]);
  const medicalSafetyNotes = useMemo(() => {
    const notes = [
      "이 브리핑은 입력된 검사값과 개인 프로필을 기반으로 한 해설 도구이며, 응급 판단이나 최종 진단을 대신하지 않습니다.",
      "수치의 해석은 검사 시점, 증상, 복약, 최근 감염 여부와 같은 임상 맥락에 따라 달라질 수 있어 담당 의료진과 함께 보는 것이 좋습니다."
    ];

    if (selectedDisease) {
      notes.push(`${selectedDisease.name}에서는 ${selectedDisease.focus?.join(", ")} 같은 핵심 수치를 질환 경과와 함께 장기 추세로 보는 것이 좋습니다.`);
    }

    if (abnormalCount >= 4) {
      notes.push("이번 리포트는 참고 범위를 벗어난 항목이 비교적 많이 보여, 증상 변화와 함께 재검 시점 또는 상담 시점을 앞당길지 의료진과 상의하는 편이 안전합니다.");
    }

    return notes;
  }, [selectedDisease, abnormalCount]);

  const combinedMetrics = useMemo(() => {
    const customMetricDefinitions = customLabs.map((item) => ({
      code: item.code,
      name: item.name,
      unit: item.unit || "",
      range: {
        low: item.low === "" ? Number.NaN : Number(item.low),
        high: item.high === "" ? Number.NaN : Number(item.high)
      },
      meaning: "사용자가 추가한 커스텀 혈액검사 항목입니다.",
      highText: "입력한 참고범위와 비교해 높은지 확인해 보세요.",
      lowText: "입력한 참고범위와 비교해 낮은지 확인해 보세요.",
      generalTip: "검사표의 참고 범위를 함께 입력하면 해설 정확도가 더 좋아집니다."
    }));

    return [...metricDefinitions, ...customMetricDefinitions];
  }, [customLabs]);

  const selectedMetric = useMemo(
    () => combinedMetrics.find((metric) => metric.code === selectedMetricCode) || null,
    [combinedMetrics, selectedMetricCode]
  );
  const latestHistoryLabs = history[0]?.labs || null;
  const filteredLabMetrics = useMemo(() => {
    const search = normalizeText(labSearchQuery);
    const focusCodes = selectedDisease?.focus || [];
    const customCodes = customLabs.map((item) => item.code);

    return combinedMetrics.filter((metric) => {
      const sectionCode = metricSectionCode(metric.code, focusCodes, customCodes);
      const sectionPass = activeLabSection === "all"
        ? true
        : activeLabSection === "focus"
          ? focusCodes.includes(metric.code)
          : sectionCode === activeLabSection;

      if (!sectionPass) {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchStack = [metric.code, metric.name, metric.meaning, metric.generalTip].map(normalizeText).join(" ");
      return searchStack.includes(search);
    });
  }, [labSearchQuery, combinedMetrics, activeLabSection, selectedDisease, customLabs]);

  const diseaseResults = useMemo(() => {
    if (profile.mode !== "patient") {
      return [];
    }

    const query = normalizeText(profile.diseaseQuery);
    return diseaseCatalog
      .filter((item) => {
        if (!query) {
          return true;
        }
        const searchStack = [item.code, item.name, item.group, ...(item.keywords || [])].map(normalizeText).join(" ");
        return searchStack.includes(query);
      })
      .slice(0, 12);
  }, [profile.mode, profile.diseaseQuery]);

  const readiness = {
    profile: Boolean(profile.displayName && profile.age),
    disease: profile.mode === "general" || Boolean(selectedDisease),
    apiKey:
      settingsDraft.provider === "gemini"
        ? Boolean(session?.user?.settings?.hasGeminiKey)
        : Boolean(session?.user?.settings?.hasOpenaiKey)
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.labs, JSON.stringify(labs));
  }, [labs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.customLabs, JSON.stringify(customLabs));
  }, [customLabs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.autoOpenExport, autoOpenExport ? "true" : "false");
  }, [autoOpenExport]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.autoLogin, String(autoLoginEnabled));
  }, [autoLoginEnabled]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const handle = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(handle);
  }, [toast]);

  useEffect(() => {
    if (!ocrMergedCodes.length) {
      return undefined;
    }

    const handle = window.setTimeout(() => setOcrMergedCodes([]), 6000);
    return () => window.clearTimeout(handle);
  }, [ocrMergedCodes]);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (!token || !autoLoginEnabled) {
      setSessionReady(true);
      return;
    }

    fetchSession(token)
      .then(({ user }) => {
        setSession({ token, user });
        setSettingsDraft((current) => ({
          ...current,
          provider: user.settings?.provider || "gemini",
          openaiModel: user.settings?.openaiModel || "gpt-5",
          geminiModel: user.settings?.geminiModel || "gemini-3-flash"
        }));
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEYS.token);
        setSession(null);
      })
      .finally(() => setSessionReady(true));
  }, [autoLoginEnabled]);

  useEffect(() => {
    if (!session?.token) {
      setHistory([]);
      return;
    }

    setHistoryLoading(true);
    setHistoryError("");
    loadMedicalReportHistory({ token: session.token })
      .then(({ reports }) => setHistory(reports || []))
      .catch((error) => setHistoryError(error.message || "기록을 불러오지 못했습니다."))
      .finally(() => setHistoryLoading(false));
  }, [session?.token]);

  useEffect(() => {
    let actionHandle = null;

    const registerListener = async () => {
      actionHandle = await registerNotificationActionListener((event) => {
        const actionType = event?.notification?.extra?.type;
        const targetView = event?.notification?.extra?.targetView;
        const reportId = event?.notification?.extra?.reportId;
        const diseaseCode = event?.notification?.extra?.diseaseCode;

        if (diseaseCode) {
          setProfile((current) => ({ ...current, diseaseCode, mode: "patient" }));
        }

        if (reportId) {
          const targetReport = history.find((item) => item.id === reportId);
          if (targetReport) {
            setLabs((current) => ({ ...current, ...(targetReport.labs || {}) }));
            if (targetReport.profile) {
              setProfile((current) => ({ ...current, ...targetReport.profile }));
            }
            setAnalysis(targetReport.analysis || null);
            setActiveView("report");
            setNotificationMessage("저장된 리포트를 바로 열었습니다. 핵심 수치와 브리핑을 확인해 보세요.");
            return;
          }
        }

        if (targetView === "disease" && diseaseCode) {
          setActiveView("disease");
          setNotificationMessage("질환 해설 화면으로 이동했습니다. 질환 맥락과 핵심 수치를 함께 확인하세요.");
          return;
        }

        if (actionType === "medication-reminder") {
          setActiveView(targetView || "schedule");
          setMedicationNotificationMessage("복약 일정 화면으로 이동했습니다. 복약 시간과 메모를 함께 확인하세요.");
          return;
        }

        if (actionType === "lab-reminder-day-before" || actionType === "lab-reminder-day-of") {
          setActiveView("report");
          setNotificationMessage("검사 일정 알림으로 이동했습니다. 리포트와 최근 변화 수치를 함께 확인해 주세요.");
          return;
        }

        if (actionType === "weekly-check") {
          setActiveView("dashboard");
          setNotificationMessage("주간 체크 화면으로 이동했습니다. 최근 기록과 일정 상태를 함께 살펴보세요.");
        }
      });
    };

    registerListener();

    return () => {
      if (actionHandle?.remove) {
        actionHandle.remove();
      }
    };
  }, [history]);

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function toggleSymptomTag(tag) {
    setProfile((current) => {
      const tags = Array.isArray(current.symptomTags) ? current.symptomTags : [];
      return {
        ...current,
        symptomTags: tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag]
      };
    });
  }

  function updateLab(code, value) {
    setLabs((current) => ({
      ...current,
      [code]: value === "" ? "" : Number(value)
    }));
  }

  function updateCustomLab(index, field, value) {
    setCustomLabs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  function updateMedicationSchedule(index, field, value) {
    setProfile((current) => ({
      ...current,
      medicationSchedules: (current.medicationSchedules || []).map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item)
    }));
  }

  function removeMedicationSchedule(index) {
    setProfile((current) => ({
      ...current,
      medicationSchedules: (current.medicationSchedules || []).filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function openMedicationEditor(index = -1) {
    setEditingMedicationIndex(index);
    if (index >= 0) {
      const existing = profile.medicationSchedules?.[index];
      setMedicationScheduleDraft(existing ? { ...existing } : emptyMedicationDraft());
    } else {
      setMedicationScheduleDraft(emptyMedicationDraft());
    }
    setMedicationEditorOpen(true);
  }

  function closeMedicationEditor() {
    setMedicationEditorOpen(false);
    setEditingMedicationIndex(-1);
    setMedicationScheduleDraft(emptyMedicationDraft());
  }

  function saveMedicationSchedule() {
    if (!medicationScheduleDraft.time) {
      return;
    }

    setProfile((current) => {
      const nextItem = {
        id: editingMedicationIndex >= 0
          ? current.medicationSchedules?.[editingMedicationIndex]?.id || `med-${Date.now()}`
          : `med-${Date.now()}`,
        label: medicationScheduleDraft.label.trim() || `복약 일정 ${((current.medicationSchedules || []).length || 0) + 1}`,
        dose: medicationScheduleDraft.dose.trim(),
        note: medicationScheduleDraft.note.trim(),
        time: medicationScheduleDraft.time,
        daysPreset: medicationScheduleDraft.daysPreset || "daily",
        mealTiming: medicationScheduleDraft.mealTiming || "after_meal",
        color: medicationScheduleDraft.color || "rose"
      };

      if (editingMedicationIndex >= 0) {
        return {
          ...current,
          medicationSchedules: (current.medicationSchedules || []).map((item, itemIndex) => itemIndex === editingMedicationIndex ? nextItem : item)
        };
      }

      return {
        ...current,
        medicationSchedules: [
          ...(current.medicationSchedules || []),
          nextItem
        ]
      };
    });
    flashToast(editingMedicationIndex >= 0 ? "복약 일정을 수정했습니다." : "복약 일정을 추가했습니다.", "success");
    closeMedicationEditor();
  }

  function removeCustomLab(index) {
    setCustomLabs((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function flashToast(message, tone = "info") {
    setToast({ message, tone, id: Date.now() });
  }

  async function beginReportAction(label, startMessage) {
    setReportActionBusy(true);
    setReportActionLabel(label);
    setReportActionMessage(startMessage);
    flashToast(startMessage, "info");
    await new Promise((resolve) => window.setTimeout(resolve, 60));
  }

  async function handleSavedSessionLogin() {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (!token) {
      setAuthError("저장된 세션이 없습니다.");
      return;
    }

    setAuthBusy(true);
    setAuthError("");

    if (authMode === "signup") {
      if (!authForm.name.trim()) {
        setAuthError("회원가입을 위해 이름을 입력해 주세요.");
        setAuthBusy(false);
        return;
      }
      if (authForm.password !== authForm.confirmPassword) {
        setAuthError("비밀번호와 비밀번호 확인이 서로 다릅니다.");
        setAuthBusy(false);
        return;
      }
    }

    try {
      const { user } = await fetchSession(token);
      setSession({ token, user });
      setSettingsDraft((current) => ({
        ...current,
        provider: user.settings?.provider || "gemini",
        openaiModel: user.settings?.openaiModel || "gpt-5",
        geminiModel: user.settings?.geminiModel || "gemini-3-flash"
      }));
      setActiveView("dashboard");
    } catch (error) {
      localStorage.removeItem(STORAGE_KEYS.token);
      setAuthError(error.message || "저장된 세션으로 로그인하지 못했습니다.");
    } finally {
      setAuthBusy(false);
    }
  }

  function handleAddCustomLab() {
    if (!customLabDraft.name.trim()) {
      return;
    }

    const code = (customLabDraft.code || customLabDraft.name)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 20) || `CUSTOM_${Date.now()}`;

    setCustomLabs((current) => [
      ...current,
      {
        code,
        name: customLabDraft.name.trim(),
        value: customLabDraft.value === "" ? "" : Number(customLabDraft.value),
        unit: customLabDraft.unit.trim(),
        low: customLabDraft.low,
        high: customLabDraft.high
      }
    ]);

    setCustomLabDraft({ name: "", code: "", value: "", unit: "", low: "", high: "" });
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    setAuthInfo("");

    try {
      const payload = authMode === "signup"
        ? await signupUser(authForm)
        : await loginUser({ email: authForm.email, password: authForm.password });

      localStorage.setItem(STORAGE_KEYS.token, payload.token);
      setSession(payload);
      setSettingsDraft({
        provider: payload.user.settings?.provider || "gemini",
        openaiApiKey: "",
        geminiApiKey: "",
        openaiModel: payload.user.settings?.openaiModel || "gpt-5",
        geminiModel: payload.user.settings?.geminiModel || "gemini-3-flash"
      });
      setAuthForm({ name: "", email: authForm.email, password: "", confirmPassword: "" });
      setRecoveryForm({ name: "", email: authForm.email, newPassword: "", confirmPassword: "" });
      setAuthInfo("");
      setActiveView("dashboard");
    } catch (error) {
      setAuthError(error.message || "로그인에 실패했습니다.");
    } finally {
      setAuthBusy(false);
    }
  }

  function switchAuthMode(nextMode) {
    setAuthMode(nextMode);
    setAuthError("");
    setAuthInfo("");
  }

  async function handleRecoverySubmit(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    setAuthInfo("");

    try {
      if (authMode === "find_id") {
        const result = await findLoginId({ name: recoveryForm.name });
        const message = result.matches?.length
          ? `가입된 계정: ${result.matches.map((item) => item.emailMask).join(", ")}`
          : "가입된 계정을 찾았습니다.";
        setAuthInfo(message);
        flashToast("아이디 찾기 결과를 확인해 주세요.", "success");
        return;
      }

      if (recoveryForm.newPassword !== recoveryForm.confirmPassword) {
        throw new Error("새 비밀번호와 비밀번호 확인이 서로 다릅니다.");
      }

      await resetPassword({
        name: recoveryForm.name,
        email: recoveryForm.email,
        newPassword: recoveryForm.newPassword
      });
      setAuthInfo("비밀번호를 재설정했습니다. 새 비밀번호로 로그인해 주세요.");
      setRecoveryForm({ name: "", email: "", newPassword: "", confirmPassword: "" });
      flashToast("비밀번호 재설정이 완료되었습니다.", "success");
    } catch (error) {
      setAuthError(error.message || "계정 복구를 진행하지 못했습니다.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    try {
      if (session?.token) {
        await logoutUser(session.token);
      }
    } catch {
      // ignore logout network errors and clear local session anyway
    }
    localStorage.removeItem(STORAGE_KEYS.token);
    setSession(null);
    setAnalysis(null);
    setActiveView("dashboard");
  }
  async function handleSaveSettings(event) {
    event.preventDefault();
    if (!session?.token) {
      return;
    }

    setSettingsBusy(true);
    setSettingsMessage("");

    try {
      const { user } = await saveAiSettings({
        token: session.token,
        provider: settingsDraft.provider,
        openaiApiKey: settingsDraft.openaiApiKey,
        geminiApiKey: settingsDraft.geminiApiKey,
        openaiModel: settingsDraft.openaiModel,
        geminiModel: settingsDraft.geminiModel
      });

      setSession((current) => ({ ...current, user }));
      setSettingsDraft((current) => ({
        ...current,
        provider: user.settings?.provider || "gemini",
        openaiApiKey: "",
        geminiApiKey: "",
        openaiModel: user.settings?.openaiModel || current.openaiModel || "gpt-5",
        geminiModel: user.settings?.geminiModel || current.geminiModel || "gemini-3-flash"
      }));
      setSettingsMessage("AI 설정을 저장했습니다. 이제 저장한 키로만 분석이 동작합니다.");
    } catch (error) {
      setSettingsMessage(error.message || "설정 저장에 실패했습니다.");
    } finally {
      setSettingsBusy(false);
    }
  }

  async function handleGenerateReport() {
    if (!session?.token) {
      setAuthError("먼저 로그인해 주세요.");
      return;
    }

    const providerKeyReady = settingsDraft.provider === "gemini"
      ? session.user?.settings?.hasGeminiKey
      : session.user?.settings?.hasOpenaiKey;

    if (!providerKeyReady) {
      setActiveView("settings");
      setAnalysisError("먼저 AI 설정에서 사용할 API 키를 저장해 주세요.");
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError("");

    try {
      const baseLabs = Object.fromEntries(
        Object.entries(labs).filter(([, value]) => value !== "" && Number.isFinite(Number(value)))
      );
      const extraLabs = Object.fromEntries(
        customLabs
          .filter((item) => item.name && item.value !== "" && Number.isFinite(Number(item.value)))
          .map((item) => [
            item.code,
            {
              value: Number(item.value),
              label: item.name,
              unit: item.unit,
              low: item.low === "" ? null : Number(item.low),
              high: item.high === "" ? null : Number(item.high)
            }
          ])
      );
      const cleanLabs = { ...baseLabs, ...extraLabs };

      const result = await requestMedicalAnalysis({
        provider: settingsDraft.provider,
        profile,
        disease: selectedDisease,
        labs: cleanLabs,
        token: session.token
      });

      setAnalysis(result);
      setActiveView("report");
      setAnalysisLoading(false);

      try {
        await persistMedicalReport({
          profile,
          disease: selectedDisease,
          labs: cleanLabs,
          analysis: result,
          provider: settingsDraft.provider,
          token: session.token
        });

        const { reports } = await loadMedicalReportHistory({ token: session.token });
        setHistory(reports || []);
      } catch (historyError) {
        flashToast(historyError?.message || "기록 저장 또는 기록 불러오기에 실패했습니다.", "error");
      }
    } catch (error) {
      setAnalysisError(error.message || "리포트 생성에 실패했습니다.");
      setActiveView("report");
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function handleRunOcr() {
    setOcrBusy(true);
    setAnalysisError("");
    try {
      const payload = uploadedFile
        ? await extractLabMetricsFromImage(uploadedFile, profile.ocrTemplate || "general", profile.ocrInstitutionPreset || "generic")
        : getSampleOcrPayload(profile.ocrTemplate || "general", profile.ocrInstitutionPreset || "generic");
      setOcrResult(normalizeOcrPayload(payload));
    } catch (error) {
      setAnalysisError(error.message || "OCR 분석에 실패했습니다.");
    } finally {
      setOcrBusy(false);
    }
  }

  function updateOcrMatch(index, field, value) {
    setOcrResult((current) => {
      if (!current?.matches?.length) {
        return current;
      }

      return {
        ...current,
        matches: current.matches.map((match, matchIndex) => {
          if (matchIndex !== index) {
            return match;
          }

          if (field === "enabled") {
            return { ...match, enabled: Boolean(value) };
          }

          if (field === "value") {
            return { ...match, value: value === "" ? "" : Number(value) };
          }

          return { ...match, [field]: field === "code" ? String(value || "").toUpperCase() : value };
        })
      };
    });
  }

  function handleAddOcrRow() {
    setOcrResult((current) => ({
      rawText: current?.rawText || "",
      matches: [
        ...(current?.matches || []),
        {
          enabled: true,
          label: "",
          code: `CUSTOM_${Date.now().toString().slice(-5)}`,
          value: "",
          unit: "",
          low: "",
          high: "",
          confidence: 1
        }
      ]
    }));
  }

  function handleApplyOcr() {
    if (!ocrResult?.matches?.length) {
      return;
    }
    const enabledMatches = ocrResult.matches.filter((match) => match.enabled && match.code && match.label && match.value !== "" && Number.isFinite(Number(match.value)));
    if (!enabledMatches.length) {
      return;
    }
    setLabs((current) => {
      const next = { ...current };
      enabledMatches.forEach((match) => {
        if (metricDefinitions.some((metric) => metric.code === match.code)) {
          next[match.code] = Number(match.value);
        }
      });
      return next;
    });
    setCustomLabs((current) => {
      const next = [...current];
      enabledMatches.forEach((match) => {
        if (!metricDefinitions.some((metric) => metric.code === match.code)) {
          const existingIndex = next.findIndex((item) => item.code === match.code);
          const customItem = {
            code: match.code,
            name: match.label,
            value: Number(match.value),
            unit: match.unit || "",
            low: match.low === "" ? "" : Number(match.low),
            high: match.high === "" ? "" : Number(match.high)
          };
          if (existingIndex >= 0) {
            next[existingIndex] = { ...next[existingIndex], ...customItem };
          } else {
            next.push(customItem);
          }
        }
      });
      return next;
    });
    const mergedCodes = enabledMatches.map((match) => match.code);
    setOcrMergedCodes(mergedCodes);
    setLabViewMode("table");
    setActiveLabSection("all");
    setLabSearchQuery("");
    setSelectedMetricCode(mergedCodes[0] || "");
    setActiveView("labs");
    flashToast(`OCR 결과 ${mergedCodes.length}개 항목을 표형 입력 화면으로 병합했습니다.`, "success");
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setUploadedFile(file);
    setUploadedImage(URL.createObjectURL(file));
    setOcrResult(null);
  }

  function handleLoadLatestLabs() {
    if (!latestHistoryLabs) {
      return;
    }
    setLabs((current) => ({ ...current, ...latestHistoryLabs }));
    setOcrMergedCodes([]);
    flashToast("최근 저장된 혈액검사 값을 불러왔습니다.", "success");
  }

  function handleLoadReport(report) {
    if (report?.labs) {
      setLabs((current) => ({ ...current, ...report.labs }));
    }
    if (report?.profile) {
      setProfile((current) => ({ ...current, ...report.profile }));
    }
    setAnalysis(report.analysis || null);
    setActiveView("report");
  }

  function toggleHistoryCompare(reportId) {
    setHistoryCompareIds((current) => {
      if (current.includes(reportId)) {
        return current.filter((item) => item !== reportId);
      }
      if (current.length >= 2) {
        return [current[1], reportId];
      }
      return [...current, reportId];
    });
  }

  function openReportById(reportId) {
    const targetReport = history.find((item) => item.id === reportId);
    if (!targetReport) {
      return false;
    }
    handleLoadReport(targetReport);
    return true;
  }

  async function handleScheduleReminder() {
    setNotificationBusy(true);
    setNotificationMessage("");
    try {
    flashToast("혈액검사 알림을 예약하는 중입니다.", "info");
      const result = await scheduleLabReminder({
        date: profile.nextLabDate,
        time: profile.reminderTime,
        diseaseName: selectedDisease?.name,
        displayName: profile.displayName || session?.user?.name,
        strategy: profile.reminderStrategy || "day-before-and-day-of",
        reportId: history[0]?.id,
        diseaseCode: selectedDisease?.code
      });
      setNotificationMessage(result.message || "기기 알림을 예약했습니다.");
      flashToast(result.message || "기기 알림을 예약했습니다.", "success");
    } catch (error) {
      setNotificationMessage(error.message || "기기 알림 예약에 실패했습니다.");
      flashToast(error.message || "기기 알림 예약에 실패했습니다.", "error");
    } finally {
      setNotificationBusy(false);
    }
  }

  async function handleCancelReminder() {
    setNotificationBusy(true);
    setNotificationMessage("");
    try {
      const result = await cancelLabReminder();
      setNotificationMessage(result.message || "기기 알림을 제거했습니다.");
      flashToast(result.message || "기기 알림을 제거했습니다.", "success");
    } catch (error) {
      setNotificationMessage(error.message || "기기 알림 제거에 실패했습니다.");
      flashToast(error.message || "기기 알림 제거에 실패했습니다.", "error");
    } finally {
      setNotificationBusy(false);
    }
  }

  async function handleScheduleMedicationReminder() {
    setMedicationNotificationBusy(true);
    setMedicationNotificationMessage("");
    try {
    flashToast("복약 알림을 예약하는 중입니다.", "info");
      const result = await scheduleMedicationReminder({
        reminders: profile.medicationSchedules,
        time: profile.medicationReminderTime,
        medicationText: profile.medications,
        displayName: profile.displayName || session?.user?.name,
        reportId: history[0]?.id,
        diseaseCode: selectedDisease?.code
      });
      setMedicationNotificationMessage(result.message || "복약 알림을 예약했습니다.");
      flashToast(result.message || "복약 알림을 예약했습니다.", "success");
    } catch (error) {
      setMedicationNotificationMessage(error.message || "복약 알림 예약에 실패했습니다.");
      flashToast(error.message || "복약 알림 예약에 실패했습니다.", "error");
    } finally {
      setMedicationNotificationBusy(false);
    }
  }

  async function handleCancelMedicationReminder() {
    setMedicationNotificationBusy(true);
    setMedicationNotificationMessage("");
    try {
      const result = await cancelMedicationReminder();
      setMedicationNotificationMessage(result.message || "복약 알림을 제거했습니다.");
      flashToast(result.message || "복약 알림을 제거했습니다.", "success");
    } catch (error) {
      setMedicationNotificationMessage(error.message || "복약 알림 제거에 실패했습니다.");
      flashToast(error.message || "복약 알림 제거에 실패했습니다.", "error");
    } finally {
      setMedicationNotificationBusy(false);
    }
  }

  async function handleShareReport() {
    if (!analysis) {
      setReportActionMessage("먼저 AI 리포트를 생성해 주세요.");
      flashToast("먼저 AI 리포트를 생성해 주세요.", "error");
      return;
    }

    await beginReportAction("공유 파일 준비", "공유할 리포트를 준비하고 있습니다.");
    try {
      const result = await shareReport({
        profile,
        disease: selectedDisease,
        analysis,
        metricMap: currentMetricMap,
        focusCodes: selectedDisease?.focus,
        clinicalBriefs,
        relationshipMap,
        diseaseExpertGuide,
        reportMetricClusters,
        emergencyFlags: diseaseEmergencyFlags,
        retestPriorityCards,
        symptomBrief,
        clinicianQuestions: enhancedClinicianQuestions
      });
      setReportActionMessage(result.message || "리포트를 공유했습니다.");
      flashToast(result.message || "리포트를 공유했습니다.", "success");
    } catch (error) {
      setReportActionMessage(error.message || "리포트 공유에 실패했습니다.");
      flashToast(error.message || "리포트 공유에 실패했습니다.", "error");
    } finally {
      setReportActionBusy(false);
      setReportActionLabel("");
    }
  }

  async function handleExportPdf() {
    if (!analysis) {
      setReportActionMessage("먼저 AI 리포트를 생성해 주세요.");
      flashToast("먼저 AI 리포트를 생성해 주세요.", "error");
      return;
    }

    await beginReportAction("PDF 생성", "PDF를 생성하고 저장하는 중입니다.");
    try {
      const result = await exportReportPdf({
        profile,
        disease: selectedDisease,
        analysis,
        metricMap: currentMetricMap,
        focusCodes: selectedDisease?.focus,
        clinicalBriefs,
        relationshipMap,
        diseaseExpertGuide,
        reportMetricClusters,
        emergencyFlags: diseaseEmergencyFlags,
        retestPriorityCards,
        symptomBrief,
        clinicianQuestions: enhancedClinicianQuestions
      });
      if (autoOpenExport && result?.uri) {
        await openExportedFile({
          uri: result.uri,
          title: "PDF 리포트 열기",
          text: "방금 생성한 PDF 리포트를 열거나 공유할 수 있습니다."
        });
      }
      setReportActionMessage(result.message || "PDF 저장을 완료했습니다.");
      flashToast(result.message || "PDF 저장을 완료했습니다.", "success");
    } catch (error) {
      setReportActionMessage(error.message || "PDF 저장에 실패했습니다.");
      flashToast(error.message || "PDF 저장에 실패했습니다.", "error");
    } finally {
      setReportActionBusy(false);
      setReportActionLabel("");
    }
  }

  async function handleExportImage() {
    if (!analysis) {
      setReportActionMessage("먼저 AI 리포트를 생성해 주세요.");
      flashToast("먼저 AI 리포트를 생성해 주세요.", "error");
      return;
    }

    await beginReportAction("이미지 생성", "공유용 리포트 이미지를 생성하고 있습니다.");
    try {
      const result = await exportReportImage({
        profile,
        disease: selectedDisease,
        analysis,
        metricMap: currentMetricMap,
        focusCodes: selectedDisease?.focus,
        clinicalBriefs,
        relationshipMap,
        diseaseExpertGuide,
        reportMetricClusters,
        emergencyFlags: diseaseEmergencyFlags,
        retestPriorityCards,
        symptomBrief,
        clinicianQuestions: enhancedClinicianQuestions
      });
      if (autoOpenExport && result?.uri) {
        await openExportedFile({
          uri: result.uri,
          title: "이미지 리포트 열기",
          text: "방금 생성한 리포트 이미지를 열거나 공유할 수 있습니다."
        });
      }
      setReportActionMessage(result.message || "리포트 이미지를 저장했습니다.");
      flashToast(result.message || "리포트 이미지를 저장했습니다.", "success");
    } catch (error) {
      setReportActionMessage(error.message || "리포트 이미지 저장에 실패했습니다.");
      flashToast(error.message || "리포트 이미지 저장에 실패했습니다.", "error");
    } finally {
      setReportActionBusy(false);
      setReportActionLabel("");
    }
  }

  const symptomBrief = useMemo(() => {
    const tags = Array.isArray(profile.symptomTags) ? profile.symptomTags.filter(Boolean) : [];
    const summary = String(profile.symptomSummary || "").trim();
    const watch = String(profile.symptomWatch || "").trim();
    const triggers = String(profile.symptomTriggers || "").trim();
    const relief = String(profile.symptomRelief || "").trim();
    const durationDays = Number(profile.symptomDurationDays);
    if (!tags.length && !summary && !watch && !triggers && !relief && !Number.isFinite(durationDays)) {
      return null;
    }

    const focusSignals = [];
    if (tags.some((item) => ["발열", "오한"].includes(item))) {
      focusSignals.push("발열과 오한은 감염 또는 염증 축과 함께 해석하는 것이 좋습니다.");
    }
    if (tags.some((item) => ["멍", "출혈"].includes(item))) {
      focusSignals.push("혈소판, 헤모글로빈, 응고 관련 수치를 함께 보면 출혈 경향 해석에 도움이 됩니다.");
    }
    if (tags.some((item) => ["부종", "호흡곤란"].includes(item))) {
      focusSignals.push("신장, 체액, 전해질 축을 같이 보면 부종과 호흡 관련 맥락을 정리하기 좋습니다.");
    }
    if (tags.some((item) => ["통증"].includes(item))) {
      focusSignals.push("통증이 동반되면 CRP, WBC 같은 염증 지표를 함께 보는 것이 좋습니다.");
    }
    if (tags.some((item) => ["체중감소", "식욕저하"].includes(item))) {
      focusSignals.push("영양 상태와 간기능, 염증 수치를 함께 보면 전체 흐름을 읽기 좋습니다.");
    }

    const durationText = Number.isFinite(durationDays) && durationDays > 0 ? `${durationDays}일` : symptomOnsetLabel(profile.symptomOnset);
    return {
      headline: `${symptomSeverityLabel(profile.symptomSeverity)} 강도의 증상이 ${durationText} 정도 이어지고 있습니다.`,
      summary: summary || "증상 메모가 아직 비어 있습니다. 주요 증상을 한 줄로 정리해 두면 브리핑 품질이 좋아집니다.",
      tags,
      watch,
      triggers,
      relief,
      durationDays: Number.isFinite(durationDays) ? durationDays : null,
      severity: profile.symptomSeverity,
      focusSignals: focusSignals.slice(0, 4),
      nextAction: tags.length >= 3
        ? "증상 태그가 여러 개이면 수치, 일정, 복약 맥락을 함께 묶어 보는 방식이 더 유용합니다."
        : "증상이 적더라도 최근 변화, 일정, 복약 흐름을 같이 보면 상담 준비가 쉬워집니다."
    };
  }, [profile.symptomSummary, profile.symptomSeverity, profile.symptomOnset, profile.symptomDurationDays, profile.symptomTriggers, profile.symptomRelief, profile.symptomTags, profile.symptomWatch]);
  const summaryText = analysis?.aiResult?.overall_summary || analysis?.structured?.summary?.headline || "아직 생성된 AI 리포트가 없습니다.";
  const priorityItems = reportList(analysis?.aiResult?.priority_items);
  const managementTips = reportList(analysis?.aiResult?.management_tips || analysis?.aiResult?.care_tips);
  const clinicianQuestions = reportList(analysis?.aiResult?.questions_for_clinician || analysis?.aiResult?.questions);
  const enhancedClinicianQuestions = useMemo(() => {
    const next = [...clinicianQuestions];
    if (symptomBrief?.tags?.length) {
      next.unshift(`현재 증상 태그(${symptomBrief.tags.join(", ")})와 혈액 수치가 어떻게 연결되는지 의료진에게 먼저 확인해 보세요.`);
    }
    if (symptomBrief?.durationDays) {
      next.push(`증상이 ${symptomBrief.durationDays}일 이상 이어졌다면 경과 관찰 기준과 재검 시점을 함께 물어보는 것이 좋습니다.`);
    }
    if (profile.symptomTriggers) {
      next.push(`악화 요인으로 적어 둔 "${profile.symptomTriggers}"가 수치 변화와 관련 있는지 상담해 보세요.`);
    }
    if (profile.symptomRelief) {
      next.push(`완화 요인으로 적어 둔 "${profile.symptomRelief}"가 실제 관리 전략으로 적절한지 확인해 보세요.`);
    }
    if ((profile.medicationSchedules || []).length) {
      next.push(`현재 복약 일정(${(profile.medicationSchedules || []).map((item) => `${item.label} ${item.time}`).join(", ")})이 수치 해석에 어떤 영향을 줄 수 있는지 함께 질문해 보세요.`);
    }
    return [...new Set(next.filter(Boolean))].slice(0, 6);
  }, [clinicianQuestions, symptomBrief, profile.symptomTriggers, profile.symptomRelief, profile.medicationSchedules]);
  const agentSignals = useMemo(() => {
    const signalCodes = selectedDisease?.focus?.length
      ? selectedDisease.focus
      : combinedMetrics
          .filter((metric) => classifyMetric(metric, customLabs.find((item) => item.code === metric.code)?.value ?? labs[metric.code]) !== "normal")
          .slice(0, 4)
          .map((metric) => metric.code);

    return signalCodes
      .map((code) => combinedMetrics.find((metric) => metric.code === code))
      .filter(Boolean)
      .map((metric) => ({
        code: metric.code,
        name: metric.name,
        value: formatMetricValue(customLabs.find((item) => item.code === metric.code)?.value ?? labs[metric.code]),
        unit: metric.unit,
        status: classifyMetric(metric, customLabs.find((item) => item.code === metric.code)?.value ?? labs[metric.code])
      }));
  }, [selectedDisease, combinedMetrics, customLabs, labs]);
  const infographicMetrics = useMemo(() => {
    return combinedMetrics
      .map((metric) => {
        const value = customLabs.find((item) => item.code === metric.code)?.value ?? labs[metric.code];
        const status = classifyMetric(metric, value);
        return {
          code: metric.code,
          name: metric.name,
          unit: metric.unit,
          value: formatMetricValue(value),
          status,
          severity: metricSeverityScore(metric, value),
          valueRaw: value
        };
      })
      .filter((metric) => metric.status !== "normal" && metric.value !== "-")
      .sort((left, right) => right.severity - left.severity)
      .slice(0, 5);
  }, [combinedMetrics, customLabs, labs]);
  const abnormalRatio = useMemo(() => {
    const total = combinedMetrics.length || 1;
    return Math.round((abnormalCount / total) * 100);
  }, [abnormalCount, combinedMetrics.length]);
  const reportRiskBand = useMemo(() => {
    if (abnormalCount >= 5 || abnormalRatio >= 45) {
      return { label: "고위험 브리핑", tone: "high" };
    }

    if (abnormalCount >= 2 || abnormalRatio >= 20) {
      return { label: "주의 브리핑", tone: "medium" };
    }

    return { label: "안정 브리핑", tone: "low" };
  }, [abnormalCount, abnormalRatio]);
  const emergencyFlags = useMemo(() => {
    const flags = [];
    const hgb = Number(currentMetricMap.HGB);
    const plt = Number(currentMetricMap.PLT);
    const anc = Number(currentMetricMap.ANC);
    const crp = Number(currentMetricMap.CRP);
    const creat = Number(currentMetricMap.CREAT);
    const potassium = Number(currentMetricMap.K);

    if (Number.isFinite(hgb) && hgb < 7) {
      flags.push({ level: "critical", title: "중증 빈혈 가능성 점검", detail: `HGB ${hgb} g/dL`, message: "호흡곤란, 어지럼, 실신감이 함께 있으면 지체 없이 의료진 판단을 우선해야 합니다." });
    }
    if (Number.isFinite(plt) && plt < 30) {
      flags.push({ level: "critical", title: "혈소판 매우 낮음", detail: `PLT ${plt}`, message: "출혈, 코피, 잇몸출혈, 멍이 있으면 응급 여부를 먼저 확인해야 합니다." });
    }
    if (Number.isFinite(anc) && anc < 500) {
      flags.push({ level: "critical", title: "호중구감소 고위험", detail: `ANC ${anc}`, message: "발열이나 오한이 동반되면 감염 위험이 높아 빠른 상담이 필요할 수 있습니다." });
    }
    if (Number.isFinite(potassium) && (potassium >= 6 || potassium <= 2.8)) {
      flags.push({ level: "critical", title: "칼륨 급격 변화 주의", detail: `K ${potassium}`, message: "두근거림, 근력저하, 흉부 불편감이 동반되면 즉시 의료진 판단이 필요합니다." });
    }
    if (Number.isFinite(creat) && creat >= 3.5) {
      flags.push({ level: "watch", title: "신기능 악화 가능성", detail: `Creatinine ${creat}`, message: "소변량 변화, 부종, 탈수 여부와 함께 보면 판단이 더 정확해집니다." });
    }
    if (Number.isFinite(crp) && crp >= 10) {
      flags.push({ level: "watch", title: "염증/감염 활성 가능성", detail: `CRP ${crp}`, message: "발열, 통증, 기침, 최근 처치와 함께 증상 메모를 남겨 두는 것이 좋습니다." });
    }

    return flags.slice(0, 4);
  }, [currentMetricMap]);
  const retestPriorityCards = useMemo(() => {
    return combinedMetrics
      .map((metric) => {
        const value = currentMetricMap[metric.code];
        const numeric = Number(value);
        const status = classifyMetric(metric, value);
        if (status === "normal" || status === "unknown" || !Number.isFinite(numeric)) {
          return null;
        }
        const low = Number(metric.range?.low);
        const high = Number(metric.range?.high);
        let severity = 16;
        if (Number.isFinite(low) && numeric < low && Math.abs(low) > 0) {
          severity = Math.abs((low - numeric) / Math.max(Math.abs(low), 1)) * 100;
        }
        if (Number.isFinite(high) && numeric > high && Math.abs(high) > 0) {
          severity = Math.abs((numeric - high) / Math.max(Math.abs(high), 1)) * 100;
        }
        return {
          code: metric.code,
          name: metric.name,
          value: numeric,
          unit: metric.unit,
          severity,
          message: status === "high" ? metric.highText : metric.lowText
        };
      })
      .filter(Boolean)
      .sort((left, right) => right.severity - left.severity)
      .slice(0, 4);
  }, [combinedMetrics, currentMetricMap]);
  const diseaseEmergencyFlags = useMemo(() => {
    if (!selectedDisease) {
      return emergencyFlags;
    }

    const flags = [...emergencyFlags];
    const wbc = Number(currentMetricMap.WBC);
    const alb = Number(currentMetricMap.ALB);
    const tBil = Number(currentMetricMap.TBIL);
    const glucose = Number(currentMetricMap.GLU);

    if (selectedDisease.group?.includes("혈액암") && Number.isFinite(wbc) && wbc > 50) {
      flags.unshift({ level: "critical", title: "혈액암 고백혈구 상태 점검", detail: `WBC ${wbc}`, message: "호흡곤란, 두통, 시야 변화가 있으면 즉시 의료진 판단을 우선해야 합니다." });
    }
    if (selectedDisease.group?.includes("간") && Number.isFinite(tBil) && tBil >= 3) {
      flags.unshift({ level: "watch", title: "황달/담즙정체 맥락 점검", detail: `TBIL ${tBil}`, message: "황달, 소변색 변화, 복부 불편감이 있으면 빠른 상담이 필요할 수 있습니다." });
    }
    if (selectedDisease.group?.includes("신장") && Number.isFinite(alb) && alb < 3) {
      flags.unshift({ level: "watch", title: "알부민 저하 맥락 점검", detail: `ALB ${alb}`, message: "부종, 체중 증가, 식사량 변화를 같이 해석하면 임상 의미가 더 분명해집니다." });
    }
    if (selectedDisease.group?.includes("대사") && Number.isFinite(glucose) && glucose >= 250) {
      flags.unshift({ level: "watch", title: "고혈당 조절 상태 점검", detail: `GLU ${glucose}`, message: "갈증, 다뇨, 식사/인슐린 일정과 함께 보면 판단 시점이 더 분명해집니다." });
    }

    return flags.slice(0, 5);
  }, [selectedDisease, emergencyFlags, currentMetricMap]);
  const comparedReports = useMemo(() => history.filter((report) => historyCompareIds.includes(report.id)), [history, historyCompareIds]);
  const historyCompareMetrics = useMemo(() => {
    if (comparedReports.length !== 2) {
      return [];
    }
    const [left, right] = comparedReports;
    const focusCodes = [...new Set([...(left.disease?.focus || []), ...(right.disease?.focus || []), "WBC", "HGB", "PLT", "CRP", "CREAT"])].slice(0, 8);
    return focusCodes.map((code) => {
      const metric = combinedMetrics.find((item) => item.code === code);
      if (!metric) {
        return null;
      }
      const leftValue = left.labs?.[code];
      const rightValue = right.labs?.[code];
      const delta = Number.isFinite(Number(leftValue)) && Number.isFinite(Number(rightValue)) ? Number(rightValue) - Number(leftValue) : null;
      return {
        code,
        name: metric.name,
        unit: metric.unit,
        leftValue,
        rightValue,
        delta,
        intensity: delta === null ? 0 : Math.min(100, Math.abs(delta) / Math.max(Math.abs(Number(leftValue)) || 1, 1) * 100)
      };
    }).filter(Boolean);
  }, [comparedReports, combinedMetrics]);
  const trendMetrics = useMemo(() => {
    const candidateCodes = [
      ...(selectedDisease?.focus || []),
      ...agentSignals.map((signal) => signal.code),
      ...infographicMetrics.map((metric) => metric.code)
    ];

    const codes = [...new Set(candidateCodes)].slice(0, 4);
    const reportsChrono = [...history].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));

    return codes
      .map((code) => {
        const metric = combinedMetrics.find((item) => item.code === code);
        if (!metric) {
          return null;
        }

        const reportPoints = reportsChrono
          .map((report) => ({
            label: formatTrendDate(report.createdAt),
            value: extractNumericLabValue(report.labs, code)
          }))
          .filter((point) => point.label && point.value !== null);

        const currentValue = extractNumericLabValue(
          {
            ...labs,
            ...Object.fromEntries(customLabs.map((item) => [item.code, { value: item.value }]))
          },
          code
        );

        const points = [...reportPoints];
        if (currentValue !== null) {
          points.push({
            label: "?꾩옱",
            value: currentValue
          });
        }

        const trimmed = points.slice(-6);
        if (!trimmed.length) {
          return null;
        }

        const values = trimmed.map((point) => point.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const spread = max - min || 1;
    const first = trimmed[0]?.value ?? currentValue ?? 0;
    const last = trimmed[trimmed.length - 1]?.value ?? currentValue ?? 0;
        const delta = last - first;

        return {
          code,
          name: metric.name,
          unit: metric.unit,
          latest: formatMetricValue(last),
          delta,
          status: classifyMetric(metric, last),
          points: trimmed.map((point, index) => ({
            ...point,
            x: trimmed.length === 1 ? 120 : 16 + (208 / (trimmed.length - 1)) * index,
            y: 72 - ((point.value - min) / spread) * 48
          }))
        };
      })
      .filter(Boolean);
  }, [selectedDisease, agentSignals, infographicMetrics, history, combinedMetrics, labs, customLabs]);
  const diseaseInsights = useMemo(() => {
    if (profile.mode !== "patient" || !selectedDisease) {
      return [];
    }

    return (selectedDisease.focus || []).map((code) => {
      const metric = combinedMetrics.find((item) => item.code === code);
      if (!metric) {
        return null;
      }

      const value = currentMetricMap[code];
      const status = classifyMetric(metric, value);
      const severity = metricSeverityScore(metric, value);
      const directionText = status === "high"
        ? metric.highText
        : status === "low"
          ? metric.lowText
          : metric.generalTip;

      return {
        code,
        name: metric.name,
        value: formatMetricValue(value),
        unit: metric.unit,
        status,
        severity,
        summary: `${selectedDisease.name} 문맥에서 ${metric.name}(${metric.code})는 ${formatStatusLabel(status)} 상태입니다.`, 
        meaning: metric.meaning,
        directionText,
        askDoctor: `${metric.name} 변화가 현재 치료 경과나 병세 판단에서 어떤 의미인지 확인해 보세요.`
      };
    }).filter(Boolean);
  }, [profile.mode, selectedDisease, combinedMetrics, currentMetricMap]);
  const clinicalBriefs = useMemo(() => {
    const byCode = (code) => {
      const metric = combinedMetrics.find((item) => item.code === code);
      if (!metric) return null;
      const rawValue = currentMetricMap[code];
      return {
        metric,
        value: rawValue,
        status: classifyMetric(metric, rawValue),
        displayValue: formatMetricValue(rawValue)
      };
    };

    const hgb = byCode("HGB");
    const rbc = byCode("RBC");
    const ferritin = byCode("FERRITIN");
    const wbc = byCode("WBC");
    const anc = byCode("ANC");
    const crp = byCode("CRP");
    const creat = byCode("CREAT");
    const bun = byCode("BUN");
    const sodium = byCode("NA");
    const potassium = byCode("K");
    const ast = byCode("AST");
    const alt = byCode("ALT");
    const albumin = byCode("ALB");
    const tbil = byCode("TBIL");
    const glu = byCode("GLU");
    const a1c = byCode("HBA1C");

    const cards = [];

    if (hgb || rbc || ferritin) {
      const flags = [hgb, rbc, ferritin].filter((item) => item && item.status !== "normal" && item.status !== "unknown");
      cards.push({
        id: "hematology",
        title: "혈구계 브리핑",
        tone: flags.length >= 2 ? "high" : flags.length === 1 ? "medium" : "calm",
        summary: flags.length >= 2
          ? "혈구계가 동시에 흔들리면 빈혈, 출혈 경향, 치료 영향까지 함께 보는 것이 중요합니다."
          : "혈구계는 한 항목만 보기보다 RBC, HGB, PLT 흐름을 함께 보는 편이 해석 안정성이 높습니다.",
        bullets: [
          hgb ? `HGB ${hgb.displayValue} ${hgb.metric.unit} · ${formatStatusLabel(hgb.status)}` : null,
          rbc ? `RBC ${rbc.displayValue} ${rbc.metric.unit} · ${formatStatusLabel(rbc.status)}` : null,
          ferritin ? `Ferritin ${ferritin.displayValue} ${ferritin.metric.unit} · ${formatStatusLabel(ferritin.status)}` : null
        ].filter(Boolean),
        question: "빈혈 양상이 단순 수치 이상인지, 치료·영양·출혈·염증 맥락까지 같이 봐야 하는지 질문해 보세요."
      });
    }

    if (wbc || anc || crp) {
      const flags = [wbc, anc, crp].filter((item) => item && item.status !== "normal" && item.status !== "unknown");
      cards.push({
        id: "infection",
        title: "염증/감염 브리핑",
        tone: flags.length >= 2 ? "high" : flags.length === 1 ? "medium" : "calm",
        summary: flags.length >= 2
          ? "백혈구, ANC, CRP가 함께 움직이면 감염인지 염증 반응인지 치료 영향인지 구분해서 보는 것이 중요합니다."
          : "염증 해석은 WBC 또는 CRP 한 항목만으로 단정하기보다 ANC, 증상, 복약 이력을 함께 보는 편이 안전합니다.",
        bullets: [
          wbc ? `WBC ${wbc.displayValue} ${wbc.metric.unit} · ${formatStatusLabel(wbc.status)}` : null,
          anc ? `ANC ${anc.displayValue} ${anc.metric.unit} · ${formatStatusLabel(anc.status)}` : null,
          crp ? `CRP ${crp.displayValue} ${crp.metric.unit} · ${formatStatusLabel(crp.status)}` : null
        ].filter(Boolean),
        question: "최근 발열, 항생제 사용, G-CSF 사용, 항암 치료 일정과 함께 해석해야 하는지 확인해 보세요."
      });
    }

    if (creat || bun || sodium || potassium) {
      const flags = [creat, bun, sodium, potassium].filter((item) => item && item.status !== "normal" && item.status !== "unknown");
      cards.push({
        id: "renal",
        title: "신장/전해질 브리핑",
        tone: flags.length >= 2 ? "high" : flags.length === 1 ? "medium" : "calm",
        summary: flags.length >= 2
          ? "신장기능과 전해질이 함께 흔들리면 탈수, 수액, 입원 경과, 수혈/투석 여부까지 함께 읽어야 해설이 분명해집니다."
          : "BUN, Creatinine, Na, K는 서로 연결되어 있어 한 항목보다 묶어서 보는 편이 좋습니다.",
        bullets: [
          creat ? `Creatinine ${creat.displayValue} ${creat.metric.unit} · ${formatStatusLabel(creat.status)}` : null,
          bun ? `BUN ${bun.displayValue} ${bun.metric.unit} · ${formatStatusLabel(bun.status)}` : null,
          sodium ? `Na ${sodium.displayValue} ${sodium.metric.unit} · ${formatStatusLabel(sodium.status)}` : null,
          potassium ? `K ${potassium.displayValue} ${potassium.metric.unit} · ${formatStatusLabel(potassium.status)}` : null
        ].filter(Boolean),
        question: "수분 상태, 이뇨제/신독성 약물, 최근 수액/투석 여부를 함께 반영해야 하는지 물어보세요."
      });
    }

    if (ast || alt || albumin || tbil) {
      const flags = [ast, alt, albumin, tbil].filter((item) => item && item.status !== "normal" && item.status !== "unknown");
      cards.push({
        id: "liver",
        title: "간기능/영양 브리핑",
        tone: flags.length >= 2 ? "high" : flags.length === 1 ? "medium" : "calm",
        summary: flags.length >= 2
          ? "간수치 상승과 알부민, 빌리루빈 변화가 같이 있으면 간질환뿐 아니라 영양·염증·치료 영향도 함께 봐야 합니다."
          : "AST와 ALT가 일시적 상승인지, 치료 반응인지, 다른 간기능 항목과 같이 움직이는지 확인하는 것이 중요합니다.",
        bullets: [
          ast ? `AST ${ast.displayValue} ${ast.metric.unit} · ${formatStatusLabel(ast.status)}` : null,
          alt ? `ALT ${alt.displayValue} ${alt.metric.unit} · ${formatStatusLabel(alt.status)}` : null,
          albumin ? `Albumin ${albumin.displayValue} ${albumin.metric.unit} · ${formatStatusLabel(albumin.status)}` : null,
          tbil ? `TBIL ${tbil.displayValue} ${tbil.metric.unit} · ${formatStatusLabel(tbil.status)}` : null
        ].filter(Boolean),
        question: "수치 변화 원인이 염증인지, 영양 상태와 연결되는지, 추적 검사 간격이 필요한지 상담해 보세요."
      });
    }

    if (glu || a1c) {
      const flags = [glu, a1c].filter((item) => item && item.status !== "normal" && item.status !== "unknown");
      cards.push({
        id: "metabolic",
        title: "대사/혈당 브리핑",
        tone: flags.length >= 2 ? "medium" : flags.length === 1 ? "medium" : "calm",
        summary: flags.length
          ? "혈당 해석은 공복 여부, 스테로이드나 항암제 사용, 최근 식사 시점에 따라 크게 달라질 수 있습니다."
          : "혈당과 HbA1c는 단기 상태와 장기 조절 상태를 함께 보여주는 조합입니다.",
        bullets: [
          glu ? `Glucose ${glu.displayValue} ${glu.metric.unit} · ${formatStatusLabel(glu.status)}` : null,
          a1c ? `HbA1c ${a1c.displayValue} ${a1c.metric.unit} · ${formatStatusLabel(a1c.status)}` : null
        ].filter(Boolean),
        question: "공복/비공복인지, 약물 영향인지, 장기 조절 목표와 비교해야 하는지 확인해 보세요."
      });
    }

    return cards.filter((card) => card.bullets.length).slice(0, 5);
  }, [combinedMetrics, currentMetricMap]);
  const ocrReferenceAlerts = useMemo(() => {
    if (!ocrResult?.matches?.length) {
      return [];
    }

    return ocrResult.matches
      .filter((match) => match.enabled)
      .map((match) => {
        const reference = resolveReferenceRange(match);
        const status = classifyOcrReferenceStatus(match);
        if (!reference || status === "normal" || status === "unknown") {
          return null;
        }

        return {
          code: match.code,
          label: match.label,
          status,
          message: `${match.label}(${match.code})가 ${status === "high" ? "참고범위보다 높게" : "참고범위보다 낮게"} 확인됩니다.`, 
          detail: `값 ${match.value} · 참고 ${reference.low}-${reference.high}${reference.source === "ocr" ? " (OCR 추출)" : " (기본 범위)"}`
        };
      })
      .filter(Boolean)
      .slice(0, 6);
  }, [ocrResult]);
  const reportMetricClusters = useMemo(() => {
    const focusCodes = selectedDisease?.focus || [];
    const customCodes = customLabs.map((item) => item.code);
    const groups = {};

    infographicMetrics.forEach((metric) => {
      const sectionId = metricSectionCode(metric.code, focusCodes, customCodes);
        const label = LAB_SECTION_OPTIONS.find((item) => item.id === sectionId)?.label || "기타";
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(metric);
    });

    return Object.entries(groups).map(([label, metrics]) => {
      const topSeverity = Math.max(...metrics.map((item) => item.severity || 0));
      return {
        label,
        metrics,
        tone: topSeverity >= 26 ? "high" : topSeverity >= 10 ? "medium" : "calm"
      };
    });
  }, [infographicMetrics, selectedDisease, customLabs]);
  const relationshipMap = useMemo(() => {
    return clinicalBriefs.map((card) => ({
      id: card.id,
      title: card.title,
      nodes: card.bullets.map((item) => item.split(" ")[0]).slice(0, 4),
      summary: card.summary,
      question: card.question,
      tone: card.tone
    }));
  }, [clinicalBriefs]);
  const changeAlerts = useMemo(() => {
    return trendMetrics
      .filter((metric) => metric.points.length >= 2)
      .map((metric) => {
        const status = metric.status;
        const absoluteDelta = Math.abs(metric.delta);
        const level = absoluteDelta >= 10 ? "high" : absoluteDelta >= 4 ? "medium" : "low";
        const direction = metric.delta > 0 ? "상승" : metric.delta < 0 ? "하락" : "유지";

        return {
          code: metric.code,
          name: metric.name,
          status,
          level,
          message: `${metric.name}이(가) 최근 기록 대비 ${direction} 흐름입니다.`, 
        detail: absoluteDelta > 0 ? `변화량 ${metric.delta.toFixed(1)} ${metric.unit}` : "아직 수치 변화는 크게 보이지 않습니다."
        };
      })
      .sort((left, right) => {
        const priority = { high: 3, medium: 2, low: 1 };
        return priority[right.level] - priority[left.level];
      })
      .slice(0, 4);
  }, [trendMetrics]);
  const outpatientSummary = useMemo(() => {
    const latestHistory = history[0];
    const medicationLines = (profile.medicationSchedules || []).slice(0, 3).map((item) => `${item.label} ${item.time}`);
    const checklist = [
      selectedDisease ? `${selectedDisease.name} 기준으로 ${selectedDisease.focus?.slice(0, 3).join(", ")} 수치를 우선 정리해 두었습니다.` : "질환 선택이 없어도 최근 검사 흐름과 핵심 수치를 먼저 정리해 둘 수 있습니다.",
      symptomBrief?.headline || "증상 정보가 아직 없어 수치 중심으로 브리핑합니다.",
      changeAlerts[0]?.message || "최근 기록 비교에서 아직 큰 변화 신호는 확인되지 않았습니다.",
      medicationLines.length ? `복약 일정: ${medicationLines.join(", ")}` : "등록된 복약 일정이 없어 검사와 증상 중심으로 안내합니다."
    ].filter(Boolean).slice(0, 4);

    return {
      headline: selectedDisease ? `${selectedDisease.name} 기준으로 다음 외래 전에 확인할 포인트를 묶었습니다.` : "다음 외래 전에 최근 검사와 증상 맥락을 먼저 정리했습니다.",
      historySummary: latestHistory ? `${new Date(latestHistory.createdAt).toLocaleDateString("ko-KR")}에 생성한 최근 리포트를 기준으로 요약했습니다.` : "최근 기록이 아직 적어 현재 입력값 중심으로 요약합니다.",
      medicationSummary: medicationLines.length ? medicationLines.join(" / ") : "등록된 복약 일정이 없습니다.",
      checklist
    };
  }, [history, profile.medicationSchedules, selectedDisease, symptomBrief, changeAlerts]);

  const historyTrendSeries = useMemo(() => {
    if (history.length < 2) {
      return [];
    }

    const reportsChrono = [...history].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt)).slice(-6);
    const codes = [...new Set([...(selectedDisease?.focus || []), "WBC", "HGB", "PLT", "CRP", "CREAT"])].slice(0, 6);

    return codes.map((code) => {
      const metric = combinedMetrics.find((item) => item.code === code);
      if (!metric) {
        return null;
      }

      const values = reportsChrono
        .map((report) => ({
          label: formatTrendDate(report.createdAt),
          value: extractNumericLabValue(report.labs, code)
        }))
        .filter((item) => Number.isFinite(item.value));

      if (values.length < 2) {
        return null;
      }

      const numericValues = values.map((item) => item.value);
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const spread = max - min || 1;
      const points = values.map((item, index) => ({
        x: 18 + (index * (204 / Math.max(values.length - 1, 1))),
        y: 68 - (((item.value - min) / spread) * 48),
        label: item.label,
        value: item.value
      }));
      const latest = values[values.length - 1];
      const first = values[0];
      const delta = latest.value - first.value;

      return {
        code,
        name: metric.name,
        tone: delta > 0 ? "rise" : delta < 0 ? "fall" : "flat",
        latestLabel: `${formatMetricValue(latest.value)} ${metric.unit}`,
        points
      };
    }).filter(Boolean);
  }, [history, selectedDisease, combinedMetrics]);

  const retestGuidance = useMemo(() => {
    const focusAbnormal = diseaseInsights.filter((item) => item.status !== "normal" && item.status !== "unknown").length;
    const severeCount = infographicMetrics.filter((item) => item.severity >= 18).length;

    if (profile.mode === "patient" && focusAbnormal >= 2) {
      return {
        title: "빠른 재확인 권장",
        window: "1~3일 내 재평가 검토",
        detail: `${selectedDisease?.name || "현재 질환"} 문맥에서 이상 수치가 여러 개 보입니다. 증상과 함께 의료진 상담 시점을 앞당기는 것이 좋습니다.`
      };
    }

    if (severeCount >= 2 || abnormalCount >= 4) {
      return {
        title: "단기 추적 필요",
        window: "이번 주 내 흐름 확인 권장",
        detail: "이상 수치가 여러 항목에서 겹칩니다. 최근 변화와 복약, 증상 경과를 함께 정리해 두는 것이 좋습니다."
      };
    }

    if (changeAlerts.some((alert) => alert.level === "high")) {
      return {
        title: "변화 추적 우선",
        window: "며칠 간격 비교 권장",
        detail: "최근 기록 사이 변화가 보여서 추세 비교, 증상 변화, 재검 간격을 함께 확인하는 것이 좋습니다."
      };
    }

    return {
      title: "정기 추적 유지",
      window: "기존 일정에 맞춰 확인",
      detail: "현재 정보만으로는 급한 플래그보다 꾸준한 기록 축적과 상담 준비가 더 중요해 보입니다."
    };
  }, [profile.mode, diseaseInsights, infographicMetrics, abnormalCount, changeAlerts, selectedDisease]);
  const agentAgenda = useMemo(() => {
    const items = [];

    if (profile.nextLabDate) {
      items.push({
        type: "lab",
        title: "혈액검사 예정",
        detail: `${profile.nextLabDate} · ${profile.reminderTime || "09:00"}`,
        tone: "accent"
      });
    }

    medicationItems.forEach((item, index) => {
      items.push({
        type: "medication",
        title: `복약 일정 ${index + 1}`,
        detail: item,
        tone: "calm"
      });
    });

    if (profile.symptomWatch) {
      items.push({
        type: "symptom",
        title: "증상 관찰 메모",
        detail: profile.symptomWatch,
        tone: "warn"
      });
    }

    if (changeAlerts[0]) {
      items.push({
        type: "change",
        title: "변화 감지",
        detail: `${changeAlerts[0].name}: ${changeAlerts[0].message}`,
        tone: changeAlerts[0].level === "high" ? "warn" : "calm"
      });
    }

    return items.slice(0, 5);
  }, [profile.nextLabDate, profile.reminderTime, profile.symptomWatch, medicationItems, changeAlerts]);

  if (!sessionReady) {
    return <div className="loading-screen">세션 상태를 확인하는 중입니다...</div>;
  }

  if (!session) {
    const isSignupMode = authMode === "signup";
    const isFindIdMode = authMode === "find_id";
    const isResetPasswordMode = authMode === "reset_password";
    const isRecoveryMode = isFindIdMode || isResetPasswordMode;

    return (
      <div className="auth-shell">
        <div className="auth-hero">
          <div className="auth-hero-art" aria-hidden="true">
            <div className="hero-drop hero-drop-main">
              <div className="hero-drop-core">
                <span className="hero-drop-line hero-drop-line-1" />
                <span className="hero-drop-line hero-drop-line-2" />
                <span className="hero-drop-line hero-drop-line-3" />
                <span className="hero-drop-dot" />
              </div>
            </div>
            <div className="hero-drop hero-drop-soft hero-drop-left" />
            <div className="hero-drop hero-drop-soft hero-drop-right" />
            <div className="hero-info-card">
              <span className="hero-info-label">BLOOD INSIGHT AGENT</span>
              <strong>혈액 수치 · 질환 · 증상 브리핑</strong>
            </div>
          </div>
          <div className="auth-hero-copy">
            <h1><span>Blood Insight</span><br /><span>혈액으로 알아보는 나의 건강</span></h1>
            <p className="hero-copy-two-line">
              <span>혈액 검사 결과를 읽기 쉽게 정리하고, 질환과 증상 맥락까지</span>
              <span>함께 해설해 주는 개인 건강 AI 에이전트입니다.</span>
            </p>
          </div>
          <div className="hero-checks">
            <span>회원 전용 기록 저장</span>
            <span>Gemini / ChatGPT 직접 입력</span>
            <span>환자용 질환 코드 검색 강화</span>
          </div>
        </div>

        <form className="auth-card" onSubmit={isRecoveryMode ? handleRecoverySubmit : handleAuthSubmit}>
          <div className="auth-form-head">
            <div>
              <p className="eyebrow">{isSignupMode ? "CREATE ACCOUNT" : isFindIdMode ? "ACCOUNT LOOKUP" : isResetPasswordMode ? "RESET PASSWORD" : "WELCOME BACK"}</p>
              <h3 className="auth-form-title">{isSignupMode ? "회원가입" : isFindIdMode ? "아이디 찾기" : isResetPasswordMode ? "비밀번호 재설정" : "로그인"}</h3>
              <p className="auth-form-copy">
                {isSignupMode
                  ? "이름과 계정을 만들고 개인 혈액검사 브리핑을 시작하세요."
                  : isFindIdMode
                    ? "가입한 이름을 입력하면 저장된 계정 이메일을 마스킹해서 안내해 드립니다."
                    : isResetPasswordMode
                      ? "이름과 이메일을 확인한 뒤 새 비밀번호를 다시 설정할 수 있습니다."
                      : "이메일과 비밀번호를 입력하고 바로 브리핑을 시작하세요."}
              </p>
            </div>
            <button
              type="button"
              className="ghost-btn small auth-mode-link"
              onClick={() => switchAuthMode(isSignupMode ? "login" : "signup")}
            >
              {isSignupMode ? "로그인으로 돌아가기" : "회원가입"}
            </button>
          </div>

          {(isSignupMode || isFindIdMode || isResetPasswordMode) && (
            <label>
              이름
              <input
                value={isSignupMode ? authForm.name : recoveryForm.name}
                onChange={(event) => isSignupMode
                  ? setAuthForm((current) => ({ ...current, name: event.target.value }))
                  : setRecoveryForm((current) => ({ ...current, name: event.target.value }))}
                placeholder={"예: Pink Rainbow 또는 강민성"}
              />
            </label>
          )}

          {!isFindIdMode && <label>
            이메일
            <input
              type="email"
              value={isResetPasswordMode ? recoveryForm.email : authForm.email}
              onChange={(event) => isResetPasswordMode
                ? setRecoveryForm((current) => ({ ...current, email: event.target.value }))
                : setAuthForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="name@example.com"
            />
          </label>}

          {!isRecoveryMode && <label>
            비밀번호
            <input
              type="password"
              value={authForm.password}
              onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
              placeholder={"6자 이상"}
            />
          </label>}

          {isSignupMode && (
            <label>
              비밀번호 확인
              <input
                type="password"
                value={authForm.confirmPassword}
                onChange={(event) => setAuthForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                placeholder={"비밀번호를 다시 입력해 주세요"}
              />
            </label>
          )}

          {isResetPasswordMode && (
            <>
              <label>
                새 비밀번호
                <input
                  type="password"
                  value={recoveryForm.newPassword}
                  onChange={(event) => setRecoveryForm((current) => ({ ...current, newPassword: event.target.value }))}
                  placeholder={"6자 이상 새 비밀번호"}
                />
              </label>
              <label>
                새 비밀번호 확인
                <input
                  type="password"
                  value={recoveryForm.confirmPassword}
                  onChange={(event) => setRecoveryForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  placeholder={"새 비밀번호를 다시 입력해 주세요"}
                />
              </label>
            </>
          )}

          {!isRecoveryMode && (
            <div className="auth-inline-actions">
              <label className="check-row">
                <input type="checkbox" checked={autoLoginEnabled} onChange={(event) => setAutoLoginEnabled(event.target.checked)} />
                <span>자동 로그인 사용</span>
              </label>
              {localStorage.getItem(STORAGE_KEYS.token) ? (
                <button type="button" className="ghost-btn small" onClick={handleSavedSessionLogin} disabled={authBusy}>
                  저장된 세션으로 로그인
                </button>
              ) : null}
            </div>
          )}

          {authMode === "login" && (
            <div className="auth-recovery-row">
              <button type="button" className="ghost-btn small auth-secondary-link" onClick={() => switchAuthMode("find_id")}>
                아이디 찾기
              </button>
              <button type="button" className="ghost-btn small auth-secondary-link" onClick={() => switchAuthMode("reset_password")}>
                비밀번호 재설정
              </button>
            </div>
          )}

          {authError && <div className="inline-error">{authError}</div>}
          {authInfo && <div className="inline-note">{authInfo}</div>}

          <button className="primary-btn wide" type="submit" disabled={authBusy}>
            {authBusy ? "처리 중..." : isSignupMode ? "계정 만들기" : isFindIdMode ? "아이디 찾기" : isResetPasswordMode ? "비밀번호 재설정" : "로그인"}
          </button>

          {isRecoveryMode && (
            <button type="button" className="ghost-btn wide" onClick={() => switchAuthMode("login")} disabled={authBusy}>
              로그인으로 돌아가기
            </button>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="ambient ambient-c" />

      <aside className="sidebar glass-card">
        <div className="sidebar-brand">
          <div className="brand-mark">BI</div>
          <div>
            <strong>Blood Insight Agent</strong>
            <p>{preferredDisplayName}님 전용 개인 혈액검사 브리핑 에이전트</p>
          </div>
        </div>

        <nav className="menu-list">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`menu-item ${activeView === item.id ? "active" : ""}`}
              onClick={() => setActiveView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-status">
          <div>
              <span className="sidebar-label">AI 공급자</span>
            <strong>{settingsDraft.provider === "gemini" ? "Gemini" : "ChatGPT"}</strong>
          </div>
          <div>
            <span className="sidebar-label">질환 선택</span>
            <strong>{selectedDisease ? selectedDisease.name : profile.mode === "patient" ? "선택 필요" : "일반 해설 모드"}</strong>
          </div>
          <div>
            <span className="sidebar-label">이상 수치</span>
            <strong>{abnormalCount}개</strong>
          </div>
        </div>

        <button className="ghost-btn wide" type="button" onClick={handleLogout}>로그아웃</button>
      </aside>

      <div className="content-area">
        <header className="topbar glass-card topbar-compact">
          <div>
            <p className="eyebrow">BLOOD INSIGHT AGENT</p>
                <h2>{activeView === "dashboard" ? "메인 대시보드" : NAV_ITEMS.find((item) => item.id === activeView)?.label}</h2>
                <small>{preferredDisplayName}님 맞춤 브리핑</small>
          </div>
          <div className="topbar-status-row">
            <span className="chip accent">{settingsDraft.provider === "gemini" ? "Gemini" : "ChatGPT"}</span>
                <span className={`chip ${readiness.apiKey ? "good" : "warn"}`}>{readiness.apiKey ? "AI 연결 완료" : "AI 설정 필요"}</span>
            <button type="button" className="ghost-btn small topbar-logout-btn" onClick={handleLogout}>로그아웃</button>
          </div>
        </header>

        {activeView === "dashboard" && (
          <section className="screen-grid dashboard-grid">
            <article className="glass-card hero-card hero-card-compact">
              <div className="hero-brandline">
                <span className="chip accent">Blood Insight</span>
                <span className="chip">혈액으로 알아보는 나의 건강</span>
              </div>
              <h3><span>Blood Insight,</span><br /><span>혈액으로 알아보는 나의 건강</span></h3>
              <p>
              혈액 수치, 증상, 질환, 복약 일정을 함께 읽어주는 개인 맞춤형 건강 브리핑 대시보드입니다.
              </p>
              <div className="agent-signal-grid">
                {agentSignals.map((signal) => (
                  <div key={signal.code} className={`signal-card signal-${signal.status}`}>
                    <span>{signal.code}</span>
                    <strong>{signal.value} {signal.unit}</strong>
                    <small>{signal.name}</small>
                  </div>
                ))}
              </div>
              <div className="dashboard-action-row">
                <button className="primary-btn" type="button" onClick={handleGenerateReport} disabled={analysisLoading}>
                  {analysisLoading ? "AI 리포트 생성 중..." : "AI 리포트 생성"}
                </button>
                <button className="ghost-btn" type="button" onClick={() => setActiveView("settings")}>AI 설정</button>
                <button className="ghost-btn" type="button" onClick={() => setAutoLoginEnabled((current) => !current)}>
                자동 로그인 {autoLoginEnabled ? "ON" : "OFF"}
                </button>
                <button className="ghost-btn" type="button" onClick={() => setActiveView("labs")}>수치 입력</button>
                <button className="ghost-btn" type="button" onClick={() => setActiveView("schedule")}>일정 관리</button>
              </div>
            </article>

            <article className="glass-card summary-card">
              <h3>상담 전 준비 상태</h3>
              <div className="status-stack">
                <div className={`status-line ${readiness.profile ? "done" : "todo"}`}>프로필 입력 상태 {readiness.profile ? "준비 완료" : "입력 필요"}</div>
                <div className={`status-line ${readiness.disease ? "done" : "todo"}`}>질환/해설 문맥 상태 {readiness.disease ? "준비 완료" : "선택 필요"}</div>
                <div className={`status-line ${readiness.apiKey ? "done" : "todo"}`}>AI API 연결 상태 {readiness.apiKey ? "연결 완료" : "설정 필요"}</div>
              </div>
              <div className="orb-wrap">
                <div className="orb-ring"><span>{abnormalCount}</span><small>이상 수치 항목 수</small></div>
              </div>
            </article>

            <article className="glass-card mini-card">
              <h3>최근 브리핑 요약</h3>
              <p>{history[0]?.analysis?.aiResult?.overall_summary || "최근 생성된 리포트가 아직 없습니다. 첫 리포트를 만들면 여기에 요약이 표시됩니다."}</p>
              {history[0] && <button type="button" className="ghost-btn" onClick={() => handleLoadReport(history[0])}>최근 리포트 바로 열기</button>}
            </article>

            <article className="glass-card list-card agenda-card">
              <h3>에이전트 일정 보드</h3>
              {agentAgenda.length ? agentAgenda.map((item, index) => (
                <div key={`${item.type}-${index}`} className={`agenda-item tone-${item.tone}`}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              )) : <div className="empty-card">등록된 검사 일정이나 복약 일정이 아직 없습니다. 일정 화면에서 혈액검사 일정, 복약 시간, 증상 관찰 메모를 추가해 두면 여기에서 한눈에 볼 수 있습니다.</div>}
              <div className="cta-row">
                <button type="button" className="ghost-btn" onClick={() => setActiveView("schedule")}>일정 화면으로 이동</button>
                <button type="button" className="primary-btn" onClick={handleScheduleReminder} disabled={notificationBusy}>
                  {notificationBusy ? "알림을 예약하는 중..." : "혈액검사 알림 예약"}
                </button>
              </div>
            </article>
          </section>
        )}

        {activeView === "profile" && (
          <section className="screen-grid two-column">
            <article className="glass-card profile-card">
              <div className="section-head">
                <h3>기본 프로필 정보</h3>
                <span className="chip">개인 브리핑 기준 정보</span>
              </div>
              <div className="form-grid">
                <label>
                  표시 이름
                  <input value={profile.displayName} onChange={(event) => updateProfile("displayName", event.target.value)} placeholder="예: 강민성" />
                </label>
                <label>
                  나이
                  <input value={profile.age} onChange={(event) => updateProfile("age", event.target.value)} placeholder="예: 36" />
                </label>
                <label>
                  성별
                  <select value={profile.sex} onChange={(event) => updateProfile("sex", event.target.value)}>
                    <option value="female">여성</option>
                    <option value="male">남성</option>
                    <option value="other">기타</option>
                  </select>
                </label>
                <label>
                  사용자 유형
                  <select value={profile.mode} onChange={(event) => updateProfile("mode", event.target.value)}>
                    <option value="general">일반 사용자</option>
                    <option value="patient">환자 모드</option>
                  </select>
                </label>
              </div>
              <label>
                복용 약 / 치료 중인 약물
                <textarea rows="3" value={profile.medications} onChange={(event) => updateProfile("medications", event.target.value)} placeholder="예: 스테로이드 복용 중, 항암 치료 중, 철분제 복용 등 현재 상태를 적어 주세요." />
              </label>
              <div className="form-grid">
                <label>
                  개인 메모
                  <textarea rows="4" value={profile.notes} onChange={(event) => updateProfile("notes", event.target.value)} placeholder="기저질환, 최근 변화, 치료 경과, 평소 주의하는 수치 등을 자유롭게 적어 주세요." />
                </label>
                <label>
                  의료진 메모 / 외래 준비 메모
                  <textarea rows="4" value={profile.doctorMemo || ""} onChange={(event) => updateProfile("doctorMemo", event.target.value)} placeholder="다음 외래에서 꼭 물어볼 내용, 최근 검사에서 신경 쓰이는 점, 상담 목표 등을 적어 두세요." />
                </label>
              </div>
              <div className="symptom-intake-card">
                <div className="section-head">
                  <h3>증상 입력 문진 카드</h3>
                  <span className="chip accent">증상 요약 + 강도 + 기간 + 체크리스트</span>
                </div>
                <div className="form-grid symptom-grid">
                  <label>
                    증상 한줄 요약
                    <input value={profile.symptomSummary || ""} onChange={(event) => updateProfile("symptomSummary", event.target.value)} placeholder="예: 최근 3일간 피로감과 미열이 계속됨" />
                  </label>
                  <label>
                    증상 강도
                    <select value={profile.symptomSeverity || "low"} onChange={(event) => updateProfile("symptomSeverity", event.target.value)}>
                      <option value="low">가벼움</option>
                      <option value="medium">중간</option>
                      <option value="high">강함</option>
                    </select>
                  </label>
                  <label>
                    시작 시점
                    <select value={profile.symptomOnset || "today"} onChange={(event) => updateProfile("symptomOnset", event.target.value)}>
                      <option value="today">오늘 시작됨</option>
                      <option value="within_week">1주 이내 발생</option>
                      <option value="chronic">만성 증상 / 반복 증상</option>
                    </select>
                  </label>
                  <label>
                    증상 지속 일수
                    <div className="duration-slider-group">
                      <div className="duration-stepper">
                        <button
                          type="button"
                          className="ghost-btn small"
                          onClick={() => updateProfile("symptomDurationDays", String(Math.max(0, Number(profile.symptomDurationDays || 0) - 1)))}
                        >
                          - 1일
                        </button>
                        <strong>{Number(profile.symptomDurationDays || 0)}일</strong>
                        <button
                          type="button"
                          className="ghost-btn small"
                          onClick={() => updateProfile("symptomDurationDays", String(Math.min(30, Number(profile.symptomDurationDays || 0) + 1)))}
                        >
                          + 1일
                        </button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={Number(profile.symptomDurationDays || 0)}
                        onChange={(event) => updateProfile("symptomDurationDays", event.target.value)}
                      />
                      <small>0일에서 30일까지 드래그해서 선택할 수 있습니다.</small>
                    </div>
                  </label>
                </div>
                <div className="symptom-picker-panel">
                  <div className="symptom-picker-shell">
                    <details className="symptom-picker">
                      <summary className="ghost-btn small">
                        <span className="collapsed-label">증상 선택</span>
                        <span className="expanded-label">접기</span>
                        {(profile.symptomTags || []).length ? ` (${(profile.symptomTags || []).length}개)` : ""}
                      </summary>
                      <div className="symptom-checklist-grid">
                        {SYMPTOM_TAG_OPTIONS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            className={`symptom-tag-btn ${(profile.symptomTags || []).includes(tag) ? "active" : ""}`}
                            onClick={() => toggleSymptomTag(tag)}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </details>
                    <div className="symptom-selected-row">
                      {(profile.symptomTags || []).length ? (
                        (profile.symptomTags || []).map((tag) => (
                          <span key={`selected-${tag}`} className="chip good">{tag}</span>
                        ))
                      ) : null}
                    </div>
                  </div>
                  <div className="inline-note symptom-inline-note">선택한 증상이 아직 없습니다. 필요한 항목만 골라 두면 문진 카드가 더 간결해집니다.</div>
                </div>
                <div className="form-grid symptom-grid">
                  <label>
                    악화 요인
                    <input value={profile.symptomTriggers || ""} onChange={(event) => updateProfile("symptomTriggers", event.target.value)} placeholder="예: 계단을 오르면 심해짐, 밤에 심해짐, 식사 후 악화됨" />
                  </label>
                  <label>
                    완화 요인
                    <input value={profile.symptomRelief || ""} onChange={(event) => updateProfile("symptomRelief", event.target.value)} placeholder="예: 휴식하면 호전됨, 수분 섭취 후 괜찮아짐, 약 복용 후 완화됨" />
                  </label>
                </div>
                <label>
                  증상 관찰 메모
                  <textarea rows="3" value={profile.symptomWatch} onChange={(event) => updateProfile("symptomWatch", event.target.value)} placeholder="예: 체온 변화, 출혈 여부, 호흡 상태, 부종, 체중 변화 등을 기록해 두세요." />
                </label>
                <div className="symptom-summary-preview">
                  <strong>{symptomBrief?.headline || "증상 정보가 아직 충분하지 않습니다. 입력해 두면 AI 브리핑이 더 정확해집니다."}</strong>
                  <small>{symptomBrief?.nextAction || "증상 태그, 지속 기간, 악화 요인, 완화 요인을 함께 적어 두면 다음 외래용 질문과 브리핑이 더 정교해집니다."}</small>
                </div>
              </div>
            </article>

            <article className="glass-card">
              <div className="section-head">
                <h3>질환 검색 및 선택</h3>
                <span className="chip accent">질환 코드와 해설 기준</span>
              </div>
              {profile.mode === "patient" ? (
                <>
                  <label>
                    질환명 또는 코드 검색
                    <input value={profile.diseaseQuery} onChange={(event) => updateProfile("diseaseQuery", event.target.value)} placeholder="예: 백혈병, AML, 림프종, CKD, 간경변" />
                  </label>
                  <div className="search-results">
                    {diseaseResults.map((item) => (
                      <button key={item.code} type="button" className={`search-result ${profile.diseaseCode === item.code ? "active" : ""}`} onClick={() => updateProfile("diseaseCode", item.code)}>
                        <strong>{item.name}</strong>
                        <span>{item.code} · {item.group}</span>
                        <small>{item.note}</small>
                      </button>
                    ))}
                  </div>
                  {selectedDisease && (
                    <div className="selection-card">
                      <p className="eyebrow">선택된 질환</p>
                      <h4>{selectedDisease.name}</h4>
                      <p>{selectedDisease.code} · {selectedDisease.group}</p>
                      <small>우선 볼 핵심 수치: {selectedDisease.focus.join(", ")}</small>
                    </div>
                  )}
                  <div className="selection-card">
                    <p className="eyebrow">질환별 기본 브리핑</p>
                    <p>{diseaseProtocol.summary}</p>
                    <small>함께 관찰할 증상: {(diseaseProtocol.symptomWatch || []).join(", ")}</small>
                  </div>
                </>
              ) : (
                <div className="empty-card">일반 모드에서는 질환 선택 없이도 검사 수치와 증상 중심으로 브리핑할 수 있습니다. 필요하면 환자 모드로 전환해 질환 문맥을 추가하세요.</div>
              )}
            </article>
          </section>
        )}

        {activeView === "schedule" && (
          <section className="screen-grid two-column schedule-grid-screen">
            <article className="glass-card schedule-card">
              <div className="section-head">
                <h3>혈액검사 일정 관리</h3>
                <span className="chip accent">예정일 / 알림 전략 / 재검 준비</span>
              </div>
              <div className="form-grid">
                <label>
                  다음 혈액검사 예정일
                  <input type="date" value={profile.nextLabDate} onChange={(event) => updateProfile("nextLabDate", event.target.value)} />
                </label>
                <label>
                  알림 시간
                  <input type="time" value={profile.reminderTime || "09:00"} onChange={(event) => updateProfile("reminderTime", event.target.value)} />
                </label>
                <label>
                  알림 방식
                  <select value={profile.reminderStrategy || "day-before-and-day-of"} onChange={(event) => updateProfile("reminderStrategy", event.target.value)}>
                    <option value="same-day">당일 1회</option>
                    <option value="day-before-and-day-of">전날 + 당일 2회</option>
                    <option value="weekly-check">매주 정기 체크</option>
                  </select>
                </label>
              </div>
              <div className="bullet-card">검사 일정은 실제 재검일과 알림 전략을 함께 맞춰 두는 것이 좋습니다. 일정이 바뀌면 바로 수정해 최신 상태를 유지하세요.</div>
              <div className="cta-row">
                <button type="button" className="primary-btn" onClick={handleScheduleReminder} disabled={notificationBusy}>
                  {notificationBusy ? "혈액검사 알림을 예약하는 중..." : "혈액검사 알림 예약"}
                </button>
                <button type="button" className="ghost-btn" onClick={handleCancelReminder} disabled={notificationBusy}>혈액검사 알림 제거</button>
              </div>
              {notificationMessage ? <div className="inline-note">{notificationMessage}</div> : null}
            </article>

            <article className="glass-card schedule-card">
              <div className="section-head">
                <h3>복약 일정 알림</h3>
                <span className="chip">여러 시간대 복약을 한 번에 관리</span>
              </div>
              <div className="medication-toolbar">
                <div className="inline-note">복약 시간이 여러 개라면 `+ 일정 추가`로 아침/점심/저녁처럼 분리해서 등록해 두세요.</div>
                <button type="button" className="primary-btn small" onClick={() => openMedicationEditor(-1)}>+ 일정 추가</button>
              </div>
              <div className="medication-schedule-grid">
                {(profile.medicationSchedules || []).length ? (profile.medicationSchedules || []).map((item, index) => (
                  <div key={item.id || `${item.time}-${index}`} className={`medication-card medication-${item.color || "rose"}`}>
                    <div className="medication-card-head">
                      <div>
                        <strong>{item.label || `복약 일정 ${index + 1}`}</strong>
                        <span>{item.time || "08:00"} · {item.dose || "용량 정보 없음"}</span>
                      </div>
                      <span className="chip">{item.daysPreset === "daily" ? "매일 복용" : item.daysPreset === "weekdays" ? "평일 복용" : item.daysPreset === "weekends" ? "주말 복용" : item.daysPreset === "mwf" ? "월/수/금" : "화/목/토"}</span>
                    </div>
                    <div className="medication-card-meta">
                      <span>{item.mealTiming === "before_meal" ? "식전" : item.mealTiming === "empty_stomach" ? "공복" : "식후"}</span>
                      <span>{item.note || "메모 없음"}</span>
                    </div>
                    <div className="medication-card-actions">
                      <button type="button" className="ghost-btn small" onClick={() => openMedicationEditor(index)}>수정</button>
                      <button type="button" className="ghost-btn small" onClick={() => removeMedicationSchedule(index)}>삭제</button>
                    </div>
                  </div>
                )) : <div className="empty-card">등록된 복약 일정이 아직 없습니다. 필요할 때마다 시간대를 나눠 추가해 두면 알림을 더 정확하게 받을 수 있습니다.</div>}
              </div>
              <div className="cta-row">
                <button type="button" className="primary-btn" onClick={handleScheduleMedicationReminder} disabled={medicationNotificationBusy}>
                  {medicationNotificationBusy ? "복약 알림을 예약하는 중..." : "복약 알림 예약"}
                </button>
                <button type="button" className="ghost-btn" onClick={handleCancelMedicationReminder} disabled={medicationNotificationBusy}>복약 알림 제거</button>
              </div>
              {medicationNotificationMessage ? <div className="inline-note">{medicationNotificationMessage}</div> : null}
            </article>
          </section>
        )}

        {activeView === "labs" && (
          <section className="screen-grid two-column">
            <article className="glass-card">
              <div className="section-head">
                <h3>혈액 수치 입력</h3>
                <div className="chip-row">
                  <button type="button" className="ghost-btn small" onClick={() => setLabs(sampleValues)}>샘플 값 채우기</button>
                  <button type="button" className="ghost-btn small" onClick={handleLoadLatestLabs} disabled={!latestHistoryLabs}>최근 기록 불러오기</button>
                  <button type="button" className="ghost-btn small" onClick={() => setActiveView("report")}>리포트 보기</button>
                </div>
              </div>
                <div className="labs-toolbar">
                <div className="labs-toolbar-row">
                  <div className="segmented-row">
                    {LAB_SECTION_OPTIONS.filter((item) => item.id !== "focus" || selectedDisease).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`segment-btn ${activeLabSection === item.id ? "active" : ""}`}
                        onClick={() => setActiveLabSection(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="labs-toolbar-inline">
                    <div className="segmented-row">
                      <button type="button" className={`segment-btn ${labViewMode === "cards" ? "active" : ""}`} onClick={() => setLabViewMode("cards")}>카드형</button>
                      <button type="button" className={`segment-btn ${labViewMode === "table" ? "active" : ""}`} onClick={() => setLabViewMode("table")}>표형</button>
                    </div>
                    <input value={labSearchQuery} onChange={(event) => setLabSearchQuery(event.target.value)} placeholder="항목명 또는 코드 검색" />
                  </div>
                </div>
                <div className="input-support-grid">
                  <div className="input-support-card">
                    <div className="input-support-chip-row">
                      <span className="chip accent">입력 가이드</span>
                      {selectedDisease ? <span className="chip">{selectedDisease.name} 포커스 반영</span> : <span className="chip">일반 브리핑</span>}
                    </div>
                    <strong>혈액검사 입력을 항목군 기준으로 정리했습니다.</strong>
                    <p>CBC, 염증/면역, 간기능, 신장/전해질, 대사/내분비 흐름으로 나눠 필요한 수치를 빠르게 찾을 수 있게 했습니다.</p>
                    <small>질환 포커스 항목과 최근 기록 불러오기까지 함께 지원합니다.</small>
                  </div>
                  <div className="input-support-card">
                    <span className="chip good">현재 표시 항목</span>
                    <strong>{filteredLabMetrics.length}개</strong>
                    <p>{activeLabSection === "focus" ? "선택한 질환에서 우선 보는 혈액검사만 추려서 보여주고 있습니다." : "선택한 항목군 기준으로 검사 입력 카드를 정리해 두었습니다."}</p>
                    <small>검색어가 있으면 코드, 항목명, 기본 해설까지 함께 검색합니다.</small>
                  </div>
                  {ocrMergedCodes.length > 0 && (
                    <div className="input-support-card merged-support-card">
                      <span className="chip accent">OCR 蹂묓빀 ?꾨즺</span>
                      <strong>{ocrMergedCodes.length}개 항목</strong>
                      <p>방금 반영한 OCR 결과를 표형 입력 화면에서 바로 이어서 검토할 수 있게 맞췄습니다.</p>
                      <small>강조된 행을 먼저 확인하고 부족한 항목만 추가로 입력해 보세요.</small>
                    </div>
                  )}
                </div>
              </div>
              {labViewMode === "cards" ? (
                <div className="metric-grid">
                  {filteredLabMetrics.map((metric) => {
                    const customIndex = customLabs.findIndex((item) => item.code === metric.code);
                    const metricValue = customIndex >= 0 ? customLabs[customIndex]?.value : labs[metric.code];
                    const status = classifyMetric(metric, metricValue);
                    const isOcrMerged = ocrMergedCodes.includes(metric.code);
                    return (
                      <button key={metric.code} type="button" className={`metric-card ${isOcrMerged ? "metric-card-merged" : ""}`} onClick={() => setSelectedMetricCode(metric.code)}>
                        <div className="metric-head">
                          <div className="metric-title-stack">
                            <strong>{metric.name}</strong>
                            <span>{metric.code}</span>
                          </div>
                          <div className="metric-head-badges">
                            {isOcrMerged && <span className="chip accent">OCR 병합</span>}
                            <StatusPill status={status} />
                          </div>
                        </div>
                        <label className="metric-input-wrap" onClick={(event) => event.stopPropagation()}>
                          <input
                            type="number"
                            step="0.1"
                            value={metricValue}
                            onChange={(event) => customIndex >= 0 ? updateCustomLab(customIndex, "value", event.target.value === "" ? "" : Number(event.target.value)) : updateLab(metric.code, event.target.value)}
                          />
                        </label>
                        <div className="metric-footer">
                          <span className="metric-reading">{formatMetricValue(metricValue)} {metric.unit}</span>
                          <small className="metric-range-copy">
                            {Number.isFinite(metric.range.low) && Number.isFinite(metric.range.high) ? (
                              <>
                                <span className="metric-range-label">정상</span>
                                <span className="metric-range-value">{metric.range.low} - {metric.range.high}</span>
                              </>
                            ) : (
                              <>
                                <span className="metric-range-label">범위</span>
                                <span className="metric-range-value">직접 입력 가능</span>
                              </>
                            )}
                          </small>
                        </div>
                        {Number.isFinite(metric.range.low) && Number.isFinite(metric.range.high) && (
                          <div className="range-bar">
                            <div className="range-marker" style={{ left: `${buildMarkerPosition(metric, metricValue)}%` }} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="lab-table-card">
                  <div className="lab-table-head">
                    <span>항목</span>
                    <span>코드</span>
                    <span>상태</span>
                    <span>값</span>
                    <span>정상범위</span>
                  </div>
                  <div className="lab-table-body">
                    {filteredLabMetrics.map((metric) => {
                      const customIndex = customLabs.findIndex((item) => item.code === metric.code);
                      const metricValue = customIndex >= 0 ? customLabs[customIndex]?.value : labs[metric.code];
                      const status = classifyMetric(metric, metricValue);
                      const isOcrMerged = ocrMergedCodes.includes(metric.code);
                      return (
                        <button key={`table-${metric.code}`} type="button" className={`lab-table-row ${isOcrMerged ? "lab-table-row-merged" : ""}`} onClick={() => setSelectedMetricCode(metric.code)}>
                          <div className="lab-table-metric">
                            <strong>{metric.name}</strong>
                            <small>{metric.meaning}</small>
                          </div>
                          <div className="lab-table-code-stack">
                            <span className="lab-table-code">{metric.code}</span>
                            {isOcrMerged && <span className="ocr-merge-badge">OCR 蹂묓빀</span>}
                          </div>
                          <StatusPill status={status} />
                          <label className="lab-table-input" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="number"
                              step="0.1"
                              value={metricValue}
                              onChange={(event) => customIndex >= 0 ? updateCustomLab(customIndex, "value", event.target.value === "" ? "" : Number(event.target.value)) : updateLab(metric.code, event.target.value)}
                            />
                            <small>{metric.unit}</small>
                          </label>
                          <span className="lab-table-range">{Number.isFinite(metric.range.low) && Number.isFinite(metric.range.high) ? `${metric.range.low} - ${metric.range.high}` : "직접 입력"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {!filteredLabMetrics.length && <div className="empty-card">현재 조건에 맞는 혈액검사 항목이 없습니다. 탭을 바꾸거나 검색어를 비워 보세요.</div>}
              <details className="custom-lab-panel collapsible-card">
                <summary className="collapsible-summary">
                  <div>
                    <strong>커스텀 항목 추가</strong>
                    <small>필요한 혈액검사 항목을 직접 추가합니다.</small>
                  </div>
                  <span className="chip accent collapsible-state-chip">
                    <span className="collapsed-label">수동 추가</span>
                    <span className="expanded-label">접기</span>
                  </span>
                </summary>
                <div className="collapsible-body">
                  <div className="form-grid">
                    <label>
                      항목명
                      <input value={customLabDraft.name} onChange={(event) => setCustomLabDraft((current) => ({ ...current, name: event.target.value }))} placeholder="예: LDL, TSH, Magnesium" />
                    </label>
                    <label>
                      코드
                      <input value={customLabDraft.code} onChange={(event) => setCustomLabDraft((current) => ({ ...current, code: event.target.value }))} placeholder="예: LDL" />
                    </label>
                    <label>
                      값
                      <input type="number" step="0.1" value={customLabDraft.value} onChange={(event) => setCustomLabDraft((current) => ({ ...current, value: event.target.value }))} />
                    </label>
                    <label>
                      단위
                      <input value={customLabDraft.unit} onChange={(event) => setCustomLabDraft((current) => ({ ...current, unit: event.target.value }))} placeholder="mg/dL" />
                    </label>
                    <label>
                      참고범위 하한
                      <input type="number" step="0.1" value={customLabDraft.low} onChange={(event) => setCustomLabDraft((current) => ({ ...current, low: event.target.value }))} />
                    </label>
                    <label>
                      참고범위 상한
                      <input type="number" step="0.1" value={customLabDraft.high} onChange={(event) => setCustomLabDraft((current) => ({ ...current, high: event.target.value }))} />
                    </label>
                  </div>
                  <div className="cta-row">
                    <button type="button" className="ghost-btn" onClick={handleAddCustomLab}>커스텀 항목 추가</button>
                  </div>
                  <div className="history-grid">
                    {customLabs.map((item, index) => (
                      <div className="history-card" key={`${item.code}-${index}`}>
                        <div className="history-topline">
                          <strong>{item.name}</strong>
                          <button type="button" className="ghost-btn small" onClick={() => removeCustomLab(index)}>삭제</button>
                        </div>
                        <div className="form-grid">
                          <label>
                            값
                            <input type="number" step="0.1" value={item.value} onChange={(event) => updateCustomLab(index, "value", event.target.value === "" ? "" : Number(event.target.value))} />
                          </label>
                          <label>
                            단위
                            <input value={item.unit} onChange={(event) => updateCustomLab(index, "unit", event.target.value)} />
                          </label>
                          <label>
                            참고범위 하한
                            <input type="number" step="0.1" value={item.low} onChange={(event) => updateCustomLab(index, "low", event.target.value)} />
                          </label>
                          <label>
                            참고범위 상한
                            <input type="number" step="0.1" value={item.high} onChange={(event) => updateCustomLab(index, "high", event.target.value)} />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            </article>

            <article className="glass-card">
              <details className="ocr-collapsible-card collapsible-card">
                <summary className="collapsible-summary">
                  <div>
                    <strong>사진 / 캡처 OCR</strong>
                    <small>촬영 · 업로드 후 OCR로 항목을 추출합니다.</small>
                  </div>
                  <span className="chip collapsible-state-chip">
                    <span className="collapsed-label">촬영 / 업로드</span>
                    <span className="expanded-label">접기</span>
                  </span>
                </summary>
                <div className="collapsible-body">
                  <label className="upload-zone">
                    <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} />
                    <div>
                      <strong>검사표 사진 촬영 또는 업로드</strong>
                      <p>카메라 촬영, 앨범 선택, 캡처본 업로드를 모두 지원합니다. OCR 후 직접 검토하고 반영할 수 있습니다.</p>
                    </div>
                  </label>
                  {uploadedImage && <div className="image-preview"><img src={uploadedImage} alt="검사표 미리보기" /></div>}
                  <div className="cta-row">
                    <button type="button" className="primary-btn" onClick={handleRunOcr} disabled={ocrBusy}>{ocrBusy ? "OCR 분석 중..." : "OCR 분석"}</button>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => setOcrResult(normalizeOcrPayload(getSampleOcrPayload(profile.ocrTemplate || "general", profile.ocrInstitutionPreset || "generic")))}
                    >
                      샘플 OCR
                    </button>
                  </div>
                  <div className="empty-card">OCR이 모르는 항목은 커스텀 혈액검사로 자동 연결하거나 직접 추가해서 AI 해설에 포함할 수 있게 설계되어 있습니다.</div>
                  <label>
                    OCR 템플릿 모드
                    <select value={profile.ocrTemplate || "general"} onChange={(event) => updateProfile("ocrTemplate", event.target.value)}>
                      {ocrTemplates.map((template) => (
                        <option key={template.id} value={template.id}>{template.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    검사기관 프리셋
                    <select value={profile.ocrInstitutionPreset || "generic"} onChange={(event) => updateProfile("ocrInstitutionPreset", event.target.value)}>
                      {ocrInstitutionPresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>{preset.label}</option>
                      ))}
                    </select>
                  </label>
                  <div className="inline-note">
                    {ocrTemplates.find((template) => template.id === (profile.ocrTemplate || "general"))?.helper}
                  </div>
                  <div className="inline-note">
                    {ocrInstitutionPresets.find((preset) => preset.id === (profile.ocrInstitutionPreset || "generic"))?.helper}
                  </div>

                  {ocrResult && (
                    <div className="ocr-panel">
                      <div className="ocr-toolbar">
                        <span className="chip">검토 후 반영</span>
                        <button type="button" className="ghost-btn small" onClick={handleAddOcrRow}>행 추가</button>
                      </div>
                      <div className="inline-note">OCR이 인식한 항목은 표준 코드로 정리되고, 필요하면 검사표 그대로 새 항목을 추가할 수 있습니다.</div>
                      <div className="ocr-table">
                    <div className="ocr-table-head">
                      <span>사용</span>
                      <span>항목명</span>
                      <span>코드</span>
                      <span>값</span>
                      <span>단위</span>
                      <span>하한</span>
                      <span>상한</span>
                      <span>원문</span>
                    </div>
                    {ocrResult.matches.map((match, index) => (
                      <div className={`ocr-table-row ${match.enabled ? "" : "disabled"}`} key={`${match.code}-${index}`}>
                        {(() => {
                          const referenceStatus = classifyOcrReferenceStatus(match);
                          const reference = resolveReferenceRange(match);
                          return (
                            <>
                        <label className="ocr-check">
                          <input type="checkbox" checked={Boolean(match.enabled)} onChange={(event) => updateOcrMatch(index, "enabled", event.target.checked)} />
                        </label>
                        <div className="ocr-cell-stack">
                            <input value={match.label} onChange={(event) => updateOcrMatch(index, "label", event.target.value)} placeholder="항목명" />
                          <small>
                          {match.sourceLine || "OCR 추출 원문"}
                            {reference ? ` · 참고 ${reference.low}-${reference.high}` : ""}
                          {referenceStatus === "high" ? " · 범위보다 높음" : referenceStatus === "low" ? " · 범위보다 낮음" : ""}
                          </small>
                        </div>
                        <input value={match.code} onChange={(event) => updateOcrMatch(index, "code", event.target.value)} placeholder="코드" />
                        <input type="number" step="0.1" value={match.value} onChange={(event) => updateOcrMatch(index, "value", event.target.value)} placeholder="값" />
                        <input value={match.unit || ""} onChange={(event) => updateOcrMatch(index, "unit", event.target.value)} placeholder="단위" />
                        <input type="number" step="0.1" value={match.low ?? ""} onChange={(event) => updateOcrMatch(index, "low", event.target.value === "" ? "" : Number(event.target.value))} placeholder="??" />
                        <input type="number" step="0.1" value={match.high ?? ""} onChange={(event) => updateOcrMatch(index, "high", event.target.value === "" ? "" : Number(event.target.value))} placeholder="??" />
                        <div className={`ocr-confidence status-${referenceStatus}`}>{Math.round((match.confidence || 0) * 100)}%</div>
                            </>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                      {ocrReferenceAlerts.length ? (
                        <div className="guidance-stack">
                          {ocrReferenceAlerts.map((alert) => (
                            <div key={`ocr-alert-${alert.code}`} className={`guidance-card level-${alert.status === "high" ? "high" : "medium"}`}>
                              <div>
                                <strong>{alert.label}</strong>
                                <span>{alert.code}</span>
                              </div>
                              <p>{alert.message}</p>
                              <small>{alert.detail}</small>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {ocrResult.rawText ? <div className="ocr-raw-text">{ocrResult.rawText}</div> : null}
                      <button type="button" className="primary-btn wide" onClick={handleApplyOcr}>검토값 반영하기</button>
                    </div>
                  )}
                </div>
              </details>
            </article>
          </section>
        )}

        {activeView === "disease" && (
          <section className="screen-grid two-column">
            <article className="glass-card report-hero disease-hero">
              <div className="chip-row">
                <span className="chip accent">{profile.mode === "patient" ? "환자 전용 해설" : "일반 모드"}</span>
                <span className="chip">{selectedDisease ? selectedDisease.code : "질환 미선택"}</span>
                {selectedDisease ? <span className="chip report-risk-chip risk-medium">의료 자문형 브리핑</span> : null}
              </div>
              <h3>질환별 전용 해설</h3>
              <p>
                {selectedDisease
                  ? `${selectedDisease.name} 맥락에서 중요하게 보는 혈액 항목과 현재 수치의 관계를 질환 중심으로 정리했습니다. 실제 임상에서는 증상, 치료 주기, 복약, 최근 감염과 입원 이력까지 함께 보는 방식으로 해석합니다.`
                  : "환자 모드에서 질환을 선택하면, 질환 코드와 주요 혈액검사 항목의 관계를 이 화면에서 직접 해설합니다."}
              </p>
              {selectedDisease ? (
                <div className="briefing-band">
                  <div className="briefing-cell">
                    <span>질환군</span>
                    <strong>{selectedDisease.group}</strong>
                  </div>
                  <div className="briefing-cell">
                    <span>포커스 항목</span>
                    <strong>{selectedDisease.focus?.length || 0}개</strong>
                  </div>
                  <div className="briefing-cell">
                    <span>메모</span>
                    <strong>{selectedDisease.note || "질환 메모 준비"}</strong>
                  </div>
                </div>
              ) : null}
            </article>

            <article className="glass-card list-card agenda-card">
              <div className="section-tabbar">
                <button type="button" className={`section-tab-btn ${activeDiseaseSection === "overview" ? "active" : ""}`} onClick={() => setActiveDiseaseSection("overview")}>핵심 해설</button>
                <button type="button" className={`section-tab-btn ${activeDiseaseSection === "expert" ? "active" : ""}`} onClick={() => setActiveDiseaseSection("expert")}>전문의 시각</button>
                <button type="button" className={`section-tab-btn ${activeDiseaseSection === "protocol" ? "active" : ""}`} onClick={() => setActiveDiseaseSection("protocol")}>프로토콜</button>
                <button type="button" className={`section-tab-btn ${activeDiseaseSection === "care" ? "active" : ""}`} onClick={() => setActiveDiseaseSection("care")}>경과/안전</button>
              </div>
            </article>

            {activeDiseaseSection === "overview" && <article className="glass-card list-card">
              <h3>질환 포커스 항목</h3>
              {selectedDisease ? (
                <div className="disease-focus-grid">
                  {diseaseInsights.map((item) => (
                    <div key={item.code} className={`disease-focus-card focus-${item.status}`}>
                      <div className="disease-focus-head">
                        <div>
                          <strong>{item.code}</strong>
                          <span>{item.name}</span>
                        </div>
                        <StatusPill status={item.status} />
                      </div>
                      <div className="disease-focus-value">{item.value} {item.unit}</div>
                      <p>{item.summary}</p>
                    </div>
                  ))}
                </div>
              ) : <div className="empty-card">프로필에서 환자 모드와 질환 코드를 먼저 선택해 주세요.</div>}
            </article>}

            {activeDiseaseSection === "overview" && <article className="glass-card list-card">
              <h3>질환-수치 관계 해설</h3>
              {selectedDisease ? diseaseInsights.map((item) => (
                <div key={`${item.code}-explain`} className="disease-brief-card">
                  <strong>{item.name} ({item.code})</strong>
                  <p>{item.meaning}</p>
                  <div className="bullet-card">{item.directionText}</div>
                  <div className="bullet-card">{item.askDoctor}</div>
                </div>
              )) : <div className="empty-card">질환 해설은 환자 모드에서만 활성화됩니다.</div>}
            </article>}

            {activeDiseaseSection === "overview" && <article className="glass-card list-card">
              <h3>임상 해설 포인트</h3>
              {clinicalBriefs.length ? (
                <div className="clinical-brief-grid">
                  {clinicalBriefs.map((card) => (
                    <div key={card.id} className={`clinical-brief-card tone-${card.tone}`}>
                      <span className="chip accent">CONSULT NOTE</span>
                      <strong>{card.title}</strong>
                      <p>{card.summary}</p>
                      <ul>
                        {card.bullets.map((item) => (
                          <li key={`${card.id}-${item}`}>{item}</li>
                        ))}
                      </ul>
                      <small>{card.question}</small>
                    </div>
                  ))}
                </div>
              ) : <div className="empty-card">질환 맥락과 현재 수치를 바탕으로 한 임상 해설 포인트가 생성됩니다.</div>}
            </article>}

            {activeDiseaseSection === "expert" && <article className="glass-card list-card">
              <h3>전문의 자문 포인트</h3>
              {selectedDisease && diseaseExpertGuide ? (
                <div className="clinical-brief-grid">
                  <div className="clinical-brief-card tone-high">
                    <span className="chip accent">SPECIALIST VIEW</span>
                    <strong>해석 각도</strong>
                    <p>{diseaseExpertGuide.angle}</p>
                    <small>{diseaseExpertGuide.caution}</small>
                  </div>
                  <div className="clinical-brief-card tone-medium">
                    <span className="chip">CHECKPOINTS</span>
                    <strong>우선 체크 항목</strong>
                    <ul>
                      {(diseaseExpertGuide.checkpoints || []).map((item) => (
                        <li key={`${selectedDisease.code}-${item}`}>{item}</li>
                      ))}
                    </ul>
                    <small>질환 코드와 현재 수치, 증상/치료 시점을 함께 연결해 보는 용도입니다.</small>
                  </div>
                </div>
              ) : <div className="empty-card">질환을 선택하면 질환군과 코드에 맞춘 전문 자문 체크 포인트를 보여줍니다.</div>}
            </article>}

            {activeDiseaseSection === "protocol" && <article className="glass-card list-card">
              <h3>질환별 에이전트 프로토콜</h3>
              {selectedDisease ? (
                <div className="protocol-grid">
                  <div className="bullet-card">
                    <strong>핵심 해설</strong>
                    <div>{diseaseProtocol.summary}</div>
                  </div>
                  <div className="bullet-card">
                    <strong>우선 관찰 증상</strong>
                    <div>{(diseaseProtocol.symptomWatch || []).join(", ")}</div>
                  </div>
                  <div className="bullet-card">
                    <strong>의료진에게 물어볼 질문</strong>
                    <div>{(diseaseProtocol.questions || []).join(" / ")}</div>
                  </div>
                  <div className="bullet-card">
                    <strong>에이전트 체크 포인트</strong>
                    <div>{(diseaseProtocol.carePoints || []).join(" / ")}</div>
                  </div>
                </div>
              ) : <div className="empty-card">질환을 선택하면 해당 질환군에 맞는 에이전트 프로토콜을 표시합니다.</div>}
            </article>}

            {activeDiseaseSection === "expert" && <article className="glass-card list-card">
              <h3>의료 브리핑 / 안전 문구</h3>
              <div className="guidance-stack">
                {medicalSafetyNotes.map((note, index) => (
                  <div key={`disease-safety-${index}`} className="guidance-card level-watch">
                    <div>
                      <strong>{index === 0 ? "안전 해석 원칙" : "상담 준비 포인트"}</strong>
                      <span>MEDICAL SAFETY</span>
                    </div>
                    <p>{note}</p>
                  </div>
                ))}
              </div>
            </article>}

            {activeDiseaseSection === "protocol" && <article className="glass-card list-card">
              <h3>질환별 액션 플로우</h3>
              {selectedDisease ? (
                <div className="flow-grid">
                  {(diseaseProtocol.carePoints || []).map((item, index) => (
                    <div key={`${selectedDisease.code}-flow-${index}`} className="flow-step">
                      <span>{index + 1}</span>
                      <strong>{item}</strong>
                    </div>
                  ))}
                </div>
              ) : <div className="empty-card">질환을 선택하면 에이전트가 어떤 순서로 해석하는지 단계별로 표시합니다.</div>}
            </article>}

            {activeDiseaseSection === "care" && <article className="glass-card list-card">
              <h3>치료 경과 체크 포인트</h3>
              {selectedDisease ? (
                <>
                  <div className="bullet-card">{selectedDisease.note || "선택한 질환의 치료 맥락 메모가 여기에 표시됩니다."}</div>
                  <div className="bullet-card">{retestGuidance.title}: {retestGuidance.window}</div>
                  <div className="bullet-card">{retestGuidance.detail}</div>
                </>
              ) : <div className="empty-card">질환을 고르면 치료 경과 체크 포인트를 함께 보여줍니다.</div>}
            </article>}
          </section>
        )}

        {activeView === "report" && (
          <section className="screen-grid report-grid">
            <article className="glass-card report-hero">
              <div className="chip-row">
                <span className="chip accent">{settingsDraft.provider === "gemini" ? "Gemini" : "ChatGPT"}</span>
                <span className="chip">{selectedDisease ? selectedDisease.name : "일반 해설"}</span>
                <span className={`chip report-risk-chip risk-${reportRiskBand.tone}`}>{reportRiskBand.label}</span>
              </div>
              <h3>AI 에이전트 종합 브리핑</h3>
              <p>{analysisLoading ? "수치를 기반으로 AI 리포트를 생성하고 있습니다..." : summaryText}</p>
              {analysisError && <div className="inline-error">{analysisError}</div>}
              <div className="bullet-card report-lead-card">
                이번 브리핑은 입력된 수치, 개인 프로필, 질환 문맥을 함께 읽는 구조입니다. 실제 임상 판단은 증상, 치료 일정, 최근 감염과 입원 여부까지 함께 최종 확인해야 합니다.
              </div>
              <div className="briefing-band">
                <div className="briefing-cell">
                  <span>감시 포인트</span>
                  <strong>{priorityItems.length}개</strong>
                </div>
                <div className="briefing-cell">
                  <span>이상 수치</span>
                  <strong>{abnormalCount}개</strong>
                </div>
                <div className="briefing-cell">
                  <span>리포트 상태</span>
                  <strong>{analysis ? "생성 완료" : "대기"}</strong>
                </div>
              </div>
              <div className="cta-row">
                <button type="button" className="primary-btn" onClick={handleGenerateReport} disabled={analysisLoading}>다시 생성</button>
                <button type="button" className="ghost-btn" onClick={() => setActiveView("history")}>기록 보기</button>
                <button type="button" className="ghost-btn" onClick={handleShareReport} disabled={reportActionBusy}>공유</button>
                <button type="button" className="ghost-btn" onClick={handleExportPdf} disabled={reportActionBusy}>PDF</button>
                <button type="button" className="ghost-btn" onClick={handleExportImage} disabled={reportActionBusy}>이미지</button>
              </div>
              <label className="export-open-toggle-card">
                <div>
                  <strong>생성 후 바로 열기</strong>
                  <small>PDF 또는 이미지를 만든 뒤 바로 열기/공유 창을 띄웁니다.</small>
                </div>
                <span className="export-open-toggle">
                  <input type="checkbox" checked={autoOpenExport} onChange={(event) => setAutoOpenExport(event.target.checked)} />
                </span>
              </label>
              {reportActionMessage ? <div className="inline-note">{reportActionMessage}</div> : null}
              <div className="agent-prep-grid">
                <div className="bullet-card">
                  <strong>상담 준비</strong>
                  <div>우선 확인 항목 {priorityItems.length}개와 질문 후보 {clinicianQuestions.length}개를 기준으로 진료 전 메모를 정리해 보세요.</div>
                </div>
                <div className="bullet-card">
                  <strong>증상 연결</strong>
                  <div>{selectedDisease ? `${selectedDisease.name} 문맥에서는 ${selectedDisease.focus?.slice(0, 4).join(", ")} 같은 포커스 수치를 증상 변화와 함께 보는 것이 좋습니다.` : "피로, 발열, 체중 변화, 부종, 출혈 경향처럼 증상 메모가 있으면 AI 해설과 실제 상담 연결이 더 좋아집니다."}</div>
                </div>
                <div className="bullet-card">
                  <strong>다음 액션</strong>
                  <div>{abnormalCount >= 4 ? "이번에는 변화 항목이 많아 재검 시점과 상담 시점을 함께 빠르게 보는 편이 안전합니다." : "수치가 안정적이어도 추세 그래프와 치료 일정, 복약 알림까지 함께 보면 기록 관리가 쉬워집니다."}</div>
                </div>
              </div>
              <div className="outpatient-summary-card">
                <div className="section-head">
                  <h3>다음 외래용 요약</h3>
                  <span className="chip accent">OUTPATIENT NOTE</span>
                </div>
                <div className="outpatient-summary-grid">
                  <div className="bullet-card">
                    <strong>이번 외래 핵심 포인트</strong>
                    <div>{outpatientSummary.headline}</div>
                  </div>
                  <div className="bullet-card">
                    <strong>최근 기록 요약</strong>
                    <div>{outpatientSummary.historySummary}</div>
                  </div>
                  <div className="bullet-card">
                    <strong>복약 일정 / 치료 맥락</strong>
                    <div>{outpatientSummary.medicationSummary}</div>
                  </div>
                </div>
                <div className="outpatient-checklist">
                  {outpatientSummary.checklist.map((item) => (
                    <div key={item} className="bullet-card">{item}</div>
                  ))}
                </div>
              </div>

            </article>

            <article className="glass-card summary-card agenda-card">
              <div className="section-tabbar">
                <button type="button" className={`section-tab-btn ${activeReportSection === "overview" ? "active" : ""}`} onClick={() => setActiveReportSection("overview")}>개요</button>
                <button type="button" className={`section-tab-btn ${activeReportSection === "clinical" ? "active" : ""}`} onClick={() => setActiveReportSection("clinical")}>임상 해설</button>
                <button type="button" className={`section-tab-btn ${activeReportSection === "trend" ? "active" : ""}`} onClick={() => setActiveReportSection("trend")}>추세</button>
                <button type="button" className={`section-tab-btn ${activeReportSection === "safety" ? "active" : ""}`} onClick={() => setActiveReportSection("safety")}>안전/원본</button>
              </div>
            </article>

            {activeReportSection === "overview" && <article className="glass-card summary-card">
              <h3>브리핑 요약</h3>
              <div className="status-stack compact">
                <div className="status-line done">이상 수치 {abnormalCount}개</div>
                <div className={`status-line ${selectedDisease ? "done" : "todo"}`}>{selectedDisease ? `${selectedDisease.name} 문맥 적용` : "일반 해설 문맥"}</div>
                <div className="status-line done">기본 AI {settingsDraft.provider === "gemini" ? "Gemini" : "ChatGPT"}</div>
              </div>
            </article>}

            {activeReportSection === "overview" && <article className="glass-card summary-card">
              <h3>에이전트 스캔 보드</h3>
              <div className="scan-grid">
                <div className="scan-dial">
                  <div className="scan-dial-ring" style={{ "--scan-fill": `${Math.max(12, abnormalRatio)}%` }}>
                    <div className="scan-dial-core">
                      <strong>{abnormalRatio}%</strong>
                      <small>이상 수치 비율</small>
                    </div>
                  </div>
                </div>
                <div className="scan-stat">
                  <span>브리핑 대상</span>
                  <strong>{selectedDisease?.focus?.length || infographicMetrics.length || 1}개</strong>
                  <small>{selectedDisease ? "질환 문맥 우선순위 적용" : "수치 기반 자동 우선순위"}</small>
                </div>
                <div className="scan-stat">
                  <span>질문 후보</span>
                  <strong>{clinicianQuestions.length}개</strong>
                  <small>의료진 상담 질문 정리</small>
                </div>
              </div>
            </article>}

            {activeReportSection === "overview" && <article className="glass-card list-card">
              <h3>핵심 수치 인포그래픽</h3>
              <div className="infographic-list">
                {infographicMetrics.length ? infographicMetrics.map((metric) => (
                  <div key={metric.code} className={`infographic-row row-${metric.status}`}>
                    <div className="infographic-copy">
                      <strong>{metric.code}</strong>
                      <span>{metric.name}</span>
                    </div>
                    <div className="infographic-bar">
                      <div className="infographic-fill" style={{ width: `${Math.max(12, metric.severity)}%` }} />
                    </div>
                    <div className="infographic-meta">
                      <strong>{metric.value} {metric.unit}</strong>
                      <small>{metric.status === "high" ? "높음" : metric.status === "low" ? "낮음" : metric.status === "unknown" ? "참고범위 없음" : "정상 범위"}</small>
                    </div>
                  </div>
                )) : <div className="empty-card">시각화할 핵심 수치가 아직 없습니다. 수치 입력 후 다시 생성해 보세요.</div>}
              </div>
            </article>}

            {activeReportSection === "trend" && <article className="glass-card list-card">
              <h3>검사 추세 그래프</h3>
              <div className="trend-grid">
                {trendMetrics.length ? trendMetrics.map((metric) => (
                  <div key={metric.code} className={`trend-card trend-${metric.status}`}>
                    <div className="trend-head">
                      <div>
                        <strong>{metric.code}</strong>
                        <span>{metric.name}</span>
                      </div>
                      <div className="trend-meta">
                        <strong>{metric.latest} {metric.unit}</strong>
                        <small>{metric.delta > 0 ? `+${metric.delta.toFixed(1)}` : metric.delta.toFixed(1)}</small>
                      </div>
                    </div>
                    <svg className="trend-chart" viewBox="0 0 240 92" preserveAspectRatio="none" aria-hidden="true">
                      <path d="M12 76 H228" className="trend-baseline" />
                      <polyline
                        className="trend-line"
                        fill="none"
                        points={metric.points.map((point) => `${point.x},${point.y}`).join(" ")}
                      />
                      {metric.points.map((point, index) => (
                        <circle key={`${metric.code}-${index}`} className="trend-node" cx={point.x} cy={point.y} r="4.5" />
                      ))}
                    </svg>
                    <div className="trend-label-row">
                      {metric.points.map((point, index) => (
                        <span key={`${metric.code}-label-${index}`}>{point.label}</span>
                      ))}
                    </div>
                  </div>
                )) : <div className="empty-card">추세를 그릴 만큼 저장된 기록이 아직 충분하지 않습니다. 리포트를 여러 번 생성하면 그래프가 더 정확해집니다.</div>}
              </div>
            </article>}

            {activeReportSection === "trend" && <article className="glass-card list-card">
              <h3>변화 감지 및 재검 가이드</h3>
              <div className="guidance-stack">
                <div className="guidance-hero-card">
                  <strong>{retestGuidance.title}</strong>
                  <span>{retestGuidance.window}</span>
                  <p>{retestGuidance.detail}</p>
                </div>
                {changeAlerts.length ? changeAlerts.map((alert) => (
                  <div key={alert.code} className={`guidance-card level-${alert.level}`}>
                    <div>
                      <strong>{alert.name}</strong>
                      <span>{alert.code}</span>
                    </div>
                    <p>{alert.message}</p>
                    <small>{alert.detail}</small>
                  </div>
                )) : <div className="empty-card">아직 누적 기록이 많지 않아 변화 감지 카드가 제한적으로 보입니다. 리포트를 더 쌓아 보세요.</div>}
              </div>
            </article>}

            {activeReportSection === "overview" && <article className="glass-card list-card">
              <h3>항목군 브리핑</h3>
              {reportMetricClusters.length ? (
                <div className="report-cluster-grid">
                  {reportMetricClusters.map((cluster) => (
                    <div key={cluster.label} className={`report-cluster-card tone-${cluster.tone}`}>
                      <span className="chip">{cluster.label}</span>
                      <strong>{cluster.metrics.length}개 항목</strong>
                      <p>{cluster.label} 항목군에서 우선 볼 수치를 한 번에 묶어 정리했습니다.</p>
                      <div className="report-cluster-list">
                        {cluster.metrics.slice(0, 4).map((metric) => (
                          <div key={`${cluster.label}-${metric.code}`} className="bullet-card">
                            <strong>{metric.code}</strong> {metric.name} · {metric.value} {metric.unit}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="empty-card">리포트에 반영할 핵심 수치가 아직 충분하지 않습니다.</div>}
            </article>}

            {activeReportSection === "clinical" && <article className="glass-card list-card">
              <h3>임상 해설 포인트</h3>
              {clinicalBriefs.length ? (
                <div className="clinical-brief-grid">
                  {clinicalBriefs.map((card) => (
                    <div key={`report-${card.id}`} className={`clinical-brief-card tone-${card.tone}`}>
                      <span className="chip accent">AI CONSULT NOTE</span>
                      <strong>{card.title}</strong>
                      <p>{card.summary}</p>
                      <ul>
                        {card.bullets.map((item) => (
                          <li key={`report-${card.id}-${item}`}>{item}</li>
                        ))}
                      </ul>
                      <small>{card.question}</small>
                    </div>
                  ))}
                </div>
              ) : <div className="empty-card">수치 조합을 기반으로 한 임상 해설 포인트가 여기에 생성됩니다.</div>}
            </article>}

            {activeReportSection === "clinical" && <article className="glass-card list-card">
              <h3>질환별 전문의 시각</h3>
              {selectedDisease && diseaseExpertGuide ? (
                <div className="clinical-brief-grid">
                  <div className="clinical-brief-card tone-high">
                    <span className="chip accent">SPECIALIST VIEW</span>
                    <strong>{selectedDisease.name} 해석 각도</strong>
                    <p>{diseaseExpertGuide.angle}</p>
                    <small>{diseaseExpertGuide.caution}</small>
                  </div>
                  <div className="clinical-brief-card tone-medium">
                    <span className="chip">CHECKPOINTS</span>
                    <strong>이번 리포트에서 같이 볼 점</strong>
                    <ul>
                      {(diseaseExpertGuide.checkpoints || []).map((item) => (
                        <li key={`report-${selectedDisease.code}-${item}`}>{item}</li>
                      ))}
                    </ul>
                    <small>AI 설명과 별개로 실제 임상 자문처럼 어떤 축을 우선 보는지 정리했습니다.</small>
                  </div>
                </div>
              ) : <div className="empty-card">질환을 선택하면 질환별 전문 해석 관점을 리포트에서도 함께 보여줍니다.</div>}
            </article>}

            {activeReportSection === "overview" && <article className="glass-card list-card">
              <h3>수치 관계도</h3>
              {relationshipMap.length ? (
                <div className="relation-map-grid">
                  {relationshipMap.map((item) => (
                    <div key={item.id} className={`report-cluster-card tone-${item.tone}`}>
                      <span className="chip accent">RELATION MAP</span>
                      <strong>{item.title}</strong>
                      <div className="relation-node-row">
                        {item.nodes.map((node, index) => (
                          <div key={`${item.id}-${node}`} className="relation-node">
                            <span>{node}</span>
                            {index < item.nodes.length - 1 ? <small>+</small> : null}
                          </div>
                        ))}
                      </div>
                      <p>{item.summary}</p>
                      <small>{item.question}</small>
                    </div>
                  ))}
                </div>
              ) : <div className="empty-card">조합 해설을 만들 만큼 입력된 수치가 모이면 관계도가 채워집니다.</div>}
            </article>}

            {activeReportSection === "safety" && <article className="glass-card list-card">
              <h3>응급 플래그</h3>
              <div className="guidance-stack">
                {diseaseEmergencyFlags.length ? diseaseEmergencyFlags.map((flag) => (
                  <div key={`${flag.title}-${flag.detail}`} className={`guidance-card level-${flag.level}`}>
                    <div>
                      <strong>{flag.title}</strong>
                      <span>{flag.detail}</span>
                    </div>
                    <p>{flag.message}</p>
                  </div>
                )) : <div className="empty-card">현재 입력값 기준으로 즉시 강조할 응급 플래그는 확인되지 않았습니다. 다만 증상과 함께 해석해야 합니다.</div>}
              </div>
            </article>}

            {activeReportSection === "safety" && <article className="glass-card list-card">
              <h3>재검 우선순위</h3>
              <div className="guidance-stack">
                {retestPriorityCards.length ? retestPriorityCards.map((item) => (
                  <div key={`retest-${item.code}`} className="guidance-card level-medium">
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.code} · {formatMetricValue(item.value)} {item.unit}</span>
                    </div>
                    <p>{item.message}</p>
                  </div>
                )) : <div className="empty-card">재검 우선순위 항목은 분석 시 자동으로 정리됩니다.</div>}
              </div>
            </article>}

            {activeReportSection === "safety" && <article className="glass-card list-card">
              <h3>의료 브리핑 / 안전 문구</h3>
              <div className="guidance-stack">
                {medicalSafetyNotes.map((note, index) => (
                  <div key={`report-safety-${index}`} className="guidance-card level-watch">
                    <div>
                      <strong>{index === 0 ? "안전 해석 원칙" : "의료진 상담 권장 문구"}</strong>
                      <span>SAFETY NOTE</span>
                    </div>
                    <p>{note}</p>
                  </div>
                ))}
              </div>
            </article>}

            {activeReportSection === "clinical" && <article className="glass-card list-card">
              <h3>우선 확인 항목</h3>
              {priorityItems.length ? priorityItems.map((item, index) => renderReportItem(item, index)) : <div className="empty-card">AI 우선 항목은 분석 결과에 따라 여기에 표시됩니다.</div>}
            </article>}

            {activeReportSection === "clinical" && <article className="glass-card list-card">
              <h3>관리 포인트</h3>
              {managementTips.length ? managementTips.map((item, index) => renderReportItem(item, index)) : <div className="empty-card">생활관리와 상담 포인트가 여기에 정리됩니다.</div>}
            </article>}

            {activeReportSection === "clinical" && <article className="glass-card list-card">
              <h3>의료진에게 물어볼 질문</h3>
              {clinicianQuestions.length ? clinicianQuestions.map((item, index) => renderReportItem(item, index)) : <div className="empty-card">질문 추천은 AI 응답에 따라 여기에 채워집니다.</div>}
            </article>}

            {activeReportSection === "safety" && <article className="glass-card list-card">
              <h3>수치 카드</h3>
              <div className="metric-grid compact-grid">
                {combinedMetrics.map((metric) => {
                  const metricValue = customLabs.find((item) => item.code === metric.code)?.value ?? labs[metric.code];
                  const status = classifyMetric(metric, metricValue);
                  return (
                    <button key={metric.code} type="button" className="metric-card compact" onClick={() => setSelectedMetricCode(metric.code)}>
                      <div className="metric-head">
                        <div>
                          <strong>{metric.code}</strong>
                          <span>{metric.name}</span>
                        </div>
                        <StatusPill status={status} />
                      </div>
                      <div className="metric-footer">
                        <span className="metric-reading">{formatMetricValue(metricValue)} {metric.unit}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>}
          </section>
        )}

        {activeView === "history" && (
          <section className="screen-grid">
            <article className="glass-card">
              <div className="section-head">
                <h3>저장된 리포트 기록</h3>
                <span className="chip">불러보기 / 비교</span>
              </div>
              {comparedReports.length > 0 && (
                <div className="history-compare-panel">
                  <div className="history-compare-head">
                    <div>
                      <strong>기록 비교</strong>
                      <small>{comparedReports.length === 2 ? "두 리포트의 핵심 수치를 나란히 비교하고 있습니다." : "비교할 리포트를 하나 더 선택하면 좌우 비교가 열립니다."}</small>
                    </div>
                    <button type="button" className="ghost-btn small" onClick={() => setHistoryCompareIds([])}>비교 초기화</button>
                  </div>
                  {historyTrendSeries.length ? (
                    <div className="timeline-multi-panel">
                      <div className="section-head">
                        <h3>다중 추세 그래프</h3>
                        <span className="chip">최근 기록 흐름 한눈에 보기</span>
                      </div>
                      <div className="timeline-multi-grid">
                        {historyTrendSeries.map((series) => (
                          <div key={series.code} className={`timeline-series-card tone-${series.tone}`}>
                            <div className="timeline-series-head">
                              <div>
                                <strong>{series.code}</strong>
                                <small>{series.name}</small>
                              </div>
                              <span>{series.latestLabel}</span>
                            </div>
                            <svg className="timeline-series-chart" viewBox="0 0 240 88" preserveAspectRatio="none" aria-hidden="true">
                              <path d="M10 72 H230" className="trend-baseline" />
                              <polyline className="trend-line" fill="none" points={series.points.map((point) => `${point.x},${point.y}`).join(" ")} />
                              {series.points.map((point, index) => (
                                <circle key={`${series.code}-${index}`} className="trend-node" cx={point.x} cy={point.y} r="4" />
                              ))}
                            </svg>
                            <div className="timeline-series-labels">
                              {series.points.map((point, index) => (
                                <span key={`${series.code}-label-${index}`}>{point.label}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {comparedReports.length === 2 ? (
                    <div className="history-compare-grid">
                      <div className="history-compare-card">
                        <span className="chip accent">기준 리포트</span>
                        <strong>{comparedReports[0].disease?.name || "혈액검사 리포트"}</strong>
                        <small>{new Date(comparedReports[0].createdAt).toLocaleString("ko-KR")}</small>
                      </div>
                      <div className="history-compare-card">
                        <span className="chip accent">비교 리포트</span>
                        <strong>{comparedReports[1].disease?.name || "혈액검사 리포트"}</strong>
                        <small>{new Date(comparedReports[1].createdAt).toLocaleString("ko-KR")}</small>
                      </div>
                      <div className="history-compare-table">
                        {historyCompareMetrics.map((item) => (
                          <div key={`compare-${item.code}`} className={`history-compare-row ${item.delta === null ? "flat" : item.delta > 0 ? "rise" : item.delta < 0 ? "fall" : "flat"}`}>
                            <strong>{item.code}</strong>
                            <span>{formatMetricValue(item.leftValue)} {item.unit}</span>
                            <span>{formatMetricValue(item.rightValue)} {item.unit}</span>
                            <small>{item.delta === null ? "변화 계산 없음" : `${item.delta > 0 ? "+" : ""}${item.delta.toFixed(1)} ${item.unit}`}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
              {historyLoading && <div className="empty-card">기록을 불러오는 중입니다...</div>}
              {historyError && <div className="inline-error">{historyError}</div>}
              <div className="history-grid">
                {history.map((report) => (
                  <div key={report.id} className={`history-card history-card-shell ${historyCompareIds.includes(report.id) ? "history-card-selected" : ""}`}>
                    <button type="button" className="history-card history-card-main" onClick={() => handleLoadReport(report)}>
                      <div className="history-topline">
                        <strong>{report.disease?.name || (report.profile?.mode === "patient" ? "환자 모드 리포트" : "일반 해설 리포트")}</strong>
                        <span>{new Date(report.createdAt).toLocaleString("ko-KR")}</span>
                      </div>
                      <p>{report.analysis?.aiResult?.overall_summary || "저장된 혈액검사 브리핑"}</p>
                      <small>{report.profile?.displayName || preferredDisplayName} · {report.provider === "openai" ? "ChatGPT" : "Gemini"}</small>
                    </button>
                    <div className="history-card-actions">
                      <button type="button" className="ghost-btn small" onClick={() => toggleHistoryCompare(report.id)}>
                        {historyCompareIds.includes(report.id) ? "비교 해제" : "비교 선택"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {!historyLoading && history.length === 0 && <div className="empty-card">아직 저장된 리포트가 없습니다.</div>}
            </article>
          </section>
        )}

        {activeView === "settings" && (
          <section className="screen-grid two-column">
            <article className="glass-card">
              <div className="section-head">
                <h3>AI 설정</h3>
                <span className="chip accent">사용자별 API 연결</span>
              </div>
              <form className="settings-form" onSubmit={handleSaveSettings}>
                <div className="toggle-row">
                  <button type="button" className={settingsDraft.provider === "gemini" ? "toggle-btn active" : "toggle-btn"} onClick={() => setSettingsDraft((current) => ({ ...current, provider: "gemini" }))}>Gemini</button>
                  <button type="button" className={settingsDraft.provider === "openai" ? "toggle-btn active" : "toggle-btn"} onClick={() => setSettingsDraft((current) => ({ ...current, provider: "openai" }))}>ChatGPT</button>
                </div>

                <label>
                  Gemini 모델명
                  <input value={settingsDraft.geminiModel} onChange={(event) => setSettingsDraft((current) => ({ ...current, geminiModel: event.target.value }))} placeholder="예: gemini-3-flash 또는 gemini-3-flash-preview" />
                </label>
                <label>
                  Gemini API Key
                  <input value={settingsDraft.geminiApiKey} onChange={(event) => setSettingsDraft((current) => ({ ...current, geminiApiKey: event.target.value }))} placeholder="필요할 때만 입력하거나 교체하세요" />
                </label>
                <label>
                  ChatGPT 모델명
                  <input value={settingsDraft.openaiModel} onChange={(event) => setSettingsDraft((current) => ({ ...current, openaiModel: event.target.value }))} placeholder="예: gpt-5" />
                </label>
                <label>
                  ChatGPT API Key
                  <input value={settingsDraft.openaiApiKey} onChange={(event) => setSettingsDraft((current) => ({ ...current, openaiApiKey: event.target.value }))} placeholder="필요할 때만 입력하거나 교체하세요" />
                </label>

                <div className="key-status-grid">
                  <div className="status-box">
                    <span>Gemini 키 저장 여부</span>
                    <strong className={`status-indicator ${session.user?.settings?.hasGeminiKey ? "saved" : "missing"}`}>{session.user?.settings?.hasGeminiKey ? "저장됨" : "없음"}</strong>
                  </div>
                  <div className="status-box">
                    <span>ChatGPT 키 저장 여부</span>
                    <strong className={`status-indicator ${session.user?.settings?.hasOpenaiKey ? "saved" : "missing"}`}>{session.user?.settings?.hasOpenaiKey ? "저장됨" : "없음"}</strong>
                  </div>
                </div>

                {settingsMessage && <div className="inline-note">{settingsMessage}</div>}

                <button type="submit" className="primary-btn wide" disabled={settingsBusy}>{settingsBusy ? "저장 중..." : "AI 설정 저장"}</button>
              </form>
            </article>

            <article className="glass-card info-card">
              <h3>에이전트 동작 원리</h3>
              <div className="bullet-card">로그인한 사용자는 서버 공용 키가 아니라 본인 계정에 저장한 API 키로만 분석을 진행합니다.</div>
              <div className="bullet-card">Gemini와 ChatGPT 모델명도 여기서 직접 바꿀 수 있어, 사용하는 AI 에이전트의 맥락을 명시적으로 고를 수 있습니다.</div>
              <div className="bullet-card">하나의 모델을 바꾸면 이후 브리핑은 모두 해당 설정 기준으로 생성됩니다.</div>
              <div className="bullet-card">정식 배포 전 개인 테스트에 맞춘 구조이므로, 빠른 반복과 맞춤 설정에 유리합니다.</div>
            </article>
          </section>
        )}
      </div>

      <nav className="mobile-nav glass-card">
        {NAV_ITEMS.map((item) => (
          <button key={item.id} type="button" className={activeView === item.id ? "active" : ""} onClick={() => setActiveView(item.id)}>{item.label}</button>
        ))}
      </nav>

      {reportActionBusy ? (
        <div className="action-overlay">
          <div className="action-overlay-card">
            <div className="action-spinner" />
            <strong>{reportActionLabel || "내보내기 준비 중"}</strong>
            <p>{reportActionMessage || "파일을 생성하는 중입니다. 잠시만 기다려 주세요."}</p>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={`toast-message toast-${toast.tone || "info"}`}>
          {toast.message}
        </div>
      ) : null}

      {selectedMetric && (
        <div className="modal-shell" onClick={() => setSelectedMetricCode("")}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="close-btn" onClick={() => setSelectedMetricCode("")}>닫기</button>
            <p className="eyebrow">METRIC DETAIL</p>
            <h3>{selectedMetric.name} ({selectedMetric.code})</h3>
            {(() => {
              const currentValue = customLabs.find((item) => item.code === selectedMetric.code)?.value ?? labs[selectedMetric.code];
              const currentStatus = classifyMetric(selectedMetric, currentValue);
              return (
            <div className="modal-stack">
              <div className="modal-block">
                <strong>현재 값</strong>
                <p>{formatMetricValue(currentValue)} {selectedMetric.unit}</p>
              </div>
              <div className="modal-block">
                <strong>의미</strong>
                <p>{selectedMetric.meaning}</p>
              </div>
              <div className="modal-block">
                <strong>정상 범위</strong>
                <p>{Number.isFinite(selectedMetric.range.low) && Number.isFinite(selectedMetric.range.high) ? `${selectedMetric.range.low} - ${selectedMetric.range.high}` : "입력된 참고 범위가 없으면 AI가 일반 설명 중심으로 안내합니다."}</p>
              </div>
              <div className="modal-block">
                <strong>관리 팁</strong>
                <p>{currentStatus === "high" ? selectedMetric.highText : currentStatus === "low" ? selectedMetric.lowText : selectedMetric.generalTip}</p>
              </div>
            </div>
              );
            })()}
          </div>
        </div>
      )}

      {medicationEditorOpen && (
        <div className="modal-shell" onClick={closeMedicationEditor}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="close-btn" onClick={closeMedicationEditor}>닫기</button>
            <p className="eyebrow">MEDICATION SCHEDULE</p>
            <h3>{editingMedicationIndex >= 0 ? "복약 일정 수정" : "복약 일정 추가"}</h3>
            <p className="modal-copy">복약 시간, 요일 패턴, 식전/식후 맥락을 함께 등록해 두면 각 시간대에 맞는 푸시 알림을 받을 수 있습니다.</p>
            <div className="modal-stack medication-editor-stack">
              <label>
                복약 이름
                <input value={medicationScheduleDraft.label} onChange={(event) => setMedicationScheduleDraft((current) => ({ ...current, label: event.target.value }))} placeholder="예: 아침약, 철분제, 항암제" />
              </label>
              <div className="form-grid">
                <label>
                  시간
                  <input type="time" value={medicationScheduleDraft.time} onChange={(event) => setMedicationScheduleDraft((current) => ({ ...current, time: event.target.value }))} />
                </label>
                <label>
                  용량 / 횟수
                  <input value={medicationScheduleDraft.dose} onChange={(event) => setMedicationScheduleDraft((current) => ({ ...current, dose: event.target.value }))} placeholder="예: 1정 5mg, 하루 2회" />
                </label>
              </div>
              <div className="form-grid triple">
                <label>
                  요일 패턴
                  <select value={medicationScheduleDraft.daysPreset || "daily"} onChange={(event) => setMedicationScheduleDraft((current) => ({ ...current, daysPreset: event.target.value }))}>
                    <option value="daily">매일</option>
                    <option value="weekdays">평일</option>
                    <option value="weekends">주말</option>
                    <option value="mwf">월/수/금</option>
                    <option value="tts">화/목/토</option>
                  </select>
                </label>
                <label>
                  복약 타이밍
                  <select value={medicationScheduleDraft.mealTiming || "after_meal"} onChange={(event) => setMedicationScheduleDraft((current) => ({ ...current, mealTiming: event.target.value }))}>
                    <option value="before_meal">식전</option>
                    <option value="after_meal">식후</option>
                    <option value="empty_stomach">공복</option>
                  </select>
                </label>
                <label>
                  강조 색상
                  <select value={medicationScheduleDraft.color || "rose"} onChange={(event) => setMedicationScheduleDraft((current) => ({ ...current, color: event.target.value }))}>
                    <option value="rose">빨강</option>
                    <option value="teal">초록</option>
                    <option value="gold">노랑</option>
                    <option value="ink">먹색</option>
                  </select>
                </label>
              </div>
              <label>
                메모
                <textarea rows="3" value={medicationScheduleDraft.note} onChange={(event) => setMedicationScheduleDraft((current) => ({ ...current, note: event.target.value }))} placeholder="예: 식후 30분, 복약 후 3시간마다 속이 불편하면 의료진과 상의" />
              </label>
              <div className="modal-action-row">
                <button type="button" className="ghost-btn" onClick={closeMedicationEditor}>취소</button>
                <button type="button" className="primary-btn" onClick={saveMedicationSchedule}>{editingMedicationIndex >= 0 ? "수정 저장" : "일정 추가"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

