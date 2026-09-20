#!/bin/bash
set -e

echo "🚀 [1/5] Descarregant últims canvis de Git..."
git pull origin main

echo "📦 [2/5] Instal·lant dependències..."
npm install

echo "🗄️ [3/5] Sincronitzant base de dades (additive only)..."
# Backup the SQLite file before schema sync. Never wipe existing tracking data.
if [ -f .env ]; then
  DB_PATH="$(node -e "require('dotenv').config(); const u=process.env.DATABASE_URL||''; process.stdout.write(u.startsWith('file:') ? u.slice(5) : '')")"
  if [ -n "$DB_PATH" ] && [ -f "$DB_PATH" ]; then
    STAMP="$(date +%Y%m%d-%H%M%S)"
    cp -a "$DB_PATH" "${DB_PATH}.bak-${STAMP}"
    echo "Backed up SQLite to ${DB_PATH}.bak-${STAMP}"
  fi
fi
npx prisma generate
# Explicit additive column. This cannot drop tables or existing rows.
node scripts/add-dual-weights-column.mjs
# Additive schema sync only. Do not pass --force-reset; Prisma will refuse
# destructive changes instead of wiping tracking data.
npx prisma db push

echo "🔨 [4/5] Compilant Next.js..."
npm run build

echo "🔄 [5/5] Reiniciant servei systemd..."
sudo systemctl restart sports-trackr

echo "✅ Tot llest i operatiu a https://sport.janrosell.com!"
