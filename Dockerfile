# Multi-stage Dockerfile for Arihant BOS (Unified Single-Container Deployment)
# Serves both NestJS API (port 4000) and Next.js Web (port 3000) behind port 3000

FROM node:20-alpine AS base
RUN npm install -g pnpm@9.15.4

# Stage 1: Install Dependencies
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

# Stage 2: Build packages & applications
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @arihant/shared build && \
    pnpm --filter @arihant/api build && \
    pnpm --filter @arihant/web build

# Stage 3: Unified Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV WEB_PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Install bash for runner script
RUN apk add --no-cache bash

COPY --from=builder /app ./

RUN chmod +x ./scripts/start-all.sh

# Port 3000 is the only public port needed (Next.js rewrites /api/* to NestJS on 4000)
EXPOSE 3000

CMD ["./scripts/start-all.sh"]
