import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import jsPDF from "jspdf";

const EXPORT_WIDTH = 1240;
const PAGE_MARGIN = 56;
const SECTION_GAP = 26;
const COVER_HEIGHT = 280;
const HERO_HEIGHT = 220;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

function asList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function coerceNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatMetricValue(value) {
  const numeric = coerceNumber(value);
  if (numeric === null) return "-";
  if (Math.abs(numeric) >= 100) return String(Math.round(numeric));
  if (Math.abs(numeric) >= 10) return numeric.toFixed(1);
  return numeric.toFixed(2);
}

function normalizeItem(item, index = 0) {
  if (typeof item === "string" || typeof item === "number") {
    return { title: `포인트 ${index + 1}`, body: String(item) };
  }

  if (item && typeof item === "object") {
    return {
      title: item.title || item.test_code || `항목 ${index + 1}`,
      body: [item.why_it_matters, item.care_tip, item.ask_doctor, item.text, item.summary, item.message]
        .filter(Boolean)
        .join(" ")
        .trim()
    };
  }

  return { title: `항목 ${index + 1}`, body: "" };
}

function inferMetricStatus(metric) {
  const value = coerceNumber(metric.value);
  const low = coerceNumber(metric.low);
  const high = coerceNumber(metric.high);
  if (value === null) return "unknown";
  if (low !== null && value < low) return "low";
  if (high !== null && value > high) return "high";
  return "normal";
}

function statusTone(status) {
  if (status === "high") return { fill: "#fff1ef", stroke: "#ef6d6a", chip: "#f9d7d5", text: "#8f3244" };
  if (status === "low") return { fill: "#eefbf7", stroke: "#0e9a8a", chip: "#d8f3ec", text: "#116c62" };
  if (status === "normal") return { fill: "#f4fbf6", stroke: "#43b080", chip: "#dff4e8", text: "#1d6e4c" };
  return { fill: "#f7f5f1", stroke: "#a6aebb", chip: "#edf0f4", text: "#5f6775" };
}

function diseaseTone(disease) {
  if (!disease) return { accent: "#ef6d6a", deep: "#391f2f", soft: "#fff1ec" };
  const group = String(disease.group || "");
  if (group.includes("혈액") || group.includes("암")) return { accent: "#c94f4b", deep: "#3c1d25", soft: "#fff1ef" };
  if (group.includes("신장")) return { accent: "#2f9e74", deep: "#153a34", soft: "#eef8f3" };
  if (group.includes("간")) return { accent: "#d8893f", deep: "#46311d", soft: "#fff7ec" };
  return { accent: "#ef6d6a", deep: "#391f2f", soft: "#fff1ec" };
}

function fillRoundRect(ctx, x, y, width, height, radius, fill) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function strokeRoundRect(ctx, x, y, width, height, radius, stroke) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawText(ctx, text, x, y, options = {}) {
  const {
    maxWidth = 400,
    lineHeight = 22,
    color = "#4b5563",
    font = "500 15px 'Segoe UI', sans-serif"
  } = options;

  ctx.save();
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textBaseline = "top";
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) {
    ctx.restore();
    return y;
  }

  let line = "";
  let cursorY = y;
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = candidate;
    }
  });
  if (line) ctx.fillText(line, x, cursorY);
  ctx.restore();
  return cursorY + lineHeight;
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
      title: "의료진에게 물어볼 질문",
      items: asList(analysis?.aiResult?.questions_for_clinician || analysis?.aiResult?.questions).map(normalizeItem)
    }
  ].filter((section) => section.items.length);
}

function collectMetricCards(payload) {
  const source = asList(payload.metricCards);
  if (source.length) {
    return source.slice(0, 8).map((metric) => ({
      code: metric.code,
      name: metric.name || metric.code,
      value: metric.value,
      unit: metric.unit || "",
      low: metric.low ?? metric.range?.low ?? null,
      high: metric.high ?? metric.range?.high ?? null,
      status: metric.status || inferMetricStatus(metric)
    }));
  }

  return Object.entries(payload.labs || {}).slice(0, 8).map(([code, value]) => ({
    code,
    name: code,
    value,
    unit: "",
    low: null,
    high: null,
    status: inferMetricStatus({ value, low: null, high: null })
  }));
}

function makeExportModel(payload) {
  const analysis = payload.analysis || {};
  const aiResult = analysis.aiResult || {};
  const metricCards = collectMetricCards(payload);
  const sections = buildSections(analysis);
  const metricNarratives = asList(payload.metricNarratives).map(normalizeItem).slice(0, 6);
  const clinicalBriefs = asList(payload.clinicalBriefs || analysis.clinicalBriefs).map(normalizeItem).slice(0, 4);
  const relationshipMap = asList(payload.relationshipMap || analysis.relationshipMap).slice(0, 3);
  const diseaseExpertGuide = payload.diseaseExpertGuide || analysis.diseaseExpertGuide || null;
  const reportMetricClusters = asList(payload.reportMetricClusters || analysis.reportMetricClusters).slice(0, 4);
  const emergencyFlags = asList(payload.emergencyFlags).map(normalizeItem).slice(0, 4);
  const retestPriorityCards = asList(payload.retestPriorityCards).map(normalizeItem).slice(0, 4);
  const symptomBrief = payload.symptomBrief || analysis.symptomBrief || null;
  const summary = aiResult.overall_summary || analysis.summary || "혈액검사 결과를 개인 프로필과 질환 맥락에 맞춰 정리한 AI 브리핑입니다.";
  const abnormalCount = metricCards.filter((metric) => metric.status === "high" || metric.status === "low").length;
  const abnormalRatio = metricCards.length ? Math.round((abnormalCount / metricCards.length) * 100) : 0;

  return {
    profile: payload.profile || {},
    disease: payload.disease || null,
    summary,
    metricCards,
    sections: [
      ...(metricNarratives.length ? [{ title: "상세 수치 해설", items: metricNarratives }] : []),
      ...sections
    ],
    clinicalBriefs,
    relationshipMap,
    diseaseExpertGuide,
    reportMetricClusters,
    symptomBrief,
    emergencyFlags,
    retestPriorityCards,
    stats: [
      { label: "이상 수치 비율", value: `${abnormalRatio}%` },
      { label: "브리핑 대상", value: `${metricCards.length}개` },
      { label: "질문 후보", value: `${asList(aiResult.questions_for_clinician || aiResult.questions).length}개` }
    ]
  };
}

function estimateCanvasHeight(model) {
  let height = COVER_HEIGHT + HERO_HEIGHT + 760;
  height += model.metricCards.length ? Math.ceil(model.metricCards.length / 2) * 186 : 0;
  height += model.reportMetricClusters.length ? Math.ceil(model.reportMetricClusters.length / 2) * 170 + 80 : 0;
  height += model.clinicalBriefs.length ? Math.ceil(model.clinicalBriefs.length / 2) * 176 + 80 : 0;
  height += model.relationshipMap.length ? model.relationshipMap.length * 118 + 70 : 0;
  height += model.diseaseExpertGuide ? 220 : 0;
  height += model.symptomBrief ? 130 : 0;
  height += model.emergencyFlags.length ? model.emergencyFlags.length * 94 + 70 : 0;
  height += model.retestPriorityCards.length ? model.retestPriorityCards.length * 94 + 70 : 0;
  height += model.sections.reduce((sum, section) => sum + 90 + section.items.length * 94, 0);
  return height + 220;
}

function drawBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fff0ea");
  gradient.addColorStop(0.45, "#f9f3e9");
  gradient.addColorStop(1, "#eef4e7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawCover(ctx, model, width, startY, variant = "full") {
  const tone = diseaseTone(model.disease);
  fillRoundRect(ctx, PAGE_MARGIN, startY, width - PAGE_MARGIN * 2, COVER_HEIGHT - 24, 40, "rgba(255,255,255,0.92)");
  strokeRoundRect(ctx, PAGE_MARGIN, startY, width - PAGE_MARGIN * 2, COVER_HEIGHT - 24, 40, "rgba(175,118,118,0.12)");

  fillRoundRect(ctx, PAGE_MARGIN + 22, startY + 22, width - PAGE_MARGIN * 2 - 44, COVER_HEIGHT - 68, 34, tone.soft);
  fillRoundRect(ctx, PAGE_MARGIN + 38, startY + 40, 230, 42, 21, "rgba(255,255,255,0.72)");
  ctx.fillStyle = tone.accent;
  ctx.font = "700 18px 'Segoe UI', sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(variant === "share" ? "SHARE BRIEF COVER" : "MEDICAL BRIEF COVER", PAGE_MARGIN + 62, startY + 61);

  ctx.fillStyle = "#201827";
  ctx.font = "700 40px 'Segoe UI', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("Blood Insight Agent", PAGE_MARGIN + 38, startY + 102);

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

  const infoY = startY + COVER_HEIGHT - 120;
  const infoWidth = (width - PAGE_MARGIN * 2 - 76) / 3;
  [["이름", model.profile?.displayName || "-"],["다음 검사", model.profile?.nextLabDate || "-"],["위험 단계", model.stats?.[0]?.value || "-"]].forEach(([label, value], index) => {
    const x = PAGE_MARGIN + 38 + index * (infoWidth + 12);
    fillRoundRect(ctx, x, infoY, infoWidth, 74, 22, "rgba(255,255,255,0.88)");
    ctx.fillStyle = "#7c2d3f";
    ctx.font = "700 14px 'Segoe UI', sans-serif";
    ctx.fillText(label, x + 16, infoY + 20);
    drawText(ctx, String(value), x + 16, infoY + 40, {
      maxWidth: infoWidth - 30,
      lineHeight: 20,
      font: "700 17px 'Segoe UI', sans-serif",
      color: "#201827"
    });
  });
}

function drawHero(ctx, model, width, startY) {
  const tone = diseaseTone(model.disease);
  const heroGradient = ctx.createLinearGradient(0, startY, width, startY + HERO_HEIGHT);
  heroGradient.addColorStop(0, "#201827");
  heroGradient.addColorStop(1, tone.deep);
  fillRoundRect(ctx, PAGE_MARGIN, startY, width - PAGE_MARGIN * 2, HERO_HEIGHT, 40, heroGradient);

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  ctx.arc(width - 160, startY + 80, 84, 0, Math.PI * 2);
  ctx.fill();

  fillRoundRect(ctx, PAGE_MARGIN + 34, startY + 28, 240, 38, 19, "rgba(255,255,255,0.12)");
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 14px 'Segoe UI', sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("BLOOD INSIGHT AGENT", PAGE_MARGIN + 58, startY + 48);

  ctx.font = "700 44px 'Segoe UI', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(model.disease?.name || "혈액검사 AI 브리핑", PAGE_MARGIN + 34, startY + 88);
  drawText(ctx, model.summary, PAGE_MARGIN + 34, startY + 144, {
    maxWidth: width - PAGE_MARGIN * 2 - 280,
    lineHeight: 28,
    font: "500 20px 'Segoe UI', sans-serif",
    color: "rgba(255,255,255,0.88)"
  });
}

function drawStats(ctx, model, width, startY) {
  const gap = 14;
  const cardWidth = (width - PAGE_MARGIN * 2 - gap * 2) / 3;
  model.stats.forEach((stat, index) => {
    const x = PAGE_MARGIN + index * (cardWidth + gap);
    fillRoundRect(ctx, x, startY, cardWidth, 104, 26, "rgba(255,255,255,0.86)");
    strokeRoundRect(ctx, x, startY, cardWidth, 104, 26, "rgba(175,118,118,0.12)");
    ctx.fillStyle = "#7c2d3f";
    ctx.font = "700 14px 'Segoe UI', sans-serif";
    ctx.fillText(stat.label, x + 18, startY + 24);
    ctx.fillStyle = "#201827";
    ctx.font = "700 28px 'Segoe UI', sans-serif";
    ctx.fillText(stat.value, x + 18, startY + 64);
  });
  return startY + 104 + SECTION_GAP;
}

function drawProfileCard(ctx, model, width, startY) {
  const height = 168;
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
  ctx.fillText("환자 브리핑 블록", PAGE_MARGIN + 24, startY + 26);

  infoPairs.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = PAGE_MARGIN + 24 + col * ((width - PAGE_MARGIN * 2 - 72) / 2 + 24);
    const y = startY + 54 + row * 46;
    ctx.fillStyle = "#6b7280";
    ctx.font = "700 13px 'Segoe UI', sans-serif";
    ctx.fillText(label, x, y);
    ctx.fillStyle = "#201827";
    ctx.font = "600 17px 'Segoe UI', sans-serif";
    ctx.fillText(String(value), x, y + 24);
  });

  ctx.fillStyle = "#7c2d3f";
  ctx.font = "700 16px 'Segoe UI', sans-serif";
  ctx.fillText("담당의 메모", width - 338, startY + 44);
  drawText(ctx, profile.doctorMemo || "다음 외래에서 꼭 물어볼 내용이나 최근 가장 신경 쓰이는 증상을 메모해 두세요.", width - 338, startY + 70, {
    maxWidth: 250,
    lineHeight: 20,
    font: "500 14px 'Segoe UI', sans-serif",
    color: "#4b5563"
  });

  return startY + height + SECTION_GAP;
}

function drawMetricCards(ctx, model, width, startY) {
  if (!model.metricCards.length) return startY;
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
    const cardY = y + row * 160;
    const tone = statusTone(metric.status);

    fillRoundRect(ctx, x, cardY, cardWidth, 146, 26, tone.fill);
    strokeRoundRect(ctx, x, cardY, cardWidth, 146, 26, tone.stroke);

    ctx.fillStyle = "#201827";
    ctx.font = "700 18px 'Segoe UI', sans-serif";
    ctx.fillText(metric.name, x + 20, cardY + 22);
    ctx.fillStyle = "#6b7280";
    ctx.font = "600 12px 'Segoe UI', sans-serif";
    ctx.fillText(metric.code, x + 20, cardY + 44);

    fillRoundRect(ctx, x + cardWidth - 108, cardY + 16, 88, 34, 17, tone.chip);
    ctx.fillStyle = tone.text;
    ctx.font = "700 13px 'Segoe UI', sans-serif";
    ctx.fillText(metric.status === "high" ? "높음" : metric.status === "low" ? "낮음" : metric.status === "normal" ? "정상" : "확인", x + cardWidth - 82, cardY + 38);

    ctx.fillStyle = "#201827";
    ctx.font = "700 28px 'Segoe UI', sans-serif";
    ctx.fillText(`${formatMetricValue(metric.value)} ${metric.unit || ""}`.trim(), x + 20, cardY + 92);

    ctx.fillStyle = "#6b7280";
    ctx.font = "700 12px 'Segoe UI', sans-serif";
    ctx.fillText("정상", x + cardWidth - 80, cardY + 76);
    ctx.fillText(metric.low !== null && metric.high !== null ? `${metric.low} - ${metric.high}` : "범위 없음", x + cardWidth - 80, cardY + 96);

    fillRoundRect(ctx, x + 20, cardY + 114, cardWidth - 40, 10, 10, "rgba(239, 231, 218, 0.88)");
    fillRoundRect(ctx, x + 20, cardY + 114, Math.max(56, (cardWidth - 40) * (metric.status === "normal" ? 0.46 : 0.82)), 10, 10, tone.stroke);
  });

  return y + Math.ceil(model.metricCards.length / 2) * 160 + SECTION_GAP;
}

function drawClusterMatrix(ctx, model, width, startY) {
  if (!model.reportMetricClusters.length) return startY;
  ctx.fillStyle = "#201827";
  ctx.font = "700 24px 'Segoe UI', sans-serif";
  ctx.fillText("Cluster Brief", PAGE_MARGIN, startY);
  const gap = 14;
  const cardWidth = (width - PAGE_MARGIN * 2 - gap) / 2;
  let y = startY + 24;

  model.reportMetricClusters.forEach((cluster, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = PAGE_MARGIN + col * (cardWidth + gap);
    const cardY = y + row * 152;
    fillRoundRect(ctx, x, cardY, cardWidth, 138, 24, "rgba(255,255,255,0.9)");
    strokeRoundRect(ctx, x, cardY, cardWidth, 138, 24, "rgba(175,118,118,0.12)");
    ctx.fillStyle = "#7c2d3f";
    ctx.font = "700 17px 'Segoe UI', sans-serif";
    ctx.fillText(cluster.title || "Cluster", x + 20, cardY + 22);
    drawText(ctx, (cluster.metrics || []).slice(0, 4).map((m) => `${m.code} ${m.value}${m.unit ? ` ${m.unit}` : ""}`).join(" / "), x + 20, cardY + 48, {
      maxWidth: cardWidth - 40,
      lineHeight: 20,
      font: "600 14px 'Segoe UI', sans-serif",
      color: "#4b5563"
    });
    drawText(ctx, cluster.summary || "같은 문맥에서 함께 보는 수치 묶음입니다.", x + 20, cardY + 90, {
      maxWidth: cardWidth - 40,
      lineHeight: 18,
      font: "500 13px 'Segoe UI', sans-serif",
      color: "#6b7280"
    });
  });

  return y + Math.ceil(model.reportMetricClusters.length / 2) * 152 + SECTION_GAP;
}

function drawClinicalBriefs(ctx, model, width, startY) {
  let y = startY;
  if (model.clinicalBriefs.length) {
    ctx.fillStyle = "#201827";
    ctx.font = "700 24px 'Segoe UI', sans-serif";
    ctx.fillText("Clinical Highlights", PAGE_MARGIN, y);
    y += 24;

    const gap = 14;
    const cardWidth = (width - PAGE_MARGIN * 2 - gap) / 2;
    model.clinicalBriefs.forEach((card, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = PAGE_MARGIN + col * (cardWidth + gap);
      const cardY = y + row * 164;
      fillRoundRect(ctx, x, cardY, cardWidth, 148, 24, "rgba(255,255,255,0.9)");
      strokeRoundRect(ctx, x, cardY, cardWidth, 148, 24, "rgba(175,118,118,0.12)");
      ctx.fillStyle = "#7c2d3f";
      ctx.font = "700 16px 'Segoe UI', sans-serif";
      ctx.fillText(card.title || "Clinical Note", x + 20, cardY + 22);
      drawText(ctx, card.body || "", x + 20, cardY + 48, {
        maxWidth: cardWidth - 40,
        lineHeight: 20,
        font: "500 14px 'Segoe UI', sans-serif",
        color: "#4b5563"
      });
    });

    y += Math.ceil(model.clinicalBriefs.length / 2) * 164 + SECTION_GAP;
  }

  if (model.relationshipMap.length) {
    ctx.fillStyle = "#201827";
    ctx.font = "700 24px 'Segoe UI', sans-serif";
    ctx.fillText("Relation Map", PAGE_MARGIN, y);
    y += 24;

    model.relationshipMap.forEach((item, index) => {
      const cardY = y + index * 110;
      fillRoundRect(ctx, PAGE_MARGIN, cardY, width - PAGE_MARGIN * 2, 94, 24, "rgba(255,255,255,0.9)");
      strokeRoundRect(ctx, PAGE_MARGIN, cardY, width - PAGE_MARGIN * 2, 94, 24, "rgba(175,118,118,0.12)");
      ctx.fillStyle = "#7c2d3f";
      ctx.font = "700 17px 'Segoe UI', sans-serif";
      ctx.fillText(item.title || "Relation", PAGE_MARGIN + 20, cardY + 20);
      ctx.fillStyle = "#4b5563";
      ctx.font = "600 15px 'Segoe UI', sans-serif";
      ctx.fillText((item.nodes || []).join("  ·  "), PAGE_MARGIN + 20, cardY + 46);
      drawText(ctx, item.summary || "", PAGE_MARGIN + 20, cardY + 62, {
        maxWidth: width - PAGE_MARGIN * 2 - 40,
        lineHeight: 18,
        font: "500 13px 'Segoe UI', sans-serif",
        color: "#6b7280"
      });
    });

    y += model.relationshipMap.length * 110 + SECTION_GAP;
  }

  if (model.diseaseExpertGuide) {
    fillRoundRect(ctx, PAGE_MARGIN, y, width - PAGE_MARGIN * 2, 170, 28, "rgba(255,255,255,0.92)");
    strokeRoundRect(ctx, PAGE_MARGIN, y, width - PAGE_MARGIN * 2, 170, 28, "rgba(175,118,118,0.12)");
    ctx.fillStyle = "#7c2d3f";
    ctx.font = "700 22px 'Segoe UI', sans-serif";
    ctx.fillText("Specialist View", PAGE_MARGIN + 24, y + 26);
    drawText(ctx, model.diseaseExpertGuide.angle || "", PAGE_MARGIN + 24, y + 56, {
      maxWidth: width - PAGE_MARGIN * 2 - 48,
      lineHeight: 22,
      font: "500 16px 'Segoe UI', sans-serif",
      color: "#4b5563"
    });
    drawText(ctx, asList(model.diseaseExpertGuide.checkpoints).slice(0, 4).join(" / "), PAGE_MARGIN + 24, y + 110, {
      maxWidth: width - PAGE_MARGIN * 2 - 48,
      lineHeight: 20,
      font: "600 14px 'Segoe UI', sans-serif",
      color: "#7c2d3f"
    });
    y += 170 + SECTION_GAP;
  }

  return y;
}

function drawSectionList(ctx, title, items, width, startY) {
  if (!items.length) return startY;
  ctx.fillStyle = "#201827";
  ctx.font = "700 24px 'Segoe UI', sans-serif";
  ctx.fillText(title, PAGE_MARGIN, startY);
  let y = startY + 26;
  items.forEach((item) => {
    fillRoundRect(ctx, PAGE_MARGIN, y, width - PAGE_MARGIN * 2, 82, 22, "rgba(255,255,255,0.9)");
    strokeRoundRect(ctx, PAGE_MARGIN, y, width - PAGE_MARGIN * 2, 82, 22, "rgba(175,118,118,0.12)");
    ctx.fillStyle = "#7c2d3f";
    ctx.font = "700 16px 'Segoe UI', sans-serif";
    ctx.fillText(item.title || "항목", PAGE_MARGIN + 20, y + 20);
    drawText(ctx, item.body || "설명이 아직 준비되지 않았습니다.", PAGE_MARGIN + 20, y + 42, {
      maxWidth: width - PAGE_MARGIN * 2 - 40,
      lineHeight: 18,
      font: "500 13px 'Segoe UI', sans-serif",
      color: "#4b5563"
    });
    y += 94;
  });
  return y + 8;
}

function drawSafetyMemo(ctx, model, width, startY) {
  fillRoundRect(ctx, PAGE_MARGIN, startY, width - PAGE_MARGIN * 2, 164, 28, "rgba(255,255,255,0.92)");
  strokeRoundRect(ctx, PAGE_MARGIN, startY, width - PAGE_MARGIN * 2, 164, 28, "rgba(175,118,118,0.12)");
  ctx.fillStyle = "#7c2d3f";
  ctx.font = "700 22px 'Segoe UI', sans-serif";
  ctx.fillText("의료 안전 문구", PAGE_MARGIN + 24, startY + 30);
  drawText(ctx, "이 보고서는 의료 상담을 준비하기 위한 브리핑 자료입니다. 응급 증상, 급격한 수치 변화, 출혈·고열과 같은 상황에서는 즉시 의료진의 판단을 우선해야 합니다.", PAGE_MARGIN + 24, startY + 60, {
    maxWidth: width - PAGE_MARGIN * 2 - 48,
    lineHeight: 22,
    font: "500 15px 'Segoe UI', sans-serif",
    color: "#4b5563"
  });
  return startY + 164 + SECTION_GAP;
}

function drawFooter(ctx, width, totalHeight) {
  ctx.fillStyle = "#6b7280";
  ctx.font = "600 14px 'Segoe UI', sans-serif";
  ctx.fillText("Blood Insight Agent · 제출용 브리핑 문서", PAGE_MARGIN, totalHeight - 34);
}

async function renderReportCanvas(payload, variant = "full") {
  const model = makeExportModel(payload);
  const width = variant === "share" ? 1080 : EXPORT_WIDTH;
  const estimatedHeight = estimateCanvasHeight(model);
  const height = Math.max(estimatedHeight + (variant === "share" ? 180 : 120), variant === "share" ? 3200 : 3200);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  drawBackground(ctx, width, height);
  drawCover(ctx, model, width, PAGE_MARGIN, variant);
  drawHero(ctx, model, width, PAGE_MARGIN + COVER_HEIGHT);

  let cursor = PAGE_MARGIN + COVER_HEIGHT + HERO_HEIGHT + SECTION_GAP;
  cursor = drawStats(ctx, model, width, cursor);
  cursor = drawProfileCard(ctx, model, width, cursor);
  cursor = drawMetricCards(ctx, model, width, cursor);
  cursor = drawClusterMatrix(ctx, model, width, cursor);
  cursor = drawClinicalBriefs(ctx, model, width, cursor);

  if (model.symptomBrief) {
    cursor = drawSectionList(ctx, "Symptom Context", [normalizeItem({ title: model.symptomBrief.headline || "증상 요약", summary: [model.symptomBrief.summary, asList(model.symptomBrief.tags).join(", ")].filter(Boolean).join(" / ") })], width, cursor);
  }
  if (model.emergencyFlags.length) cursor = drawSectionList(ctx, "Emergency Flags", model.emergencyFlags, width, cursor);
  if (model.retestPriorityCards.length) cursor = drawSectionList(ctx, "Retest Priority", model.retestPriorityCards, width, cursor);
  model.sections.forEach((section) => {
    cursor = drawSectionList(ctx, section.title, section.items, width, cursor);
  });
  cursor = drawSafetyMemo(ctx, model, width, cursor);
  drawFooter(ctx, width, height);
  return { canvas, model };
}

function dataUrlToBase64(dataUrl) {
  return dataUrl.split(",")[1] || "";
}

async function saveNativeFile(fileName, dataUrl, mimeType) {
  const saved = await Filesystem.writeFile({
    path: fileName,
    data: dataUrlToBase64(dataUrl),
    directory: Directory.Documents,
    recursive: true
  });
  return { uri: saved.uri, mimeType };
}

function downloadWebFile(fileName, dataUrl) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export async function openExportedFile({ uri, title = "리포트 열기", text = "생성된 파일을 열거나 공유할 수 있습니다." }) {
  const nativeUri = typeof uri === "string" ? uri : uri?.uri;
  if (Capacitor.isNativePlatform() && nativeUri) {
    await Share.share({ title, text, url: nativeUri, dialogTitle: title });
    return { ok: true };
  }
  return { ok: false };
}

function buildReportText({ profile, disease, analysis }) {
  return [
    profile?.displayName ? `${profile.displayName}님의 혈액검사 AI 브리핑` : "혈액검사 AI 브리핑",
    disease?.name ? `질환 문맥: ${disease.name} (${disease.code})` : "일반 해설 모드",
    analysis?.aiResult?.overall_summary || "요약 정보 없음"
  ].join("\n");
}

export async function exportReportImage(payload) {
  const { canvas } = await renderReportCanvas(payload, "share");
  const dataUrl = canvas.toDataURL("image/png", 1);
  const fileName = `blood-insight-report-${Date.now()}.png`;
  if (Capacitor.isNativePlatform()) {
    const saved = await saveNativeFile(fileName, dataUrl, "image/png");
    return { ok: true, uri: saved.uri, message: "리포트 이미지를 저장했습니다." };
  }
  downloadWebFile(fileName, dataUrl);
  return { ok: true, message: "리포트 이미지를 다운로드했습니다." };
}

export async function shareReport(payload) {
  const { canvas } = await renderReportCanvas(payload, "share");
  const dataUrl = canvas.toDataURL("image/png", 1);
  const fileName = `blood-insight-share-${Date.now()}.png`;
  const shareText = buildReportText(payload);
  if (Capacitor.isNativePlatform()) {
    const saved = await saveNativeFile(fileName, dataUrl, "image/png");
    await Share.share({
      title: "혈액검사 AI 리포트 공유",
      text: shareText,
      url: saved.uri,
      dialogTitle: "혈액검사 AI 리포트"
    });
    return { ok: true, uri: saved.uri, message: "공유 시트를 열었습니다." };
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
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
  heightLeft -= pageHeight;
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;
  }

  const pdfDataUrl = pdf.output("datauristring");
  const fileName = `blood-insight-report-${Date.now()}.pdf`;
  if (Capacitor.isNativePlatform()) {
    const saved = await saveNativeFile(fileName, pdfDataUrl, "application/pdf");
    return { ok: true, uri: saved.uri, message: "PDF 리포트를 저장했습니다." };
  }
  downloadWebFile(fileName, pdfDataUrl);
  return { ok: true, message: "PDF 리포트를 다운로드했습니다." };
}
