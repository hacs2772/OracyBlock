@echo off
chcp 65001 >nul
cd /d "%~dp0"
title OracyBlock 백업에서 되살리기

echo.
echo  ===========================================
echo   OracyBlock 백업에서 되살리기
echo  ===========================================
echo.
echo  DB가 망가졌거나 기록이 사라졌을 때만 써요.
echo  고른 백업 때로 모든 기록이 돌아가요 (그 뒤에 생긴 기록은 없어져요).
echo.

docker info >nul 2>&1
if errorlevel 1 (
    echo   Docker Desktop 이 꺼져 있어요. 켜고 다시 실행해 주세요.
    pause
    exit /b 1
)

rem 되살릴 백업: 파일 이름을 주면 그것, 없으면 가장 최근 것
set "FILE=%~1"
if "%FILE%"=="" (
    for /f "delims=" %%f in ('dir /b /o-d "backups\db\oracyblock-*.sql.gz" 2^>nul') do if not defined FILE set "FILE=%%f"
)
if "%FILE%"=="" (
    echo   backups\db 폴더에 백업이 없어요.
    pause
    exit /b 1
)
if not exist "backups\db\%FILE%" (
    echo   backups\db\%FILE% 파일이 없어요.
    pause
    exit /b 1
)

echo  되살릴 백업: %FILE%
for %%A in ("backups\db\%FILE%") do echo  크기: %%~zA 바이트
echo.
echo  다른 백업을 쓰려면: restore.bat oracyblock-20261125-1308.sql.gz 처럼 이름을 붙여 실행
echo.
choice /c YN /n /m "  정말 되살릴까요? [Y = 네 / N = 아니요] "
if errorlevel 2 exit /b 0

echo.
echo [1/3] 지금 상태도 한 번 더 백업해 둬요 (되돌리고 싶을 때를 위해)
docker compose --env-file .env exec -T backup sh /backup-loop.sh once

echo.
echo [2/3] 서버를 잠깐 멈추고 되살려요
docker compose --env-file .env stop backend
docker compose --env-file .env exec -T backup sh -c "gunzip -c '/backups/db/%FILE%' | psql -q -v ON_ERROR_STOP=1 >/dev/null"
if errorlevel 1 (
    echo.
    echo   되살리기에 실패했어요. 서버는 다시 켜 둘게요. 위의 빨간 글을 캡처해서 보내 주세요.
    docker compose --env-file .env start backend
    pause
    exit /b 1
)

echo.
echo [3/3] 서버 다시 켜기
docker compose --env-file .env start backend

echo.
echo  다 됐어요! %FILE% 때로 돌아갔어요.  https://oracyblock.com
echo.
pause
