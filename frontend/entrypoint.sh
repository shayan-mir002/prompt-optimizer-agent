#!/bin/sh
set -e

# Render the nginx template, injecting $BACKEND_URL. The container listens on
# a fixed port 80 (see nginx.conf.template) so Railway's health check and the
# public domain target port are always 80 — no port guessing.
export BACKEND_URL="${BACKEND_URL:-http://backend:8080}"

envsubst '${BACKEND_URL}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
