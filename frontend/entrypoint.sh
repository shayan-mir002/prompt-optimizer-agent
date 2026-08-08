#!/bin/sh
set -e

# Render the nginx template, injecting $BACKEND_URL and $PORT with sane
# defaults so the same image works locally AND on Railway (which injects
# $PORT and expects the app to listen on it).
export PORT="${PORT:-80}"
export BACKEND_URL="${BACKEND_URL:-http://backend:8080}"

envsubst '${BACKEND_URL} ${PORT}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
