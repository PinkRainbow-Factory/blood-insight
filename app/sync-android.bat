@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d C:\PinkRainbow Project\app
"C:\Program Files\nodejs\npm.cmd" run build
"C:\Program Files\nodejs\npx.cmd" cap sync android
