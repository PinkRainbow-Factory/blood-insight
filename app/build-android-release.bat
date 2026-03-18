@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d C:\PinkRainbow Project\app
"C:\Program Files\nodejs\npm.cmd" run build
"C:\Program Files\nodejs\npx.cmd" cap sync android
cd /d C:\PinkRainbow Project\app\android
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%\bin;%PATH%
call gradlew.bat bundleRelease
