#!/bin/bash
set -e

echo "🚀 [1/5] Descarregant últims canvis de Git..."
git pull origin main

echo "📦 [2/5] Instal·lant dependències..."
npm install

echo "🗄️ [3/5] Sincronitzant base de dades..."
npx prisma generate
npx prisma db push

echo "🔨 [4/5] Compilant Next.js..."
npm run build

echo "🔄 [5/5] Reiniciant servei systemd..."
sudo systemctl restart sports-trackr

echo "✅ Tot llest i operatiu a https://sport.janrosell.com!"