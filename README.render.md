# Deploying to Render (free plan) — quick guide

This guide walks you through deploying the project to Render's free web service. It assumes your repository is on GitHub and that you have already added `render.yaml`, a `Procfile`, and `ytlinkEX/settings_render.py` to this repository.

Summary of the flow:
- Push your code to GitHub
- Create a Render Web Service pointing to the `main` branch
- Configure environment variables/secrets in the Render dashboard
- Trigger a deploy, then run migrations and `collectstatic` from the Render shell

1) Prepare your repository

- Ensure `requirements-prod.txt` contains all runtime dependencies (it already includes `yt-dlp`, `gunicorn`, and `whitenoise`).
- Make sure you do NOT commit secrets. `ytlinkEX/settings_render.py` reads `SECRET_KEY` and `DATABASE_URL` from environment variables.

2) Connect Render to GitHub

- In Render (https://dashboard.render.com) create a new Web Service and connect your GitHub repository.
- Choose the `main` branch and the Python environment.
- Use the default build command from `render.yaml` (it runs `pip install -r requirements-prod.txt`).
- Start command: `gunicorn ytlinkEX.wsgi:application --bind 0.0.0.0:$PORT`

3) Configure Environment Variables (Render Dashboard → Environment)

Set these environment variables on Render (do not push them to GitHub):

- `DJANGO_SETTINGS_MODULE=ytlinkEX.settings_render`
- `SECRET_KEY=<your-secret-key>`
- `ALLOWED_HOSTS=<your-render-service>.onrender.com` (or `*` for quick testing)
- Optional: `DATABASE_URL=postgres://user:pass@host:port/dbname` if you want a managed DB.

4) Deploy and run migrations

After the service builds and launches, open the Render Shell (Dashboard → your service → Shell) and run:

```bash
source venv/bin/activate || true
python manage.py migrate --settings=ytlinkEX.settings_render
python manage.py collectstatic --noinput --settings=ytlinkEX.settings_render
```

Notes:
- If you don't provide `DATABASE_URL`, the app will use the repo default (likely SQLite). SQLite works for small demos but is not suitable for concurrent production traffic.
- For the free plan: long-running background tasks and heavy network usage may be rate-limited. Consider processing playlists in smaller chunks to avoid timeouts.

5) (Optional) Processing large playlists

- Free web services might time out on very long requests. Options:
  - Implement chunked processing in the web UI (process N videos per request).
  - Use Render Scheduled Jobs or an external worker (paid) to handle heavy processing.

6) Logs & debugging

- Use the Render logs tab for build logs and runtime errors. The `ytlinkEX/settings_render.py` file routes logs to stdout so Render collects them.

If you want, I can:
- Add a `render_deploy.sh` helper script to automate migrations and collectstatic via the Render shell
- Create a small worker example using RQ and a `render.yaml` worker service (note: reliable background workers may need a paid plan)
