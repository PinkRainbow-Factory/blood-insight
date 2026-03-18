import Tesseract from "tesseract.js";

export const ocrTemplates = [
  { id: "general", label: "일반 검사표", helper: "CBC와 화학검사가 섞인 일반 검사표" },
  { id: "cbc", label: "CBC 중심", helper: "혈구계 수치가 많은 검사표" },
  { id: "chemistry", label: "간/신장/대사", helper: "AST, ALT, BUN, Cr, 전해질 중심" },
  { id: "oncology", label: "혈액암/항암 추적", helper: "CBC, ANC, LDH, CRP, 전해질 중심" }
];

export const ocrInstitutionPresets = [
  { id: "generic", label: "일반 / 미지정", helper: "기관 구분 없이 일반 검사표로 읽습니다." },
  { id: "samsung", label: "삼성서울병원 스타일", helper: "영문 약어와 chemistry 표기를 조금 더 우선 해석합니다." },
  { id: "asan", label: "서울아산병원 스타일", helper: "CBC + chemistry 혼합형 검사표를 우선 해석합니다." },
  { id: "severance", label: "세브란스 스타일", helper: "국문/영문 혼합 표기와 T.Bili, Alb 같은 약어를 정리합니다." },
  { id: "university", label: "대학병원 국문 양식", helper: "국문 항목명이 많은 검사표를 우선 해석합니다." },
  { id: "green_cross", label: "녹십자 검사실 스타일", helper: "외부 수탁검사 결과지의 영문 약어와 지질/갑상선 표기를 먼저 정리합니다." },
  { id: "samkwang", label: "삼광 검사실 스타일", helper: "국문 항목명과 영문 약어가 섞인 결과지를 더 공격적으로 정규화합니다." },
  { id: "checkup", label: "건강검진센터 양식", helper: "CBC, 간수치, 지질/혈당 항목이 섞인 건강검진 결과지에 맞춥니다." },
  { id: "inpatient", label: "입원 CBC/Chemistry", helper: "Na, K, Cr, BUN 같은 입원 추적형 chemistry 표기를 더 강하게 읽습니다." },
  { id: "chemo", label: "항암 외래 추적지", helper: "CBC, ANC, LDH, CRP 중심의 항암 외래 추적 양식에 맞춥니다." }
];

const templateFocusMap = {
  general: [],
  cbc: ["WBC", "RBC", "HGB", "HCT", "MCV", "MCH", "MCHC", "PLT", "NEUT", "LYM", "ANC"],
  chemistry: ["AST", "ALT", "BUN", "CREAT", "GLU", "ALB", "TBIL", "ALP", "NA", "K", "MG", "HBA1C"],
  oncology: ["WBC", "HGB", "PLT", "ANC", "CRP", "LDH", "CREAT", "BUN", "K", "NA"]
};

const presetSubstitutions = {
  generic: [],
  samsung: [
    [/T\.Bili/gi, "TBIL"],
    [/D\.Bili/gi, "DBIL"],
    [/Alb\b/gi, "Albumin"],
    [/Cr\b/g, "Creatinine"],
    [/Glu\b/gi, "Glucose"],
    [/Plt\b/gi, "PLT"]
  ],
  asan: [
    [/Hb\b/gi, "HGB"],
    [/Hct\b/gi, "HCT"],
    [/TCO2/gi, "CO2"],
    [/Na\b/g, "Sodium"],
    [/K\b/g, "Potassium"]
  ],
  severance: [
    [/총빌리루빈/gi, "TBIL"],
    [/알부민/gi, "Albumin"],
    [/크레아티닌/gi, "Creatinine"],
    [/혈색소/gi, "HGB"],
    [/혈당/gi, "Glucose"]
  ],
  university: [
    [/백혈구/gi, "WBC"],
    [/적혈구/gi, "RBC"],
    [/혈소판/gi, "PLT"],
    [/호중구/gi, "Neutrophil"],
    [/림프구/gi, "Lymphocyte"]
  ],
  green_cross: [
    [/T\.Prot/gi, "Total Protein"],
    [/D\.Bilirubin/gi, "DBIL"],
    [/Uric\s*Acid/gi, "URIC ACID"],
    [/Free\s*T4/gi, "FT4"],
    [/TSH\s*\(/gi, "TSH ("]
  ],
  samkwang: [
    [/총단백/gi, "Total Protein"],
    [/직접빌리루빈/gi, "DBIL"],
    [/간접빌리루빈/gi, "IBIL"],
    [/요산/gi, "Uric Acid"],
    [/망상적혈구/gi, "Reticulocyte"]
  ],
  checkup: [
    [/총콜레스테롤/gi, "TOTAL CHOLESTEROL"],
    [/중성지방/gi, "TRIGLYCERIDE"],
    [/고밀도지단백/gi, "HDL"],
    [/저밀도지단백/gi, "LDL"],
    [/공복혈당/gi, "Glucose"],
    [/감마지티피/gi, "GGT"],
    [/혈색소/gi, "HGB"],
    [/당화혈색소/gi, "HbA1c"],
    [/갑상선자극호르몬/gi, "TSH"]
  ],
  inpatient: [
    [/CO2/gi, "TCO2"],
    [/Bicarb/gi, "TCO2"],
    [/HCO3/gi, "TCO2"],
    [/Ca\b/gi, "Calcium"],
    [/P\b/gi, "Phosphorus"],
    [/Mg\b/gi, "Magnesium"],
    [/Cr\b/gi, "Creatinine"],
    [/BUN\/Cr/gi, "BUN Creatinine"],
    [/Uric\s*Acid/gi, "URIC ACID"]
  ],
  chemo: [
    [/Absolute\s*Neutrophil\s*Count/gi, "ANC"],
    [/ANC/gi, "ANC"],
    [/Platelet/gi, "PLT"],
    [/Hemoglobin/gi, "HGB"],
    [/Lactate\s*dehydrogenase/gi, "LDH"],
    [/C-reactive\s*protein/gi, "CRP"],
    [/Ferritin/gi, "FERRITIN"],
    [/Reticulocyte/gi, "RETIC"],
    [/Monocyte/gi, "MONO"]
  ]
};

const metricMatchers = [
  { code: "WBC", label: "백혈구", aliases: ["WBC", "백혈구"] },
  { code: "RBC", label: "적혈구", aliases: ["RBC", "적혈구"] },
  { code: "HGB", label: "혈색소", aliases: ["HGB", "Hb", "Hemoglobin", "혈색소", "헤모글로빈"] },
  { code: "HCT", label: "헤마토크릿", aliases: ["HCT", "Hematocrit", "헤마토크릿"] },
  { code: "MCV", label: "MCV", aliases: ["MCV"] },
  { code: "MCH", label: "MCH", aliases: ["MCH"] },
  { code: "MCHC", label: "MCHC", aliases: ["MCHC"] },
  { code: "PLT", label: "혈소판", aliases: ["PLT", "Platelet", "혈소판"] },
  { code: "NEUT", label: "호중구", aliases: ["NEUT", "Neutrophil", "호중구"] },
  { code: "LYM", label: "림프구", aliases: ["LYM", "Lymphocyte", "림프구"] },
  { code: "MONO", label: "단핵구", aliases: ["MONO", "Monocyte", "단핵구"] },
  { code: "EOS", label: "호산구", aliases: ["EOS", "Eosinophil", "호산구"] },
  { code: "BASO", label: "호염구", aliases: ["BASO", "Basophil", "호염구"] },
  { code: "ANC", label: "절대호중구수", aliases: ["ANC", "Absolute Neutrophil Count", "절대호중구수"] },
  { code: "RETIC", label: "망상적혈구", aliases: ["RETIC", "Reticulocyte", "망상적혈구"] },
  { code: "ALB", label: "알부민", aliases: ["Albumin", "ALB", "알부민"] },
  { code: "TBIL", label: "총빌리루빈", aliases: ["T-Bilirubin", "TBIL", "Bilirubin", "총빌리루빈"] },
  { code: "DBIL", label: "직접빌리루빈", aliases: ["D-Bilirubin", "DBIL", "Direct Bilirubin", "직접빌리루빈"] },
  { code: "ALP", label: "ALP", aliases: ["ALP", "Alkaline Phosphatase"] },
  { code: "TOTAL_PROTEIN", label: "총단백", aliases: ["Total Protein", "T.Prot", "TOTAL PROTEIN", "총단백"] },
  { code: "NA", label: "나트륨", aliases: ["Sodium", "Na", "NA", "나트륨"] },
  { code: "K", label: "칼륨", aliases: ["Potassium", "K", "칼륨"] },
  { code: "CRP", label: "CRP", aliases: ["CRP", "C-reactive protein"] },
  { code: "AST", label: "AST", aliases: ["AST", "SGOT"] },
  { code: "ALT", label: "ALT", aliases: ["ALT", "SGPT"] },
  { code: "BUN", label: "BUN", aliases: ["BUN", "Blood Urea Nitrogen", "요소질소"] },
  { code: "CREAT", label: "크레아티닌", aliases: ["Creatinine", "CREAT", "Cr", "크레아티닌"] },
  { code: "GLU", label: "포도당", aliases: ["Glucose", "GLU", "포도당", "혈당"] },
  { code: "FERRITIN", label: "페리틴", aliases: ["Ferritin", "FERRITIN", "페리틴"] },
  { code: "LDH", label: "LDH", aliases: ["LDH"] },
  { code: "ESR", label: "ESR", aliases: ["ESR"] },
  { code: "HBA1C", label: "당화혈색소", aliases: ["HbA1c", "A1c", "HBA1C", "당화혈색소"] },
  { code: "MG", label: "마그네슘", aliases: ["Magnesium", "Mg", "마그네슘"] },
  { code: "TSH", label: "TSH", aliases: ["TSH", "갑상선자극호르몬"] },
  { code: "TOTAL_CHOLESTEROL", label: "총콜레스테롤", aliases: ["Total Cholesterol", "총콜레스테롤", "Cholesterol"] },
  { code: "TRIGLYCERIDE", label: "중성지방", aliases: ["Triglyceride", "TG", "중성지방"] },
  { code: "HDL", label: "HDL", aliases: ["HDL", "HDL-Cholesterol"] },
  { code: "LDL", label: "LDL", aliases: ["LDL", "LDL-Cholesterol"] },
  { code: "GGT", label: "감마지티피", aliases: ["GGT", "γ-GTP", "감마지티피"] },
  { code: "URIC_ACID", label: "요산", aliases: ["Uric Acid", "UricAcid", "URIC ACID", "요산"] },
  { code: "CALCIUM", label: "칼슘", aliases: ["Calcium", "Ca", "칼슘"] },
  { code: "PHOSPHORUS", label: "인", aliases: ["Phosphorus", "Phosphate", "P", "인"] },
  { code: "TCO2", label: "총이산화탄소", aliases: ["TCO2", "Total CO2", "Bicarbonate"] }
];

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeCode(label) {
  return label.toUpperCase().replace(/[^A-Z0-9]/g, "_").replace(/^_+|_+$/g, "").slice(0, 20);
}

function normalizeAliasText(value) {
  return String(value || "").toLowerCase().replace(/[\s/()_.-]+/g, "");
}

function matchKnownMetric(label) {
  const normalizedLabel = normalizeAliasText(label);
  return metricMatchers.find((matcher) => matcher.aliases.some((alias) => normalizeAliasText(alias) === normalizedLabel)) || null;
}

function preprocessText(rawText, presetId = "generic") {
  return (presetSubstitutions[presetId] || []).reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), rawText || "");
}

function parseValueFromText(text, aliases) {
  for (const alias of aliases) {
    const pattern = new RegExp(`${escapeRegExp(alias)}(?:\\s*[:=]|[^\\d]){0,12}(\\d+(?:[.,]\\d+)?)`, "i");
    const match = text.match(pattern);
    if (match) {
      return Number(match[1].replace(/,/g, "."));
    }
  }
  return null;
}

function parseMetricSnapshotFromText(text, aliases) {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  for (const alias of aliases) {
    const aliasPattern = escapeRegExp(alias);
    const richPattern = new RegExp(`${aliasPattern}(?:\\s*[:=]|[^\\d]){0,18}(\\d+(?:[.,]\\d+)?)(?:\\s*([%A-Za-z/._^0-9-]+))?(?:\\s+(\\d+(?:[.,]\\d+)?)\\s*[-~]\\s*(\\d+(?:[.,]\\d+)?))?`, "i");

    for (const line of lines) {
      const match = line.match(richPattern);
      if (!match) {
        continue;
      }

      return {
        value: Number(match[1].replace(/,/g, ".")),
        unit: match[2] || "",
        low: match[3] ? Number(match[3].replace(/,/g, ".")) : "",
        high: match[4] ? Number(match[4].replace(/,/g, ".")) : "",
        sourceLine: line
      };
    }
  }

  return null;
}

function parseLineMetric(line, knownCodes) {
  const compactLine = String(line || "").replace(/\s+/g, " ").trim();
  const match = compactLine.match(/^([A-Za-z가-힣][A-Za-z0-9가-힣/()_. -]{1,40})\s*[:=]?\s+(\d+(?:[.,]\d+)?)(?:\s*([%A-Za-z/._^0-9-]+))?(?:\s+(\d+(?:[.,]\d+)?)\s*[-~]\s*(\d+(?:[.,]\d+)?))?$/);
  if (!match) {
    return null;
  }

  const label = match[1].trim();
  const matchedMetric = matchKnownMetric(label);
  const code = matchedMetric?.code || normalizeCode(label);
  if (!code || knownCodes.has(code)) {
    return null;
  }

  return {
    code,
    label: matchedMetric?.label || label,
    value: Number(match[2].replace(/,/g, ".")),
    unit: match[3] || "",
    low: match[4] ? Number(match[4].replace(/,/g, ".")) : "",
    high: match[5] ? Number(match[5].replace(/,/g, ".")) : "",
    confidence: 0.72,
    source: "ocr",
    sourceLine: compactLine,
    isCustom: !matchedMetric
  };
}

function buildGenericMatches(rawText, knownCodes) {
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const genericMatches = [];

  lines.forEach((line) => {
    const parsed = parseLineMetric(line, knownCodes);
    if (parsed) {
      genericMatches.push(parsed);
      knownCodes.add(parsed.code);
    }
  });

  return genericMatches;
}

function sortByTemplate(matches, templateId) {
  const focusCodes = templateFocusMap[templateId] || [];
  if (!focusCodes.length) {
    return matches;
  }

  const rank = new Map(focusCodes.map((code, index) => [code, index]));
  return [...matches].sort((left, right) => {
    const leftRank = rank.has(left.code) ? rank.get(left.code) : 999;
    const rightRank = rank.has(right.code) ? rank.get(right.code) : 999;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return (right.confidence || 0) - (left.confidence || 0);
  });
}

export function extractLabMetricsFromText(rawText, templateId = "general", presetId = "generic") {
  const preprocessedText = preprocessText(rawText, presetId);
  const prioritizedMatchers = sortByTemplate(metricMatchers, templateId);
  const knownMatches = prioritizedMatchers
    .map((matcher) => {
      const snapshot = parseMetricSnapshotFromText(preprocessedText, matcher.aliases);
      const value = snapshot?.value ?? parseValueFromText(preprocessedText, matcher.aliases);
      if (value === null || Number.isNaN(value)) return null;
      return {
        code: matcher.code,
        label: matcher.label,
        value,
        unit: snapshot?.unit || "",
        low: snapshot?.low ?? "",
        high: snapshot?.high ?? "",
        confidence: 0.88,
        source: "ocr",
        sourceLine: snapshot?.sourceLine || matcher.aliases.find((alias) => preprocessedText.toLowerCase().includes(alias.toLowerCase())) || matcher.code
      };
    })
    .filter(Boolean);

  const knownCodes = new Set(knownMatches.map((item) => item.code));
  const genericMatches = buildGenericMatches(preprocessedText, knownCodes);

  return {
    rawText: preprocessedText,
    templateId,
    presetId,
    matches: sortByTemplate([...knownMatches, ...genericMatches], templateId)
  };
}

export async function extractLabMetricsFromImage(file, templateId = "general", presetId = "generic") {
  const result = await Tesseract.recognize(file, "eng+kor");
  const rawText = result?.data?.text || "";
  const parsed = extractLabMetricsFromText(rawText, templateId, presetId);
  return {
    rawText: parsed.rawText,
    templateId,
    presetId,
    matches: parsed.matches.map((item) => ({
      ...item,
      confidence: result?.data?.confidence ? Math.min(0.99, Math.max(item.confidence || 0.72, result.data.confidence / 100)) : item.confidence
    }))
  };
}

export function getSampleOcrPayload(templateId = "general", presetId = "generic") {
  const samples = {
    general: `
    CBC\n    WBC 13.8\n    RBC 3.42\n    Hb 9.8\n    HCT 31.2\n    PLT 118\n    CRP 16.2\n    AST 42\n    ALT 58\n    BUN 24\n    Creatinine 1.1\n    Glucose 114\n    Ferritin 18\n    Magnesium 2.0 mg/dL\n    TSH 5.6 uIU/mL\n  `,
    cbc: `
    CBC\n    WBC 2.4\n    RBC 3.01\n    Hb 8.7\n    HCT 27.6\n    MCV 91.8\n    PLT 84\n    ANC 0.7\n    Neutrophil 31\n    Lymphocyte 56\n  `,
    chemistry: `
    Chemistry\n    AST 46\n    ALT 63\n    BUN 28\n    Creatinine 1.5\n    Sodium 133\n    Potassium 5.3\n    Albumin 3.2\n    T.Bili 1.4\n    HbA1c 6.9\n  `,
    oncology: `
    Oncology Follow-up\n    WBC 1.8\n    Hb 8.9\n    PLT 72\n    ANC 0.5\n    CRP 12.4\n    LDH 410\n    Creatinine 1.3\n    Potassium 4.8\n  `
  };
  const presetSamples = {
    checkup: `
    건강검진\n    백혈구 5.9\n    혈색소 13.8\n    혈당 102\n    총콜레스테롤 198\n    중성지방 134\n    HDL 52\n    LDL 117\n    감마지티피 41\n  `,
    inpatient: `
    Inpatient Chemistry\n    WBC 11.4\n    HGB 10.2\n    PLT 168\n    Sodium 131\n    Potassium 5.1\n    BUN 32\n    Creatinine 1.7\n    Calcium 8.3\n    Phosphorus 4.8\n    Magnesium 2.2\n    TCO2 19\n  `,
    chemo: `
    Hematology Oncology\n    WBC 2.1\n    Hemoglobin 8.6\n    Platelet 69\n    Absolute Neutrophil Count 0.6\n    CRP 10.8\n    LDH 438\n    Ferritin 622\n    Creatinine 1.2\n  `
  };

  const sampleText = presetSamples[presetId] || samples[templateId] || samples.general;
  return extractLabMetricsFromText(sampleText, templateId, presetId);
}
