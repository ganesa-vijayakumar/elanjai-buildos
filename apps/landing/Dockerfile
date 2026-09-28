# Landing app → static nginx image. Deployable independently of tenant/admin/backend.
# Build context: repository root (npm workspaces need the root lockfile).
FROM node:24-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json tsconfig.base.json ./
# npm ci requires every workspace manifest; only landing + shared sources are copied.
COPY packages/shared/package.json packages/shared/
COPY apps/landing/package.json apps/landing/
COPY apps/tenant/package.json apps/tenant/
COPY apps/admin/package.json apps/admin/
RUN npm ci --no-audit --no-fund
COPY packages/shared packages/shared
COPY apps/landing apps/landing
ARG VITE_API_BASE_URL=/api
ARG VITE_BASE_DOMAIN=localhost
ARG VITE_ADMIN_HOST=admin.localhost
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_BASE_DOMAIN=$VITE_BASE_DOMAIN VITE_ADMIN_HOST=$VITE_ADMIN_HOST
RUN npm run build -w @buildos/landing

FROM nginx:alpine
COPY --from=build /repo/apps/landing/dist /usr/share/nginx/html
COPY apps/landing/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
