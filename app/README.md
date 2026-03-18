# Blood Insight AI App

## 구조
- `src/App.jsx`: 앱 메인 UI와 상태 관리
- `src/data.js`: 질환/혈액수치 기준 데이터
- `src/styles.css`: 모바일 대응 인포그래픽 스타일
- `capacitor.config.ts`: Capacitor Android 패키징 설정

## 시작
1. `npm install`
2. `npm run dev`
3. `npm run build`
4. `npx cap add android`
5. `npm run cap:sync`
6. `npm run cap:android`

## 현재 구현 상태
- 로그인/데모 세션 화면
- 환자/일반인 모드 전환
- 질환 검색 및 코드 선택
- 사진 업로드 미리보기
- 혈액검사 수동 입력
- AI 스타일 인포그래픽 리포트
- 수치 상세 모달
- ChatGPT/Gemini 설정 화면

## 다음 연결 포인트
- 서버 인증 API
- OCR 업로드 분석 API
- OpenAI/Gemini 실 호출
- 검사 기록 저장 DB
