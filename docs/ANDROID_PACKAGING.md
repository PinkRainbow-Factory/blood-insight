# Android Packaging Guide

## 현재 준비 상태
- React 앱 구조 완료
- Capacitor Android 프로젝트 생성 완료
- 서버 API 분리 완료
- OCR, 분석, 기록 저장 흐름 완료

## 생성된 Android 프로젝트
- 위치: `app/android`

## 이후 순서
1. `cd app`
2. `npm run build`
3. `npx cap sync android`
4. `npx cap open android`
5. Android Studio에서 빌드/실기기 테스트

## NAS 서버 연결 예시
- 내부 웹 테스트: `http://NAS-IP:4173`
- 내부 API: `http://NAS-IP:18082`
- DDNS 예정: `http://pinkrainbow.tplinkdns.com:18082`

## 현재 기본 프로덕션 API 주소
- `app/src/services/apiClient.js`에서 기본값을 `http://pinkrainbow.tplinkdns.com:18082`로 설정해 두었습니다.
- 필요하면 `app/.env.production.example`를 기준으로 `VITE_API_BASE_URL`을 따로 줄 수 있습니다.

## 주의
- 실제 APK 빌드/서명은 Android Studio 또는 Android SDK 환경이 준비되어 있어야 합니다.
- 현재 작업공간에서는 Android 프로젝트 생성까지 완료했고, APK 산출은 Android 빌드 환경 단계에서 진행하면 됩니다.
