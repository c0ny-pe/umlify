# Deploy — cc3002.dcc.uchile.cl/umlify

Production runs as a **single Node process** under pm2 on host `gordon`: the Express
backend serves the REST API **and** the built React SPA, both under the `/umlify`
base path. The DCC reverse proxy forwards `https://cc3002.dcc.uchile.cl/umlify/` to
`localhost:8009`, preserving the `/umlify` prefix.

```
browser ──> DCC proxy (/umlify/ ──> :8009) ──> pm2: umlify (Express)
                                                   ├─ /umlify/api/*  REST API
                                                   └─ /umlify/*      SPA + assets (frontend/dist)
                                                          └─ Postgres @ localhost:5432
```

Port **8009**, base path **/umlify**, both set in `ecosystem.config.js`.
Secrets live in `backend/.env` (see `backend/.env.example`).

## First-time setup

```bash
# 1. Clone into the home dir, matching the other apps
cd ~
git clone <repo-url> umlify
cd umlify
git checkout feat/production-deploy   # or the branch you merge this into

# 2. Create the dedicated Postgres role + database (run as a superuser)
psql -h localhost -U postgres -c "CREATE ROLE umlify WITH LOGIN PASSWORD 'CHANGE_ME';"
psql -h localhost -U postgres -c "CREATE DATABASE umlify OWNER umlify;"

# 3. Configure secrets
cp backend/.env.example backend/.env
$EDITOR backend/.env        # set DATABASE_URL password + JWT_SECRET

# 4. Build everything and apply migrations (the update script does all of this)
./update                    # first run also builds; ignore the `pm2 restart` warning

# 5. Start under pm2 and persist across reboots
pm2 start ecosystem.config.js
pm2 save
```

The `./update` call on a fresh checkout runs `pm2 restart umlify`, which fails if the
app isn't registered yet — that's expected. Run `pm2 start ecosystem.config.js`
afterwards. On every later deploy, `./update` handles restart.

## Redeploy (after pushing changes)

```bash
cd ~/umlify
./update
```

`update` does: `git pull` → backend `npm install` + `migrate:up` + `build` →
frontend `npm install` + production build (`VITE_BASE_PATH=/umlify/`) → `pm2 restart umlify`.

## Reverse proxy

The DCC-managed proxy already forwards `/umlify` → `:8009`. The reference block is in
[`deploy/nginx-umlify.conf`](deploy/nginx-umlify.conf). The key point: the prefix is
**preserved** (no trailing slash on `proxy_pass`), matching `BASE_PATH=/umlify` in the app.

## How the base path flows through the app

| Layer | Setting | Value |
| --- | --- | --- |
| pm2 | `ecosystem.config.js` env | `PORT=8009`, `BASE_PATH=/umlify` |
| Frontend build | `VITE_BASE_PATH` (in `update`) | `/umlify/` → Vite `base`, asset URLs, `import.meta.env.BASE_URL` |
| React Router | `basename` (App.tsx) | derived from `BASE_URL` → `/umlify` |
| API client | `API_BASE_URL` (services/api.ts) | same-origin `/umlify/api` |
| Express | `BASE_PATH` env (app.ts) | routes at `/umlify/api/*`, static + SPA fallback under `/umlify` |

Local dev is unchanged: `BASE_PATH`/`VITE_BASE_PATH` default to empty, so everything
serves at the root and the Vite dev proxy still forwards `/api`.

## Checks

```bash
pm2 logs umlify --lines 100
curl -i http://localhost:8009/umlify/                 # 200, serves index.html
curl -i http://localhost:8009/umlify/api/users/1      # 200/401/404 JSON (not HTML)
curl -i https://cc3002.dcc.uchile.cl/umlify/          # through the proxy
```
