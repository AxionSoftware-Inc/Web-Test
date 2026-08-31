#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."
git pull origin main
npm ci
npm run lint
npm run build

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart questlab-web --update-env || pm2 start npm --name questlab-web -- start
fi
