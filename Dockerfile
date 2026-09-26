# Una sola compilación; la configuración de cada ambiente se inyecta al arrancar.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm run build:portal

FROM nginx:1.29-alpine AS app
ENV PORTAL_URL=http://localhost:8081/ \
    PORTAL_ORIGIN=http://localhost:8081 \
    ENABLE_MOCKS=false \
    RUNTIME_CONFIG_TEMPLATE=/etc/runtime-config/config.js.template \
    RUNTIME_CONFIG_OUTPUT=/usr/share/nginx/html/config.js
COPY docker/app/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/app/config.js.template /etc/runtime-config/config.js.template
COPY --chmod=755 docker/runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /app/dist /usr/share/nginx/html

FROM nginx:1.29-alpine AS portal
ENV CONTAINER_ORIGIN=http://localhost:8080 \
    RUNTIME_CONFIG_TEMPLATE=/etc/runtime-config/config.js.template \
    RUNTIME_CONFIG_OUTPUT=/usr/share/nginx/html/config.js
COPY docker/portal/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/portal/config.js.template /etc/runtime-config/config.js.template
COPY --chmod=755 docker/runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /app/portal/dist /usr/share/nginx/html
