function fallbackResponse({ structured }) {
  const top = structured.priorityItems.slice(0, 3).map((item) => ({
    test_code: item.code,
    title: `${item.name} 우선 확인`,
    why_it_matters: `${item.name} 수치가 ${item.label} 상태로 보여 현재 맥락에서 우선 확인이 필요합니다.`,
    care_tip: `${item.name} 변화와 관련된 증상, 복용약, 최근 치료 일정이나 컨디션을 함께 기록해 의료진과 상의해보세요.`,
    ask_doctor: `${item.name} 수치 변화가 현재 질환 또는 치료 경과와 어떤 관련이 있는지 설명해주실 수 있나요?`
  }));

  return {
    overall_summary: structured.disease
      ? `${structured.disease.name} 맥락에서 ${top.map((item) => item.test_code).join(", ")} 항목을 우선적으로 보는 것이 좋겠습니다.`
      : `입력된 수치를 기준으로 ${top.map((item) => item.test_code).join(", ")} 항목을 우선적으로 확인하는 것이 좋겠습니다.`,
    dashboard_commentary: structured.disease
      ? `${structured.disease.name}에서는 ${structured.disease.focus?.join(", ")} 같은 핵심 수치를 메인 화면부터 우선해서 보는 편이 좋습니다.`
      : "일반 건강관리 모드에서는 최근 혈액 수치, 증상, 복약 일정의 흐름을 함께 보는 해설을 제공합니다.",
    disease_commentary: structured.disease
      ? `${structured.disease.name} 맥락에서는 포커스 수치와 최근 변화 추세를 함께 연결해 읽는 것이 중요합니다.`
      : "질환을 선택하지 않으면 일반 건강관리 기준의 해설을 제공합니다.",
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
    safety_notice: "이 결과는 의료 상담을 대체하지 않으며, 증상이나 치료 계획은 담당 의료진과 함께 판단해야 합니다."
  };
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
      throw new Error("OpenAI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function callOpenAIAnalysis({ apiKey, model, systemPrompt, userPrompt, structured }) {
  if (!apiKey) {
    return fallbackResponse({ structured });
  }

  const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
        { role: "user", content: [{ type: "input_text", text: userPrompt }] }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const outputText = data.output_text;

  try {
    return JSON.parse(outputText);
  } catch {
    return {
      ...fallbackResponse({ structured }),
      overall_summary: outputText || fallbackResponse({ structured }).overall_summary
    };
  }
}
