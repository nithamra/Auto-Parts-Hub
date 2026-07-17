---
name: Auto-parts store setup
description: Critical decisions and crash lessons for the AllAmerican Auto Parts monorepo
---

## Generated API client already includes /api prefix
Do NOT call setBaseUrl('/api') — it doubles the prefix to /api/api/... The Replit proxy passes the full /api/* path to port 8080 and the API server mounts routes under /api already.
**Why:** Proxy forwards the full path. setBaseUrl prepends again.
**How to apply:** Leave setBaseUrl uncalled in main.tsx. If you see /api/api/ in logs, this is the cause.

## Wouter v3 nested Switch inside Route is broken
A nested <Switch> inside <Route path="/:rest*"> (children prop) scopes inner routes relative to the captured prefix — inner <Route path="/"> matches empty string, never renders. Blank page, no errors.
**Why:** Wouter v3 changed nested route base-path resolution.
**How to apply:** Always use a flat <Switch> with all routes listed at the top level.

## Duplicate export * in index.ts causes silent React crash
If lib/api-client-react/src/index.ts has duplicate export * lines, ESM module fails. React DevTools message appears but page is blank. No console errors.
**Why:** ESM duplicate named exports fail silently in Vite.
**How to apply:** Keep index.ts with exactly one export * per module.

## Catalog filter params must use undefined, not null
Orval serializes null as the string "null" in query params. parseInt("null") = NaN. PostgreSQL rejects it with "invalid input syntax for type integer: NaN".
**Why:** undefined values are omitted from query strings; null is not.
**How to apply:** Use undefined (never null) for optional filter params. Add isNaN() guards in API route handlers.
