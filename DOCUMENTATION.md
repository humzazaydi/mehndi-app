# Henna Studio — Project Documentation

Bridal henna booking platform built with Angular 21, Angular Material, Tailwind CSS v4, and Supabase.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Architecture](#architecture)
6. [Routing](#routing)
7. [Services](#services)
8. [Features](#features)
9. [Shared Library](#shared-library)
10. [Database](#database)
11. [Styling System](#styling-system)
12. [PWA](#pwa)

---

## Overview

Henna Studio is a full-stack PWA for booking bridal mehndi (henna) services. It has two primary user roles:

- **Client** — Browse artists and packages, book appointments, track booking status, and purchase henna cones from the store.
- **Admin** — Manage all bookings, artists, packages, payments, orders, and view analytics dashboards.

The app is served at `http://localhost:4200` in development.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (standalone components) |
| UI Library | Angular Material 21 |
| Styling | Tailwind CSS v4 + custom CSS properties |
| State | Angular Signals (`signal`, `computed`) |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Charts | ECharts via `ngx-echarts` |
| Testing | Vitest + jsdom |
| PWA | Angular Service Worker |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 11+
- A Supabase project (URL + anon key)

### Installation

```bash
git clone <repo-url>
cd mehndi-app
npm install
```

### Environment Setup

Create `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

### Database Setup

Run the SQL migration files in order inside the Supabase SQL editor:

```
supabase/migrations/001_schema.sql
supabase/migrations/002_rls.sql
supabase/migrations/003_storage.sql
supabase/migrations/004_remove_rls.sql
supabase/migrations/005_orders_user_id.sql
supabase/migrations/006_grant_execute.sql
supabase/migrations/007_artist_performance.sql
```

### Development Commands

```bash
npm start        # Dev server at http://localhost:4200
npm run build    # Production build
npm run watch    # Dev build with watch mode
npm test         # Run tests (vitest)

# Scaffold a new standalone component
ng generate component path/to/name --standalone
```

---

## Project Structure

```
mehndi-app/
├── public/                        # Static assets (favicon, PWA icons, images)
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   └── images/
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── tailwind.css               # Tailwind v4 entry point
│   ├── styles.scss                # Angular Material theme + global CSS
│   └── app/
│       ├── app.ts                 # Root component (bootstrap + init)
│       ├── app.routes.ts          # All application routes
│       ├── core/
│       │   ├── models/            # TypeScript interfaces & enums
│       │   ├── services/          # All injectable services
│       │   └── guards/            # Route guards
│       ├── layout/
│       │   ├── public-layout/     # Nav + footer wrapper
│       │   └── admin-layout/      # Sidebar + header wrapper
│       ├── shared/                # Reusable components & pipes
│       └── features/
│           ├── public/            # Marketing pages (home, artists, packages)
│           ├── auth/              # Login & register
│           ├── booking/           # Booking wizard & tracker
│           ├── client/            # Client portal
│           ├── store/             # Cone store
│           └── admin/             # Admin panel
└── supabase/
    └── migrations/                # SQL migration files
```

---

## Architecture

### Component Model

All components are **standalone** — there are no NgModules. Every component declares its own imports array. Components are lazy-loaded by the router via `loadComponent`.

### State Management

State is managed entirely with **Angular Signals**. Services expose `readonly` signals as their public API. There is no RxJS in application logic.

```typescript
// Example service pattern
@Injectable({ providedIn: 'root' })
export class BookingService {
  private _bookings = signal<Booking[]>([]);
  readonly bookings = this._bookings.asReadonly();
  readonly loading = signal(false);

  async loadMyBookings() {
    this.loading.set(true);
    const { data } = await this.supabase.from('bookings').select(BOOKING_SELECT);
    this._bookings.set(data ?? []);
    this.loading.set(false);
  }
}
```

### Root App Bootstrap

`AppComponent` (`src/app/app.ts`) runs the following on `ngOnInit`:

1. `AuthService.initialize()` — fetches the current session and subscribes to auth state changes.
2. `SettingsService.loadAll()` — loads business configuration and CMS content blocks.
3. If a user is logged in: `NotificationService.load()` and `NotificationService.subscribeToRealtime()`.

### Route Guards

| Guard | File | Behavior |
|---|---|---|
| `authGuard` | `core/guards/auth.guard.ts` | Requires authenticated user; redirects to `/auth/login` |
| `adminGuard` | `core/guards/admin.guard.ts` | Requires `profile.role === 'admin'` |
| `guestGuard` | `core/guards/guest.guard.ts` | Redirects authenticated users away from auth pages |

Guards poll `auth.loading()` at 50 ms intervals before resolving, because auth is initialized asynchronously.

### Layouts

| Layout | Used for | Key features |
|---|---|---|
| `PublicLayoutComponent` | Public pages + client portal | Sticky top nav, dark-mode toggle, footer |
| `AdminLayoutComponent` | Admin panel | `mat-sidenav` (collapses to `over` on mobile via `BreakpointObserver`) |

---

## Routing

```
/                          → HomeComponent
/artists                   → ArtistsComponent
/artists/:id               → ArtistDetailComponent
/packages                  → PackagesComponent
/store                     → ConeStoreComponent
/store/checkout            → CheckoutComponent
/store/order-confirm/:id   → OrderConfirmComponent
/booking                   → BookingWizardComponent       [authGuard]
/booking/success/:id        → BookingSuccessComponent
/booking/track/:id          → BookingTrackerComponent

/auth/login                → LoginComponent               [guestGuard]
/auth/register             → RegisterComponent            [guestGuard]

/client/dashboard          → ClientDashboardComponent     [authGuard]
/client/bookings           → MyBookingsComponent          [authGuard]
/client/bookings/:id       → BookingDetailComponent       [authGuard]
/client/orders             → MyOrdersComponent            [authGuard]

/admin/dashboard           → AdminDashboardComponent      [adminGuard]
/admin/bookings            → AdminBookingsComponent       [adminGuard]
/admin/bookings/:id        → AdminBookingDetailComponent  [adminGuard]
/admin/artists             → AdminArtistsComponent        [adminGuard]
/admin/packages            → AdminPackagesComponent       [adminGuard]
/admin/payments            → AdminPaymentsComponent       [adminGuard]
/admin/analytics           → AdminAnalyticsComponent      [adminGuard]
/admin/store               → AdminStoreComponent          [adminGuard]
/admin/settings            → AdminSettingsComponent       [adminGuard]

**                         → redirect to /
```

---

## Services

All services are `providedIn: 'root'` and live in `src/app/core/services/`.

---

### SupabaseService

Thin wrapper around the Supabase JS client.

| Member | Type | Description |
|---|---|---|
| `client` | `SupabaseClient` | The raw client instance |
| `from(table)` | method | PostgREST query builder |
| `auth` | property | Supabase Auth API |
| `storage` | property | Supabase Storage API |
| `channel()` | method | Realtime subscription |
| `rpc(fn, params)` | method | Call a PostgreSQL RPC function |

---

### AuthService

Source of truth for the current session and user profile.

| Signal | Type | Description |
|---|---|---|
| `session` | `Session \| null` | Current Supabase session |
| `profile` | `Profile \| null` | Current user's profile row |
| `loading` | `boolean` | True while auth is initializing |
| `isAuthenticated` | `boolean` (computed) | Session is not null |
| `isAdmin` | `boolean` (computed) | `profile.role === 'admin'` |
| `isClient` | `boolean` (computed) | `profile.role === 'client'` |

| Method | Description |
|---|---|
| `initialize()` | Fetches session and sets up auth state listener |
| `signUp(email, password, fullName, phone)` | Create a new client account |
| `signIn(email, password)` | Log in with email and password |
| `signOut()` | Log out and navigate to home |
| `loadProfile(userId)` | Fetch profile row from DB |
| `updateProfile(updates)` | Partial update of the profile row |

---

### BookingService

Manages bridal mehndi bookings. Uses the `BOOKING_SELECT` constant for deep-join queries (booking → artist, package, addons, payments, status history).

| Signal | Type | Description |
|---|---|---|
| `bookings` | `Booking[]` | Loaded bookings (all or current user's) |
| `selectedBooking` | `Booking \| null` | Currently viewed booking |
| `loading` | `boolean` | Loading state |

| Method | Description |
|---|---|
| `loadMyBookings()` | Fetch bookings for the current user |
| `loadAllBookings(filters?)` | Admin: fetch all bookings, optionally filtered by status, artistId, dateFrom, dateTo |
| `getById(id)` | Fetch a single booking with full join |
| `create(wizardData)` | Create a new booking and its addon junction rows |
| `updateStatus(bookingId, status, notes?)` | Update booking status + insert a row into `booking_status_history` |
| `getAvailableTimeSlots(artistId, date)` | Return time slots not already booked for that artist on that date |
| `subscribeToBookingUpdates(userId, callback)` | Subscribe to realtime updates on the bookings table |

---

### ArtistService

Manages artists and their package assignments.

| Signal | Type | Description |
|---|---|---|
| `artists` | `Artist[]` | Artists with nested `artist_packages → package` |
| `loading` | `boolean` | Loading state |

| Method | Description |
|---|---|
| `loadArtists(activeOnly?)` | Fetch all artists (default: active only) |
| `getById(id)` | Fetch a single artist |
| `create(artist)` | Insert a new artist row |
| `update(id, updates)` | Update an artist |
| `delete(id)` | Delete an artist |
| `assignPackage(artistId, packageId, customPrice?)` | Create an `artist_packages` row |
| `updateArtistPackage(id, updates)` | Update custom_price or is_available on an assignment |
| `removeArtistPackage(id)` | Delete an `artist_packages` row |
| `uploadPhoto(artistId, file)` | Upload to `artist-photos` bucket and return the public URL |

---

### PackageService

Manages service packages and optional add-ons.

| Signal | Type | Description |
|---|---|---|
| `packages` | `Package[]` | All packages ordered by `sort_order` |
| `addons` | `Addon[]` | All add-ons ordered by name |
| `loading` | `boolean` | Loading state |

| Method | Description |
|---|---|
| `loadPackages(activeOnly?)` | Fetch packages |
| `loadAddons(activeOnly?)` | Fetch add-ons |
| `createPackage(pkg)` | Insert a new package |
| `updatePackage(id, updates)` | Update a package |
| `deletePackage(id)` | Delete a package |
| `createAddon(addon)` | Insert a new add-on |
| `updateAddon(id, updates)` | Update an add-on |
| `deleteAddon(id)` | Delete an add-on |

---

### PaymentService

Manages payment submissions and admin verification.

| Signal | Type | Description |
|---|---|---|
| `payments` | `Payment[]` | Loaded payments |
| `loading` | `boolean` | Loading state |

| Method | Description |
|---|---|
| `loadPaymentsForBooking(bookingId)` | Fetch payments for one booking |
| `loadAllPayments(filters?)` | Admin: fetch all payments, optionally filtered by status |
| `submitPayment(params)` | Create a payment record; optionally upload receipt to `payment-receipts` bucket (7-day signed URL) |
| `verifyPayment(paymentId, bookingId, paidAmount)` | Mark payment verified; update booking `paid_amount` and `remaining_amount` |
| `rejectPayment(paymentId, notes)` | Mark payment rejected with admin notes |

---

### OrderService

Manages the henna cone store — products, cart, and orders.

| Signal | Type | Description |
|---|---|---|
| `products` | `Product[]` | Active products ordered by type |
| `orders` | `Order[]` | All orders (admin) |
| `myOrders` | `Order[]` | Current user's orders |
| `cart` | `CartItem[]` | Cart items (persisted to `localStorage` under `mehndi_cart`) |
| `loading` | `boolean` | Loading state |

| Method | Description |
|---|---|
| `loadProducts()` | Fetch active products |
| `loadAllOrders()` | Admin: fetch all orders with `order_items` |
| `addToCart(product, quantity)` | Add or increment a cart item |
| `updateCartItem(productId, quantity)` | Update quantity; removes item if quantity ≤ 0 |
| `removeFromCart(productId)` | Remove a cart item |
| `clearCart()` | Empty the cart |
| `getCartTotal()` | Return sum of `price × quantity` for all items |
| `placeOrder(params)` | Insert order + order_item rows, then clear cart |
| `loadMyOrders()` | Fetch the current user's orders |
| `updateOrderStatus(orderId, status)` | Update `order_status` |

---

### NotificationService

In-app notifications with Supabase Realtime.

| Signal | Type | Description |
|---|---|---|
| `notifications` | `Notification[]` | Latest 50 notifications (newest first) |
| `unreadCount` | `number` | Count of unread notifications |

| Method | Description |
|---|---|
| `load()` | Fetch user's notifications from DB |
| `markRead(id)` | Mark one notification as read |
| `markAllRead()` | Mark all user notifications as read |
| `subscribeToRealtime(userId)` | Listen for INSERT events on the `notifications` table |

---

### SettingsService

Application-wide configuration and CMS content blocks.

| Signal | Type | Description |
|---|---|---|
| `banking` | `BankingSettings \| null` | Bank account details for payment methods |
| `business` | `BusinessSettings` | Business rules (charges, percentages, minimums) |
| `contentBlocks` | `ContentBlock[]` | CMS content entries keyed by slug |

**BusinessSettings defaults:**

| Key | Default | Description |
|---|---|---|
| `advancePercentage` | 50 | % of total required as advance payment |
| `homeServiceCharge` | 2500 | Home visit surcharge (PKR) |
| `karachiDeliveryCharge` | 300 | Store delivery within Karachi (PKR) |
| `otherCitiesDeliveryCharge` | 600 | Store delivery outside Karachi (PKR) |
| `minRegularCones` | 4 | Minimum quantity for regular cone purchase |

| Method | Description |
|---|---|
| `loadAll()` | Fetch `banking` and `business` settings rows + active content blocks |
| `getContentBlock(slug)` | Find a content block by its slug |
| `updateSetting(key, value)` | Upsert a setting row |
| `updateContentBlock(slug, updates)` | Update a CMS content block |

---

### AnalyticsService

Calls Supabase RPC functions for admin analytics. All methods accept an `AnalyticsFilter` (`{ dateFrom, dateTo }`).

| Method | Returns |
|---|---|
| `getRevenueSummary()` | `{ total_revenue, verified_payments, outstanding, avg_booking_value }` |
| `getMonthlyRevenue()` | `{ month, revenue }[]` |
| `getRevenueByArtist()` | `{ artist_name, revenue }[]` |
| `getRevenueByPackage()` | `{ package_name, revenue }[]` |
| `getBookingMetrics()` | `{ total_bookings, completed, pending, … }` |
| `getBookingsByStatus()` | `{ status, count }[]` |
| `getCustomerMetrics()` | `{ new_customers, repeat_customers, … }` |
| `getArtistPerformance()` | `{ artist_name, total_bookings, completed_bookings, total_revenue, completion_rate }[]` |
| `getPeakDays()` | `{ date, booking_count }[]` |

---

### ThemeService

Dark/light mode with localStorage persistence.

| Signal | Type | Description |
|---|---|---|
| `isDark` | `boolean` | Current theme state |

| Method | Description |
|---|---|
| `toggle()` | Toggle between dark and light |
| `setDark(value, persist?)` | Set theme explicitly; optionally persist to localStorage |

On construction: reads from localStorage, or falls back to the OS `prefers-color-scheme` preference.

---

### SnackbarService

Wrapper for Angular Material's `MatSnackBar`.

| Method | Default duration | Description |
|---|---|---|
| `success(message, duration?)` | 3 s | Green snackbar |
| `error(message, duration?)` | 5 s | Red snackbar |
| `info(message, duration?)` | 3 s | Neutral snackbar |

---

## Features

### Public Pages (`/features/public/`)

| Component | Route | Description |
|---|---|---|
| `HomeComponent` | `/` | Landing page with hero, CTAs, and featured content |
| `ArtistsComponent` | `/artists` | Browse and filter all active artists |
| `ArtistDetailComponent` | `/artists/:id` | Artist bio, packages, and gallery |
| `PackagesComponent` | `/packages` | Showcase all service packages with pricing |

---

### Auth (`/features/auth/`)

| Component | Route | Description |
|---|---|---|
| `LoginComponent` | `/auth/login` | Email + password login |
| `RegisterComponent` | `/auth/register` | New client registration (name, phone, email, password) |

---

### Booking (`/features/booking/`)

**`BookingWizardComponent`** — 5-step Material Stepper.

| Step | Component | Purpose |
|---|---|---|
| 1 | `Step1ArtistComponent` | Choose artist and package |
| 2 | `Step2DatetimeComponent` | Pick appointment date and time slot |
| 3 | `Step3AddonsComponent` | Select optional add-ons |
| 4 | `Step4DetailsComponent` | Enter contact info and service address |
| 5 | `Step5ReviewComponent` | Review total, accept terms, submit |

Wizard state is managed by `BookingWizardService` which persists form data across steps.

| Component | Route | Description |
|---|---|---|
| `BookingSuccessComponent` | `/booking/success/:id` | Confirmation page after booking created |
| `BookingTrackerComponent` | `/booking/track/:id` | Public tracker (no auth required) showing booking status and timeline |

---

### Client Portal (`/features/client/`)

| Component | Route | Description |
|---|---|---|
| `ClientDashboardComponent` | `/client/dashboard` | User overview with upcoming bookings and quick actions |
| `MyBookingsComponent` | `/client/bookings` | List of user's bookings |
| `BookingDetailComponent` | `/client/bookings/:id` | Booking detail with payment submission dialog |
| `MyOrdersComponent` | `/client/orders` | List of user's store orders |

`BookingDetailComponent` embeds **`PaymentFormDialogComponent`** which lets clients submit advance or balance payments with an optional receipt upload.

---

### Cone Store (`/features/store/`)

| Component | Route | Description |
|---|---|---|
| `ConeStoreComponent` | `/store` | Browse regular and organic henna cones, add to cart |
| `CheckoutComponent` | `/store/checkout` | Review cart, enter shipping address, select payment method |
| `OrderConfirmComponent` | `/store/order-confirm/:id` | Order confirmation with order number and details |

---

### Admin Panel (`/features/admin/`)

| Component | Route | Description |
|---|---|---|
| `AdminDashboardComponent` | `/admin/dashboard` | KPI cards + recent bookings + revenue summary |
| `AdminBookingsComponent` | `/admin/bookings` | All bookings with status/artist/date filters |
| `AdminBookingDetailComponent` | `/admin/bookings/:id` | Full booking detail, payment history, status transitions |
| `AdminArtistsComponent` | `/admin/artists` | CRUD for artists; open `ArtistFormDialogComponent` and `ArtistPackagesDialogComponent` |
| `AdminPackagesComponent` | `/admin/packages` | CRUD for packages and add-ons |
| `AdminPaymentsComponent` | `/admin/payments` | View, verify, or reject payment submissions |
| `AdminAnalyticsComponent` | `/admin/analytics` | Revenue and booking charts powered by ECharts |
| `AdminStoreComponent` | `/admin/store` | Manage products, view and update store orders |
| `AdminSettingsComponent` | `/admin/settings` | Edit banking info, business rules, and CMS content blocks |

---

## Shared Library

Located in `src/app/shared/`.

### Components

| Component | Selector | Key Inputs / Outputs |
|---|---|---|
| `LoadingSpinnerComponent` | `<app-loading-spinner>` | `@Input() diameter = 40`, `@Input() message = ''` |
| `EmptyStateComponent` | `<app-empty-state>` | `@Input() icon`, `@Input() title`, `@Input() subtitle` |
| `StatusBadgeComponent` | `<app-status-badge>` | `@Input() status: string` |
| `FileUploadComponent` | `<app-file-upload>` | `@Input() label, hint, accept`; `@Output() fileSelected: EventEmitter<File>` |
| `ConfirmDialogComponent` | (dialog) | Data: `{ title, message, confirmText?, cancelText?, confirmColor? }` |

### Pipes

| Pipe | Usage | Example Output |
|---|---|---|
| `CurrencyPkPipe` | `{{ value \| currencyPk }}` | `Rs. 12,500` |
| `BookingStatusPipe` | `{{ status \| bookingStatus }}` | `'in_progress'` → `'In Progress'` |

---

## Database

### Enums

| Enum | Values |
|---|---|
| `user_role` | `admin`, `client` |
| `booking_status` | `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `rejected` |
| `payment_status` | `pending`, `verified`, `rejected`, `refunded` |
| `payment_method` | `meezan`, `hbl`, `easypaisa`, `jazzcash`, `cash` |
| `payment_type` | `advance`, `balance`, `full` |
| `order_status` | `pending`, `processing`, `shipped`, `delivered`, `cancelled` |
| `product_type` | `regular`, `organic` |

### Tables

| Table | Description |
|---|---|
| `profiles` | User accounts — extends `auth.users` with `full_name`, `phone`, `role` |
| `artists` | Artist records with `name`, `bio`, `photo_url`, `is_active` |
| `packages` | Service packages with `base_price`, `sort_order` |
| `artist_packages` | Many-to-many junction for artist ↔ package with optional `custom_price` |
| `addons` | Optional add-ons that can be selected during booking |
| `bookings` | Core booking record with amounts (`total_amount`, `advance_amount`, `paid_amount`, `remaining_amount`), location, and status |
| `booking_addons` | Junction table for bookings ↔ add-ons |
| `booking_status_history` | Audit log of every booking status change |
| `payments` | Payment submissions with receipt URL, verification info |
| `products` | Henna cone products with `type`, `price`, `min_quantity` |
| `orders` | Store orders with shipping and payment info |
| `order_items` | Line items for each order |
| `notifications` | In-app notifications with `type`, `is_read`, `data` (JSONB) |
| `settings` | Key-value store for app configuration |
| `content_blocks` | CMS entries keyed by `slug` |
| `audit_logs` | General-purpose audit trail |

### Auto-generated Numbers

- `booking_number` — Starts at `BK-1000`, incremented by sequence.
- `order_number` — Starts at `ORD-1000`, incremented by sequence.

### RPC Functions

Defined in `001_schema.sql` and `007_artist_performance.sql`. All accept `date_from` and `date_to` parameters.

| Function | Description |
|---|---|
| `get_revenue_summary` | Aggregate revenue totals and averages |
| `get_monthly_revenue` | Revenue grouped by month |
| `get_revenue_by_artist` | Revenue per artist |
| `get_revenue_by_package` | Revenue per package |
| `get_booking_metrics` | Counts by status and totals |
| `get_bookings_by_status` | Booking count per status |
| `get_customer_metrics` | New vs. repeat customer counts |
| `get_peak_days` | Days with the highest booking volume |
| `get_artist_performance` | Per-artist bookings, revenue, and completion rate |

### Storage Buckets

| Bucket | Access | Used for |
|---|---|---|
| `artist-photos` | Public | Artist profile images |
| `payment-receipts` | Private (signed URLs, 7-day TTL) | Client payment receipt uploads |

### Row-Level Security

RLS policies are defined in `002_rls.sql` and disabled by `004_remove_rls.sql`. The app currently relies on application-level filtering. Execute permissions for all RPC functions are granted in `006_grant_execute.sql` to both `authenticated` and `anon` roles.

---

## Styling System

Two CSS entry points are declared in `angular.json`:

1. **`src/tailwind.css`** — Tailwind v4 `@import` with a custom `dark` variant keyed on the `.dark-theme` class applied to `document.body`.
2. **`src/styles.scss`** — Angular Material theme (`mat.$rose-palette`), global CSS custom properties, layout helpers, and status badge variants.

### Brand Tokens

| Variable | Value | Usage |
|---|---|---|
| `--brand-primary` | `#b5263a` | Primary buttons, accents |
| `--brand-primary-light` | (lighter tint) | Hover states |
| `--brand-secondary` | `#d4a017` | Gold accents, highlights |
| `--sidebar-width` | `260px` | Admin sidenav |
| `--header-height` | `64px` | Sticky top nav |

### Layout Helpers

| Class | Description |
|---|---|
| `.page-container` | Centered max-width container with horizontal padding |
| `.admin-page` | Standard admin page padding and layout |
| `.status-badge` | Base class for status chip variants |

### Dark Mode

The `ThemeService` toggles the `.dark-theme` class on `document.body`. Tailwind's `dark:` utilities and Angular Material's dark theme respond to this class.

---

## PWA

The app is configured as a Progressive Web App.

| File | Purpose |
|---|---|
| `public/manifest.webmanifest` | App name, theme color (`#e11d48`), icons |
| `ngsw-config.json` | Angular Service Worker caching strategy |
| `public/favicon.svg` | Mehndi mandala icon (brand colors) |
| `public/icon-*.png` | PWA icons from 72×72 to 512×512 (maskable) |

The service worker is registered automatically by `@angular/service-worker` in production builds.
