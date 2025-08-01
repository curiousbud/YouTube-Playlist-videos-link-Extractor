# Production Deployment Checklist

## Before Deployment

- [ ] Remove debug print statements from code
- [ ] Set DEBUG = False in production settings
- [ ] Configure ALLOWED_HOSTS with your domain
- [ ] Set up environment variables (.env file)
- [ ] Configure database (PostgreSQL recommended)
- [ ] Set up Redis for caching (optional but recommended)
- [ ] Configure logging
- [ ] Collect static files: `python manage.py collectstatic`
- [ ] Run migrations: `python manage.py migrate`
- [ ] Test with production settings locally

## Security Checklist

- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS in production
- [ ] Configure security headers
- [ ] Set secure cookie flags
- [ ] Enable HSTS headers
- [ ] Review ALLOWED_HOSTS setting

## Performance

- [ ] Configure caching (Redis recommended)
- [ ] Optimize database queries
- [ ] Set up static file serving (CDN recommended)
- [ ] Configure logging properly
- [ ] Monitor memory usage

## Deployment Commands

```bash
# Using production settings
python manage.py runserver --settings=ytlinkEX.production_settings

# Or set environment variable
export DJANGO_SETTINGS_MODULE=ytlinkEX.production_settings
python manage.py runserver
```

## Common Deployment Platforms

- **Heroku**: Use Procfile and requirements.txt
- **Railway**: Automatic Django detection
- **PythonAnywhere**: Upload files and configure WSGI
- **VPS**: Use nginx + gunicorn for production
