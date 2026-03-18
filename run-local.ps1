$nodePath = 'C:\Program Files\nodejs'
$env:Path = "$nodePath;$env:Path"

Start-Process powershell -ArgumentList '-NoExit', '-Command', "$env:Path='$nodePath;'+$env:Path; Set-Location 'C:\PinkRainbow Project\server'; & 'C:\Program Files\nodejs\npm.cmd' run dev"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "$env:Path='$nodePath;'+$env:Path; Set-Location 'C:\PinkRainbow Project\app'; & 'C:\Program Files\nodejs\npm.cmd' run dev"
Start-Sleep -Seconds 4
Start-Process 'http://localhost:4173'
