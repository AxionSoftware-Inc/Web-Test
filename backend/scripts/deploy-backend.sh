#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."
git pull origin main
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check --deploy

API_BIND="${QUESTLAB_API_BIND:-0.0.0.0:8001}"
API_PORT="${QUESTLAB_API_PORT:-${API_BIND##*:}}"
API_PID_FILE="${QUESTLAB_API_PID_FILE:-$PWD/.questlab-api.pid}"
API_LOG_FILE="${QUESTLAB_API_LOG_FILE:-$PWD/questlab-api.log}"

if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe questlab-api >/dev/null 2>&1; then
    pm2 delete questlab-api
  fi
  pm2 start "gunicorn config.wsgi:application --bind ${API_BIND} --workers ${WEB_CONCURRENCY:-3} --timeout 60 --access-logfile - --error-logfile -" --name questlab-api
else
  if [ -f "$API_PID_FILE" ] && kill -0 "$(cat "$API_PID_FILE")" 2>/dev/null; then
    kill "$(cat "$API_PID_FILE")"
  fi
  nohup gunicorn config.wsgi:application --bind "$API_BIND" --workers "${WEB_CONCURRENCY:-3}" --timeout 60 --access-logfile - --error-logfile - >"$API_LOG_FILE" 2>&1 &
  echo $! > "$API_PID_FILE"
fi

attempts=0
until curl --fail --silent --show-error "http://127.0.0.1:${API_PORT}/api/health/" >/dev/null; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 15 ]; then
    echo "questlab-api health check failed after startup" >&2
    exit 1
  fi
  sleep 1
done
