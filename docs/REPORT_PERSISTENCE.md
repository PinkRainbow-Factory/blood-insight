# Report Persistence

## 저장 위치
- 현재 MVP 저장소는 `server/data/labReports.json`
- 구조: `{ reports: [] }`

## API
- `POST /api/reports`
  - 분석 결과 저장
- `GET /api/reports`
  - 저장된 분석 기록 목록 조회
- `GET /api/reports/:id`
  - 단일 기록 조회

## 앱 동작
- `AI 리포트 생성` 성공 후 자동 저장
- 리포트 화면 하단에 저장 히스토리 표시

## 이후 확장
- PostgreSQL 테이블로 이전
- 사용자별 필터링
- 검사 날짜별 정렬/검색
- 그래프용 추세 데이터 묶음
