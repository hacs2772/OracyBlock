#!/bin/sh
# =====================================================
# 자동 백업 (docker-compose.yml 의 backup 서비스가 실행)
#   - DB: 켜질 때 한 번 + 하루에 한 번 → backups/db/oracyblock-날짜.sql.gz (BACKUP_KEEP_DAYS일 지난 것은 지움)
#   - 지금 한 번만: docker compose --env-file .env exec backup sh /backup-loop.sh once
# =====================================================
set -u
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
mkdir -p /backups/db

backup_once() {
  stamp=$(date +%Y%m%d-%H%M)
  out="/backups/db/oracyblock-$stamp.sql.gz"
  if pg_dump --no-owner --clean --if-exists | gzip > "$out.tmp"; then
    mv "$out.tmp" "$out"
    echo "[backup] $(date '+%F %T') DB 백업: $(basename "$out")"
  else
    rm -f "$out.tmp"
    echo "[backup] $(date '+%F %T') DB 백업 실패 - DB가 켜져 있는지 확인해 주세요"
  fi
  find /backups/db -name 'oracyblock-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
}

if [ "${1:-}" = "once" ]; then
  backup_once
  exit 0
fi
while true; do
  backup_once
  sleep 86400
done
