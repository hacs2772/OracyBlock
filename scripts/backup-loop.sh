#!/bin/sh
# =====================================================
# 자동 백업 (docker-compose.yml 의 backup 서비스가 실행)
#   - DB: 켜질 때 한 번 + 하루에 한 번 → backups/db/oracyblock-날짜.sql.gz
#   - 실패하면 10분 뒤에 다시 해요 (PC를 켠 직후엔 DB가 아직 준비 중일 수 있어요)
#   - 끝까지 다 받은 백업만 남기고, 그때만 BACKUP_KEEP_DAYS일 지난 것을 지워요 (실패가 이어져도 옛 백업은 남아요)
#   - 지금 한 번만: docker compose --env-file .env exec backup sh /backup-loop.sh once
#   - (선택) .env 의 BACKUP_COPY_DIR 폴더에도 한 부 (구글 드라이브·OneDrive 폴더면 저절로 PC 밖에 올라가요)
#   - 되살리기: docs/deploy.md 의 "백업에서 되살리기"
# =====================================================
set -u
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
mkdir -p /backups/db

# DB가 받을 준비가 될 때까지 기다려요 (최대 5분)
wait_db() {
  i=0
  until pg_isready -q; do
    i=$((i + 1))
    [ "$i" -ge 30 ] && return 1
    sleep 10
  done
}

# (선택) PC 밖에 한 부 더: .env 에 BACKUP_COPY_DIR 를 적었을 때만. 최근 BACKUP_COPY_KEEP개만 남겨요
copy_out() {
  [ -n "${BACKUP_COPY:-}" ] || return 0
  keep="${BACKUP_COPY_KEEP:-7}"
  if cp "$1" "/backup-copy/$(basename "$1").part" && mv "/backup-copy/$(basename "$1").part" "/backup-copy/$(basename "$1")"; then
    ls -1t /backup-copy/oracyblock-*.sql.gz 2>/dev/null | tail -n +$((keep + 1)) | while read -r f; do rm -f "$f"; done
    echo "[backup] 바깥 폴더에도 한 부: $(basename "$1")"
  else
    echo "[backup] 바깥 폴더(BACKUP_COPY_DIR)에 복사하지 못했어요 - 폴더가 있는지 확인해 주세요"
  fi
}

backup_once() {
  stamp=$(date +%Y%m%d-%H%M)
  out="/backups/db/oracyblock-$stamp.sql.gz"
  tmp="/backups/db/.oracyblock-$stamp.sql.tmp"
  # 파이프(|)로 바로 묶으면 pg_dump가 실패해도 gzip이 성공해서 빈 백업이 "성공"으로 남아요. 먼저 파일로 받고 확인해요
  if wait_db && pg_dump --no-owner --clean --if-exists > "$tmp" && tail -n 5 "$tmp" | grep -q "PostgreSQL database dump complete"; then
    gzip -c "$tmp" > "$out.part" && mv "$out.part" "$out"
    rm -f "$tmp"
    echo "[backup] $(date '+%F %T') DB 백업: $(basename "$out") ($(du -k "$out" | cut -f1)KB)"
    find /backups/db -name 'oracyblock-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
    find /backups/db -name 'oracyblock-*.sql.gz' -size -1k -delete # 예전에 생긴 빈 백업
    copy_out "$out"
    return 0
  fi
  rm -f "$tmp" "$out.part"
  echo "[backup] $(date '+%F %T') DB 백업 실패 - 10분 뒤에 다시 해요"
  return 1
}

if [ "${1:-}" = "once" ]; then
  backup_once
  exit $?
fi
while true; do
  if backup_once; then sleep 86400; else sleep 600; fi
done
