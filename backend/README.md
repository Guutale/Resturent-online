# Restaurant Online Backend

## Setup
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env`
4. Start dev server: `npm run dev`

Base URL: `http://localhost:<PORT>/api` (example: `http://localhost:5001/api`)

## Main Endpoints

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (Bearer token)

### Users
- `PATCH /users/me`
- `PATCH /users/me/password`
- `POST /users/me/addresses`
- `PATCH /users/me/addresses/:id`
- `DELETE /users/me/addresses/:id`
- `GET /users` (admin)
- `GET /users/:id` (admin)
- `GET /users/:id/orders` (admin)
- `PATCH /users/:id` (admin)
- `DELETE /users/:id` (admin)

### Categories
- `GET /categories`
- `GET /categories/admin` (admin, includes inactive)
- `POST /categories` (admin)
- `PATCH /categories/:id` (admin)
- `DELETE /categories/:id` (admin, safety check for linked products)

### Products
- `GET /products?category=&search=&sort=&page=&limit=`
- `GET /products/:id`
- `POST /products` (admin)
- `PATCH /products/:id` (admin)
- `DELETE /products/:id` (admin)
- `PATCH /products/:id/availability` (admin)

### Orders
- `POST /orders` (user)
- `GET /orders/my` (user)
- `GET /orders/assigned` (delivery)
- `GET /orders/:id` (user/admin)
- `GET /orders/:id/invoice` (user/admin/delivery)
- `PATCH /orders/:id/cancel` (user)
- `GET /orders` (admin)
- `PATCH /orders/:id/status` (admin)
- `PATCH /orders/:id/assign-delivery` (admin)
- `PATCH /orders/:id/delivery-status` (delivery)

### Payments
- `GET /payments` (admin)
- `GET /payments/:id` (admin)
- `PATCH /payments/:id` (admin)

### Notifications
- `GET /notifications/my` (user)
- `PATCH /notifications/my/read-all` (user)
- `GET /notifications/admin` (admin)
- `PATCH /notifications/admin/read-all` (admin)
- `PATCH /notifications/:id/read` (user/admin)

## Frontend Route Skeleton
`frontend/src/router.jsx` includes all user/admin pages from your UI flow.
