#!/bin/bash
set -e

echo "🚀 [1/5] Descarregant últims canvis de Git..."
git pull origin main

echo "📦 [2/5] Instal·lant noves dependències (si n'hi ha)..."
npm install

echo "🗄️ [3/5] Sincronitzant esquema de base de dades..."
npx prisma generate
npx prisma db push

echo "🔨 [4/5] Compilant Next.js en producció..."
npm run build

echo "🔄 [5/5] Reiniciant procés PM2..."
pm2 restart sports-trackr || pm2 start npm --name "sports-trackr" -- start -- -p 3005
pm2 save

echo "✅ Tot llest i operatiu a https://sport.janrosell.com!"