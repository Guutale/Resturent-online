# Restaurant System Data Model (MongoDB/Mongoose)

## 1) User
- `name`: String, required
- `email`: String, required, unique, lowercase, trimmed
- `passwordHash`: String, required
- `role`: String enum(`user`,`admin`,`delivery`), default `user`
- `phone`: String, optional
- `addresses`: Array of
  - `label`: String (`Home`,`Work`,`Other`)
  - `city`: String, required
  - `district`: String, required
  - `street`: String, required
  - `notes`: String, optional
  - `isDefault`: Boolean, default `false`
- `isBlocked`: Boolean, default `false`
- timestamps

## 2) Category
- `name`: String, required, unique
- `slug`: String, required, unique
- `imageUrl`: String, optional
- `isActive`: Boolean, default `true`
- timestamps

## 3) Product
- `title`: String, required
- `slug`: String, required, unique
- `description`: String, optional
- `price`: Number, required, min `0`
- `categoryId`: ObjectId ref `Category`, required
- `imageUrl`: String, optional
- `isAvailable`: Boolean, default `true`
- `stockQty`: Number, optional (if set, ordering requires stock)
- `lowStockThreshold`: Number, default `5` (admin low-stock alert)
- `prepTimeMinutes`: Number, optional
- `tags`: `[String]`, optional
- timestamps

## 4) Order
- `orderNumber`: String, unique
- `userId`: ObjectId ref `User`, required
- `assignedDeliveryUserId`: ObjectId ref `User` (role `delivery`), optional
- `deliveryAssignedAt`: Date, optional
- `items`: Array of
  - `productId`: ObjectId ref `Product`
  - `title`: String snapshot, required
  - `price`: Number snapshot, required
  - `qty`: Number, required, min `1`
  - `imageUrl`: String snapshot, optional
- `subtotal`: Number, required
- `deliveryFee`: Number, required
- `total`: Number, required
- `customer`:
  - `name`: String, required
  - `phone`: String, required
- `deliveryAddress`:
  - `city`: String, required
  - `district`: String, required
  - `street`: String, required
  - `notes`: String, optional
- `paymentMethod`: enum(`COD`,`CARD`,`EVCPLUS`), default `COD`
- `paymentStatus`: enum(`unpaid`,`paid`,`refunded`), default `unpaid`
- `status`: enum(`pending`,`preparing`,`assigned`,`out_for_delivery`,`delivered`,`cancelled`) default `pending`
- `statusHistory`: Array of `{ status, at, byUserId?, byRole?, note? }`
- `deliveredAt`: Date, optional
- `cancelledAt`: Date, optional
- `adminNote`: String, optional
- timestamps

## 5) Payment
- `orderId`: ObjectId ref `Order`, required, unique
- `orderNumber`: String snapshot, required
- `userId`: ObjectId ref `User`, required
- `amount`: Number, required
- `currency`: String, default `USD`
- `paymentMethod`: enum(`COD`,`CARD`,`EVCPLUS`)
- `paymentStatus`: enum(`unpaid`,`paid`,`refunded`)
- `paidAt`: Date, optional
- `refundedAt`: Date, optional
- timestamps

## 6) Notification
- `audience`: enum(`user`,`admin`)
- `userId`: ObjectId ref `User` (required if audience=`user`)
- `title`: String
- `message`: String
- `type`: String (e.g. `order_created`, `payment_updated`, `low_stock`)
- `data`: Mixed (e.g. `{ orderId, orderNumber }`)
- `isRead`: Boolean default `false`
- timestamps

## 7) AuditLog (Pro)
- `actorUserId`: ObjectId ref `User`
- `actorRole`: String
- `action`: String (e.g. `admin.product_delete`)
- `entityType`: String (e.g. `Product`, `Order`)
- `entityId`: String/ObjectId (stored as string)
- `meta`: Mixed (prev/next snapshots)
- timestamps

## Notes
- Keep cart in localStorage/Context for v1.
- Create DB order only on checkout.
- Use item snapshots in `Order.items` to preserve historical prices/titles.
