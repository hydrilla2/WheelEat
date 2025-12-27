# Frontend environment variables (local development)

When you run the frontend locally with `npm start`, the React dev server runs on `http://localhost:3000` and **does not automatically proxy** `/api/*` to your Cloudflare Pages backend.

## Fix: set `REACT_APP_API_BASE_URL`

Create a file (either one is fine, both are gitignored):

- `.env.development.local` (recommended)
- `.env.local`

Put this inside:

```env
REACT_APP_API_BASE_URL=https://wheeleat-xp5.pages.dev
```

Then restart the dev server:

```bash
npm start
```

## Production

In production (Cloudflare Pages), you typically **leave `REACT_APP_API_BASE_URL` unset** so the app uses same-origin requests like `/api/malls`.


