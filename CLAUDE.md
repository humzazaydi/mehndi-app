# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server at http://localhost:4200
npm run build      # production build
npm run watch      # dev build with watch mode
npm test           # run tests (vitest)
ng generate component path/to/name --standalone  # scaffold a new standalone component
```

No linter is configured; Prettier is used for formatting (printWidth 100, singleQuote, Angular HTML parser).

## Architecture

**Stack:** Angular 21 · Angular Material 21 · Tailwind CSS v4 · Supabase (PostgreSQL + Auth + Storage) · PWA

### Rendering & State

All components are **standalone** (no NgModules). State is managed entirely via Angular **signals** (`signal`, `computed`, `inject`). There is no RxJS in the app logic — services expose `readonly` signals and async methods that mutate them directly. Change detection uses the default zone-based strategy.

The root `App` component (`src/app/app.ts`) initialises auth, settings, and real-time notifications on startup before any route renders.

### Service Layer (`src/app/core/services/`)

Each service follows the same pattern:
- Injects `SupabaseService` (thin wrapper around the Supabase JS client)
- Exposes `readonly` signals for data (`bookings`, `payments`, `cart`, etc.) plus a shared `loading` signal
- Exposes `async` methods that call Supabase and update the signals directly

`AuthService` is the source of truth for the current session and profile. Guards (`auth.guard`, `admin.guard`, `guest.guard`) poll `auth.loading()` with a 50 ms interval before resolving because auth is initialized asynchronously.

`SettingsService` loads two Supabase rows on startup (`banking`, `business`) and exposes typed signals. `ContentBlock` CMS entries are also loaded here.

`OrderService` persists the cart to `localStorage` under the key `mehndi_cart`; it is restored on service construction.

### Routing (`src/app/app.routes.ts`)

| Prefix | Layout | Guard |
|--------|--------|-------|
| `/` (public pages, store, booking) | `PublicLayoutComponent` | none / `authGuard` for `/booking` |
| `/auth/*` | none | `guestGuard` |
| `/client/*` | `PublicLayoutComponent` | `authGuard` |
| `/admin/*` | `AdminLayoutComponent` | `adminGuard` |

All feature components are lazy-loaded via `loadComponent`.

### Layouts

`PublicLayoutComponent` renders the sticky top nav, `<router-outlet>`, and footer. It also owns the dark-mode toggle (adds `dark-theme` class to `document.body`).

`AdminLayoutComponent` is a `mat-sidenav-container` that collapses the sidenav to `over` mode on mobile (detected via `BreakpointObserver`).

### Styling System

Two CSS entry points are declared in `angular.json`:
1. `src/tailwind.css` — Tailwind v4 import with a custom `dark` variant keyed on `.dark-theme`
2. `src/styles.scss` — Angular Material theme (`mat.$rose-palette` primary), global CSS custom properties, layout helpers (`.page-container`, `.admin-page`), and `.status-badge` variants

Angular Material is configured with `inlineStyleLanguage: scss`. Component styles should be written inline in the template or as `styles` array strings rather than separate `.scss` files, because the schematic default is SCSS but most existing components use inline Tailwind.

Custom properties defined in `:root`:
- `--brand-primary` `#b5263a`, `--brand-primary-light`, `--brand-secondary` `#d4a017`
- `--sidebar-width: 260px`, `--header-height: 64px`

### Database & Migrations (`supabase/migrations/`)

Migrations are plain SQL files numbered sequentially (`001_schema.sql`, `002_rls.sql`, etc.) and must be run manually in the Supabase SQL editor — there is no migration runner wired into the dev workflow. `004_remove_rls.sql` disables all RLS and grants full `authenticated`/`anon` access, so the app currently relies on application-level filtering rather than row-level policies.

Key Supabase patterns used in the codebase:
- Joins via PostgREST nested selects: `select('*, artists(id, name), packages(id, name)')`
- The `BOOKING_SELECT` constant in `BookingService` is the canonical deep-join query for bookings
- Storage bucket `payment-receipts` uses signed URLs (7-day TTL)
- Real-time subscriptions are set up in `NotificationService` via `supabase.channel()`

### Shared Components (`src/app/shared/`)

| Component | Purpose |
|-----------|---------|
| `LoadingSpinnerComponent` | Centred spinner, drop in with `<app-loading-spinner />` |
| `EmptyStateComponent` | Icon + title + optional subtitle placeholder |
| `FileUploadComponent` | Drag-and-drop with `fileSelected` EventEmitter |
| `StatusBadgeComponent` | Wraps the `.status-badge` CSS class |
| `ConfirmDialogComponent` | Generic `MatDialog` confirmation |
| `CurrencyPkPipe` | Formats numbers as `Rs. X,XXX` |
| `BookingStatusPipe` | Human-readable booking status labels |

### Feature Modules

- **`/features/public/`** — Home, Artists listing, Artist detail, Packages listing (all unauthenticated)
- **`/features/booking/`** — Multi-step `BookingWizardComponent`, success page, public tracker
- **`/features/client/`** — Client dashboard, My Bookings, Booking detail (with payment dialog), My Orders
- **`/features/store/`** — Cone Store, Checkout, Order Confirmation
- **`/features/admin/`** — Dashboard (KPIs via Supabase RPC functions), Bookings, Booking detail, Artists CRUD, Packages CRUD, Payments, Analytics (ECharts via `ngx-echarts`), Store orders, Settings
- **`/features/auth/`** — Login, Register

### Analytics

Admin analytics calls Supabase RPC functions defined in `001_schema.sql` (`get_revenue_summary`, `get_monthly_revenue`, `get_revenue_by_artist`, `get_booking_metrics`, etc.) via `AnalyticsService.rpc()`. Charts are rendered with `ngx-echarts`.
