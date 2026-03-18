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
    priority_items: top,
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
