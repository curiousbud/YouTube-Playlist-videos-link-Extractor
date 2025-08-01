# Production Deployment Guide

## 🚀 Production Deployment Steps

### 1. Environment Setup

Create a `.env` file in your project root for production environment variables:

```bash
# Django Settings
DJANGO_SETTINGS_MODULE=ytlinkEX.settings_prod
SECRET_KEY=your-super-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database (if using PostgreSQL)
DB_NAME=ytextractor
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# Cache (Redis)
REDIS_URL=redis://127.0.0.1:6379/1

# Email Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
ADMIN_EMAIL=admin@yourdomain.com
```

### 2. Install Production Dependencies

```bash
pip install -r requirements-prod.txt
```

### 3. Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### 4. Run Database Migrations

```bash
python manage.py migrate
```

### 5. Create Logs Directory

```bash
mkdir logs
```

### 6. Production Server Setup

#### Option A: Using Gunicorn (Recommended)

```bash
# Install gunicorn (already in requirements-prod.txt)
gunicorn --bind 0.0.0.0:8000 ytlinkEX.wsgi:application
```

#### Option B: Using Gunicorn with systemd (Linux)

Create `/etc/systemd/system/ytextractor.service`:

```ini
[Unit]
Description=YouTube Playlist Extractor
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/your/project
Environment="DJANGO_SETTINGS_MODULE=ytlinkEX.settings_prod"
EnvironmentFile=/path/to/your/.env
ExecStart=/path/to/venv/bin/gunicorn --workers 3 --bind unix:/path/to/ytextractor.sock ytlinkEX.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start ytextractor
sudo systemctl enable ytextractor
```

### 7. Nginx Configuration (if using Nginx)

Create `/etc/nginx/sites-available/ytextractor`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location = /favicon.ico { access_log off; log_not_found off; }
    
    location /static/ {
        root /path/to/your/project;
    }
    
    location /media/ {
        root /path/to/your/project;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/path/to/ytextractor.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ytextractor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🐳 Docker Deployment (Alternative)

### Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements-prod.txt .
RUN pip install --no-cache-dir -r requirements-prod.txt

# Copy project
COPY . .

# Create logs directory
RUN mkdir -p logs

# Collect static files
RUN python manage.py collectstatic --noinput

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "ytlinkEX.wsgi:application"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DJANGO_SETTINGS_MODULE=ytlinkEX.settings_prod
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./staticfiles:/app/staticfiles
    depends_on:
      - web
    restart: unless-stopped
```

## ☁️ Cloud Deployment Options

### Heroku

1. Create `Procfile`:
```
web: gunicorn ytlinkEX.wsgi:application
```

2. Create `runtime.txt`:
```
python-3.12.0
```

3. Deploy:
```bash
heroku create your-app-name
heroku config:set DJANGO_SETTINGS_MODULE=ytlinkEX.settings_prod
heroku config:set SECRET_KEY=your-secret-key
git push heroku main
heroku run python manage.py migrate
```

### DigitalOcean App Platform

Create `app.yaml`:
```yaml
name: ytextractor
services:
- name: web
  source_dir: /
  github:
    repo: your-username/YouTube-Playlist-videos-link-Extractor
    branch: main
  run_command: gunicorn --worker-tmp-dir /dev/shm ytlinkEX.wsgi:application
  environment_slug: python
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
  env:
  - key: DJANGO_SETTINGS_MODULE
    value: ytlinkEX.settings_prod
  - key: SECRET_KEY
    value: your-secret-key
    type: SECRET
databases:
- name: ytextractor-db
  engine: PG
  version: "13"
```

## 🔒 Security Checklist

- [ ] Set `DEBUG = False`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Use strong `SECRET_KEY`
- [ ] Enable HTTPS
- [ ] Set up proper database permissions
- [ ] Configure firewall
- [ ] Set up monitoring and logging
- [ ] Regular security updates
- [ ] Backup strategy

## 📊 Monitoring & Maintenance

### Log Monitoring
```bash
# View Django logs
tail -f logs/django.log

# View system logs
sudo journalctl -u ytextractor -f
```

### Performance Monitoring
- Monitor CPU and memory usage
- Set up Redis monitoring
- Monitor database performance
- Set up alerts for errors

### Regular Maintenance
- Update dependencies regularly
- Monitor disk space
- Clean up old cache entries
- Database maintenance
- SSL certificate renewal
