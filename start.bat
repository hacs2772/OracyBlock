@echo off
chcp 65001 >nul
cd /d "%~dp0"
title OracyBlock 서버

echo.
echo  ===========================================
echo   OracyBlock 서버 켜기 (oracyblock.com)
echo  ===========================================
echo.

echo [1/4] 최신 코드 받기 (git pull)
git pull

echo.
echo [2/4] Docker 확인
docker info >nul 2>&1
if errorlevel 1 (
    echo   Docker Desktop 이 꺼져 있어요. 켜고 고래 아이콘이 멈추면 이 파일을 다시 실행해 주세요.
    pause
    exit /b 1
)

echo.
echo [3/4] 설정 파일 확인 (.env)
if not exist ".env" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\new-env.ps1"
)
findstr /c:"=CHANGE_ME" ".env" >nul
if not errorlevel 1 (
    echo.
    echo   메모장이 열리면 CHANGE_ME 세 곳을 바꾸고 저장해 주세요:
    echo     TUNNEL_TOKEN   = Cloudflare 터널 토큰
    echo     ADMIN_EMAIL    = 관리자 이메일
    echo     ADMIN_PASSWORD = 관리자 비밀번호 - 10자 이상, 나만 아는 것
    echo   저장한 뒤 이 파일을 다시 실행하면 돼요.
    notepad ".env"
    pause
    exit /b 1
)

echo.
echo [4/4] 서버 켜기 - 다 준비될 때까지 기다려요. 처음이나 업데이트 뒤엔 5~10분
docker compose --profile public --env-file .env up -d --build --wait --wait-timeout 900
if errorlevel 1 (
    echo.
    echo   서버가 제대로 켜지지 않았어요. 아래 줄을 PowerShell에 붙여 넣으면 원인 글이 보여요:
    echo   docker compose --env-file .env logs --tail 60 backend
    pause
    exit /b 1
)

rem 백업 스크립트가 바뀌었을 수 있어서 백업만 다시 켜요 (몇 초)
docker compose --env-file .env restart backup >nul 2>&1

echo.
echo  켜졌어요!  https://oracyblock.com
echo  (내 PC 확인용: http://localhost:8090)
echo.
echo  이 창은 닫아도 서버는 계속 켜져 있어요.
echo  PC를 다시 켜면 Docker Desktop 이 켜질 때 저절로 다시 켜져요.
echo  끄려면: stop.bat
echo.
pause
