# Deployment Guide

This guide provides instructions for deploying the YouTube Playlist Video Extractor (MERN Stack) to various platforms.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
- [Netlify Deployment](#netlify-deployment)
- [Self-Hosted Deployment](#self-hosted-deployment)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)

## Prerequisites

Before deploying, ensure you have:

1. **YouTube Data API v3 Key**
   - Go to [Google Cloud Console](https://console.developers.google.com/)
   - Create a new project
   - Enable "YouTube Data API v3"
   - Create credentials (API key)
   - Copy the API key for use in environment variables

2. **MongoDB Database** (Optional)
   - Local MongoDB installation, OR
   - MongoDB Atlas free tier account

3. **Node.js 18+** (for local builds and self-hosted deployments)

## Vercel Deployment (Recommended)

Vercel is the recommended platform for deploying Next.js applications.

### Step 1: Push to GitHub

```bash
git push origin main
```

### Step 2: Import to Vercel

1. Go to [Vercel](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Configure Environment Variables

Add these environment variables in Vercel dashboard:

```env
YOUTUBE_API_KEY=your_youtube_api_key_here
MONGODB_URI=your_mongodb_connection_string (optional)
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your application will be live at `https://your-project.vercel.app`

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions

## Netlify Deployment

### Step 1: Create netlify.toml

Create a `netlify.toml` file in the project root:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"
```

### Step 2: Deploy to Netlify

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub and select your repository
5. Configure build settings (should auto-detect from netlify.toml)
6. Add environment variables:
   - `YOUTUBE_API_KEY`
   - `MONGODB_URI` (optional)
7. Click "Deploy site"

## Self-Hosted Deployment

For deploying on your own server (VPS, AWS EC2, DigitalOcean, etc.)

### Prerequisites
- Node.js 18+ installed
- PM2 process manager (recommended)
- Nginx (for reverse proxy)

### Step 1: Clone and Build

```bash
# Clone repository
git clone https://github.com/curiousbud/YouTube-Playlist-videos-link-Extractor.git
cd YouTube-Playlist-videos-link-Extractor

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
nano .env.local  # Add your API keys

# Build for production
npm run build
```

### Step 2: Install PM2

```bash
npm install -g pm2
```

### Step 3: Start Application

```bash
# Start with PM2
pm2 start npm --name "youtube-extractor" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### Step 4: Configure Nginx (Optional)

Create Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/youtube-extractor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: SSL Certificate (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

## Docker Deployment

### Create Dockerfile

```dockerfile
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

# ffmpeg is needed for some yt-dlp formats (bestvideo+bestaudio merges)
RUN apk add --no-cache ffmpeg
# Pre-download the yt-dlp binary so the first download request is fast
RUN npm run setup:ytdlp

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# The pre-downloaded yt-dlp binary follows the app into the image
COPY --from=builder --chown=nextjs:nodejs /app/.yt-dlp ./.yt-dlp

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - YOUTUBE_API_KEY=${YOUTUBE_API_KEY}
      - MONGODB_URI=${MONGODB_URI}
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

### Build and Run

```bash
# Create .env file with your variables
cp .env.example .env

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

## Bulk Downloads (yt-dlp Download Backend)

The app can download actual video files two ways:

1. **Single downloads** — from the homepage ("Download a video from any site") and
   from the playlist results list.
2. **Bulk downloads** — on the `/bulk` page: upload an Excel file of video links
   and receive a ZIP of the downloaded videos plus a `download_report.txt`.

Both run through **yt-dlp**, the same tool the original Python script used, so
they support **YouTube, Instagram, TikTok, Facebook, Twitter/X, Vimeo and
hundreds of other sites** — not just YouTube.

### Where downloads work

| Feature                        | Vercel (free/hobby) | Vercel (Pro) | Node host / Docker |
| ------------------------------ | ------------------- | ------------ | ------------------ |
| Playlist extraction + exports  | ✅                  | ✅           | ✅                 |
| Single video downloads         | ❌ (4.5 MB cap)     | ⚠️ small only| ✅                 |
| Bulk Excel downloads (ZIP)     | ❌                  | ❌           | ✅                 |

Downloads spawn the yt-dlp binary, write to a temp folder, and stream large
bodies — all of which require a **Node.js host with a writable filesystem and
outbound network access**. Vercel's serverless functions run in a read-only
sandbox with small response caps, so the download features are designed for
self-hosted servers, Render, Railway, Fly.io, a VPS, or Docker.

### How the yt-dlp binary is handled

The binary is **not committed** to the repository. On a Node host it is
downloaded automatically on the first download request, or pre-downloaded at
deploy time:

```bash
npm run setup:ytdlp        # downloads the latest yt-dlp binary into ./.yt-dlp/
```

You can also point the app at your own copy (for example a system package):

```bash
# apt install yt-dlp  →  export YTDLP_BINARY=/usr/bin/yt-dlp
```

### Self-hosted deployment (VPS / dedicated server)

```bash
# 1. Get the code and install dependencies
git clone https://github.com/curiousbud/YouTube-Playlist-videos-link-Extractor.git
cd YouTube-Playlist-videos-link-Extractor
npm ci

# 2. Configure
cp .env.example .env.local        # set YOUTUBE_API_KEY (and MONGODB_URI if used)

# 3. Pre-download the yt-dlp binary (needs network access to GitHub)
npm run setup:ytdlp

# 4. Build and run
npm run build
npm start                         # Next.js on http://localhost:3000
```

Recommended for production:

```bash
# Process manager — keeps the server alive and restarts it on failure
npm i -g pm2
pm2 start "npm start" --name youtube-extractor
pm2 save && pm2 startup

# Optional: serve via Nginx/Caddy as a reverse proxy with HTTPS
```

Requirements:

- **Node.js 20.6+** (Next.js 16 requirement)
- **Outbound network access** to GitHub (one-time binary download) and to the
  video sites themselves
- **ffmpeg** (optional) — only needed if you select a format that requires a
  video+audio merge, e.g. `bestvideo+bestaudio` in the Quality field
- A writable temp directory (any Node host has one)

### Deploy on Render / Railway / Fly.io

Render (Web Service) / Railway both run Node long-lived processes, so they work
out of the box:

1. Connect the GitHub repository.
2. Build command: `npm ci && npm run setup:ytdlp && npm run build`
3. Start command: `npm start`
4. Environment variables: `YOUTUBE_API_KEY` (and `MONGODB_URI` if used).
5. Ensure the service has a **persistent disk** if you want the pre-downloaded
   binary to survive restarts; otherwise it re-downloads on first use (adds a
   few seconds to the first download).

### Docker

The Dockerfile in the [Docker Deployment](#docker-deployment) section already
installs ffmpeg and pre-downloads the yt-dlp binary at build time, so `npm run
setup:ytdlp` does not need to run at container start.

### Cookies for private / age-gated content

Some videos (age-restricted YouTube, private Instagram posts) require a login.
yt-dlp accepts a **Netscape-format cookies.txt**:

1. Install a browser extension such as "Get cookies.txt LOCALLY" (or export
   cookies manually in that format).
2. Export the cookies for the site while logged in.
3. On the `/bulk` page, upload the file in the "Cookies file" field. It is sent
   to the server with that single request only and is never stored.

### Platform support

yt-dlp ships extractors for **over 1000 sites** — see the [yt-dlp supported
sites list](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md).
Sites that require login (many Instagram/Twitter posts) need the cookies file
above. The download filenames follow the `{uploader} - {title} [{id}].{ext}`
pattern and the bulk ZIP sorts videos into per-platform folders.

### Testing your deployment

```bash
# Quick check that the binary is present
.yt-dlp/yt-dlp --version          # (or: yt-dlp --version if YTDLP_BINARY is set)

# Metadata check — should return a JSON with a filename
curl "http://localhost:3000/api/download-url/validate?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ" \
  -H "Origin: http://localhost:3000"

# Streaming check — should return 200 with content-type video/mp4
curl -D - -o /dev/null "http://localhost:3000/api/download-url?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ" \
  -H "Origin: http://localhost:3000"
```

> The `Origin` header is required because `/api/*` routes are protected by an
> origin guard — browsers send it automatically, curl needs it manually.

## Environment Variables

### Required Variables

```env
# Required for playlist extraction
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### Optional Variables

```env
# Optional - for link history storage
MONGODB_URI=mongodb://localhost:27017/youtube-playlist-extractor

## Database Setup

### MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP (or allow access from anywhere for development)
5. Get the connection string
6. Add to environment variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/youtube-extractor?retryWrites=true&w=majority
```

### Local MongoDB

1. Install MongoDB:

```bash
# Ubuntu/Debian
sudo apt install mongodb

# macOS
brew install mongodb-community
```

2. Start MongoDB:

```bash
# Ubuntu/Debian
sudo systemctl start mongodb

# macOS
brew services start mongodb-community
```

3. Use local connection string:

```env
MONGODB_URI=mongodb://localhost:27017/youtube-playlist-extractor
```

## Monitoring and Maintenance

### View Application Logs

**Vercel:**
- View logs in Vercel dashboard under "Logs" tab

**PM2 (Self-hosted):**
```bash
pm2 logs youtube-extractor
```

**Docker:**
```bash
docker-compose logs -f app
```

### Update Application

**Vercel/Netlify:**
- Push changes to GitHub, automatic deployment will trigger

**Self-hosted with PM2:**
```bash
git pull
npm install
npm run build
pm2 restart youtube-extractor
```

**Docker:**
```bash
git pull
docker-compose down
docker-compose up -d --build
```

## Performance Optimization

### Caching

For better performance with high traffic, configure a CDN for static assets:
   - Vercel: Automatic CDN
   - Netlify: Automatic CDN
   - Self-hosted: Use Cloudflare

### Rate Limiting

YouTube Data API has quotas. Monitor usage:
- Daily quota: 10,000 units
- Playlist items: ~3 units per request
- Video details: ~1 unit per request

Consider implementing:
- User authentication
- Request rate limiting
- Longer cache durations

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### API Errors

- Check YouTube API key is valid
- Verify API is enabled in Google Cloud Console
- Check quota usage in Google Cloud Console

### MongoDB Connection Issues

- Verify connection string is correct
- Check network access in MongoDB Atlas
- Ensure MongoDB service is running (self-hosted)

### Application Not Starting

- Check Node.js version (must be 18+)
- Verify all environment variables are set
- Check port 3000 is not in use

## Security Checklist

Before deploying to production:

- [ ] YouTube API key is set as environment variable (not hardcoded)
- [ ] MongoDB connection string uses strong password
- [ ] HTTPS is enabled
- [ ] Environment variables are secured
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented (if high traffic expected)
- [ ] Regular security updates are scheduled

## Support

For deployment issues:
- Check [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- Open an issue on GitHub
- Review the README.md and MIGRATION.md

---

**Recommended Deployment: Vercel** for ease of use and excellent Next.js integration.
