# AllAmerican Auto Parts Store

Full-stack American auto parts e-commerce platform — dark patriotic industrial theme, targeting Ford/Chevrolet/GMC/Jeep/Dodge owners.

## Architecture

**Monorepo** (pnpm workspaces):

| Package | Path | Purpose |
|---------|------|---------|
| `@workspace/auto-parts-store` | `artifacts/auto-parts-store` | React + Vite storefront |
| `@workspace/api-server` | `artifacts/api-server` | Express API server |
| `@workspace/db` | `lib/db` | Drizzle ORM + PostgreSQL schema |
| `@workspace/api-client-react` | `lib/api-client-react` | Orval-generated React Query hooks |
| `@workspace/api-zod` | `lib/api-zod` | Orval-generated Zod schemas |

**Routing**: Replit proxy routes `/*` → Vite (port 22045) and `/api/*` → Express (port 8080). The generated API client URLs already include the `/api` prefix — do NOT call `setBaseUrl()`.

## Key Decisions

- **Cart/wishlist**: Session-based (anonymous cookie `session_id`), no auth required.
- **Auth**: SHA-256 hash, token format `token_<userId>`. Token stored in localStorage.
- **Vehicle data**: Hardcoded in-memory in the vehicles route (Ford, Chevrolet, GMC, Jeep, Dodge).
- **Wouter routing**: Flat `<Switch>` (no nested Switch inside Route) to avoid wouter v3 path scoping issues.
- **API client**: Generated API paths already include `/api` prefix. Do not use `setBaseUrl`.

## Tech Stack

- **Frontend**: React 18, Vite 7, Tailwind CSS v4, Framer Motion, wouter v3, TanStack Query v5
- **Backend**: Express, Drizzle ORM, PostgreSQL
- **Design**: Oswald (headings) + Barlow (body), dark zinc theme, American Red (#b91c1c) + Steel Blue accents

## Seed Data

Database is pre-seeded with:
- 8 categories, 5 brands (Ford, Chevrolet, GMC, Jeep, Dodge)
- 30 products across all categories
- 18 reviews, 5 users (admin@allamerican.com / password123 is admin)
- 5 sample orders

## Development

```bash
# Start both services
pnpm --filter @workspace/auto-parts-store run dev  # port 22045
pnpm --filter @workspace/api-server run dev         # port 8080

# Regenerate API client after spec changes
cd lib/api-spec && pnpm run generate

# Push schema changes
cd lib/db && pnpm exec drizzle-kit push
```

## User Preferences

- Keep the "Patriotic Industrial Muscle" design aesthetic
- Oswald for all headings (uppercase, tracking-wider)
- Dark zinc default, American Red primary, Steel Blue secondary
