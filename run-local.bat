@echo off
set PATH=C:\Program Files\nodejs;%PATH%
start powershell -NoExit -Command "$env:Path='C:\Program Files\nodejs;'+$env:Path; Set-Location 'C:\PinkRainbow Project\server'; & 'C:\Program Files\nodejs\npm.cmd' run dev"
start powershell -NoExit -Command "$env:Path='C:\Program Files\nodejs;'+$env:Path; Set-Location 'C:\PinkRainbow Project\app'; & 'C:\Program Files\nodejs\npm.cmd' run dev"
timeout /t 4 >nul
start http://localhost:4173
