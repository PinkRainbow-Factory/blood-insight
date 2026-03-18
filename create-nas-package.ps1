$root = "C:\PinkRainbow Project\deploy\nas-package"
$bundle = Join-Path $root "blood-insight"
$zip = Join-Path $root "blood-insight-nas-package-fixed.zip"
$tar = Join-Path $root "blood-insight-nas-package.tar.gz"

Remove-Item $zip -Force -ErrorAction SilentlyContinue
Remove-Item $tar -Force -ErrorAction SilentlyContinue
Remove-Item $bundle -Recurse -Force -ErrorAction SilentlyContinue

New-Item -ItemType Directory -Path (Join-Path $bundle "app") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $bundle "server") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $bundle "server\data") -Force | Out-Null

Copy-Item "C:\PinkRainbow Project\docker-compose.yml" (Join-Path $bundle "docker-compose.yml")
Copy-Item "C:\PinkRainbow Project\deploy\ugreen-nas\.env.example" (Join-Path $bundle ".env.example")

Copy-Item `
  "C:\PinkRainbow Project\app\Dockerfile", `
  "C:\PinkRainbow Project\app\nginx.conf", `
  "C:\PinkRainbow Project\app\index.html", `
  "C:\PinkRainbow Project\app\package.json", `
  "C:\PinkRainbow Project\app\package-lock.json", `
  "C:\PinkRainbow Project\app\vite.config.js", `
  "C:\PinkRainbow Project\app\.env.production" `
  (Join-Path $bundle "app")

Copy-Item "C:\PinkRainbow Project\app\src" (Join-Path $bundle "app\src") -Recurse

Copy-Item `
  "C:\PinkRainbow Project\server\Dockerfile", `
  "C:\PinkRainbow Project\server\package.json", `
  "C:\PinkRainbow Project\server\package-lock.json" `
  (Join-Path $bundle "server")

Copy-Item "C:\PinkRainbow Project\server\src" (Join-Path $bundle "server\src") -Recurse

@'
Blood Insight NAS package

1. Upload this package to /volume1/docker
2. Extract so the final folder becomes /volume1/docker/blood-insight
3. Preserve existing server/data if you want to keep users and reports
4. In Ugreen NAS Docker UI, redeploy/rebuild the project
5. Web: http://pinkrainbow.duckdns.org:4173
6. API: http://pinkrainbow.duckdns.org:18082
'@ | Set-Content (Join-Path $bundle "README.txt") -Encoding utf8

Compress-Archive -Path (Join-Path $bundle "*") -DestinationPath $zip
tar -czf $tar -C $root "blood-insight"

[PSCustomObject]@{
  Zip = (Get-Item $zip).FullName
  TarGz = (Get-Item $tar).FullName
  Updated = (Get-Date)
} | Format-List
