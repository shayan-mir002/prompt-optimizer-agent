#!/bin/sh
set -e

# Render the nginx template, injecting $BACKEND_URL and $PORT. Railway injects
# its own $PORT, so nginx listens on that port for the health check and public
# traffic; local Docker runs fall back to port 80.
export BACKEND_URL="${BACKEND_URL:-http://backend:8080}"
export PORT="${PORT:-80}"

envsubst '${BACKEND_URL} ${PORT}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
