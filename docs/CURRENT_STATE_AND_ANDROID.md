# 현재 상태와 Android 전환 설명

## 1. 지금 무엇이 되었는가
- 웹 개발 서버로 앱 화면을 확인 가능
- 백엔드 API 서버 실행 가능
- Capacitor 기반 Android 프로젝트 생성 완료

즉, 이제는 단순 웹 프로토타입이 아니라 **Android 프로젝트까지 만들어진 상태**입니다.

## 2. 지금 바로 보이는 것
- 웹에서 확인: `http://localhost:4173`
- 백엔드 상태 확인: `http://localhost:8080/health`
- Android 네이티브 프로젝트 위치: `app/android`

## 3. Android 앱 상태
현재는 다음 단계까지 끝났습니다.
- React 앱 구현
- Capacitor 설정
- `npx cap add android` 완료
- Android 프로젝트 생성 완료

아직 안 한 것:
- Android Studio에서 실제 APK 빌드
- 실기기 설치
- 아이콘/스플래시/권한 세부 마감

## 4. NAS 구조
권장 구조:
- NAS 컨테이너 1: `server`
- NAS 컨테이너 2: `web`
- Android 앱: NAS API 호출

## 5. 포트 계획
사용 중인 포트:
- 8000
- 8080
- 8081
- 42475

이번 프로젝트 권장 포트:
- 웹: `4173`
- API: `18082`

## 6. DDNS 계획
- DDNS: `pinkrainbow.tplinkdns.com`
- Android 앱 기본 프로덕션 API 주소: `http://pinkrainbow.tplinkdns.com:18082`
- 포트포워딩은 NAS에서 완전히 구동 가능한 시점에 진행

## 7. 다음 실제 단계
1. Android Studio에서 `app/android` 열기
2. APK 또는 디버그 빌드 생성
3. NAS에 Docker Compose로 서버/웹 배포
4. 이후 포트포워딩/HTTPS/도메인 연결
