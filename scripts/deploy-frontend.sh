#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."
git pull origin main
npm ci
npm run lint
npm run build

WEB_HOST="${QUESTLAB_WEB_HOST:-0.0.0.0}"
WEB_PORT="${QUESTLAB_WEB_PORT:-3001}"
WEB_PID_FILE="${QUESTLAB_WEB_PID_FILE:-$PWD/.questlab-web.pid}"
WEB_LOG_FILE="${QUESTLAB_WEB_LOG_FILE:-$PWD/questlab-web.log}"

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart questlab-web --update-env || pm2 start npm --name questlab-web -- start -- --hostname "$WEB_HOST" --port "$WEB_PORT"
else
  if [ -f "$WEB_PID_FILE" ] && kill -0 "$(cat "$WEB_PID_FILE")" 2>/dev/null; then
    kill "$(cat "$WEB_PID_FILE")"
  fi
  nohup npm run start -- --hostname "$WEB_HOST" --port "$WEB_PORT" >"$WEB_LOG_FILE" 2>&1 &
  echo $! > "$WEB_PID_FILE"
fi

attempts=0
until curl --fail --silent --show-error "http://127.0.0.1:${WEB_PORT}/" >/dev/null; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 15 ]; then
    echo "questlab-web health check failed after startup" >&2
    exit 1
  fi
  sleep 1
done
