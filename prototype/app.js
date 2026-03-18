const diseaseCatalog = [
  {
    code: "C92.0",
    name: "급성 골수성 백혈병",
    group: "혈액암",
    focus: ["WBC", "HGB", "PLT", "CRP"],
    note: "혈액세포 생산과 염증 반응 관련 수치를 우선적으로 살펴봐야 합니다."
  },
  {
    code: "D64.9",
    name: "빈혈",
    group: "혈액질환",
    focus: ["HGB", "RBC", "FERRITIN"],
    note: "산소 운반과 철 저장 상태를 함께 보는 것이 중요합니다."
  },
  {
    code: "K76.9",
    name: "간질환",
    group: "소화기",
    focus: ["AST", "ALT", "CRP"],
    note: "간세포 손상과 염증성 변화가 같이 보이는지 확인합니다."
  },
  {
    code: "N18.9",
    name: "만성 신장질환",
    group: "신장",
    focus: ["CREAT", "BUN", "HGB"],
    note: "신장 기능과 빈혈 경향을 함께 추적하는 것이 좋습니다."
  },
  {
    code: "E11.9",
    name: "제2형 당뇨병",
    group: "대사",
    focus: ["GLU", "CRP", "ALT"],
    note: "혈당과 대사성 염증 경향을 함께 보는 방식이 유용합니다."
  }
];

const metricDefinitions = [
  {
    code: "WBC",
    name: "백혈구",
    unit: "x10^3/uL",
    range: { low: 4.0, high: 10.0 },
    meaning: "감염, 염증, 면역 상태를 해석할 때 자주 보는 기본 혈액수치입니다.",
    highText: "높으면 염증이나 감염 반응, 일부 혈액질환 맥락을 함께 살펴봐야 합니다.",
    lowText: "낮으면 면역 방어력이 약해졌는지, 치료 영향이 있는지 확인이 필요할 수 있습니다.",
    generalTip: "급격한 변화가 있으면 최근 감염, 투약, 치료 일정과 함께 의료진에게 보여주는 것이 좋습니다."
  },
  {
    code: "HGB",
    name: "혈색소",
    unit: "g/dL",
    range: { low: 12.0, high: 16.0 },
    meaning: "산소를 운반하는 핵심 지표로 피로감, 어지러움, 빈혈 해석에 중요합니다.",
    highText: "높으면 탈수나 농축 상태를 포함해 전체 맥락을 같이 봐야 합니다.",
    lowText: "낮으면 빈혈 가능성, 출혈, 치료 영향, 영양 상태 등을 폭넓게 확인합니다.",
    generalTip: "피로감이 반복되면 철분, 출혈 여부, 질환 경과를 함께 점검하는 것이 좋습니다."
  },
  {
    code: "PLT",
    name: "혈소판",
    unit: "x10^3/uL",
    range: { low: 150, high: 400 },
    meaning: "출혈과 응고 균형을 볼 때 핵심이 되는 수치입니다.",
    highText: "높으면 염증성 반응이나 회복 과정, 드물게 혈액질환 맥락을 같이 해석합니다.",
    lowText: "낮으면 멍, 출혈 경향, 치료 영향과의 관련성을 확인해야 할 수 있습니다.",
    generalTip: "수치가 크게 낮을 때는 멍, 잇몸 출혈, 코피 등의 증상을 기록해두면 도움이 됩니다."
  },
  {
    code: "CRP",
    name: "CRP",
    unit: "mg/L",
    range: { low: 0, high: 5.0 },
    meaning: "몸 안의 염증 반응을 반영하는 대표적인 지표입니다.",
    highText: "높으면 감염, 염증, 조직 손상 가능성을 다른 증상과 함께 살펴야 합니다.",
    lowText: "정상 또는 낮은 편이면 뚜렷한 전신 염증 신호가 강하지 않을 수 있습니다.",
    generalTip: "최근 감기, 통증, 수술, 염증성 질환 악화 여부를 함께 기록하면 해석에 유리합니다."
  },
  {
    code: "AST",
    name: "AST",
    unit: "U/L",
    range: { low: 10, high: 40 },
    meaning: "간과 근육 등 여러 조직 손상 시 참고하는 효소입니다.",
    highText: "높으면 간세포 손상, 약물 영향, 근육 손상 등 다양한 가능성을 함께 봅니다.",
    lowText: "낮다고 해서 큰 의미가 없는 경우가 많으며 전체 패널과 같이 해석합니다.",
    generalTip: "음주, 운동, 복용약, 간질환 여부가 해석에 영향을 줄 수 있습니다."
  },
  {
    code: "ALT",
    name: "ALT",
    unit: "U/L",
    range: { low: 7, high: 56 },
    meaning: "간 기능과 관련해서 AST와 함께 자주 확인하는 수치입니다.",
    highText: "높으면 간세포 손상 가능성을 생각하며 약물, 지방간, 간염 맥락을 같이 확인합니다.",
    lowText: "낮은 값 자체보다는 전체 간기능 패널 흐름이 더 중요합니다.",
    generalTip: "체중 변화, 음주, 복용약, 피로감과 함께 해석하면 좋습니다."
  },
  {
    code: "CREAT",
    name: "크레아티닌",
    unit: "mg/dL",
    range: { low: 0.5, high: 1.2 },
    meaning: "신장 기능을 볼 때 중요한 기본 수치입니다.",
    highText: "높으면 신장 기능 저하 가능성을 포함해 탈수, 약물 영향, 기저질환을 함께 봅니다.",
    lowText: "낮으면 근육량이 적은 경우처럼 개인차가 반영될 수 있습니다.",
    generalTip: "수분 섭취, 복용약, 기존 신장질환 여부가 해석에 중요합니다."
  },
  {
    code: "GLU",
    name: "포도당",
    unit: "mg/dL",
    range: { low: 70, high: 99 },
    meaning: "공복 혈당 상태를 빠르게 확인하는 지표입니다.",
    highText: "높으면 혈당 조절 상태를 더 자세히 확인해볼 필요가 있습니다.",
    lowText: "낮으면 식사 간격, 저혈당 증상, 복용약 여부를 함께 보아야 합니다.",
    generalTip: "공복 여부와 최근 식사 시간을 꼭 같이 기록해야 의미가 분명해집니다."
  }
];

const sampleValues = {
  WBC: 13.8,
  HGB: 9.8,
  PLT: 118,
  CRP: 16.2,
  AST: 42,
  ALT: 58,
  CREAT: 1.1,
  GLU: 114
};

const state = {
  activeScreen: "home",
  provider: "chatgpt",
  userType: "general",
  selectedDisease: null,
  labs: {},
  latestAnalysis: null
};

const navItems = document.querySelectorAll(".nav-item");
const screens = document.querySelectorAll(".screen");
const sidebarMode = document.getElementById("sidebarMode");
const reportModeChip = document.getElementById("reportModeChip");
const providerChip = document.getElementById("providerChip");
const heroGauge = document.getElementById("heroGauge");
const heroGaugeLabel = document.getElementById("heroGaugeLabel");
const labGrid = document.getElementById("labGrid");
const diseaseSearch = document.getElementById("diseaseSearch");
const diseaseResults = document.getElementById("diseaseResults");
const selectedDiseaseCard = document.getElementById("selectedDiseaseCard");
const metricModal = document.getElementById("metricModal");
const modalBody = document.getElementById("modalBody");
const imageUpload = document.getElementById("imageUpload");
const imagePreview = document.getElementById("imagePreview");

function switchScreen(screenId) {
  state.activeScreen = screenId;
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.screen === screenId));
  screens.forEach((screen) => screen.classList.toggle("active", screen.id === `screen-${screenId}`));
}

function updateProviderUI() {
  providerChip.textContent = state.provider === "chatgpt" ? "ChatGPT 모드" : "Gemini 모드";
  document.querySelectorAll(".provider-pill").forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.provider === state.provider);
  });
}

function updateModeUI() {
  sidebarMode.textContent = state.userType === "patient" ? "환자 모드" : "일반 건강관리";
  reportModeChip.textContent = state.userType === "patient" ? "Patient Mode" : "General Mode";
  document.querySelectorAll(".toggle-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.type === state.userType);
  });
}

function renderLabInputs() {
  labGrid.innerHTML = metricDefinitions.map((metric) => `
    <label class="lab-card">
      <div class="lab-meta">
        <strong>${metric.name}</strong>
        <small>${metric.code}</small>
      </div>
      <small>정상범위 ${metric.range.low} - ${metric.range.high} ${metric.unit}</small>
      <input type="number" step="0.1" data-metric="${metric.code}" placeholder="${metric.unit}" value="${state.labs[metric.code] ?? ""}">
    </label>
  `).join("");

  labGrid.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", (event) => {
      const code = event.target.dataset.metric;
      const value = Number(event.target.value);
      state.labs[code] = Number.isFinite(value) ? value : "";
    });
  });
}

function renderDiseaseResults(query = "") {
  const lowered = query.trim().toLowerCase();
  const filtered = diseaseCatalog.filter((disease) => {
    if (!lowered) return true;
    return disease.name.toLowerCase().includes(lowered) || disease.code.toLowerCase().includes(lowered) || disease.group.toLowerCase().includes(lowered);
  });

  diseaseResults.innerHTML = filtered.map((disease) => `
    <button class="search-result" data-disease="${disease.code}">
      <strong>${disease.name}</strong>
      <div>${disease.code} · ${disease.group}</div>
      <div class="support-copy">${disease.note}</div>
    </button>
  `).join("");

  diseaseResults.querySelectorAll(".search-result").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedDisease = diseaseCatalog.find((disease) => disease.code === button.dataset.disease) || null;
      renderSelectedDisease();
      if (state.selectedDisease) {
        state.userType = "patient";
        updateModeUI();
      }
    });
  });
}

function renderSelectedDisease() {
  if (!state.selectedDisease) {
    selectedDiseaseCard.innerHTML = `<p class="support-copy">선택된 질환이 없습니다. 환자 모드에서는 질환을 선택하면 관련 혈액수치를 우선 분석합니다.</p>`;
    return;
  }

  selectedDiseaseCard.innerHTML = `
    <div class="feature-list">
      <div>
        <strong>${state.selectedDisease.name}</strong>
        <div>${state.selectedDisease.code} · ${state.selectedDisease.group}</div>
      </div>
      <div class="support-copy">${state.selectedDisease.note}</div>
      <div>중요 추적 항목: ${state.selectedDisease.focus.join(", ")}</div>
    </div>
  `;
}

function getMetricStatus(metric, value) {
  if (value === "" || Number.isNaN(value)) {
    return { status: "normal", label: "미입력", severity: 0, offset: 10 };
  }

  const { low, high } = metric.range;
  const span = Math.max(high - low, 1);

  if (value < low) {
    const severity = Math.min(100, Math.round(((low - value) / span) * 120) + 22);
    return {
      status: value < low * 0.85 ? "low" : "borderline",
      label: value < low * 0.85 ? "낮음" : "경계 낮음",
      severity,
      offset: Math.max(5, 45 - ((low - value) / span) * 20)
    };
  }

  if (value > high) {
    const severity = Math.min(100, Math.round(((value - high) / span) * 120) + 22);
    return {
      status: value > high * 1.15 ? "high" : "borderline",
      label: value > high * 1.15 ? "높음" : "경계 높음",
      severity,
      offset: Math.min(92, 55 + ((value - high) / span) * 20)
    };
  }

  const normalized = ((value - low) / span) * 50 + 25;
  return { status: "normal", label: "정상", severity: 8, offset: normalized };
}

function createSummary(analyzedMetrics, riskScore) {
  const abnormal = analyzedMetrics.filter((metric) => metric.status !== "normal");
  const name = document.getElementById("profileName").value || "사용자";
  const disease = state.selectedDisease;

  if (abnormal.length === 0) {
    return {
      title: `${name}님의 혈액검사 흐름은 비교적 안정적입니다`,
      text: "입력된 주요 수치들이 대부분 정상 범위 안에 있습니다. 추세 비교와 현재 컨디션을 함께 기록해두면 다음 검사 때 더 정밀하게 볼 수 있습니다."
    };
  }

  const focusLabels = abnormal.slice(0, 3).map((item) => item.name).join(", ");
  const diseaseSentence = disease
    ? `${disease.name} 맥락에서는 ${disease.focus.join(", ")} 같은 항목을 더 우선적으로 보게 됩니다.`
    : "현재는 일반 건강관리 모드 기준으로 전체 패턴을 해석했습니다.";

  const cautionLevel = riskScore >= 70 ? "주의도가 높아" : riskScore >= 40 ? "주의해서 볼 부분이 있어" : "일부 경계 항목이 있어";

  return {
    title: `${name}님의 결과는 ${cautionLevel} 보입니다`,
    text: `${focusLabels} 중심으로 정상 범위를 벗어난 수치가 보였습니다. ${diseaseSentence} 이 앱은 진단을 확정하지 않고, 어떤 항목을 우선적으로 이해하고 의료진과 상의하면 좋은지 정리해줍니다.`
  };
}

function buildContextCards(analyzedMetrics) {
  const contextStack = document.getElementById("contextStack");
  if (!state.selectedDisease) {
    contextStack.innerHTML = `
      <div class="context-card">
        <strong>일반 건강관리 모드</strong>
        <div class="context-note">현재는 질환 특이적 룰 없이 정상범위, 염증, 간기능, 신장기능, 혈당 흐름 중심으로 해석했습니다.</div>
      </div>
    `;
    return;
  }

  const relatedMetrics = analyzedMetrics.filter((metric) => state.selectedDisease.focus.includes(metric.code));
  const cards = relatedMetrics.length ? relatedMetrics : analyzedMetrics.slice(0, 3);

  contextStack.innerHTML = cards.map((metric) => `
    <div class="context-card">
      <strong>${state.selectedDisease.name} x ${metric.name}</strong>
      <div class="context-note">${metric.diseaseContext}</div>
    </div>
  `).join("");
}

function renderBulletCards(targetId, items, titleKey, bodyKey) {
  const target = document.getElementById(targetId);
  target.innerHTML = items.map((item) => `
    <div class="bullet-card">
      <strong>${item[titleKey]}</strong>
      <div class="support-copy">${item[bodyKey]}</div>
    </div>
  `).join("");
}

function analyze() {
  const analyzedMetrics = metricDefinitions.map((metric) => {
    const value = Number(state.labs[metric.code]);
    const statusInfo = getMetricStatus(metric, value);
    const isRelated = state.selectedDisease?.focus.includes(metric.code) || false;
    const diseaseContext = state.selectedDisease
      ? isRelated
        ? `${state.selectedDisease.name} 사용자의 추적 포인트에 포함됩니다. 현재 값은 ${statusInfo.label} 상태로, 질환 경과나 치료 영향과 함께 보는 것이 좋습니다.`
        : `${state.selectedDisease.name}의 핵심 추적 항목은 아니지만 전체 컨디션 해석에는 도움이 됩니다.`
      : "현재는 일반 건강관리 관점에서 설명합니다.";

    const explanation = statusInfo.status === "high"
      ? metric.highText
      : statusInfo.status === "low"
        ? metric.lowText
        : statusInfo.status === "borderline"
          ? `정상 범위를 살짝 벗어나 전체 맥락과 추세를 함께 보는 것이 좋습니다. ${metric.generalTip}`
          : "현재 값은 기준 범위 안쪽으로 보여 비교적 안정적으로 해석됩니다.";

    const importanceBoost = isRelated ? 20 : 0;
    const priorityScore = Math.min(100, statusInfo.severity + importanceBoost);

    return {
      ...metric,
      value,
      status: statusInfo.status,
      label: statusInfo.label,
      severity: statusInfo.severity,
      offset: statusInfo.offset,
      isRelated,
      priorityScore,
      diseaseContext,
      explanation,
      careTip: metric.generalTip,
      question: `${metric.name} 수치가 현재 제 프로필과 ${state.selectedDisease ? state.selectedDisease.name : "현재 건강상태"} 맥락에서 어떤 의미인지 더 자세히 설명해주실 수 있나요?`
    };
  });

  const priority = analyzedMetrics
    .filter((metric) => Number.isFinite(metric.value))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 4);

  const riskScore = Math.min(96, Math.round(priority.reduce((sum, item) => sum + item.priorityScore, 0) / Math.max(priority.length, 1)));
  const summary = createSummary(analyzedMetrics, riskScore);

  state.latestAnalysis = {
    analyzedMetrics,
    priority,
    riskScore,
    summary
  };

  renderReport();
  switchScreen("report");
}

function renderReport() {
  const analysis = state.latestAnalysis;
  if (!analysis) return;

  const { analyzedMetrics, priority, riskScore, summary } = analysis;
  const heroLabel = riskScore >= 70 ? "주의 높음" : riskScore >= 40 ? "주의 필요" : "안정적";

  document.getElementById("summaryTitle").textContent = summary.title;
  document.getElementById("summaryText").textContent = summary.text;
  document.getElementById("riskScore").textContent = riskScore;
  document.getElementById("heroMetricCount").textContent = `${analyzedMetrics.filter((metric) => Number.isFinite(metric.value)).length}개`;
  heroGaugeLabel.textContent = heroLabel;
  heroGauge.style.background = `radial-gradient(circle at center, #0f1a2b 0 59%, transparent 60%), conic-gradient(var(--accent) 0deg, var(--accent-3) ${Math.max(90, riskScore * 2)}deg, rgba(255, 255, 255, 0.12) ${Math.max(90, riskScore * 2 + 2)}deg)`;

  const priorityList = document.getElementById("priorityList");
  priorityList.innerHTML = priority.map((metric, index) => `
    <div class="priority-item">
      <strong>${index + 1}. ${metric.name}</strong>
      <div>${metric.value} ${metric.unit} · ${metric.label}</div>
      <p>${metric.explanation}</p>
    </div>
  `).join("");

  buildContextCards(analyzedMetrics);

  const metricsBoard = document.getElementById("metricsBoard");
  metricsBoard.innerHTML = analyzedMetrics.filter((metric) => Number.isFinite(metric.value)).map((metric) => `
    <button class="metric-card" data-open-metric="${metric.code}">
      <div class="metric-top">
        <div>
          <h4>${metric.name}</h4>
          <div class="metric-subline">${metric.code} · ${metric.unit}</div>
        </div>
        <span class="status-badge status-${metric.status}">${metric.label}</span>
      </div>
      <div class="metric-value">
        <strong>${metric.value}</strong>
        <span>${metric.unit}</span>
      </div>
      <div class="range-bar">
        <span class="range-marker" style="left: calc(${metric.offset}% - 9px)"></span>
      </div>
      <footer>정상범위 ${metric.range.low} - ${metric.range.high}</footer>
    </button>
  `).join("");

  metricsBoard.querySelectorAll(".metric-card").forEach((button) => {
    button.addEventListener("click", () => openMetricModal(button.dataset.openMetric));
  });

  const careItems = priority.map((metric) => ({
    title: `${metric.name} 관리 포인트`,
    body: metric.careTip
  }));

  const questions = priority.map((metric) => ({
    title: `${metric.name} 질문`,
    body: metric.question
  }));

  renderBulletCards("careTips", careItems, "title", "body");
  renderBulletCards("doctorQuestions", questions, "title", "body");

  document.getElementById("riskOrb").style.background =
    `radial-gradient(circle at center, rgba(255, 255, 255, 0.78) 0 52%, transparent 53%), conic-gradient(${riskScore >= 70 ? "var(--danger)" : riskScore >= 40 ? "var(--accent-3)" : "var(--safe)"} 0deg, rgba(239, 111, 81, 0.55) ${Math.max(140, riskScore * 2.8)}deg, rgba(255, 255, 255, 0.14) ${Math.max(141, riskScore * 2.8 + 1)}deg)`;
}

function openMetricModal(metricCode) {
  const metric = state.latestAnalysis?.analyzedMetrics.find((item) => item.code === metricCode);
  if (!metric) return;

  modalBody.innerHTML = `
    <div class="modal-content">
      <div>
        <p class="eyebrow">METRIC DETAIL</p>
        <h2>${metric.name}</h2>
      </div>

      <div class="modal-block">
        <strong>현재 값</strong>
        <p>${metric.value} ${metric.unit} · ${metric.label}</p>
        <p class="support-copy">정상범위 ${metric.range.low} - ${metric.range.high} ${metric.unit}</p>
      </div>

      <div class="modal-block">
        <strong>이 수치가 의미하는 것</strong>
        <p>${metric.meaning}</p>
      </div>

      <div class="modal-block">
        <strong>현재 해설</strong>
        <p>${metric.explanation}</p>
      </div>

      <div class="modal-block">
        <strong>질환 맥락</strong>
        <p>${metric.diseaseContext}</p>
      </div>

      <div class="modal-block">
        <strong>관리 포인트</strong>
        <p>${metric.careTip}</p>
      </div>
    </div>
  `;

  metricModal.classList.remove("hidden");
}

function fillDemo() {
  document.getElementById("loginEmail").value = "demo@bloodinsight.ai";
  document.getElementById("loginPassword").value = "prototype123";
  document.getElementById("profileName").value = "김민서";
  document.getElementById("profileAge").value = "41";
  document.getElementById("profileNotes").value = "최근 피로감이 있고, 항암 치료 후 추적검사를 받고 있습니다.";
  diseaseSearch.value = "백혈병";
  renderDiseaseResults("백혈병");
  state.selectedDisease = diseaseCatalog[0];
  state.userType = "patient";
  updateModeUI();
  renderSelectedDisease();
  Object.entries(sampleValues).forEach(([code, value]) => {
    state.labs[code] = value;
  });
  renderLabInputs();
  document.getElementById("loginFeedback").textContent = "데모 세션이 채워졌습니다. 검사 입력으로 이동해 바로 리포트를 만들 수 있습니다.";
}

navItems.forEach((item) => {
  item.addEventListener("click", () => switchScreen(item.dataset.screen));
});

document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => switchScreen(button.dataset.jump));
});

document.getElementById("startDemo").addEventListener("click", () => {
  fillDemo();
  switchScreen("profile");
});

document.getElementById("demoFill").addEventListener("click", fillDemo);
document.getElementById("applySampleLabs").addEventListener("click", () => {
  Object.assign(state.labs, sampleValues);
  renderLabInputs();
});

document.getElementById("generateReport").addEventListener("click", analyze);

document.getElementById("loginButton").addEventListener("click", () => {
  const feedback = document.getElementById("loginFeedback");
  feedback.textContent = "로컬 프로토타입 세션으로 로그인되었습니다. 다음 단계에서는 서버 인증과 연결할 수 있습니다.";
  switchScreen("profile");
});

document.querySelectorAll(".toggle-item").forEach((button) => {
  button.addEventListener("click", () => {
    state.userType = button.dataset.type;
    if (state.userType === "general") {
      state.selectedDisease = null;
      renderSelectedDisease();
    }
    updateModeUI();
  });
});

document.querySelectorAll(".provider-pill").forEach((button) => {
  button.addEventListener("click", () => {
    state.provider = button.dataset.provider;
    updateProviderUI();
  });
});

document.getElementById("saveSettings").addEventListener("click", () => {
  const feedback = document.getElementById("settingsFeedback");
  const providerLabel = state.provider === "chatgpt" ? "ChatGPT" : "Gemini";
  feedback.textContent = `${providerLabel} 설정이 로컬 프로토타입에 저장되었습니다. 다음 단계에서는 서버 프록시와 연결하면 실제 모델 호출로 확장할 수 있습니다.`;
});

diseaseSearch.addEventListener("input", (event) => renderDiseaseResults(event.target.value));

imageUpload.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.innerHTML = `<img src="${reader.result}" alt="업로드된 검사표 미리보기">`;
  };
  reader.readAsDataURL(file);
});

document.getElementById("closeModal").addEventListener("click", () => {
  metricModal.classList.add("hidden");
});

metricModal.addEventListener("click", (event) => {
  if (event.target.dataset.closeModal === "true") {
    metricModal.classList.add("hidden");
  }
});

renderLabInputs();
renderDiseaseResults();
renderSelectedDisease();
updateProviderUI();
updateModeUI();
document.getElementById("showSampleReport").addEventListener("click", () => {
  fillDemo();
  analyze();
});
