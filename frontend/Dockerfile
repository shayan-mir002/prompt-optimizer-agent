# ── Build stage: compile the React app ─────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Serve stage: nginx serves the static build and proxies the API ────────────
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

# entrypoint.sh renders the nginx template with $BACKEND_URL and $PORT
# (with sane defaults), then starts nginx — works on Docker locally AND on
# Railway (which injects $PORT).
CMD ["/entrypoint.sh"]
