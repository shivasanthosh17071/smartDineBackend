# SmartDine Backend

A Node.js + Express + MongoDB backend for **SmartDine** — a QR-based, contactless restaurant ordering & management platform. Covers the MVP + Phase 2 feature set from the product spec: customer ordering via table QR codes, live order tracking (Socket.IO), kitchen/waiter/cashier dashboards, flexible payments with split billing, service requests, reviews with basic sentiment tagging, coupons/loyalty points, and admin analytics.

## Features Implemented

- **Auth**: JWT-based auth (cookie + bearer token), role-based access control (`admin`, `kitchen`, `waiter`, `cashier`, `customer`)
- **Branches**: multi-branch/multi-location support
- **Tables & QR**: auto-generated QR codes per table, session-based dining (no login required for guests)
- **Menu**: categories with scheduling, items with customization (spice level, portion size, add-ons), search/filter, kitchen "86" availability toggle synced in real time
- **Orders**: price-integrity validated on the server, live status tracking (`placed → accepted → preparing → ready → served`), status history, urgent flagging, cancellation
- **Payments**: Pay Now / Pay Later / Split Bill, mock payment provider (swappable for Razorpay/Stripe), invoice numbers, end-of-day settlement report
- **Service Requests**: one-tap water/cutlery/bill/waiter-call requests routed to waiter dashboards in real time
- **Reviews**: post-meal ratings, tipping, lightweight sentiment tagging, per-item ratings
- **Coupons**: percentage/flat discounts with usage limits and validation endpoint
- **Staff Management**: admin can create/manage kitchen, waiter, cashier, and admin accounts
- **Analytics**: sales overview, top-selling items, prep-time analytics, sentiment summary
- **Real-time layer**: Socket.IO rooms scoped by branch, role, and table session so each dashboard only receives relevant events

## Tech Stack

Node.js, Express.js, MongoDB (Mongoose), Socket.IO, JWT, bcryptjs, QRCode, Helmet, express-rate-limit

## Getting Started

### 1. Prerequisites
- Node.js 18+
- MongoDB (local install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
Copy the sample env file and fill in real values:
```bash
cp .env.sample .env
```
At minimum, set `MONGO_URI` and `JWT_SECRET`.

### 4. Seed demo data (optional but recommended)
Creates a demo branch, 5 tables with QR codes, and a sample menu:
```bash
npm run seed
```

### 5. Run the server
```bash
npm run dev     # with nodemon (auto-restart)
# or
npm start
```

The API will be available at `http://localhost:5000/api`. A bootstrap admin account is auto-created on first run using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.

## API Overview

| Resource | Base Route | Notes |
|---|---|---|
| Auth | `/api/auth` | register, login, me, logout |
| Branches | `/api/branches` | admin only |
| Tables | `/api/tables` | QR resolve is public: `GET /api/tables/qr/:qrToken` |
| Menu | `/api/menu/categories`, `/api/menu/items` | public read, admin write, kitchen availability toggle |
| Orders | `/api/orders` | place order (public/guest), staff status updates |
| Payments | `/api/payments` | pay now/later/split, EOD report |
| Service Requests | `/api/service-requests` | one-tap requests, waiter dashboard |
| Reviews | `/api/reviews` | post-meal feedback |
| Coupons | `/api/coupons` | admin-managed, public validation |
| Staff | `/api/staff` | admin-managed accounts |
| Analytics | `/api/analytics` | sales, top items, prep times, sentiment |

Health check: `GET /api/health`

## Real-Time Events (Socket.IO)

Clients join rooms via:
- `join:branch` (branchId)
- `join:role` ({branchId, role})
- `join:table` ({tableId, sessionId})

Emitted events include: `order:new`, `order:status_updated`, `menu:item_availability_updated`, `service:new`, `service:updated`, `table:status_updated`, `payment:updated`.

## Project Structure

```
smartdine-backend/
├── config/          # DB connection, constants (roles, statuses, socket events)
├── controllers/      # Route handler logic
├── middleware/        # Auth, error handling, validation
├── models/            # Mongoose schemas
├── routes/            # Express routers
├── sockets/            # Socket.IO setup and emitters
├── utils/              # Token generation, QR generation, order calculations, seed script
├── app.js               # Express app configuration
└── server.js             # Entry point (HTTP + Socket.IO + DB bootstrap)
```

## Notes for Production

- Swap the mock payment provider in `paymentController.js` for real Razorpay/Stripe SDK calls + webhook verification.
- Add Cloudinary upload handling for menu item images (multer + cloudinary SDK are already listed as dependencies to wire up).
- Consider adding request validation with a schema library (e.g. Zod/Joi) for stricter input checks.
- Add automated tests (Jest + Supertest recommended) before going live.
