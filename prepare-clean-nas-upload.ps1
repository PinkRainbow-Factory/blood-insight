$target = 'C:\PinkRainbow Project\nas-source-upload'
if (Test-Path $target) { Remove-Item $target -Recurse -Force }
New-Item -ItemType Directory -Force -Path $target, "$target\app", "$target\server" | Out-Null

robocopy 'C:\PinkRainbow Project\app' "$target\app" /E /XD node_modules android dist .run /XF package-lock.json > $null
robocopy 'C:\PinkRainbow Project\server' "$target\server" /E /XD node_modules data /XF package-lock.json > $null
Copy-Item 'C:\PinkRainbow Project\deploy\ugreen-nas\docker-compose.yml' "$target\docker-compose.yml"
Copy-Item 'C:\PinkRainbow Project\deploy\ugreen-nas\.env.example' "$target\.env.example"
Copy-Item 'C:\PinkRainbow Project\deploy\ugreen-nas\README.md' "$target\README.md"
