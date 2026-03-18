$env:Path = 'C:\Program Files\nodejs;' + $env:Path
Set-Location 'C:\PinkRainbow Project\app'
& 'C:\Program Files\nodejs\npm.cmd' run build
& 'C:\Program Files\nodejs\npx.cmd' cap sync android
Set-Location 'C:\PinkRainbow Project\app\android'
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path
cmd /c gradlew.bat bundleRelease
