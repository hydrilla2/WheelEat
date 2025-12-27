# Cloudflare Pages Deployment Guide

This repository is configured for deployment on Cloudflare Pages. The build command installs dependencies and builds the React frontend.

## Structure

- **`/functions/api`** - Cloudflare Pages Functions (backend API endpoints)
- **`/functions/package.json`** - Dependencies for Cloudflare Pages Functions (must be committed)
- **`/functions/package-lock.json`** - Lock file for dependencies (must be committed)
- **`/frontend`** - React frontend source code
- **`/frontend/build`** - Static build output (should be committed or built before deployment)

## Important: Commit package-lock.json

**You MUST commit `functions/package-lock.json` to your repository** for Cloudflare Pages Functions to properly install dependencies during deployment.

If you see an error like "Could not resolve @supabase/supabase-js", make sure:
1. `functions/package.json` is committed
2. `functions/package-lock.json` is committed (run `npm install` in the functions directory if it doesn't exist)
3. The dependencies are correctly listed in `functions/package.json`

## Deployment Steps

### Option 1: Deploy with Pre-built Static Files

1. Build the frontend locally:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. Copy the build output to the root `public` directory (or configure Cloudflare Pages to use `frontend/build` as the output directory)

3. Deploy to Cloudflare Pages:
   - Connect your repository to Cloudflare Pages
   - Set **Build command**: `cd functions && npm install && cd ../frontend && npm install && npm run build`
   - Set **Build output directory**: `frontend/build`
   - Set **Root directory**: (leave as root)
   
   **Note**: This builds both Functions dependencies and the frontend during deployment.

### Option 2: Configure Build in Cloudflare Pages (Alternative)

1. In Cloudflare Pages dashboard:
   - **Build command**: `cd functions && npm install && cd ../frontend && npm install && npm run build`
   - **Build output directory**: `frontend/build`
   - **Root directory**: (leave as root)

2. This builds both Functions dependencies and the frontend during deployment.

## Environment Variables

Set these in Cloudflare Pages dashboard under Settings > Environment Variables:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `REACT_APP_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID (for Google Sign-In)

## API Endpoints

All API endpoints are available under `/api/*`:

- `GET /api/health` - Health check
- `GET /api/malls` - Get all available malls
- `GET /api/categories?mall_id=<mall_id>` - Get categories for a mall
- `GET /api/restaurants?categories=<categories>&mall_id=<mall_id>` - Get restaurants
- `POST /api/spin` - Spin the wheel
- `GET /api/users` - Get users (example endpoint)

## Functions Directory

The `/functions` directory contains Cloudflare Pages Functions:
- Each file in `/functions/api/` becomes an endpoint at `/api/<filename>`
- Shared libraries are in `/functions/api/lib/`
- Functions use the Fetch API format with `onRequest(context)` export

## Static Files

Static files (images, sounds) are served from `/frontend/public/` and will be available at the root after building.

## Notes

- No Node.js backend is required - all backend logic is in Cloudflare Pages Functions
- The frontend uses relative API paths (`/api/*`) to work on the same domain
- CORS is handled automatically by the functions
- The `_redirects` file ensures client-side routing works correctly

