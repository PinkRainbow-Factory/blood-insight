$env:Path = 'C:\Program Files\nodejs;' + $env:Path
Set-Location 'C:\PinkRainbow Project\app'
& 'C:\Program Files\nodejs\npx.cmd' cap open android
