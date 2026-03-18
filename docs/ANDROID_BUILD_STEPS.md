# Android Build Steps

## 현재 상태
- Android 프로젝트 생성 완료
- NAS API 주소 정상 응답 확인 완료
- 프로덕션 API 주소: `http://pinkrainbow.tplinkdns.com:18082`
- `.env.production` 반영 완료

## 가장 쉬운 방법: Android Studio로 빌드

### 1. Android Studio 실행
- Android Studio를 엽니다.

### 2. 프로젝트 열기
- `Open` 클릭
- 폴더 선택:
  - `C:\PinkRainbow Project\app\android`

### 3. Gradle 동기화 대기
- 처음 열면 Gradle sync가 자동으로 진행됩니다.
- 하단 상태바에서 완료될 때까지 기다립니다.

### 4. 디버그 APK 빌드
- 상단 메뉴 `Build`
- `Build Bundle(s) / APK(s)`
- `Build APK(s)` 클릭

### 5. APK 위치
- 디버그 APK 경로:
  - `C:\PinkRainbow Project\app\android\app\build\outputs\apk\debug\app-debug.apk`

## 명령으로 디버그 APK 빌드
- [build-android-debug.bat](C:\PinkRainbow Project\app\build-android-debug.bat)
- 또는 [build-android-debug.ps1](C:\PinkRainbow Project\app\build-android-debug.ps1)

## 출시용 빌드

### Android Studio에서
- `Build`
- `Generate Signed Bundle / APK`
- `Android App Bundle` 추천
- keystore 생성 또는 기존 keystore 선택

### 명령 스크립트
- [build-android-release.bat](C:\PinkRainbow Project\app\build-android-release.bat)
- 또는 [build-android-release.ps1](C:\PinkRainbow Project\app\build-android-release.ps1)

주의:
- 릴리즈 빌드는 보통 서명 설정이 필요하므로 Android Studio에서 진행하는 편이 훨씬 쉽습니다.

## 앱 테스트
- 디버그 APK를 스마트폰에 설치
- 앱 실행 후 혈액검사 입력
- NAS API `pinkrainbow.tplinkdns.com:18082`로 연결됨

## NAS 주소 변경이 필요할 때
- `app/.env.production` 수정 후
- 다시 `npm run build`
- `npx cap sync android`
- 이후 APK 재빌드
