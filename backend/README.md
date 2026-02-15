# Restaurant Online Backend

## Setup
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env`
4. Start dev server: `npm run dev`

Base URL: `http://localhost:<PORT>/api` (example: `http://localhost:5001/api`)

## Dev Seed Accounts
From `backend/` run:
- `npm run seed:roles`

Default credentials (override via `backend/.env`):
- Admin: `admin@mail.com` / `admin123`
- HR: `hr@mail.com` / `hr12345`
- Finance: `finance@mail.com` / `finance123`
- Dispatcher: `dispatcher@mail.com` / `dispatcher123`
- Chef: `chef@mail.com` / `chef123`
- Waiter: `waiter@mail.com` / `waiter123`
- Delivery: `delivery@mail.com` / `delivery123`
- User: `user@mail.com` / `user123`

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
- `POST /users` (admin, create staff/users with role)
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
- `GET /orders/kitchen` (chef/admin)
- `GET /orders/:id` (user/admin/dispatcher/delivery; chef can read kitchen orders)
- `GET /orders/:id/invoice` (user/admin/dispatcher/chef/delivery)
- `PATCH /orders/:id/confirm-payment` (user, EVC/CARD) body: `{ "transactionReference": "...", "proofImageUrl": "data:image/... or https://..." }`
- `PATCH /orders/:id/cancel` (user)
- `PATCH /orders/:id/kitchen-status` (chef/admin)
- `GET /orders` (admin/dispatcher)
- `PATCH /orders/:id/status` (admin)
- `PATCH /orders/:id/assign-delivery` (dispatcher)
- `PATCH /orders/:id/delivery-status` (delivery/dispatcher)

### Payments
- `GET /payments` (admin)
- `GET /payments/:id` (admin)
- `PATCH /payments/:id` (admin)

Payment statuses: `unpaid` → `pending` → `paid` (or `failed` / `refunded`).

### Notifications
- `GET /notifications/my` (user)
- `PATCH /notifications/my/read-all` (user)
- `GET /notifications/admin` (admin)
- `PATCH /notifications/admin/read-all` (admin)
- `PATCH /notifications/:id/read` (user/admin)

### Payroll
- `GET /payroll/payments` (admin/finance)
- `POST /payroll/payments` (admin/finance)
- `PATCH /payroll/payments/:id` (admin/finance)
- `GET /payroll/staff/:staffId/payments` (admin/finance/hr read-only)
- `GET /payroll/report?month=YYYY-MM&role=` (admin/finance)

### Delivery Staff
- `GET /delivery-staff` (admin/dispatcher)
- `POST /delivery-staff` (admin/dispatcher)
- `PATCH /delivery-staff/:id` (admin/dispatcher)
- `GET /delivery-staff/:id/performance` (admin/dispatcher)

### Staff (HR)
- `GET /staff` (admin/hr)
- `POST /staff` (admin/hr)
- `GET /staff/:id` (admin/hr)
- `PATCH /staff/:id` (admin/hr)
- `DELETE /staff/:id` (admin/hr)

### Salary Structures (HR)
- `GET /salary-structures` (admin/hr)
- `GET /salary-structures/current/:staffUserId` (admin/hr)
- `POST /salary-structures` (admin/hr)
- `PATCH /salary-structures/:id` (admin/hr)

### Attendance (HR)
- `GET /attendance?staffUserId=` (admin/hr)
- `POST /attendance` (admin/hr)

### Finance
- `GET /finance/revenue` (admin/finance)

## Frontend Route Skeleton
`frontend/src/router.jsx` includes all user/admin pages from your UI flow.
