# Restaurant Online (FlavorPoint) - Agent Guide

This repo is a simple restaurant ordering system:
- Frontend: Vite + React (`frontend/`)
- Backend: Express + MongoDB (Mongoose) (`backend/`)
- Roles: `user`, `admin`, `hr`, `finance`, `dispatcher`, `chef`, `waiter`, `delivery` (guest is unauthenticated)

## Quickstart (Local Dev)

Backend:
- `cd backend`
- `npm install`
- Configure env: copy `backend/.env.example` to `backend/.env` and set `JWT_SECRET` and `MONGO_URI`
- Start dev server: `npm run dev`

Frontend:
- `cd frontend`
- `npm install`
- Configure env: copy `frontend/.env.example` to `frontend/.env`
- Set `VITE_API_BASE_URL` to match backend (example: `http://localhost:5001/api`)
- Start dev server: `npm run dev`

Health check:
- `GET http://localhost:<BACKEND_PORT>/health`

## Ports And Env

Backend env (`backend/.env`):
- `PORT` (defaults to `5000` in code, but can be overridden by env)
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `DEFAULT_DELIVERY_FEE`
- Optional seed vars: see `backend/.env.example` (includes `ADMIN_EMAIL`, `CHEF_EMAIL`, etc.)

Frontend env (`frontend/.env`):
- `VITE_API_BASE_URL` (must point at backend `/api`)

Note: Keep frontend `VITE_API_BASE_URL` and backend `PORT` in sync (example: backend `PORT=5001` -> frontend `http://localhost:5001/api`).

## Architecture Map

Backend:
- Entry: `backend/src/server.js` (loads env, connects DB, listens on `PORT`)
- App: `backend/src/app.js` (mounts JSON, CORS, routes, error handling)
- Routes: `backend/src/routes/*.routes.js` mounted under `/api/*`
- Controllers: `backend/src/controllers/*.controller.js`
- Models: `backend/src/models/*.js`
- Auth: JWT Bearer token via `backend/src/middleware/auth.js`
- Admin-only: `backend/src/middleware/admin.js`
- Delivery-only: `backend/src/middleware/delivery.js`
- Role guard: `backend/src/middleware/roles.js` (`allowRoles([...])`)
- Error shape: JSON `{ "message": "..." }` (see `backend/src/middleware/error.js`)

Frontend:
- Router: `frontend/src/router.jsx` (user + admin routes)
- Layout/Nav: `frontend/src/components/AppLayout.jsx`
- Auth state: `frontend/src/context/AuthContext.jsx` (stores `token` + `user` in localStorage)
- Cart state: `frontend/src/context/CartContext.jsx` (localStorage only for v1)
- API helper: `frontend/src/lib/api.js` (`apiRequest(path, options)` auto-attaches token)
- Styling: plain CSS in `frontend/src/styles.css` (not Tailwind)

## Specs (Data Model + UI Flow)

See:
- `docs/DATA_MODEL.md`
- `docs/UI_FLOW.md`

## Seed Admin (Dev)

From `backend/`:
- `npm run seed:admin`
- `npm run seed:roles` (admin/dispatcher/chef/waiter/delivery/user)

Defaults (override via `ADMIN_EMAIL` / `ADMIN_PASSWORD`):
- Email: `admin@mail.com`
- Password: `admin123`

## Testing

Backend tests:
- `cd backend`
- `npm test`

Note: tests use `supertest` and mock Mongoose methods; MongoDB is not required for `npm test`.

## Working Conventions (For Agents)

- Keep backend error responses consistent with `{ "message": "..." }` so frontend error handling continues to work.
- Prefer adding backend features as: route -> controller -> model, wrapped with `asyncHandler`.
- Do not persist cart in DB for v1; only create `Order` on checkout.
- Payments are stored in `Payment` and linked to `Order` (`orderId` unique).
- Notifications are stored in `Notification` (audience: `user`/`admin`).
- Inventory (optional per product) is `Product.stockQty`; checkout decrements stock when set.
- Invoices are generated as HTML via `GET /api/orders/:id/invoice` (print to PDF in browser).
- When changing API paths or payloads, update `backend/README.md` and keep frontend calls aligned with `frontend/src/lib/api.js`.
- Avoid editing generated folders like `frontend/dist/` and dependencies like `*/node_modules/`.
