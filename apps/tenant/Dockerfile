# Tenant workspace app → static nginx image, one build serves all tenants
# (workspace resolved by Host). Deployable independently.
# Build context: repository root (npm workspaces need the root lockfile).
FROM node:24-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/landing/package.json apps/landing/
COPY apps/tenant/package.json apps/tenant/
COPY apps/admin/package.json apps/admin/
RUN npm ci --no-audit --no-fund
COPY packages/shared packages/shared
COPY apps/tenant apps/tenant
ARG APP_VERSION=dev
ARG VITE_API_BASE_URL=/api
ARG VITE_BASE_DOMAIN=localhost
ARG VITE_ADMIN_HOST=admin.localhost
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_BASE_DOMAIN=$VITE_BASE_DOMAIN VITE_ADMIN_HOST=$VITE_ADMIN_HOST
RUN npm run build -w @buildos/tenant
RUN printf '%s' "$APP_VERSION" > /repo/apps/tenant/dist/version.txt

FROM nginx:alpine
COPY --from=build /repo/apps/tenant/dist /usr/share/nginx/html
COPY apps/tenant/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
