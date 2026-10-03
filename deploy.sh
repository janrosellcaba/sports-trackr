#!/bin/bash
set -e

echo "🚀 [1/5] Descarregant últims canvis de Git..."
git pull origin main

echo "📦 [2/5] Instal·lant dependències..."
npm install

echo "🗄️ [3/5] Sincronitzant base de dades..."
# Snapshot the live SQLite file first (consistent copy, even if the app is writing).
node scripts/backup-sqlite.mjs
npx prisma generate
# Explicit additive column. This cannot drop tables or existing rows.
node scripts/add-dual-weights-column.mjs
# Additive create. Existing BodyWeight rows are left as-is.
node scripts/add-body-weight-table.mjs
# Only the unused custom-supplement catalog. Gym, sports, weight, and intake logs stay.
node scripts/drop-custom-supplements.mjs
# Schema sync. Adds missing tables/columns only.
# Do not pass --force-reset or --accept-data-loss — those would wipe live logs.
npx prisma db push

echo "🔨 [4/5] Compilant Next.js..."
npm run build

echo "🔄 [5/5] Reiniciant servei systemd..."
sudo systemctl restart sports-trackr

echo "✅ Tot llest i operatiu a https://sport.janrosell.com!"
