# Merge Priority Guide (for Cursor AI / Future Merges)

This repo has had many branch merges. When merging **into `sign-up`** (or merging `sign-up` into other branches), **do NOT lose the features below**. If there is a conflict, resolve in favor of preserving these priorities.

## Priority #1 — Responsive design (Mobile + Desktop) ✅

### Goal
- **Mobile view**: the wheel and UI must fit and remain readable.
- **Desktop view**: the wheel must not become “stuck” small after switching from mobile.
- **No “refresh-to-fix”** behavior when changing viewport size.

### Key implementation details to preserve
- **Spin wheel must react to viewport changes** (resize/orientation/iOS visualViewport).
  - File: `frontend/src/components/SpinWheel.js`
  - The wheel sizing must update when viewport changes (do not calculate once on mount).
- **Avoid duplicate/competing CSS rules** that override each other and break layout.
  - File: `frontend/src/App.css` (`.wheel-panel` must be defined once consistently)
  - File: `frontend/src/components/SpinWheel.css` (mobile breakpoints must remain)

### Common merge-conflict warning signs
- The wheel looks correct only after refresh.
- Switching between mobile/desktop makes the wheel “stick” at the wrong size.
- `wheelGeom` (or sizing logic) uses `useMemo(..., [])` and reads `window.innerWidth` once.

## Priority #2 — Advertisements (Google AdSense) ✅

### Goal
- Keep AdSense visible in header and/or bottom placements (as currently implemented).
- Do not remove AdSense components during merge conflict resolution.

### Key files to preserve
- `frontend/src/components/AdSense.js`
- `frontend/src/components/AdSense.css`
- `frontend/src/App.js` (AdSense usage in header/bottom)
- `frontend/public/index.html` (AdSense script tag, if present)

### Env variables (if used)
- `REACT_APP_ADSENSE_HEADER_SLOT`
- `REACT_APP_ADSENSE_BOTTOM_SLOT`
- `REACT_APP_ADSENSE_CONTENT_SLOT`

## Priority #3 — Sign up / Login (Google + Guest) ✅

### Goal
- Users must be able to:
  - **Continue as Guest**
  - **Sign in with Google**
- Testing must be easy (no lockout from the login screen).

### Key implementation details to preserve
- File: `frontend/src/components/Login.js`
  - Uses `@react-oauth/google`
  - Fetches user profile from Google and stores it in localStorage key: `wheeleat_user`
  - Must request the profile scope (`openid email profile`) and validate `userInfo.sub`
- File: `frontend/src/App.js`
  - Reads `wheeleat_user` from localStorage to determine auth state
  - Must support test reset helpers:
    - `/?resetAuth=1` clears saved user and returns to login
    - `/?forceLogin=1` shows login without clearing saved user
  - Must include a **Logout** action that clears `wheeleat_user`

### Required env variable
- **Local**: `frontend/.env.local` must include:
  - `REACT_APP_GOOGLE_CLIENT_ID=...`
- **Vercel**: Set `REACT_APP_GOOGLE_CLIENT_ID` in the Frontend project env vars and redeploy.

### Google Cloud Console checklist
- OAuth Client type: **Web application**
- Authorized JavaScript origins:
  - `http://localhost:3000`
  - Your production domain (e.g. `https://wheeleat.vercel.app`)
- Authorized redirect URIs:
  - `http://localhost:3000`
  - Your production domain

## Merge Conflict Resolution Rules (quick)

When conflicts happen, prioritize in this order:
1. **`SpinWheel.js` responsive sizing & resize handling**
2. **`SpinWheel.css` mobile breakpoints**
3. **`App.css` layout rules (avoid duplicate `.wheel-panel`)**
4. **AdSense component + placements**
5. **Login flow (Google + Guest) + logout/reset helpers**

If a conflict forces a choice, prefer the side that keeps **all 3 priorities working** even if it changes minor styling.

## Verification checklist (after merge)
- **Desktop**: wheel looks “normal size” and not tiny.
- **Mobile**: wheel fits fully and text is readable.
- **Resize**: switching device toolbar sizes does NOT require refresh.
- **AdSense**: ad placeholders still render in header/bottom.
- **Login**:
  - Google sign-in works (profile contains `id`)
  - Guest login works
  - Logout returns to login screen
  - `/?resetAuth=1` returns to login screen


