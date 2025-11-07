"""Render-friendly production settings.

This file is intentionally small: it imports the base settings and overrides
only the values that should come from environment variables. Secrets and
database URLs must be configured in the Render dashboard (or using Render's
secret manager).

Do NOT commit secrets into the repo. Set the following Render env vars:
  - SECRET_KEY
  - ALLOWED_HOSTS (comma-separated list) or use '*' during testing
  - DATABASE_URL (optional; if absent, falls back to local sqlite)
  - DJANGO_SETTINGS_MODULE should point to this module
"""
from .settings import *  # noqa: F401,F403
import os
from urllib.parse import urlparse, unquote

# Basic production safety
DEBUG = False

# Secret key must be provided via environment variable on Render
SECRET_KEY = os.environ.get("SECRET_KEY", "REPLACE_ME")

# Allowed hosts (comma-separated). Default to wildcard for quick testing only.
allowed = os.environ.get("ALLOWED_HOSTS", "*")
ALLOWED_HOSTS = [h.strip() for h in allowed.split(",") if h.strip()]

# Database: prefer DATABASE_URL (Postgres on Render). Fall back to default.
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    # Parse DATABASE_URL manually to avoid requiring dj-database-url in dev
    # environments. Supported schemes: postgres/postgresql, mysql, sqlite.
    parsed = urlparse(DATABASE_URL)
    scheme = parsed.scheme or ""
    if scheme.startswith("postgres"):
        engine = "django.db.backends.postgresql"
    elif scheme.startswith("mysql"):
        engine = "django.db.backends.mysql"
    elif scheme.startswith("sqlite") or scheme == "sqlite3":
        engine = "django.db.backends.sqlite3"
    else:
        engine = ""

    if engine:
        name = parsed.path.lstrip("/")
        user = unquote(parsed.username) if parsed.username else ""
        password = unquote(parsed.password) if parsed.password else ""
        host = parsed.hostname or ""
        port = parsed.port or ""

        if engine == "django.db.backends.sqlite3":
            DATABASES = {
                "default": {
                    "ENGINE": engine,
                    "NAME": name or os.path.join(BASE_DIR, "db.sqlite3"),
                }
            }
        else:
            DATABASES = {
                "default": {
                    "ENGINE": engine,
                    "NAME": name,
                    "USER": user,
                    "PASSWORD": password,
                    "HOST": host,
                    "PORT": port,
                }
            }
    else:
        # Unknown scheme; leave DATABASES as imported from base settings.
        pass

# Static files (collectstatic will populate STATIC_ROOT)
STATIC_ROOT = os.path.join(BASE_DIR, "collected_static")

# Whitenoise static file serving
MIDDLEWARE = [m for m in MIDDLEWARE]
if "whitenoise.middleware.WhiteNoiseMiddleware" not in MIDDLEWARE:
    MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Security helpers when running behind a proxy on Render
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Logging: route to console so Render picks up logs. If LOGGING isn't defined
# in the base settings (e.g. in lightweight dev setups), provide a minimal
# fallback so static analysis tools don't complain.
LOGGING = globals().get("LOGGING") or {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {},
    "root": {"level": "INFO", "handlers": []},
}
LOGGING.setdefault("handlers", {})
LOGGING["handlers"]["console"] = {
    "level": "INFO",
    "class": "logging.StreamHandler",
}
LOGGING.setdefault("root", {})
LOGGING["root"]["handlers"] = ["console"]

# Additional production-ready tweaks can be added here (CORS, rate limiting, etc.)
