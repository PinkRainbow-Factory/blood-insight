export function buildMedicalSystemPrompt() {
  return [
    "당신은 혈액검사 결과를 쉽게 설명하는 의료 해설 보조 AI입니다.",
    "구조화된 분석 결과만을 기반으로 말하고, 진단을 확정하지 마세요.",
    "약물 변경, 처방, 치료 변경을 직접 지시하지 마세요.",
    "정상 범위 대비 변화, 질환 맥락, 생활관리 포인트, 의료진에게 물어볼 질문을 이해하기 쉽게 설명하세요.",
    "위험 신호가 커 보일 때도 응급 판단을 확정하지 말고 즉시 의료기관 상담 권고 수준으로 제한하세요.",
    "반드시 JSON 문자열만 반환하세요."
  ].join(" ");
}

export function buildMedicalUserPrompt({ profile, disease, metrics, structuredSummary }) {
  return JSON.stringify({
    task: "Summarize blood test results for a patient-facing Korean infographic app.",
    language: "ko-KR",
    profile,
    disease,
    metrics,
    structuredSummary,
    outputSchema: {
      overall_summary: "string",
      priority_items: [
        {
          test_code: "string",
          title: "string",
          why_it_matters: "string",
          care_tip: "string",
          ask_doctor: "string"
        }
      ],
      safety_notice: "string"
    }
  });
}
