function fallbackResponse({ structured }) {
  const top = structured.priorityItems.slice(0, 3).map((item) => ({
    test_code: item.code,
    title: `${item.name} 우선 확인`,
    why_it_matters: `${item.name} 수치가 ${item.label} 상태로 보여 현재 맥락에서 우선 확인이 필요합니다.`,
    care_tip: `${item.name}와 관련된 증상, 약물, 최근 검사 흐름을 함께 정리해두면 도움이 됩니다.`,
    ask_doctor: `${item.name} 수치 변화가 현재 건강상태와 어떤 관련이 있는지 설명해주실 수 있나요?`
  }));

  return {
    overall_summary: structured.disease
      ? `${structured.disease.name} 사용자의 추적 포인트를 기준으로 ${top.map((item) => item.test_code).join(", ")} 항목을 우선 정리했습니다.`
      : `일반 건강관리 기준에서 ${top.map((item) => item.test_code).join(", ")} 항목을 우선 정리했습니다.`,
    dashboard_commentary: structured.disease
      ? `${structured.disease.name}에서는 ${structured.disease.focus?.join(", ")} 같은 핵심 수치를 메인 화면부터 먼저 읽는 것이 좋습니다.`
      : "질환을 선택하지 않아도 최근 혈액 수치와 증상, 복약 일정 흐름을 함께 읽는 일반 브리핑을 제공합니다.",
    disease_commentary: structured.disease
      ? `${structured.disease.name} 맥락에서는 질환 포커스 수치와 최근 변화 추세를 함께 보는 방식이 중요합니다.`
      : "질환을 선택하지 않은 경우에는 일반 건강관리 기준으로 수치를 해석합니다.",
    priority_items: top,
    metric_explanations: structured.metrics.slice(0, 6).map((metric) => ({
      code: metric.code,
      title: `${metric.name} (${metric.code})`,
      current: `현재 값 ${metric.value}${metric.unit ? ` ${metric.unit}` : ""}`,
      reference: Number.isFinite(metric.low) && Number.isFinite(metric.high) ? `참고범위 ${metric.low} - ${metric.high}${metric.unit ? ` ${metric.unit}` : ""}` : "참고범위 없음",
      interpretation: `${metric.name} 수치는 ${metric.label} 상태로 보입니다.`,
      disease_context: structured.disease ? `${structured.disease.name}에서는 ${metric.related?.join(", ") || "현재 질환 문맥"}과 연결해서 해석합니다.` : "증상과 최근 검사 추세를 함께 읽는 것이 좋습니다.",
      action_hint: "다음 검사와 비교할 수 있도록 증상, 복약, 최근 검사 변화 메모를 함께 남겨 두세요."
    })),
    management_tips: top.map((item) => ({
      title: item.title,
      body: item.care_tip
    })),
    questions_for_clinician: top.map((item) => ({
      title: item.test_code,
      body: item.ask_doctor
    })),
    safety_notice: "이 결과는 설명용 참고자료이며 진단이나 처방을 대신하지 않습니다."
  };
}

function normalizeGeminiModel(model) {
  const raw = String(model || "").trim();
  if (!raw) {
    return "gemini-3-flash";
  }

  const aliasMap = {
    "gemni-3-flash": "gemini-3-flash",
    "gemini-2.5-flash-latest": "gemini-2.5-flash",
    "gemini-2.5-pro-latest": "gemini-2.5-pro"
  };

  return aliasMap[raw] || raw;
}

function tryParseJsonBlock(text) {
  const raw = String(text || "").trim();
  if (!raw) {
    return null;
  }

  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const candidates = [raw, cleaned];
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(cleaned.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // keep trying
    }
  }

  return null;
}

async function fetchWithTimeout(url, options, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Gemini 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function callGeminiAnalysis({ apiKey, model, systemPrompt, userPrompt, structured }) {
  if (!apiKey) {
    return fallbackResponse({ structured });
  }

  const body = JSON.stringify({
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }]
      }
    ]
  });

  const primaryModel = normalizeGeminiModel(model);
  let response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });

  if (!response.ok && response.status === 404 && primaryModel === "gemni-3-flash") {
    response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const outputText = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  const parsed = tryParseJsonBlock(outputText);

  if (parsed) {
    return parsed;
  }

  return {
    ...fallbackResponse({ structured }),
    overall_summary: outputText.trim() || fallbackResponse({ structured }).overall_summary
  };
}
