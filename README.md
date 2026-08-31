# Prism Frontend (`prism_fe`)

React + TypeScript + Vite UI for Prism.

**Full stack setup (Docker backend + this app):** see the [root README](../README.md).

---

## Quick start

```powershell
cd c:\Current\prism_fe
copy .env.example .env
npm install
npm run dev
```

Open **http://localhost:5174**

### API URL (required)

Local `.env` (from [`.env.example`](.env.example)) is for your machine only:

```env
VITE_API_BASE_URL=http://127.0.0.1:8002/api/v1
```

Production builds (`npm run build`) read [`.env.production`](.env.production):

```env
VITE_API_BASE_URL=https://api.prism.com/api/v1
```

| Mode | File | `VITE_API_BASE_URL` |
|------|------|---------------------|
| `npm run dev` | `.env` | `http://127.0.0.1:8002/api/v1` |
| Local uvicorn on 8000 | `.env` | `http://127.0.0.1:8000/api/v1` |
| `npm run build` | `.env.production` | `https://api.prism.com/api/v1` |

Anything starting with `VITE_` is bundled into the browser and is public. Keep `GEMINI_API_KEY`, Google credentials, `DATABASE_URL`, and JWT/secret keys in the backend only.

Restart `npm run dev` after changing `.env`.

---

## Login page

Sign in with:

1. **Organization code** — e.g. `DEMO001` or `SYSTEM`  
2. **Email** — `9876543210@gmail.com` for phone-created users, or seeded emails like `admin@demo.com`  
3. **Password** — phone number (default for new users) or seeded `demo1234`  

---

## First-run setup UI

If the backend has no initialized deployment and `SEED_DEMO=false`, the app sends you to:

**http://localhost:5174/setup**

You enter organization details and the **organization owner phone number**. Login email becomes `{phone}@gmail.com`; password defaults to the phone unless you set another.

If setup is already done, `/setup` is not available — use `/login` or reset the database (see root README).

---

## Creating users (admin UI)

| Screen | Path | Login pattern |
|--------|------|----------------|
| Organization owner | `/setup` or platform onboard | Phone → `{phone}@gmail.com` |
| Staff (admins & tutors) | `/admin/manage/staff` | Organization owner only for admin roles |
| Student | `/admin/manage/students` | Same |

Each form shows a preview of the login email and password to give the user.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (port 5174) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

---

## Role routes (after login)

| Role | Home |
|------|------|
| Platform super user | `/admin/platform` |
| Organization admin | `/admin` (dashboard) |
| Tutor | `/tutor` |
| Student | `/student` |

---

## Related docs

- [Root README — setup, reset, demo logins](../README.md)  
- [Docker backend](../docs/DOCKER_BACKEND.md)  
- [Backend README](../prism_be/README.md)
