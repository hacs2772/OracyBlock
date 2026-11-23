# .env 만들기: .env.example 을 복사하고 JWT_SECRET·DB_PASSWORD 를 랜덤으로 채워요
# (start.bat 이 처음 실행될 때 불러요. 이미 있으면 아무것도 안 해요)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$example = Join-Path $root '.env.example'
$target = Join-Path $root '.env'
if (Test-Path $target) { exit 0 }

function New-Secret([int]$bytes) {
    $buf = New-Object byte[] $bytes
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($buf)
    $rng.Dispose()
    ($buf | ForEach-Object { $_.ToString('x2') }) -join ''
}

$text = [IO.File]::ReadAllText($example, [Text.Encoding]::UTF8)
$text = $text -replace '(?m)^JWT_SECRET=[^\r\n]*', ('JWT_SECRET=' + (New-Secret 32))
$text = $text -replace '(?m)^DB_PASSWORD=[^\r\n]*', ('DB_PASSWORD=' + (New-Secret 16))
# BOM 없는 UTF-8 (docker compose 가 첫 줄을 잘못 읽지 않게)
[IO.File]::WriteAllText($target, $text, (New-Object Text.UTF8Encoding $false))
Write-Host '  .env 를 만들었어요 (비밀키·DB 비밀번호는 랜덤으로 채웠어요)'
