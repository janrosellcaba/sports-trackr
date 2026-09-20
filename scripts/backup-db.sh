#!/usr/bin/env bash
set -euo pipefail

# Hardcoded so cron never runs in the wrong directory.
cd /home/jan/sports-trackr

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

mkdir -p /home/jan/sports-trackr/backups

url="${DATABASE_URL:-file:./dev.db}"
db="${url#file:}"
db="${db%%\?*}"

if [ ! -f "$db" ]; then
  echo "SQLite file not found: $db" >&2
  exit 1
fi

dest="/home/jan/sports-trackr/backups/trackr-$(date +%Y%m%d-%H%M%S).db"
# Safe against a live WAL database. Do not use plain cp here.
sqlite3 "$db" ".backup '$dest'"
echo "Backed up $db to $dest"

# Keep a month of snapshots so the folder does not grow forever.
find /home/jan/sports-trackr/backups -name 'trackr-*.db' -type f -mtime +30 -delete
