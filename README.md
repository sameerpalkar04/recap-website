# Afterword — The Recap Journal

Afterword is a React and Express application for browsing TV shows and generating concise episode recaps. It supports Google sign-in, guest recaps, saved recap history, Redis caching, and PostgreSQL storage.

## Run locally

1. Copy `backend/.env.example` to `backend/.env` and set `TMDB_API_KEY`, `GEMINI_API_KEY`, and the Google OAuth values described below.
2. Start Redis and PostgreSQL: `docker compose up -d redis postgres`. PostgreSQL binds to localhost port 5433 by default. Set `REDIS_URL` and `DATABASE_URL` in `backend/.env` to those local service URLs.
3. Run `npm install` and `npm run dev` from this directory. Vite runs on port 5173 and proxies `/api` to the Express API on port 3001.

For local Google OAuth, use `http://localhost:3001/api/auth/google/callback` as the redirect URI and set `FRONTEND_URL=http://localhost:5173`.

## Run in containers

Copy `backend/.env.example` to `backend/.env` and fill in the Gemini, TMDB, Google OAuth, and session-secret values. Start the app with:

```sh
docker compose up --build
```

Open `http://localhost:8080`. Traefik routes requests and balances them across backend containers. To run more API instances:

```sh
docker compose up --build --scale backend=3
```

Redis is shared by backend instances for recap caching and rate limits. PostgreSQL stores user accounts and saved recaps in the `postgres-data` volume.

## Google login and sign-up

1. In Google Cloud Console, create or select a project, configure the OAuth consent screen, then create an OAuth client ID with application type **Web application**.
2. Add the appropriate callback URL to **Authorized redirect URIs**:
   - Local Vite: `http://localhost:3001/api/auth/google/callback`
   - Docker Compose: `http://localhost:8080/api/auth/google/callback`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`. For direct Vite development, use `GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback` and `FRONTEND_URL=http://localhost:5173`. Compose uses `http://localhost:8080/api/auth/google/callback` and `http://localhost:8080`; register the Compose callback with Google.
4. Generate `AUTH_SESSION_SECRET` with `openssl rand -base64 48`. Local HTTP uses non-secure cookies; the HTTPS Compose overlay enables secure cookies.

Keep OAuth client secrets and the session signing secret private in `backend/.env`.

## Recap history and cache

Signed-in recaps are cached by show, season, and episode and stored in PostgreSQL under the Google account. Guest generation bypasses recap cache reads and writes and does not save recaps. Deleting a saved recap removes that account's history entry; the shared cache entry may remain until its TTL expires.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Server-side credential for recap generation |
| `GEMINI_MODEL` | Optional recap model |
| `TMDB_API_KEY` | Server-side credential for show search and popular shows |
| `REDIS_URL` | Shared recap cache and request-limit store |
| `DATABASE_URL` | PostgreSQL account and saved-recap store |
| `DATABASE_POOL_SIZE` | Maximum PostgreSQL connections per backend instance |
| `DATABASE_SSL` | Require validated TLS for managed PostgreSQL |
| `CORS_ORIGIN` | Comma-separated allowed browser origins |
| `TRUST_PROXY` | Set to `true` behind a trusted reverse proxy |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 web client credentials |
| `GOOGLE_REDIRECT_URI` | Exact OAuth callback URL registered with Google |
| `FRONTEND_URL` | Frontend origin used after OAuth callback |
| `AUTH_SESSION_SECRET` | HMAC signing key for OAuth state and login cookies |
| `AUTH_COOKIE_SECURE` | Set to `true` for HTTPS deployments |

The TMDB key was previously present in frontend source. Remove or rotate that key in TMDB settings and only configure its replacement in the backend environment.

## HTTPS deployment

The base Compose file is for local use over HTTP. For a public deployment, provide a DNS name pointing at the host, expose ports 80 and 443, and copy `.env.compose.example` to a root `.env`. Set `APP_HOST`, `LETSENCRYPT_EMAIL`, `HTTP_PORT=80`, and a strong URL-safe `POSTGRES_PASSWORD` generated with `openssl rand -hex 32`. Keep Gemini, TMDB, OAuth, and `AUTH_SESSION_SECRET` values in `backend/.env`. Then run:

```sh
docker compose -f docker-compose.yml -f docker-compose.https.yml up --build -d
```

Register the HTTPS callback with Google. Back up PostgreSQL regularly; the named volume survives container replacement but is not a backup. Replace the local default database password before deploying.
