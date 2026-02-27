# Backoffice Admin Panel

## Project info

A Vite + React + TypeScript project with a storefront and an admin backoffice.

## Getting started

```sh
npm install
npm run dev
```

- User dashboard: `http://localhost:5173/`
- Admin login: `http://localhost:5173/admin-login`

## Backend URL setup (Vercel + Local)

Frontend reads backend URL from `VITE_API_BASE_URL`.

1. Local development:
   - Create `Bruno-Marketplace-frontend-main/.env.local`
   - Add:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_BYPASS_PAYMENT_CHECKOUT=true
```

2. Vercel production:
   - In Vercel Project Settings -> Environment Variables, add:

```env
VITE_API_BASE_URL=https://bruno-backend-ku0v.onrender.com
VITE_BYPASS_PAYMENT_CHECKOUT=false
```

3. Safety fallback already in code:
   - If no env is set, frontend uses:
     - `http://localhost:5000` when running on `localhost/127.0.0.1`
     - `https://bruno-backend-ku0v.onrender.com` on non-local hosts (for deployed frontend)

## Build

```sh
npm run build
npm run preview
```

## Tech stack

- Vite
- React
- TypeScript
- shadcn-ui
- Tailwind CSS
