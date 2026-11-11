# Deployment

The live site runs at **https://getpluggedwebsite.onrender.com/** on three free-tier services:

| Service | Role |
|---|---|
| [Render](https://render.com) | Hosts the app itself (`python wsgi.py`, via waitress) |
| [Neon](https://neon.tech) | Postgres database |
| [Cloudflare R2](https://developers.cloudflare.com/r2/) | Object storage for admin-uploaded images |

## How a code change reaches the live site

1. Push to the `main` branch on GitHub (`DredgenYors/GetPluggedWebsite`).
2. Render is connected to that repo/branch and auto-deploys on every push - no manual deploy step.
3. First-time or rare schema changes still need a manual migration (see below); routine code/content changes don't.

If a deploy breaks something, Render keeps a history of previous deploys on the service's dashboard that you can roll back to.

## Environment variables (set in Render's dashboard, under the service's Environment tab)

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Signs session cookies and CSRF tokens. Long random string. |
| `ADMIN_PASSWORD` | Bootstraps the first `admin` account on a database with no users yet. Only read once - changing it later does nothing; change the password from the admin panel instead. |
| `DATABASE_URL` | Neon's Postgres connection string. Falls back to local SQLite if unset. |
| `R2_BUCKET` | The R2 bucket name (`get-plugged`). |
| `R2_ACCOUNT_ID` | Cloudflare account ID. |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 API token credentials. |
| `R2_PUBLIC_BASE_URL` | The bucket's public URL - images are served from here. |

`FLASK_DEBUG` must stay **unset** in production - it's what gates the insecure local-dev fallbacks for `SECRET_KEY`/`ADMIN_PASSWORD`, and enables Flask's debug mode (which leaks stack traces and an interactive debugger) if left on.

None of the R2/Postgres variables are required for local development - the app falls back to local SQLite (`instance/getplugged.db`) and local disk (`static/uploads/`) with zero config when they're unset. Run locally with `FLASK_DEBUG=1 python getpluggedv1.py`.

## One-time migration scripts

`migrate_sqlite_to_postgres.py` and `migrate_uploads_to_r2.py` (repo root) were used once to move the original local SQLite data and uploaded images into Neon and R2. They're not part of the normal deploy flow - only relevant again if standing up a fresh Postgres database or R2 bucket from scratch (each script refuses to run unless pointed at an actual Postgres `DATABASE_URL` / real R2 credentials, specifically to avoid being run by accident against the wrong target).

## Known gaps

- No automated tests or CI - verification has been manual (CDP-driven browser testing) throughout this project.
- No staging environment - `main` deploys straight to production.
