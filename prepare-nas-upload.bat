@echo off
set TARGET=C:\PinkRainbow Project\nas-upload
if exist "%TARGET%" rmdir /s /q "%TARGET%"
mkdir "%TARGET%"
xcopy /E /I /Y "C:\PinkRainbow Project\app" "%TARGET%\app"
xcopy /E /I /Y "C:\PinkRainbow Project\server" "%TARGET%\server"
copy /Y "C:\PinkRainbow Project\deploy\ugreen-nas\docker-compose.yml" "%TARGET%\docker-compose.yml"
copy /Y "C:\PinkRainbow Project\deploy\ugreen-nas\.env.example" "%TARGET%\.env.example"
copy /Y "C:\PinkRainbow Project\deploy\ugreen-nas\README.md" "%TARGET%\README.md"
