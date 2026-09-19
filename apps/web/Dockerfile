# Multi-stage Dockerfile for Arihant BOS Frontend (Next.js)
FROM node:20-alpine AS builder
RUN npm install -g pnpm@9.15.4

WORKDIR /app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies with lockfile
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @arihant/shared build && \
    pnpm --filter @arihant/web build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app ./

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["./node_modules/.bin/next", "start", "-p", "3000"]
