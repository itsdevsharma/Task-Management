# Backend README

This backend provides the REST API for the Task Management application.

Run these commands from the repository root to set up the backend:

```bash
cd backend
npm ci
cp -n .env.example .env
```

Configure `MONGODB_URI` and a unique `JWT_SECRET` in `.env`, then start the
development server from the `backend` directory:

```bash
npm run dev
```

Other commands, also run from `backend`:

```bash
npm test
npm audit
```

To start in production with MongoDB and the environment configured:

```bash
NODE_ENV=production npm start
```

The backend runs JavaScript directly and does not have a build command.
See the [project README](../README.md) for frontend setup and full documentation.
