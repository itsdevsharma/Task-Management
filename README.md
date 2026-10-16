# Task Management Application

A full-stack MERN task management app with authentication, authorization, dashboard analytics, task CRUD, filters, search, pagination, and responsive UI.

## Features

- User registration and login
- JWT-based protected API routes
- Personal task dashboard with aggregated statistics
- Create, edit, delete, and list tasks
- Search, filtering, sorting, and pagination
- Ownership enforcement across all task endpoints
- Responsive SaaS-style frontend
- Automated backend and frontend tests
- Task detail previews on hover and keyboard focus

## Tech Stack

- MongoDB + Mongoose
- Express.js
- React + Vite
- Node.js
- Tailwind CSS
- JWT auth

## Project Structure

```text
.
├── backend/
│   ├── src/
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   ├── .env.example
│   ├── index.html
│   └── package.json
├── .gitignore
├── package.json
├── README.md
├── API_DOCUMENTATION.md
└── postman_collection.json
```

## Prerequisites

- Node.js 22.12+ within the 22.x release line, or Node.js 24.x / 26+ (audit verified on 22.22.2)
- MongoDB instance or MongoDB Atlas URI
- npm

## Installation

From the repository root:

```bash
npm ci
npm --prefix backend ci
npm --prefix frontend ci
```

Lockfiles are included for reproducible installs. `npm install` followed by
`npm run install:all` is also available when intentionally updating dependencies.

## Environment Configuration

Create configuration files from the examples if they do not already exist:

```bash
cp -n backend/.env.example backend/.env
cp -n frontend/.env.example frontend/.env
```

Set your MongoDB URI and replace `JWT_SECRET` with a unique random secret before
starting the backend. Known example JWT secrets are rejected at startup. Keep all
backend credentials out of `VITE_*` variables, which are public browser values.

Backend example:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/task_management
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

Frontend example:

```env
VITE_API_URL=http://localhost:5000/api
```

## Run the App

Run the backend and frontend in separate terminals from the repository root:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

Or start both processes together:

```bash
npm run dev
```

The backend development command uses Node's native `--watch` mode.

## Available Scripts

```bash
npm run dev
npm run dev:backend
npm run dev:frontend
npm run test:backend
npm run test:frontend
```

## API Overview

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

Tasks:

- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET /api/tasks/stats`

## Security Notes

- Passwords are hashed using bcrypt
- JWT secret is stored in environment variables
- Task queries are scoped to the authenticated user
- All task writes are ownership-checked
- CORS is restricted to configured origins

## Testing

Run all API and frontend tests from the root:

```bash
npm test
```

Run either suite separately with `npm run test:backend` or `npm run test:frontend`.
Backend tests use Vitest, Supertest, and a temporary MongoDB instance. They cover
registration/login, invalid and expired JWTs, every task route without authentication,
CRUD, validation, filtering, pagination, statistics, and cross-user read/update/delete
rejection. They also verify that clients cannot reassign task ownership.

Frontend tests use Vitest and React Testing Library with mocked API calls. They
cover session expiry/logout, loading and error states, task forms, duplicate
submission prevention, profile updates, task detail dialogs, and hover previews
including keyboard access and dismissal.

The GitHub Actions workflow in `.github/workflows/ci.yml` installs from lockfiles,
runs both test suites, and builds the frontend on pushes and pull requests.

## Git workflow

Track source, documentation, lockfiles, and both `.env.example` files. The
`.gitignore` excludes local credentials, dependencies, builds, coverage, and generated
audit artifacts. Never commit your actual `.env` files.

For each subsequent change, use a descriptive branch and focused commits:

```bash
git switch -c feature/task-improvements
npm test
npm run build
git status --short
git add <changed-source-files>
git diff --cached
git commit -m "Describe the completed change"
```

Review the staged diff before committing. Add your own GitHub remote when ready
to submit; no remote or hosted repository is configured automatically.

## GitHub Submission Checklist

- [x] Project created
- [x] Backend and frontend separated
- [x] MongoDB + JWT auth implemented
- [x] Task CRUD with authorization
- [x] Frontend routes and UI added
- [x] Documentation included
- [x] Automated tests added

## Production and verification

From the repository root:

```bash
npm run test:backend
npm run test:frontend
npm --prefix frontend run build
cd backend
NODE_ENV=production npm start
```

The backend runs JavaScript directly and has no compilation/build script. Start it
from `backend` so dotenv finds `backend/.env`. MongoDB must be reachable and
`JWT_SECRET` must be configured; startup fails when the secret is missing.
Tests use an isolated temporary MongoDB and a generated test secret, without a
local `.env`. The first test run may download a MongoDB binary.

Serve `frontend/dist` with SPA fallback to `index.html`. Set `VITE_API_URL` before
building; Vite embeds it in the bundle. `npm --prefix frontend run preview` is
available for local preview. Set `CLIENT_URL` to the frontend origin.

Logout removes client storage and local authentication state. JWTs remain valid
until expiration; the logout endpoint does not revoke tokens. API 401 responses
and expired stored tokens clear the active frontend session.

This implementation supports personal tasks only. Projects, memberships, roles,
and collaboration are not implemented. The assessment audit request and exact scoring rubric are preserved in
`docs/ASSESSMENT_REQUEST.md`.

The optional `node src/seed.js` utility (run from `backend`) deletes all users and
tasks in its target database. It requires explicit `SEED_EMAIL` and
`SEED_PASSWORD` environment variables; never run it against valuable data.

See `IPTECHIE_AUDIT_REPORT.md` for the latest rubric audit and remaining limitations.
`AUDIT_REPORT.md` is an earlier audit record.

## Extended audit commands

```bash
node scripts/security-audit.mjs
npm audit
npm --prefix backend audit
npm --prefix frontend audit
node scripts/production-smoke.mjs
```

The redacted security scan checks source files, example files, the built frontend,
and environment ignore rules. Without Git metadata it cannot verify previously
tracked files or history.

`node scripts/production-audit.mjs` builds the frontend and starts an isolated
production backend plus Vite preview, then exercises the UI and injected failure
states. It requires Playwright and Chromium; see `AUDIT_REPORT.md` for setup.
This is a local production-artifact check, not a hosted deployment. The Tailwind 4
security upgrade requires modern browsers (Chrome 111+, Safari 16.4+, Firefox
128+); the audit exercised Chromium 155.
