import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import jsPDF from "jspdf";

const EXPORT_WIDTH = 1240;
const HERO_HEIGHT = 250;
const COVER_HEIGHT = 300;
const SECTION_GAP = 28;
const PAGE_MARGIN = 56;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

function sleep(ms = 20) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeItem(item, index = 0) {
  if (typeof item === "string" || typeof item === "number") {
    return { title: `포인트 ${index + 1}`, body: String(item) };
  }

  if (item && typeof item === "object") {
    return {
      title: item.title || item.test_code || `항목 ${index + 1}`,
      body: [item.why_it_matters, item.care_tip, item.ask_doctor, item.text, item.summary]
        .filter(Boolean)
        .join(" ")
        .trim()
    };
  }

  return { title: `항목 ${index + 1}`, body: "" };
}

function coerceNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatMetricValue(value) {
  const numeric = coerceNumber(value);
  if (numeric === null) {
    return "-";
  }

  if (Math.abs(numeric) >= 100) {
    return String(Math.round(numeric));
  }

  if (Math.abs(numeric) >= 10) {
    return numeric.toFixed(1);
  }

  return numeric.toFixed(2);
}

function inferMetricStatus(metric) {
  const value = coerceNumber(metric.value);
  const low = coerceNumber(metric.low);
  const high = coerceNumber(metric.high);

  if (value === null) {
    return "unknown";
  }

  if (low !== null && value < low) {
    return "low";
  }

  if (high !== null && value > high) {
    return "high";
  }

  return "normal";
}

function metricTone(status) {
  if (status === "high") {
    return { accent: "#ef5d6a", soft: "#ffe0e4", text: "#8f2331", badge: "HIGH" };
  }

  if (status === "low") {
    return { accent: "#f1a33b", soft: "#fff1d8", text: "#885200", badge: "LOW" };
  }

  return { accent: "#2d8c73", soft: "#def7ee", text: "#0f5e49", badge: "OK" };
}

function diseaseTone(disease) {
  const group = disease?.group || "";

  if (group.includes("혈액암") || group.includes("고형암")) {
    return { accent: "#8d1d2c", soft: "#ffe3e8", label: "ONCOLOGY" };
  }

  if (group.includes("감염")) {
    return { accent: "#d97706", soft: "#fff1db", label: "INFECTION" };
  }

  if (group.includes("신장")) {
    return { accent: "#1d4ed8", soft: "#dce8ff", label: "RENAL" };
  }

  if (group.includes("심혈관")) {
    return { accent: "#7c3aed", soft: "#ede4ff", label: "CARDIO" };
  }

  return { accent: "#b42352", soft: "#ffe4f0", label: "HEMATOLOGY" };
}

function buildMetricCards({ metricMap = {}, focusCodes = [] }) {
  const orderedCodes = [...new Set([...(focusCodes || []), ...Object.keys(metricMap || {})])];

  return orderedCodes
    .slice(0, 6)
    .map((code) => {
      const entry = metricMap?.[code];
      const value = entry && typeof entry === "object" ? entry.value ?? entry.numericValue ?? entry.result : entry;
      const label = entry && typeof entry === "object" ? entry.name || entry.label || code : code;
      const unit = entry && typeof entry === "object" ? entry.unit || "" : "";
      const low = entry && typeof entry === "object" ? entry.low ?? entry.referenceLow ?? entry.range?.low : null;
      const high = entry && typeof entry === "object" ? entry.high ?? entry.referenceHigh ?? entry.range?.high : null;
      const status = inferMetricStatus({ value, low, high });
      return {
        code,
        label,
        unit,
        value: formatMetricValue(value),
        status,
        tone: metricTone(status)
      };
    })
    .filter((item) => item.value !== "-");
}

function buildSections(analysis) {
  return [
    {
      title: "우선 확인 항목",
      items: asList(analysis?.aiResult?.priority_items).map(normalizeItem)
    },
    {
      title: "관리 포인트",
      items: asList(analysis?.aiResult?.management_tips || analysis?.aiResult?.care_tips).map(normalizeItem)
    },
    {
      title: "의료진과 상의할 질문",
      items: asList(analysis?.aiResult?.questions_for_clinician || analysis?.aiResult?.questions).map(normalizeItem)
    }
  ];
}

function pickSummary(analysis) {
  return analysis?.aiResult?.overall_summary || analysis?.structured?.summary?.headline || "AI 리포트 요약이 아직 생성되지 않았습니다.";
}

function buildStats({ disease, analysis, metricCards }) {
  const allItems = buildSections(analysis).flatMap((section) => section.items);
  const abnormalCount = metricCards.filter((item) => item.status !== "normal").length;
  const abnormalRatio = metricCards.length ? Math.round((abnormalCount / metricCards.length) * 100) : 0;
  return [
    { label: "이상 수치 비율", value: `${abnormalRatio}%`, caption: "질환 문맥 기준 주의 필요 항목" },
    { label: "포커스 수치", value: `${metricCards.length}`, caption: disease?.name ? `${disease.name} 추적 항목` : "핵심 수치 자동 선별" },
    { label: "브리핑 포인트", value: `${allItems.length}`, caption: "AI가 정리한 체크 포인트" }
  ];
}

function withAlpha(hex, alpha) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return hex;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function roundRectPath(ctx, x, y, width, height, radius = 24) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, width, height, radius, fillStyle) {
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function strokeRoundRect(ctx, x, y, width, height, radius, strokeStyle, lineWidth = 1) {
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeStyle;
  ctx.stroke();
}

function drawText(ctx, text, x, y, options = {}) {
  const {
    maxWidth = EXPORT_WIDTH - PAGE_MARGIN * 2,
    lineHeight = 30,
    font = "500 26px 'Segoe UI', sans-serif",
    color = "#1f2937",
    align = "left"
  } = options;

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";

  const words = String(text || "").split(/\s+/);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });

  if (current) {
    lines.push(current);
  }

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight, maxWidth);
  });

  return lines.length * lineHeight;
}

function estimateWrappedHeight(text, options = {}) {
  const canvas = createCanvas(10, 10);
  const ctx = canvas.getContext("2d");
  return drawText(ctx, text, 0, 0, options);
}

function makeExportModel(payload) {
  const metricCards = buildMetricCards(payload);
  const sections = buildSections(payload.analysis);
  if (payload.symptomBrief) {
    sections.unshift({
      title: "Symptom Context",
      items: [
        {
          title: payload.symptomBrief.headline || "증상 요약",
          body: [
            payload.symptomBrief.summary,
            Array.isArray(payload.symptomBrief.tags) && payload.symptomBrief.tags.length ? `증상 태그: ${payload.symptomBrief.tags.join(", ")}` : "",
            Array.isArray(payload.symptomBrief.focusSignals) && payload.symptomBrief.focusSignals.length ? `집중 신호: ${payload.symptomBrief.focusSignals.join(" / ")}` : "",
            payload.symptomBrief.nextAction
          ].filter(Boolean).join(" ")
        }
      ]
    });
  }
  if (Array.isArray(payload.emergencyFlags) && payload.emergencyFlags.length) {
    sections.unshift({
      title: "Emergency Flags",
      items: payload.emergencyFlags.map((item) => ({
        title: `${item.title}${item.detail ? ` · ${item.detail}` : ""}`,
        body: item.message || ""
      }))
    });
  }
  if (Array.isArray(payload.retestPriorityCards) && payload.retestPriorityCards.length) {
    sections.push({
      title: "Retest Priority",
      items: payload.retestPriorityCards.map((item) => ({
        title: `${item.name} (${item.code})`,
        body: `${item.message || ""} ${item.value ?? ""}${item.unit ? ` ${item.unit}` : ""}`.trim()
      }))
    });
  }
  if (Array.isArray(payload.clinicianQuestions) && payload.clinicianQuestions.length) {
    sections.push({
      title: "Consult Questions",
      items: payload.clinicianQuestions.slice(0, 5).map((item, index) => ({
        title: `Question ${index + 1}` ,
        body: String(item)
      }))
    });
  }
  const stats = buildStats({ ...payload, metricCards });
  return {
    profile: payload.profile || {},
    disease: payload.disease || null,
    analysis: payload.analysis || {},
    metricCards,
    clinicalBriefs: asList(payload.clinicalBriefs),
    relationshipMap: asList(payload.relationshipMap),
    diseaseExpertGuide: payload.diseaseExpertGuide || null,
    reportMetricClusters: asList(payload.reportMetricClusters),
    symptomBrief: payload.symptomBrief || null,
    sections,
    stats,
    summary: pickSummary(payload.analysis)
  };
}

function estimateCanvasHeight(model) {
  let height = COVER_HEIGHT + HERO_HEIGHT + 220;
  height += 220;
  height += model.metricCards.length ? 260 : 0;
  height += model.reportMetricClusters.length ? 340 : 0;
  height += model.clinicalBriefs.length ? 380 : 0;
  height += model.relationshipMap.length ? 320 : 0;
  height += model.diseaseExpertGuide ? 240 : 0;
  height += 210;

  model.sections.forEach((section) => {
    height += 74;
    section.items.slice(0, 6).forEach((item) => {
      const bodyHeight = estimateWrappedHeight(item.body || "", { maxWidth: 1000, lineHeight: 24, font: "500 18px 'Segoe UI', sans-serif" });
      height += 92 + Math.max(0, bodyHeight - 24);
    });
  });

  return Math.max(height + 120, 2400);
}

function drawBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fff0ea");
  gradient.addColorStop(0.42, "#f9f3e9");
  gradient.addColorStop(1, "#eef4e7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#ff8b7a";
  ctx.beginPath();
  ctx.arc(120, 120, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#9fe1c7";
  ctx.beginPath();
  ctx.arc(width - 90, 160, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawCover(ctx, model, width, startY, variant = "full") {
  const tone = diseaseTone(model.disease);
  fillRoundRect(ctx, PAGE_MARGIN, startY, width - PAGE_MARGIN * 2, COVER_HEIGHT - 32, 42, "rgba(255,255,255,0.9)");
  strokeRoundRect(ctx, PAGE_MARGIN, startY, width - PAGE_MARGIN * 2, COVER_HEIGHT - 32, 42, "rgba(175,118,118,0.12)");

  const coverGradient = ctx.createLinearGradient(PAGE_MARGIN, startY, width - PAGE_MARGIN, startY + COVER_HEIGHT);
  coverGradient.addColorStop(0, "#fff5ef");
  coverGradient.addColorStop(1, "#f8efe5");
  fillRoundRect(ctx, PAGE_MARGIN + 18, startY + 18, width - PAGE_MARGIN * 2 - 36, COVER_HEIGHT - 68, 34, coverGradient);

  fillRoundRect(ctx, PAGE_MARGIN + 38, startY + 40, 196, 42, 21, withAlpha(tone.accent, 0.12));
  ctx.fillStyle = tone.accent;
  ctx.font = "700 18px 'Segoe UI', sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(variant === "share" ? "SHARE BRIEF COVER" : "SUBMISSION COVER", PAGE_MARGIN + 62, startY + 61);

  ctx.fillStyle = "#201827";
  ctx.font = "700 40px 'Segoe UI', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("Blood Insight Agent", PAGE_MARGIN + 38, startY + 102);

  ctx.fillStyle = "#6b7280";
  ctx.font = "600 18px 'Segoe UI', sans-serif";
  drawText(ctx, model.disease?.name || "혈액검사 AI 브리핑", PAGE_MARGIN + 38, startY + 154, {
    maxWidth: width - PAGE_MARGIN * 2 - 120,
    lineHeight: 24,
    font: "600 18px 'Segoe UI', sans-serif",
    color: "#7c2d3f"
  });

  drawText(ctx, model.summary, PAGE_MARGIN + 38, startY + 190, {
    maxWidth: width - PAGE_MARGIN * 2 - 120,
    lineHeight: 24,
    font: "500 16px 'Segoe UI', sans-serif",
    color: "#4b5563"
  });

  const infoY = startY + COVER_HEIGHT - 126;
  const infoWidth = (width - PAGE_MARGIN * 2 - 76) / 3;
  [["이름", model.profile?.displayName || "-"],["다음 검사", model.profile?.nextLabDate || "-"],["위험 단계", model.stats?.[2]?.value || "-"]].forEach(([label, value], index) => {
    const cardX = PAGE_MARGIN + 38 + index * (infoWidth + 12);
    fillRoundRect(ctx, cardX, infoY, infoWidth, 74, 22, "rgba(255,255,255,0.86)");
    ctx.fillStyle = "#7c2d3f";
    ctx.font = "700 14px 'Segoe UI', sans-serif";
    ctx.fillText(label, cardX + 16, infoY + 18);
    ctx.fillStyle = "#201827";
    ctx.font = "700 18px 'Segoe UI', sans-serif";
    drawText(ctx, String(value), cardX + 16, infoY + 38, {
      maxWidth: infoWidth - 28,
      lineHeight: 20,
      font: "700 18px 'Segoe UI', sans-serif",
      color: "#201827"
    });
  });
}

function drawHero(ctx, model, width, startY = PAGE_MARGIN) {
  const tone = diseaseTone(model.disease);
  const heroGradient = ctx.createLinearGradient(0, startY, width, startY + HERO_HEIGHT);
  heroGradient.addColorStop(0, "#201827");
  heroGradient.addColorStop(1, "#391f2f");
  fillRoundRect(ctx, PAGE_MARGIN, startY, width - PAGE_MARGIN * 2, HERO_HEIGHT, 42, heroGradient);

  ctx.fillStyle = withAlpha("#ffffff", 0.14);
  ctx.beginPath();
  ctx.arc(width - 160, startY + 70, 84, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(width - 270, startY + 160, 46, 0, Math.PI * 2);
  ctx.fill();

  fillRoundRect(ctx, PAGE_MARGIN + 34, startY + 28, 178, 40, 20, withAlpha(tone.accent, 0.24));
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 18px 'Segoe UI', sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("BLOOD INSIGHT AGENT", PAGE_MARGIN + 58, startY + 48);

  ctx.font = "700 44px 'Segoe UI', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(model.disease?.name || "혈액검사 AI 브리핑", PAGE_MARGIN + 34, startY + 88);

  ctx.font = "500 20px 'Segoe UI', sans-serif";
  ctx.fillStyle = withAlpha("#ffffff", 0.88);
  drawText(ctx, model.summary, PAGE_MARGIN + 34, startY + 144, {
    maxWidth: width - PAGE_MARGIN * 2 - 280,
    lineHeight: 28,
    font: "500 20px 'Segoe UI', sans-serif",
    color: withAlpha("#ffffff", 0.9)
  });

  fillRoundRect(ctx, width - 248, startY + 28, 176, 42, 20, tone.soft);
  ctx.fillStyle = tone.accent;
  ctx.font = "700 18px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tone.label, width - 160, startY + 49);
  ctx.textAlign = "left";
}

function drawStats(ctx, model, width, startY) {
  const cardWidth = (width - PAGE_MARGIN * 2 - 24) / 3;
  model.stats.forEach((card, index) => {
    const x = PAGE_MARGIN + index * (cardWidth + 12);
    fillRoundRect(ctx, x, startY, cardWidth, 132, 26, "rgba(255,255,255,0.88)");
    strokeRoundRect(ctx, x, startY, cardWidth, 132, 26, "rgba(175,118,118,0.12)");
    ctx.fillStyle = "#7c2d3f";
    ctx.font = "600 17px 'Segoe UI', sans-serif";
    ctx.fillText(card.label, x + 22, startY + 22);
    ctx.fillStyle = "#201827";
    ctx.font = "700 34px 'Segoe UI', sans-serif";
    ctx.fillText(card.value, x + 22, startY + 52);
    ctx.fillStyle = "#6b7280";
    drawText(ctx, card.caption, x + 22, startY + 92, {
      maxWidth: cardWidth - 40,
      lineHeight: 22,
      font: "500 16px 'Segoe UI', sans-serif",
      color: "#6b7280"
    });
  });

  return startY + 132 + SECTION_GAP;
}

function drawProfileCard(ctx, model, width, startY) {
  const height = 212;
  fillRoundRect(ctx, PAGE_MARGIN, startY, width - PAGE_MARGIN * 2, height, 28, "rgba(255,255,255,0.9)");
  strokeRoundRect(ctx, PAGE_MARGIN, startY, width - PAGE_MARGIN * 2, height, 28, "rgba(175,118,118,0.12)");

  const profile = model.profile || {};
  const infoPairs = [
    ["환자명", profile.displayName || "미입력"],
    ["성별/나이", `${profile.sex === "male" ? "남성" : profile.sex === "female" ? "여성" : "미입력"} · ${profile.age || "-"}세`],
    ["다음 검사", profile.nextLabDate || "미정"],
    ["질환 코드", model.disease?.code || "일반 해설"]
  ];

  ctx.fillStyle = "#7c2d3f";
  ctx.font = "700 22px 'Segoe UI', sans-serif";
  ctx.fillText("환자 브리핑 블록", PAGE_MARGIN + 24, startY + 24);

  infoPairs.forEach(([label, value], index) => {
    const x = PAGE_MARGIN + 24 + (index % 2) * 360;
    const y = startY + 64 + Math.floor(index / 2) * 42;
    ctx.fillStyle = "#6b7280";
    ctx.font = "600 15px 'Segoe UI', sans-serif";
    ctx.fillText(label, x, y);
    ctx.fillStyle = "#1f2937";
    ctx.font = "600 17px 'Segoe UI', sans-serif";
    ctx.fillText(value, x + 92, y);
  });

  fillRoundRect(ctx, width - 362, startY + 24, 282, 112, 22, "#faf2ea");
  ctx.fillStyle = "#7c2d3f";
  ctx.font = "700 16px 'Segoe UI', sans-serif";
  ctx.fillText("담당의 메모", width - 338, startY + 44);
  drawText(ctx, profile.doctorMemo || "제출 메모나 외래 상담 포인트를 여기에 정리할 수 있습니다.", width - 338, startY + 70, {
    maxWidth: 236,
    lineHeight: 22,
    font: "500 15px 'Segoe UI', sans-serif",
    color: "#5b5560"
  });

  fillRoundRect(ctx, PAGE_MARGIN + 24, startY + 126, width - PAGE_MARGIN * 2 - 48, 62, 20, "#fff6e6");
  ctx.fillStyle = "#8a5b00";
  ctx.font = "700 15px 'Segoe UI', sans-serif";
  ctx.fillText("안전 문구", PAGE_MARGIN + 42, startY + 145);
  drawText(ctx, "이 보고서는 의료 상담을 준비하기 위한 브리핑 자료입니다. 응급 증상, 급격한 수치 변화, 출혈·고열 같은 상황에서는 즉시 의료진 판단이 우선됩니다.", PAGE_MARGIN + 42, startY + 165, {
    maxWidth: width - PAGE_MARGIN * 2 - 84,
    lineHeight: 20,
    font: "500 14px 'Segoe UI', sans-serif",
    color: "#7c5b1f"
  });

  return startY + height + SECTION_GAP;
}

function drawMetricCards(ctx, model, width, startY) {
  if (!model.metricCards.length) {
    return startY;
  }

  ctx.fillStyle = "#201827";
  ctx.font = "700 24px 'Segoe UI', sans-serif";
  ctx.fillText("핵심 수치 브리핑", PAGE_MARGIN, startY);

  let y = startY + 24;
  const gap = 14;
  const cardWidth = (width - PAGE_MARGIN * 2 - gap) / 2;

  model.metricCards.forEach((metric, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = PAGE_MARGIN + col * (cardWidth + gap);
    const cardY = y + row * 132;
    fillRoundRect(ctx, x, cardY, cardWidth, 114, 26, "rgba(255,255,255,0.9)");
    strokeRoundRect(ctx, x, cardY, cardWidth, 114, 26, "rgba(175,118,118,0.12)");
    fillRoundRect(ctx, x + 20, cardY + 20, 84, 34, 17, metric.tone.soft);
    ctx.fillStyle = metric.tone.text;
    ctx.font = "700 16px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(metric.tone.badge, x + 62, cardY + 38);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#7c2d3f";
    ctx.font = "600 18px 'Segoe UI', sans-serif";
    ctx.fillText(metric.label, x + 124, cardY + 22);
    ctx.fillStyle = "#201827";
    ctx.font = "700 30px 'Segoe UI', sans-serif";
    ctx.fillText(metric.value, x + 20, cardY + 60);
    ctx.fillStyle = "#6b7280";
    ctx.font = "500 16px 'Segoe UI', sans-serif";
    ctx.fillText(metric.unit || metric.code, x + 118, cardY + 66);
    fillRoundRect(ctx, x + 20, cardY + 92, cardWidth - 40, 8, 8, "#f7d9d4");
    fillRoundRect(ctx, x + 20, cardY + 92, Math.max(56, (cardWidth - 40) * (metric.status === "normal" ? 0.46 : 0.82)), 8, 8, metric.tone.accent);
  });

  return y + Math.ceil(model.metricCards.length / 2) * 132 + SECTION_GAP;
}

function drawInsightBlocks(ctx, model, width, startY) {
  let y = startY;

  if (model.clinicalBriefs.length) {
    ctx.fillStyle = "#201827";
    ctx.font = "700 24px 'Segoe UI', sans-serif";
    ctx.fillText("Clinical Highlights", PAGE_MARGIN, y);
    y += 24;

    const gap = 14;
    const cardWidth = (width - PAGE_MARGIN * 2 - gap) / 2;
    model.clinicalBriefs.slice(0, 4).forEach((card, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = PAGE_MARGIN + col * (cardWidth + gap);
      const cardY = y + row * 168;
      fillRoundRect(ctx, x, cardY, cardWidth, 150, 24, "rgba(255,255,255,0.9)");
      strokeRoundRect(ctx, x, cardY, cardWidth, 150, 24, "rgba(175,118,118,0.12)");
      ctx.fillStyle = "#7c2d3f";
      ctx.font = "700 17px 'Segoe UI', sans-serif";
      ctx.fillText(card.title || "Clinical Note", x + 20, cardY + 18);
      drawText(ctx, card.summary || "", x + 20, cardY + 48, {
        maxWidth: cardWidth - 40,
        lineHeight: 22,
        font: "500 15px 'Segoe UI', sans-serif",
        color: "#4b5563"
      });
      drawText(ctx, (card.bullets || []).slice(0, 3).join(" / "), x + 20, cardY + 96, {
        maxWidth: cardWidth - 40,
        lineHeight: 20,
        font: "600 14px 'Segoe UI', sans-serif",
        color: "#7c2d3f"
      });
    });

    y += Math.ceil(Math.min(model.clinicalBriefs.length, 4) / 2) * 168 + SECTION_GAP;
  }

  if (model.relationshipMap.length) {
    ctx.fillStyle = "#201827";
    ctx.font = "700 24px 'Segoe UI', sans-serif";
    ctx.fillText("Relation Map", PAGE_MARGIN, y);
    y += 24;

    model.relationshipMap.slice(0, 3).forEach((item, index) => {
      const cardY = y + index * 112;
      fillRoundRect(ctx, PAGE_MARGIN, cardY, width - PAGE_MARGIN * 2, 96, 24, "rgba(255,255,255,0.9)");
      strokeRoundRect(ctx, PAGE_MARGIN, cardY, width - PAGE_MARGIN * 2, 96, 24, "rgba(175,118,118,0.12)");
      ctx.fillStyle = "#7c2d3f";
      ctx.font = "700 17px 'Segoe UI', sans-serif";
      ctx.fillText(item.title || "Relation", PAGE_MARGIN + 20, cardY + 18);
      ctx.fillStyle = "#4b5563";
      ctx.font = "600 15px 'Segoe UI', sans-serif";
      ctx.fillText((item.nodes || []).join("  →  "), PAGE_MARGIN + 20, cardY + 46);
      drawText(ctx, item.summary || "", PAGE_MARGIN + 20, cardY + 64, {
        maxWidth: width - PAGE_MARGIN * 2 - 40,
        lineHeight: 18,
        font: "500 13px 'Segoe UI', sans-serif",
        color: "#6b7280"
      });
    });

    y += Math.min(model.relationshipMap.length, 3) * 112 + SECTION_GAP;
  }

  if (model.diseaseExpertGuide) {
    fillRoundRect(ctx, PAGE_MARGIN, y, width - PAGE_MARGIN * 2, 168, 28, "rgba(255,255,255,0.92)");
    strokeRoundRect(ctx, PAGE_MARGIN, y, width - PAGE_MARGIN * 2, 168, 28, "rgba(175,118,118,0.12)");
    ctx.fillStyle = "#7c2d3f";
    ctx.font = "700 22px 'Segoe UI', sans-serif";
    ctx.fillText("Specialist View", PAGE_MARGIN + 24, y + 22);
    drawText(ctx, model.diseaseExpertGuide.angle || "", PAGE_MARGIN + 24, y + 56, {
      maxWidth: width - PAGE_MARGIN * 2 - 48,
      lineHeight: 22,
      font: "500 16px 'Segoe UI', sans-serif",
      color: "#4b5563"
    });
    drawText(ctx, asList(model.diseaseExpertGuide.checkpoints).slice(0, 4).join(" / "), PAGE_MARGIN + 24, y + 106, {
      maxWidth: width - PAGE_MARGIN * 2 - 48,
      lineHeight: 20,
      font: "600 14px 'Segoe UI', sans-serif",
      color: "#7c2d3f"
    });
    drawText(ctx, model.diseaseExpertGuide.caution || "", PAGE_MARGIN + 24, y + 132, {
      maxWidth: width - PAGE_MARGIN * 2 - 48,
      lineHeight: 18,
      font: "500 13px 'Segoe UI', sans-serif",
      color: "#7c5b1f"
    });
    y += 168 + SECTION_GAP;
  }

  return y;
}

function drawClusterMatrix(ctx, model, width, startY) {
  if (!model.reportMetricClusters.length) {
    return startY;
  }

  ctx.fillStyle = "#201827";
  ctx.font = "700 24px 'Segoe UI', sans-serif";
  ctx.fillText("Cluster Brief", PAGE_MARGIN, startY);

  const gap = 14;
  const cardWidth = (width - PAGE_MARGIN * 2 - gap) / 2;
  let y = startY + 24;

  model.reportMetricClusters.slice(0, 4).forEach((cluster, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = PAGE_MARGIN + col * (cardWidth + gap);
    const cardY = y + row * 152;
    fillRoundRect(ctx, x, cardY, cardWidth, 136, 24, "rgba(255,255,255,0.9)");
    strokeRoundRect(ctx, x, cardY, cardWidth, 136, 24, "rgba(175,118,118,0.12)");
    ctx.fillStyle = "#7c2d3f";
    ctx.font = "700 17px 'Segoe UI', sans-serif";
    ctx.fillText(cluster.label || "Cluster", x + 20, cardY + 20);
    drawText(ctx, (cluster.metrics || []).slice(0, 4).map((metric) => `${metric.code} ${metric.value}${metric.unit ? ` ${metric.unit}` : ""}`).join(" / "), x + 20, cardY + 50, {
      maxWidth: cardWidth - 40,
      lineHeight: 20,
      font: "600 14px 'Segoe UI', sans-serif",
      color: "#7c2d3f"
    });
    drawText(ctx, `${cluster.metrics?.length || 0}개 항목이 같은 문맥에서 함께 해석됩니다.`, x + 20, cardY + 94, {
      maxWidth: cardWidth - 40,
      lineHeight: 18,
      font: "500 13px 'Segoe UI', sans-serif",
      color: "#6b7280"
    });
  });

  return y + Math.ceil(Math.min(model.reportMetricClusters.length, 4) / 2) * 152 + SECTION_GAP;
}

function drawSection(ctx, section, width, startY) {
  ctx.fillStyle = "#201827";
  ctx.font = "700 24px 'Segoe UI', sans-serif";
  ctx.fillText(section.title, PAGE_MARGIN, startY);
  let y = startY + 24;

  section.items.slice(0, 6).forEach((item) => {
    const bodyHeight = estimateWrappedHeight(item.body || "", {
      maxWidth: width - PAGE_MARGIN * 2 - 52,
      lineHeight: 24,
      font: "500 18px 'Segoe UI', sans-serif"
    });
    const cardHeight = 86 + Math.max(0, bodyHeight - 24);

    fillRoundRect(ctx, PAGE_MARGIN, y, width - PAGE_MARGIN * 2, cardHeight, 24, "rgba(255,255,255,0.9)");
    strokeRoundRect(ctx, PAGE_MARGIN, y, width - PAGE_MARGIN * 2, cardHeight, 24, "rgba(175,118,118,0.12)");
    fillRoundRect(ctx, PAGE_MARGIN + 18, y + 18, 8, cardHeight - 36, 8, "#d94f70");
    ctx.fillStyle = "#7c2d3f";
    ctx.font = "700 18px 'Segoe UI', sans-serif";
    ctx.fillText(item.title, PAGE_MARGIN + 42, y + 18);
    drawText(ctx, item.body || "세부 설명이 준비되지 않았습니다.", PAGE_MARGIN + 42, y + 48, {
      maxWidth: width - PAGE_MARGIN * 2 - 62,
      lineHeight: 24,
      font: "500 18px 'Segoe UI', sans-serif",
      color: "#4b5563"
    });
    y += cardHeight + 14;
  });

  return y + 8;
}

function drawSubmissionFooter(ctx, model, width, startY, totalHeight) {
  fillRoundRect(ctx, PAGE_MARGIN, startY, width - PAGE_MARGIN * 2, 150, 28, "rgba(255,255,255,0.92)");
  strokeRoundRect(ctx, PAGE_MARGIN, startY, width - PAGE_MARGIN * 2, 150, 28, "rgba(175,118,118,0.12)");
  fillRoundRect(ctx, PAGE_MARGIN + 24, startY + 24, 190, 36, 18, "#201827");
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 16px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SUBMISSION BRIEF", PAGE_MARGIN + 119, startY + 42);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  ctx.fillStyle = "#7c2d3f";
  ctx.font = "700 18px 'Segoe UI', sans-serif";
  ctx.fillText("제출 메모", PAGE_MARGIN + 24, startY + 78);
  drawText(ctx, model.profile?.doctorMemo || "필요한 경우 PDF를 의료진 상담 자료로 활용할 수 있도록 메모를 적어둘 수 있습니다.", PAGE_MARGIN + 24, startY + 106, {
    maxWidth: width - PAGE_MARGIN * 2 - 320,
    lineHeight: 22,
    font: "500 15px 'Segoe UI', sans-serif",
    color: "#4b5563"
  });

  ctx.fillStyle = "#9ca3af";
  ctx.font = "600 15px 'Segoe UI', sans-serif";
  ctx.fillText("Patient Sign", width - 274, startY + 88);
  ctx.fillText("Clinician Note", width - 274, startY + 124);
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width - 162, startY + 100);
  ctx.lineTo(width - 38, startY + 100);
  ctx.moveTo(width - 162, startY + 136);
  ctx.lineTo(width - 38, startY + 136);
  ctx.stroke();

  ctx.fillStyle = "#6b7280";
  ctx.font = "500 15px 'Segoe UI', sans-serif";
  ctx.fillText("Blood Insight Agent · 제출용 브리핑 문서", PAGE_MARGIN, totalHeight - 34);
}

async function renderReportCanvas(payload, variant = "full") {
  await sleep();

  const model = makeExportModel(payload);
  const width = variant === "share" ? 1080 : EXPORT_WIDTH;
  const height = Math.max(estimateCanvasHeight(model) + (variant === "share" ? 140 : 80), variant === "share" ? 2800 : 2500);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  drawBackground(ctx, width, height);
  drawCover(ctx, model, width, PAGE_MARGIN, variant);
  drawHero(ctx, model, width, PAGE_MARGIN + COVER_HEIGHT);

  let cursor = PAGE_MARGIN + COVER_HEIGHT + HERO_HEIGHT + SECTION_GAP;
  cursor = drawStats(ctx, model, width, cursor);
  cursor = drawProfileCard(ctx, model, width, cursor);
  cursor = drawMetricCards(ctx, model, width, cursor);
  cursor = drawClusterMatrix(ctx, model, width, cursor);
  cursor = drawInsightBlocks(ctx, model, width, cursor);

  model.sections.forEach((section) => {
    cursor = drawSection(ctx, section, width, cursor);
  });

  drawSubmissionFooter(ctx, model, width, cursor + 16, height);

  return { canvas, model };
}

function dataUrlToBase64(dataUrl) {
  return dataUrl.split(",")[1] || "";
}

async function saveNativeFile(fileName, dataUrl, mimeType) {
  const base64Data = dataUrlToBase64(dataUrl);
  await Filesystem.writeFile({
    path: fileName,
    data: base64Data,
    directory: Directory.Documents,
    recursive: true
  });

  return Filesystem.getUri({
    directory: Directory.Documents,
    path: fileName
  });
}

function downloadWebFile(fileName, dataUrl) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function shareSavedFile({ uri, title, text, mimeType }) {
  const nativeUri = typeof uri === "string" ? uri : uri?.uri;
  if (!nativeUri) {
    return false;
  }

  try {
    await Share.share({
      title,
      text,
      dialogTitle: title,
      files: [nativeUri]
    });
    return true;
  } catch {
    try {
      await Share.share({
        title,
        text,
        dialogTitle: title,
        url: nativeUri
      });
      return true;
    } catch {
      return false;
    }
  }
}

function buildReportText({ profile, disease, analysis }) {
  return [
    profile?.displayName ? `${profile.displayName}님의 혈액검사 AI 브리핑` : "혈액검사 AI 브리핑",
    disease?.name ? `질환 문맥: ${disease.name} (${disease.code})` : "일반 해설 모드",
    pickSummary(analysis)
  ].filter(Boolean).join("\n");
}

export async function exportReportImage(payload) {
  const { canvas } = await renderReportCanvas(payload, "share");
  const dataUrl = canvas.toDataURL("image/png", 1);
  const fileName = `blood-insight-report-${Date.now()}.png`;

  if (Capacitor.isNativePlatform()) {
    const saved = await saveNativeFile(fileName, dataUrl, "image/png");
    return {
      ok: true,
      uri: saved.uri,
      message: "리포트 이미지를 저장했습니다."
    };
  }

  downloadWebFile(fileName, dataUrl);
  return {
    ok: true,
    message: "리포트 이미지를 다운로드했습니다."
  };
}

export async function shareReport(payload) {
  const { canvas } = await renderReportCanvas(payload, "share");
  const dataUrl = canvas.toDataURL("image/png", 1);
  const fileName = `blood-insight-share-${Date.now()}.png`;
  const shareText = buildReportText(payload);

  if (Capacitor.isNativePlatform()) {
    const saved = await saveNativeFile(fileName, dataUrl, "image/png");
    const shared = await shareSavedFile({
      uri: saved,
      title: "혈액검사 AI 리포트 공유",
      text: shareText,
      mimeType: "image/png"
    });

    return {
      ok: true,
      uri: saved.uri,
      message: shared ? "공유 시트를 열었습니다." : "공유용 이미지를 저장했습니다."
    };
  }

  if (navigator.share) {
    await navigator.share({
      title: "혈액검사 AI 리포트",
      text: shareText
    });
    return { ok: true, message: "리포트를 공유했습니다." };
  }

  downloadWebFile(fileName, dataUrl);
  return { ok: true, message: "공유용 이미지를 다운로드했습니다." };
}

export async function exportReportPdf(payload) {
  const { canvas } = await renderReportCanvas(payload, "full");
  const imgData = canvas.toDataURL("image/png", 1);
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = A4_WIDTH_MM;
  const pageHeight = A4_HEIGHT_MM;
  const usableWidth = pageWidth - 20;
  const scale = usableWidth / canvas.width;
  const pagePixelHeight = Math.floor((pageHeight - 20) / scale);

  let rendered = 0;
  let pageIndex = 0;
  while (rendered < canvas.height) {
    const sliceCanvas = createCanvas(canvas.width, Math.min(pagePixelHeight, canvas.height - rendered));
    const sliceCtx = sliceCanvas.getContext("2d");
    sliceCtx.drawImage(canvas, 0, rendered, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
    const sliceData = sliceCanvas.toDataURL("image/png", 1);
    if (pageIndex > 0) {
      pdf.addPage();
    }
    pdf.addImage(sliceData, "PNG", 10, 10, usableWidth, sliceCanvas.height * scale, undefined, "FAST");
    rendered += sliceCanvas.height;
    pageIndex += 1;
  }

  const pdfDataUrl = pdf.output("datauristring");
  const fileName = `blood-insight-report-${Date.now()}.pdf`;

  if (Capacitor.isNativePlatform()) {
    const saved = await saveNativeFile(fileName, pdfDataUrl, "application/pdf");
    return {
      ok: true,
      uri: saved.uri,
      message: "PDF 리포트를 저장했습니다."
    };
  }

  downloadWebFile(fileName, pdfDataUrl);
  return {
    ok: true,
    message: "PDF 리포트를 다운로드했습니다."
  };
}
