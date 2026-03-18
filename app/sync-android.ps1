$env:Path = 'C:\Program Files\nodejs;' + $env:Path
Set-Location 'C:\PinkRainbow Project\app'
& 'C:\Program Files\nodejs\npm.cmd' run build
$distRoot = 'C:\PinkRainbow Project\app\dist'
$androidRoot = 'C:\PinkRainbow Project\app\android\app\src\main\assets\public'
New-Item -ItemType Directory -Force -Path $androidRoot | Out-Null
Copy-Item -Force "$distRoot\index.html" "$androidRoot\index.html"
Get-ChildItem $distRoot -File | Where-Object { $_.Name -ne 'index.html' } | ForEach-Object {
  Copy-Item -Force $_.FullName (Join-Path $androidRoot $_.Name)
}
robocopy "$distRoot\assets" "$androidRoot\assets" /MIR | Out-Null
if ($LASTEXITCODE -gt 7) { exit $LASTEXITCODE }
