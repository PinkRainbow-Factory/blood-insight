# AI Integration Guide

## 프론트엔드
- `app/src/services/apiClient.js`
  - 백엔드 프록시 `/api/analyze/blood-report` 호출
- `app/src/services/medicalAnalysisService.js`
  - 현재는 proxy 모드를 우선 사용
- `app/src/config/medicalPrompt.js`
  - 프롬프트 기본값과 모드 상수 보관

## 백엔드
- `server/src/index.js`
  - Express 서버 진입점
- `server/src/routes/analyze.js`
  - 혈액검사 분석 API 라우트
- `server/src/services/rulesEngine.js`
  - 기준치 비교와 우선순위 계산
- `server/src/services/analysisService.js`
  - 룰 엔진 + AI provider 조합
- `server/src/services/openaiService.js`
  - OpenAI Responses API 호출
- `server/src/services/geminiService.js`
  - Gemini generateContent 호출
- `server/src/prompts/medicalPrompt.js`
  - 의료 해설 프롬프트 템플릿

## 요청 예시
POST `/api/analyze/blood-report`

```json
{
  "provider": "openai",
  "profile": {
    "name": "김민서",
    "age": 41,
    "sex": "female",
    "purpose": "followup"
  },
  "disease": {
    "code": "C92.0",
    "name": "급성 골수성 백혈병",
    "focus": ["WBC", "HGB", "PLT", "CRP"]
  },
  "labs": {
    "WBC": 13.8,
    "HGB": 9.8,
    "PLT": 118,
    "CRP": 16.2
  },
  "userApiKeys": {
    "openai": "",
    "gemini": ""
  }
}
```

## 실행 순서
1. `server`에서 `npm install`
2. `.env.example`를 `.env`로 복사하고 키 설정
3. `npm run dev`
4. `app`에서 `npm install`
5. `npm run dev`

## 권장 방향
- 상용화 시에는 `userApiKeys`를 직접 넘기지 말고 서버 저장소에 암호화 보관
- 앱에서는 프록시 방식만 허용하고, BYOK는 고급 사용자 옵션으로 제한
