# Arihant BOS — Unified Single-Host Deployment Guide

Deploy the entire Arihant BOS application (**Next.js Web Frontend** + **NestJS Backend API** + **Kysely DB Connection**) in **one single place** with **no separate frontend and backend hosting**.

---

## 🌟 How the Unified Architecture Works

```
                        PUBLIC INTERNET
                              │
                              ▼
                     Port 3000 (HTTPS/HTTP)
                ┌────────────────────────────────┐
                │        Next.js Frontend        │
                │        (App Router)            │
                └───────────────┬────────────────┘
                                │
          ┌─────────────────────┴─────────────────────┐
          │                                           │
   Page Requests (/dashboard, /leads, etc.)     API Requests (/api/*)
          │                                           │
   Rendered by Next.js                       Transparently Rewritten to
                                             http://localhost:4000/api/*
                                                      │
                                                      ▼
                                            ┌────────────────────┐
                                            │   NestJS Backend   │
                                            │    (Port 4000)     │
                                            └─────────┬──────────┘
                                                      │
                                                      ▼
                                            ┌────────────────────┐
                                            │  Supabase Postgres │
                                            │  (Port 6543 Pooler)│
                                            └────────────────────┘
```

### Key Advantages:
1. **Single Public Port / Single URL**: Your users only visit `https://your-domain.com` (port 3000 or standard 443).
2. **Zero CORS Issues**: Because the browser calls `/api/...` on the exact same domain, there are no cross-origin restrictions.
3. **One Bill / One Server**: You don't need two separate hosting services (no Vercel + Render split). Everything runs in 1 container or 1 VPS.

---

## Deployment Option 1: Single Docker Container (Recommended)

Deploy to any container host: **Render (Web Service)**, **Railway**, **Fly.io**, **Coolify**, **Dokku**, or any **Linux VPS**.

### 1. Build & Run Locally / On Server
```bash
# 1. Build the unified Docker image
docker build -t arihant-bos .

# 2. Run container (mapping port 3000)
docker run -d \
  --name arihant-bos \
  -p 3000:3000 \
  --env-file apps/api/.env \
  arihant-bos
```

### 2. Using Docker Compose
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Deployment Option 2: Single Linux VPS (Ubuntu / Debian / Hetzner / AWS EC2)

Deploy directly using Node.js + PM2 on a single $5/month VPS.

### 1. Initial Setup on Server
```bash
# Update and install Node.js 20 & pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pnpm pm2

# Clone repository
git clone <your-repo-url> /var/www/arihant-bos
cd /var/www/arihant-bos

# Install dependencies and build
pnpm install --frozen-lockfile
pnpm run build
```

### 2. Configure Environment Variables
Copy your production `.env`:
```bash
cp apps/api/.env.example apps/api/.env
nano apps/api/.env
```
Ensure `DATABASE_URL` uses port `6543` with `?pgbouncer=true`.

### 3. Start Both Services with One Command
```bash
# Start both NestJS API (port 4000) and Next.js (port 3000) under PM2
pnpm run start:pm2

# Ensure PM2 restarts on server reboot
pm2 save
pm2 startup
```

### 4. Optional: Nginx Reverse Proxy (for SSL & Domain)
```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Deployment Option 3: PaaS Platforms (Railway / Render)

### On Railway:
1. Connect your GitHub repository to Railway.
2. Select **"Deploy from Dockerfile"** (Railway detects the root `Dockerfile` automatically).
3. Set your environment variables in Railway's dashboard (`DATABASE_URL`, `SUPABASE_JWT_SECRET`, etc.).
4. Railway will automatically expose port `3000` to a public URL.

### On Render:
1. Click **New +** → **Web Service**.
2. Connect your repo and choose **Environment: Docker**.
3. Set the build context to `.` and Dockerfile path to `Dockerfile`.
4. Add environment variables.
5. Set Health Check path to `/` or `/dashboard`.

---

## Verification Checklist

- [x] Next.js rewrites `/api/*` to `http://localhost:4000/api/*` via `apps/web/next.config.mjs`.
- [x] `apps/web/src/lib/api.ts` defaults to relative `/api` in the browser for zero-CORS requests.
- [x] Multi-stage `Dockerfile` packages both backend and frontend.
- [x] `scripts/start-all.sh` concurrently supervises both processes with graceful signal handling.
- [x] `ecosystem.config.js` is ready for zero-downtime PM2 VPS deployments.
