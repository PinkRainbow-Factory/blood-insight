# Ugreen NAS Deployment

## NAS에 업로드할 위치 권장
Ugreen NAS의 Docker 프로젝트 폴더를 하나 정해서 아래처럼 올리면 가장 관리가 쉽습니다.

권장 예시:
- `/volume1/docker-projects/blood-insight/`

그 안에 이 프로젝트 전체 또는 아래 필수 항목을 업로드합니다.
- `app/`
- `server/`
- `deploy/ugreen-nas/docker-compose.yml`
- `deploy/ugreen-nas/.env.example` -> `.env`로 복사

## 실제 업로드 추천 구조
- `/volume1/docker-projects/blood-insight/app`
- `/volume1/docker-projects/blood-insight/server`
- `/volume1/docker-projects/blood-insight/docker-compose.yml`
- `/volume1/docker-projects/blood-insight/.env`

즉, NAS에는 최종적으로 `app`, `server`, `docker-compose.yml`, `.env`가 같은 루트에 있도록 두는 방식을 추천합니다.

## 포트
- 웹: `4173`
- API: `18082`

## DDNS
- `pinkrainbow.tplinkdns.com`

## NAS에서 실행
1. `.env.example`을 `.env`로 복사
2. API 키 입력
3. `docker compose up -d --build`
4. 내부망 확인
   - `http://NAS-IP:4173`
   - `http://NAS-IP:18082/health`
5. 정상 동작 후 포트포워딩

## Android 앱
- 생성된 APK 위치:
  - `app/android/app/build/outputs/apk/debug/app-debug.apk`
- 이 APK는 NAS에 올릴 필요는 없습니다.
- 사용자 테스트용으로 직접 전달하거나, 추후 릴리즈 APK/AAB를 따로 빌드합니다.
