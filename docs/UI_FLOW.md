# UI Flow (User + Admin)

## User Flow
1. `/` Home
- Navbar: Home, Menu, Cart, Login/Profile
- Category quick links: Quraac, Qado, Casho, Biyo
- CTA: View all menu

2. `/menu`
- Search by name
- Filter by category
- Sort: `price`, `-price`, `-createdAt`
- Click card -> `/menu/:id`

3. `/menu/:id`
- View image, description, price, availability
- Select quantity
- Add to cart -> `/cart`

4. `/cart`
- Change quantity / remove
- Show subtotal + delivery fee + total
- Checkout button:
  - not logged in -> `/login` (then return to `/checkout`)
  - logged in -> `/checkout`

5. `/checkout`
- Select/add address
- Enter phone
- Choose payment method (v1: COD)
- Place order -> `/orders/:id/success`

6. `/orders`
- List order history (date, status, total)
- Click row -> `/orders/:id`

7. `/orders/:id`
- Order detail, items, totals, delivery address, status timeline

8. `/notifications`
- In-app notifications (order confirmation, status updates, payment updates)

## Admin Flow
1. `/admin/login`
- Admin authentication only
- Success -> `/admin`

2. `/admin`
- Dashboard cards: total orders, revenue, today's orders
- Recent orders table

3. `/admin/categories`
- List/create/edit/delete category

4. `/admin/products`
- List/search/filter products
- Create/edit/delete
- Toggle availability

5. `/admin/orders`
- List orders
- Filter by status
- Open detail -> `/admin/orders/:id`

6. `/admin/orders/:id`
- Assign delivery staff (optional)
- Update status: pending -> preparing -> assigned -> out_for_delivery -> delivered/cancelled

7. `/admin/users`
- Search/filter users
- Block/unblock
- Change role (user/admin/delivery)
- Delete user (with safety rules)

8. `/admin/users/:id`
- View user profile + order history

9. `/admin/payments`
- Filter payments by date/method/status
- Update payment status (paid/unpaid/refunded)

10. `/admin/notifications`
- View admin notifications
- Mark read

## Delivery Flow
1. `/delivery`
- List assigned orders
- Update status: assigned -> out_for_delivery -> delivered

## Recommended Route List
### User
- `/`
- `/menu`
- `/menu/:id`
- `/cart`
- `/checkout`
- `/login`
- `/register`
- `/profile`
- `/orders`
- `/orders/:id`
- `/notifications`

### Admin
- `/admin/login`
- `/admin`
- `/admin/categories`
- `/admin/products`
- `/admin/orders`
- `/admin/orders/:id`
- `/admin/users`
- `/admin/users/:id`
- `/admin/payments`
- `/admin/notifications`

### Delivery
- `/delivery`
