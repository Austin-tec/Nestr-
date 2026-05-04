# NESTR

Flask backend + static frontend for student housing in Nigeria.

## Stack

- **API & static files:** `app.py` (Flask)
- **Database:** [Neon](https://neon.tech) PostgreSQL (`DATABASE_URL`)
- **Auth:** bcrypt password hashes + **JWT** access tokens (7-day expiry). Set `JWT_SECRET_KEY` in production.
- **Images:** uploads are resized (max side 1920px) and saved as optimized JPEG. Static marketing images: run `python scripts/optimize_static_images.py`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon Postgres connection string (use the **pooled** URI on Render/serverless). |
| `JWT_SECRET_KEY` | Production | Long random string used to sign JWTs. |
| `WHATSAPP_*`, `NESTR_PUBLIC_URL` | Optional | See `whatsapp_bot.py` docstring. |
| `KYC_ADMIN_KEY` | Optional (required to approve KYC) | Shared secret for `POST /api/admin/kyc/review` via header `X-Admin-Key`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Optional | Send email OTPs. If unset, the API still issues a code and returns it in **dev** responses (`verification.code` / `code`). |

### Landlord verification

- New landlords register with `email_verified=false` and `kyc_status=not_submitted`.
- **Email:** `POST /api/auth/request-email-verification` then `POST /api/auth/verify-email` with `{ "code": "..." }` (dev mode returns the code in the JSON for testing).
- **KYC:** `POST /api/landlord/kyc/submit` with `{ "doc_type", "doc_id" }` → status `pending`.
- **Admin approve:** `POST /api/admin/kyc/review` with `{ "user_id", "status": "approved"|"rejected"|"pending", "notes" }` and `X-Admin-Key: <KYC_ADMIN_KEY>`.
- **Posting listings** requires landlord + verified email + `kyc_status=approved` (`verification_level` becomes `solid`).

## Local setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

1. Copy `.env.example` to `.env` in the project root (this file is gitignored).
2. Paste your Neon URI into `DATABASE_URL` as a **single line** (no line breaks). If connection fails with `channel_binding`, try the same URL with `&channel_binding=require` removed—Neon’s dashboard “pooled” string usually works as-is.
3. Set `JWT_SECRET_KEY` to any long random string (required for login tokens).

Alternatively, in PowerShell only for the current session:

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
$env:JWT_SECRET_KEY = "your-secret-at-least-32-chars-long"
```

4. Run:

```powershell
python app.py
```

On **Render** (or any host), add `DATABASE_URL` and `JWT_SECRET_KEY` in the service **Environment** tab—do not commit the real URL to Git.

Open `http://127.0.0.1:5000/`. On first run, tables are created and demo users are seeded if the DB is empty:

- Student: `student@demo.com` / `demo123`
- Landlord: `landlord@demo.com` / `demo123`

## API (summary)

- `POST /api/auth/register` — `{ name, email, password, role, phone }` → `{ user, token }`
- `POST /api/auth/login` — `{ email, password }` → `{ user, token }`
- `GET /api/users/me` — `Authorization: Bearer <JWT>`
- `GET /api/properties` — query params: `search`, `state`, `city`, `area` (substring), `type`, `minPrice`, `maxPrice`, `bedrooms`
- `POST /api/properties`, image upload, delete property — **verified landlord** only (email + KYC approved)
- `POST /api/auth/request-email-verification`, `POST /api/auth/verify-email`
- `POST /api/landlord/kyc/submit`, `GET /api/landlord/kyc/status`
- `POST /api/admin/kyc/review` — `X-Admin-Key` must match `KYC_ADMIN_KEY`

## Optimize static images (optional)

From the project root (skips `nestr images/` uploads folder):

```powershell
python scripts/optimize_static_images.py
```

## Deploy (Render)

`render.yaml` expects secret env vars `DATABASE_URL` and `JWT_SECRET_KEY` configured in the Render dashboard.
