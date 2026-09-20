#!/usr/bin/env bash
set -euo pipefail
cd /home/jan/sports-trackr
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi
mkdir -p /home/jan/sports-trackr/backups
url="${DATABASE_URL:-file:./dev.db}"
db="${url#file:}"
db="${db%%\?*}"
dest="/home/jan/sports-trackr/backups/trackr-$(date +%Y%m%d-%H%M%S).db"
sqlite3 "$db" ".backup '$dest'"
echo "Backed up $db to $dest"
find /home/jan/sports-trackr/backups -name 'trackr-*.db' -type f -mtime +30 -delete
