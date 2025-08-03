# Security Configuration Guide

This document explains the Django security configurations for the YouTube Playlist Video Extractor project.

## Development vs Production Settings

### Development Settings (`settings.py`)
- `DEBUG = True` - Shows detailed error pages for development
- `ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']` - Allows local development
- Security settings disabled for HTTP development

### Production Settings (`settings_production.py`)
- `DEBUG = False` - Hides sensitive error information
- Proper `ALLOWED_HOSTS` configuration for your domain
- Full security headers enabled for HTTPS deployment

## Security Features Implemented

### 1. Secret Key Security
- **Issue**: Default Django secret key is insecure
- **Solution**: Use environment variable or generate new key
- **Command**: `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`

### 2. HTTPS Security Headers
- **HSTS (HTTP Strict Transport Security)**: Forces HTTPS for 1 year
- **SSL Redirect**: Automatically redirects HTTP to HTTPS
- **Secure Cookies**: Cookies only sent over HTTPS

### 3. Session & CSRF Security
- **Secure Session Cookies**: Prevents session hijacking
- **CSRF Protection**: Prevents cross-site request forgery
- **HTTPOnly Cookies**: Prevents XSS cookie access

### 4. Additional Security Headers
- **XSS Filter**: Browser-level XSS protection
- **Content Type Sniffing**: Prevents MIME type attacks
- **Referrer Policy**: Controls referrer information
- **Cross-Origin Opener Policy**: Prevents window.opener attacks

## Deployment Checklist

### Before Production Deployment:

1. **Generate New Secret Key**:
   ```bash
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   ```
   Set as environment variable: `DJANGO_SECRET_KEY`

2. **Configure Domain**:
   Update `ALLOWED_HOSTS` in `settings_production.py` with your actual domain

3. **SSL Certificate**:
   Ensure HTTPS is properly configured on your server

4. **Environment Variables**:
   Set the following environment variables:
   - `DJANGO_SECRET_KEY` - Your production secret key  
   - `DJANGO_SETTINGS_MODULE=ytlinkEX.settings_production`

5. **Database Configuration**:
   Configure production database (PostgreSQL recommended)

6. **Static Files**:
   ```bash
   python manage.py collectstatic --settings=ytlinkEX.settings_production
   ```

7. **Run Security Check**:
   ```bash
   python manage.py check --deploy --settings=ytlinkEX.settings_production
   ```

## Running in Different Modes

### Development Mode (Default):
```bash
python manage.py runserver
```

### Production Mode:
```bash
python manage.py runserver --settings=ytlinkEX.settings_production
```

Or set environment variable:
```bash
export DJANGO_SETTINGS_MODULE=ytlinkEX.settings_production
python manage.py runserver
```

## Security Warnings Resolved

✅ **W004**: SECURE_HSTS_SECONDS configured  
✅ **W008**: SECURE_SSL_REDIRECT enabled in production  
✅ **W009**: Instructions for secure SECRET_KEY  
✅ **W012**: SESSION_COOKIE_SECURE enabled in production  
✅ **W016**: CSRF_COOKIE_SECURE enabled in production  
✅ **W018**: DEBUG disabled in production  
✅ **W020**: ALLOWED_HOSTS configured  

## Additional Recommendations

1. **Use a Production Database**: PostgreSQL or MySQL instead of SQLite
2. **Use Redis for Caching**: Better performance than in-memory cache
3. **Set up Monitoring**: Log aggregation and error tracking
4. **Regular Updates**: Keep Django and dependencies updated
5. **Backup Strategy**: Regular database and media file backups

## Environment Variables Template

Create a `.env` file for production (never commit this):
```
DJANGO_SECRET_KEY=your-super-secret-key-here
DB_NAME=ytlinkex_prod
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
```
