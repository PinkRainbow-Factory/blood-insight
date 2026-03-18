const metricDefinitions = {
  WBC: { name: "백혈구", low: 4.0, high: 10.0, unit: "x10^3/uL", meaning: "감염과 염증, 면역 상태를 볼 때 자주 확인합니다." },
  RBC: { name: "적혈구", low: 3.8, high: 5.2, unit: "x10^6/uL", meaning: "빈혈과 골수 기능 상태를 볼 때 참고합니다." },
  HGB: { name: "혈색소", low: 12.0, high: 16.0, unit: "g/dL", meaning: "빈혈과 산소 운반 상태 해석에 중요합니다." },
  HCT: { name: "헤마토크릿", low: 36, high: 48, unit: "%", meaning: "적혈구 농축 정도와 빈혈 경향을 봅니다." },
  MCV: { name: "MCV", low: 80, high: 100, unit: "fL", meaning: "적혈구 크기를 통해 빈혈 유형 해석에 도움을 줍니다." },
  MCH: { name: "MCH", low: 27, high: 34, unit: "pg", meaning: "적혈구 한 개가 담고 있는 혈색소 양을 봅니다." },
  MCHC: { name: "MCHC", low: 32, high: 36, unit: "g/dL", meaning: "적혈구 내 혈색소 농도를 참고합니다." },
  RDW: { name: "RDW", low: 11.5, high: 14.5, unit: "%", meaning: "적혈구 크기 분포를 통해 빈혈 원인 해석에 도움을 줍니다." },
  PLT: { name: "혈소판", low: 150, high: 400, unit: "x10^3/uL", meaning: "출혈과 응고 균형 확인에 중요합니다." },
  NEUT: { name: "호중구", low: 40, high: 74, unit: "%", meaning: "세균 감염과 면역 반응 해석에 자주 사용됩니다." },
  LYM: { name: "림프구", low: 19, high: 48, unit: "%", meaning: "바이러스 감염과 면역 상태를 볼 때 참고합니다." },
  MONO: { name: "단핵구", low: 3, high: 10, unit: "%", meaning: "염증 회복 과정과 면역 반응을 볼 때 참고합니다." },
  EOS: { name: "호산구", low: 0, high: 7, unit: "%", meaning: "알레르기 반응과 기생충 감염 맥락에서 볼 수 있습니다." },
  BASO: { name: "호염구", low: 0, high: 2, unit: "%", meaning: "알레르기 및 골수 질환 맥락에서 참고하기도 합니다." },
  ANC: { name: "절대호중구수", low: 1.5, high: 7.5, unit: "x10^3/uL", meaning: "감염 방어 능력 해석에 핵심이 되는 경우가 많습니다." },
  CRP: { name: "CRP", low: 0, high: 5.0, unit: "mg/L", meaning: "전신 염증 반응을 볼 때 참고합니다." },
  ESR: { name: "적혈구침강속도", low: 0, high: 20, unit: "mm/hr", meaning: "만성 염증이나 자가면역 질환 맥락에서 참고합니다." },
  AST: { name: "AST", low: 10, high: 40, unit: "U/L", meaning: "간과 근육 등 조직 손상 가능성을 볼 때 참고합니다." },
  ALT: { name: "ALT", low: 7, high: 56, unit: "U/L", meaning: "간 기능과 관련해 자주 보는 수치입니다." },
  ALP: { name: "ALP", low: 44, high: 147, unit: "U/L", meaning: "간담도계와 뼈 대사 맥락에서 참고합니다." },
  TBIL: { name: "총빌리루빈", low: 0.2, high: 1.2, unit: "mg/dL", meaning: "간기능과 황달 관련 평가에 참고합니다." },
  TP: { name: "총단백", low: 6.0, high: 8.3, unit: "g/dL", meaning: "영양 상태와 만성질환 맥락 해석에 도움을 줍니다." },
  ALB: { name: "알부민", low: 3.5, high: 5.2, unit: "g/dL", meaning: "영양 상태와 간기능, 염증 상태 평가에 자주 씁니다." },
  BUN: { name: "BUN", low: 7, high: 20, unit: "mg/dL", meaning: "신장 기능과 탈수 상태를 볼 때 참고합니다." },
  CREAT: { name: "크레아티닌", low: 0.5, high: 1.2, unit: "mg/dL", meaning: "신장 기능 평가에 자주 사용됩니다." },
  NA: { name: "나트륨", low: 135, high: 145, unit: "mmol/L", meaning: "체액 균형과 전해질 상태를 봅니다." },
  K: { name: "칼륨", low: 3.5, high: 5.1, unit: "mmol/L", meaning: "심장과 근육 기능에 중요한 전해질입니다." },
  CL: { name: "염소", low: 98, high: 107, unit: "mmol/L", meaning: "산염기 균형과 체액 상태를 볼 때 참고합니다." },
  CA: { name: "칼슘", low: 8.6, high: 10.2, unit: "mg/dL", meaning: "뼈 대사와 신경근 기능에 중요한 수치입니다." },
  GLU: { name: "포도당", low: 70, high: 99, unit: "mg/dL", meaning: "공복 혈당 상태를 빠르게 확인합니다." },
  HBA1C: { name: "당화혈색소", low: 4.0, high: 5.6, unit: "%", meaning: "최근 수개월간 평균 혈당 흐름을 파악할 때 중요합니다." },
  FERRITIN: { name: "페리틴", low: 15, high: 150, unit: "ng/mL", meaning: "철 저장 상태 해석에 중요한 지표입니다." },
  LDH: { name: "LDH", low: 140, high: 280, unit: "U/L", meaning: "세포 손상이나 혈액질환 맥락에서 참고하기도 합니다." },
  URIC: { name: "요산", low: 2.4, high: 7.0, unit: "mg/dL", meaning: "통풍과 대사성 상태 해석에 참고합니다." }
};

function parseMetricInput(code, rawValue) {
  const base = metricDefinitions[code] || {};
  if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
    const value = Number(rawValue.value);
    return {
      code,
      name: rawValue.label || rawValue.name || base.name || code,
      unit: rawValue.unit || base.unit || "",
      low: Number.isFinite(Number(rawValue.low)) ? Number(rawValue.low) : base.low,
      high: Number.isFinite(Number(rawValue.high)) ? Number(rawValue.high) : base.high,
      value,
      meaning: rawValue.meaning || base.meaning || "사용자가 추가한 혈액검사 항목입니다."
    };
  }

  return {
    code,
    name: base.name || code,
    unit: base.unit || "",
    low: base.low,
    high: base.high,
    value: Number(rawValue),
    meaning: base.meaning || "정의되지 않은 항목입니다."
  };
}

function getStatus(definition, value) {
  if (!Number.isFinite(value)) {
    return { status: "unknown", label: "미입력", severity: 0 };
  }

  if (!Number.isFinite(definition.low) || !Number.isFinite(definition.high)) {
    return { status: "unknown", label: "참고범위 없음", severity: 6 };
  }

  const span = Math.max(definition.high - definition.low, 1);
  if (value < definition.low) {
    const severity = Math.min(100, Math.round(((definition.low - value) / span) * 120) + 22);
    return { status: value < definition.low * 0.85 ? "low" : "borderline", label: value < definition.low * 0.85 ? "낮음" : "경계 낮음", severity };
  }
  if (value > definition.high) {
    const severity = Math.min(100, Math.round(((value - definition.high) / span) * 120) + 22);
    return { status: value > definition.high * 1.15 ? "high" : "borderline", label: value > definition.high * 1.15 ? "높음" : "경계 높음", severity };
  }
  return { status: "normal", label: "정상", severity: 8 };
}

export function runRulesEngine({ profile, disease, labs }) {
  const focus = disease?.focus ?? [];
  const metrics = Object.entries(labs).map(([code, rawValue]) => {
    const definition = parseMetricInput(code, rawValue);
    const status = getStatus(definition, definition.value);
    const related = focus.includes(code);

    return {
      code,
      name: definition.name,
      value: definition.value,
      unit: definition.unit,
      low: definition.low,
      high: definition.high,
      status: status.status,
      label: status.label,
      severity: status.severity,
      related,
      meaning: definition.meaning,
      relevanceScore: Math.min(100, status.severity + (related ? 20 : 0))
    };
  });

  const priorityItems = [...metrics]
    .filter((item) => Number.isFinite(item.value))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 6);

  const riskScore = priorityItems.length
    ? Math.min(96, Math.round(priorityItems.reduce((sum, item) => sum + item.relevanceScore, 0) / priorityItems.length))
    : 12;

  return {
    profile,
    disease,
    metrics,
    priorityItems,
    riskScore,
    summary: {
      abnormalCount: metrics.filter((item) => item.status !== "normal" && item.status !== "unknown").length,
      focusMetricCodes: priorityItems.map((item) => item.code),
      mode: disease ? "patient" : "general"
    }
  };
}
