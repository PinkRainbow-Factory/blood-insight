# NAS Deployment Guide

## 현재 운영 기준
- NAS 경로: `/volume1/docker/blood-insight`
- 웹 주소: `http://pinkrainbow.duckdns.org:4173`
- API 주소: `http://pinkrainbow.duckdns.org:18082`
- 내부 NAS IP: `192.168.68.116`

## 사용 포트
기존 사용 중:
- `8000`
- `8080`
- `8081`
- `42475`

이 프로젝트 사용:
- 웹: `4173`
- API: `18082`

## NAS에 있어야 하는 구조
```text
/volume1/docker/blood-insight/
  app/
  server/
  docker-compose.yml
  README.md
```

`server/data`는 계정/리포트 저장소라서 가능하면 유지합니다.

## 최신 패키지 반영 방법
최신 배포 패키지:
- `deploy/nas-package/blood-insight-nas-package.tar.gz`
- `deploy/nas-package/blood-insight-nas-package-fixed.zip`

권장:
1. `tar.gz` 업로드
2. `/volume1/docker` 위치에서 압축 해제
3. 기존 `/volume1/docker/blood-insight/server/data`는 보존
4. Ugreen Docker UI에서 `blood-insight` 프로젝트 재배포

## Docker UI 재배포 순서
1. Ugreen NAS `Docker` 앱 열기
2. `프로젝트` 메뉴 이동
3. `blood-insight` 선택
4. `중지`
5. 새 소스 또는 패키지 반영
6. `Compose 구성` 또는 `프로젝트 편집`
7. `재배포` 또는 `재빌드 후 배포`

이미지/컨테이너 삭제는 보통 필요 없습니다. 코드 반영이 안 될 때만 마지막 수단으로 진행합니다.

## 웹/앱 기능 차이
### 웹
- 기본 리포트 조회
- OCR 업로드
- AI 리포트 생성
- PDF 저장
- 공유 텍스트 복사/브라우저 공유

### Android 앱
- 위 웹 기능 전체
- 로컬 알림
- 복약 알림
- 혈액검사 일정 알림
- 알림 탭 시 특정 화면 열기

정리하면 `알림 기능은 Android 앱 중심`, `리포트/PDF/OCR은 웹과 앱 공통`입니다.

## 알림 관련 운영 메모
- 알림은 NAS 서버가 보내는 푸시가 아니라 `앱 내부 로컬 알림`입니다.
- 그래서 NAS 재배포 없이도 앱 APK만 업데이트하면 알림 동작을 개선할 수 있습니다.
- 현재 알림 동작:
  - 복약 알림: `프로필` 또는 `질환 해설`
  - 혈액검사 알림: 최신 `리포트`
  - 주간 체크 알림: `메인`

## PDF/공유 관련 운영 메모
- PDF는 앱 또는 웹에서 사용자 기기에서 생성됩니다.
- NAS에 별도 PDF 저장 서버를 두는 구조는 아닙니다.
- 공유 기능은 가능한 경우 시스템 공유 시트를 열고,
- 불가능하면 텍스트 복사로 fallback 합니다.

## OCR 프리셋 운영 메모
현재 프리셋:
- `일반 / 미지정`
- `삼성서울병원 스타일`
- `서울아산병원 스타일`
- `세브란스 스타일`
- `대학병원 국문 양식`
- `건강검진센터 양식`
- `입원 CBC/Chemistry`
- `항암 외래 추적지`

운영 팁:
- 건강검진 결과지면 `건강검진센터 양식`
- 입원 중 chemistry 추적표면 `입원 CBC/Chemistry`
- 혈액암/항암 외래 추적표면 `항암 외래 추적지`

## 장애 확인 포인트
### 웹은 열리는데 AI 리포트가 안 될 때
- API 키 저장 여부
- 모델명 오타 여부
- `http://pinkrainbow.duckdns.org:18082/health` 응답 여부

### 앱에서 로그인/회원가입이 안 될 때
- `http://pinkrainbow.duckdns.org:18082/api/auth/me`
- 로그인 전이라면 `auth_required`가 보이면 서버는 정상

### 새 기능이 안 보일 때
- NAS 코드 재배포가 안 됐거나
- 앱이 예전 APK일 가능성이 큼

## 다음 단계 권장
- HTTPS 리버스 프록시 적용
- 사용자 저장소를 JSON 파일에서 PostgreSQL로 이전
- 의료기관별 OCR 프리셋 실제 샘플 기반 보정
