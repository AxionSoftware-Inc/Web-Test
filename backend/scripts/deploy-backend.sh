#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."
git pull origin main
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check --deploy

if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe questlab-api >/dev/null 2>&1; then
    pm2 delete questlab-api
  fi
  pm2 start "gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers ${WEB_CONCURRENCY:-3} --timeout 60 --access-logfile - --error-logfile -" --name questlab-api
  attempts=0
  until curl --fail --silent --show-error http://127.0.0.1:8000/api/health/ >/dev/null; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 15 ]; then
      echo "questlab-api health check failed after startup" >&2
      exit 1
    fi
    sleep 1
  done
fi
