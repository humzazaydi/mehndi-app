# Supabase Setup

Run these files in the Supabase Dashboard SQL Editor in this order:

1. `migrations/001_schema.sql`
2. `migrations/002_rls.sql`
3. `migrations/003_storage.sql`
4. `seed.sql`

This creates:

- Auth-linked `profiles` with `admin` and `client` roles
- Artists, packages, artist-package availability, add-ons, and bookings
- Booking status history, payments, notifications, settings, content blocks, and audit logs
- Cone store products, orders, and order items
- Analytics RPC functions used by the admin dashboard
- Storage buckets for artist photos and payment receipts
- Seed data for packages, add-ons, products, settings, CMS blocks, artists, and artist/package availability

To make an admin account:

1. Register through the app at `/auth/register`.
2. Open `profiles` in Supabase Table Editor.
3. Change that user's `role` from `client` to `admin`.

Or run:

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = 'YOUR_AUTH_USER_ID';
```
