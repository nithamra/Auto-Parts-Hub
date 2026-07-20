# AllAmerican Auto Parts — Online Store

> The premier e-commerce platform for American-brand vehicle parts in Saudi Arabia. Sourcing genuine OEM and premium aftermarket components for Ford, Chevrolet, GMC, and Jeep.

---

## Features

| Category | Details |
|---|---|
| **Catalog** | 100+ categories, 3-level hierarchy, OEM / Aftermarket toggle, vehicle fitment filter |
| **Payments** | PayPal checkout (sandbox & live), real-time transaction capture, webhook verification |
| **Admin** | Dashboard with revenue metrics, order management, inventory alerts, transaction log |
| **Localization** | Full Arabic / English (EN ↔ AR), RTL layout support, SAR ⃁ currency |
| **Cart & Orders** | Session-based cart, order tracking, status management |
| **Search** | Full-text product search, brand/category/price filters, Make/Model/Year/Engine fitment |

---

## Tech Stack

**Frontend** — `artifacts/auto-parts-store/`
- React 18 + TypeScript · Vite 7
- Tailwind CSS v4 · shadcn/ui
- TanStack Query v5 · Wouter v3 (router)
- Framer Motion · Recharts
- `@paypal/react-paypal-js` for checkout

**Backend** — `artifacts/api-server/`
- Express.js · TypeScript · Pino logging
- PayPal Orders API v2 · Webhook verification

**Database & Shared Libraries**
- PostgreSQL (Replit-managed)
- Drizzle ORM (`lib/db/`)
- Auto-generated API client via Orval (`lib/api-client-react/`)
- OpenAPI 3.1 spec (`lib/api-spec/openapi.yaml`)

---

## Project Structure

```
.
├── artifacts/
│   ├── api-server/          # Express REST API
│   │   └── src/
│   │       └── routes/      # products, orders, categories, payments, admin …
│   └── auto-parts-store/    # React storefront + admin panel
│       └── src/
│           ├── components/  # UI primitives + layout shells
│           ├── pages/       # Route-level page components
│           │   └── admin/   # Admin dashboard, orders, products, transactions
│           └── lib/         # formatPrice, translations, language context
├── lib/
│   ├── api-spec/            # openapi.yaml (source of truth)
│   ├── api-client-react/    # Orval-generated typed hooks
│   └── db/                  # Drizzle schema + migrations
└── pnpm-workspace.yaml
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- PostgreSQL database (or use the Replit built-in)

### 1 — Install dependencies
```bash
pnpm install
```

### 2 — Set environment variables
Copy the example and fill in your values:
```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Replit) |
| `SESSION_SECRET` | Secret for signing session cookies |
| `PAYPAL_CLIENT_ID` | PayPal REST API client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal REST API client secret |
| `PAYPAL_WEBHOOK_ID` | PayPal webhook ID (from dashboard) |
| `PAYPAL_MODE` | `sandbox` or `live` |
| `VITE_PAYPAL_CLIENT_ID` | Same as `PAYPAL_CLIENT_ID` (exposed to frontend) |

### 3 — Push database schema
```bash
pnpm --filter @workspace/db push-force
```

### 4 — Seed data
```bash
# Categories
node artifacts/api-server/src/seed-categories.js

# Products
pnpm --filter @workspace/api-server exec tsx src/seed.ts
```

### 5 — Regenerate API client (after OpenAPI spec changes)
```bash
pnpm --filter @workspace/api-spec codegen
```

### 6 — Start development servers
```bash
# API server (port from $PORT env var)
pnpm --filter @workspace/api-server run dev

# Storefront (port from $PORT env var)
pnpm --filter @workspace/auto-parts-store run dev
```

---

## PayPal Integration

The store uses **PayPal Orders API v2** for payment processing.

### Flow
1. Customer fills shipping info and clicks **Pay with PayPal**
2. PayPal popup opens for authentication
3. On approval, the backend captures the payment and records the transaction
4. PayPal sends a webhook event (`PAYMENT.CAPTURE.COMPLETED`) which the IPN listener at `POST /api/payments/paypal/webhook` verifies and marks as confirmed

### Sandbox testing
Set `PAYPAL_MODE=sandbox` and use [PayPal sandbox buyer accounts](https://developer.paypal.com/tools/sandbox/accounts/).

---

## Admin Panel

Navigate to `/admin` while running the app. No separate login is required in development.

| Route | Description |
|---|---|
| `/admin` | Revenue metrics, recent orders, low-stock alerts, sales by category |
| `/admin/orders` | Full order list with status management |
| `/admin/products` | Product catalog management |
| `/admin/transactions` | PayPal transaction log — user, product, amount ⃁, date |

---

## Currency

All prices are displayed in **Saudi Riyals (⃁ SAR)** throughout the storefront and admin panel. The `formatPrice()` utility in `lib/format-price.ts` controls the format.

---

## License

MIT — see [LICENSE](LICENSE)
