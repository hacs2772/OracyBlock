@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo OracyBlock 서버를 끕니다 (가입자와 기록은 그대로 남아요)
docker compose --profile public --env-file .env down
pause
