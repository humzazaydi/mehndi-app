-- ============================================================
-- Seed Data for Mehak's Studio
-- Run AFTER all migrations
-- ============================================================

-- ─── Packages ─────────────────────────────────────────────────
-- Artists
INSERT INTO artists (name, bio, photo_url, is_active) VALUES
  (
    'Mehak Nasir',
    'Lead bridal mehndi artist specializing in traditional, Arabic, and modern fusion designs.',
    NULL,
    TRUE
  ),
  (
    'Ayesha Khan',
    'Senior artist for elegant party, engagement, and customized henna looks.',
    NULL,
    TRUE
  ),
  (
    'Sana Ali',
    'Detail-focused artist for minimal, floral, and contemporary designs.',
    NULL,
    TRUE
  );

INSERT INTO packages (name, description, base_price, sort_order, notes, is_active) VALUES
  ('Package 1', 'Wrist Length',           14000, 1, 'Includes four-side hand henna', TRUE),
  ('Package 2', '1.5" Above Wrist Length', 16000, 2, 'Includes four-side hand henna', TRUE),
  ('Package 3', 'Mid Length',             19000, 3, 'Includes four-side hand henna', TRUE),
  ('Package 4', '3/4th Length',           23000, 4, 'Includes four-side hand henna', TRUE),
  ('Package 5', 'Till Elbow Length',      25000, 5, 'Includes four-side hand henna', TRUE);

-- ─── Add-ons ──────────────────────────────────────────────────
INSERT INTO addons (name, description, price, is_active) VALUES
  ('Logo',            'Custom logo/brand element in design', 1500, TRUE),
  ('Skyline',         'City skyline incorporated in design',  4000, TRUE),
  ('Portrait',        'Portrait artwork in design',           2000, TRUE),
  ('Custom Elements', 'Additional custom design elements',    2000, TRUE);

-- Artist/package availability
INSERT INTO artist_packages (artist_id, package_id, custom_price, is_available)
SELECT a.id, p.id, NULL, TRUE
FROM artists a
CROSS JOIN packages p
WHERE a.name IN ('Mehak Nasir', 'Ayesha Khan', 'Sana Ali')
  AND p.name IN ('Package 1', 'Package 2', 'Package 3', 'Package 4', 'Package 5')
ON CONFLICT (artist_id, package_id) DO NOTHING;

-- ─── Products (Cone Store) ────────────────────────────────────
INSERT INTO products (name, type, price, min_quantity, is_active, description) VALUES
  ('Regular Henna Cones',  'regular', 250,  4, TRUE, 'Premium regular henna cones. Minimum order 4 cones.'),
  ('Organic Henna Cones',  'organic', 750,  1, TRUE, '100% organic, chemical-free henna cones. Fixed price, no discounts.');

-- ─── Settings ─────────────────────────────────────────────────
INSERT INTO settings (key, value) VALUES
  ('banking', '{
    "meezan": {
      "accountTitle": "Mehak Nasir",
      "accountNumber": "0117-0105935685"
    },
    "hbl": {
      "accountTitle": "Mehak Nasir",
      "accountNumber": "54987000090999",
      "iban": "PK18HABB0054987000090999"
    },
    "easypaisa": "0318-2550929",
    "jazzcash": "0318-2550929"
  }'::jsonb),
  ('business', '{
    "advancePercentage": 50,
    "homeServiceCharge": 2500,
    "karachiDeliveryCharge": 300,
    "otherCitiesDeliveryCharge": 600,
    "minRegularCones": 4
  }'::jsonb);

-- ─── Content Blocks ───────────────────────────────────────────
INSERT INTO content_blocks (slug, title, content, is_active) VALUES
  (
    'important_notice',
    'Important Notice',
    'Please note the following before booking:
• Advance payment of 50% is required to confirm your booking.
• Home service charges of Rs. 2,500 apply for visits outside our studio.
• Organic cones are not included in the package price.
• Customization charges are separate and discussed prior to the appointment.
• Feet henna charges start from Rs. 2,000 depending on design.
• Please ensure your hands are clean and free of any oils or creams on the day of appointment.',
    TRUE
  ),
  (
    'terms_conditions',
    'Terms & Conditions',
    '1. Booking Confirmation: Your booking is only confirmed after admin approval and advance payment.

2. Cancellation Policy: Cancellations must be made at least 48 hours before the appointment. Advance payments are non-refundable for cancellations made within 48 hours.

3. Rescheduling: You may reschedule your appointment with 24 hours notice, subject to artist availability.

4. Payment: The remaining balance is due on the day of service completion. We accept Meezan Bank, HBL, EasyPaisa, and JazzCash transfers.

5. Design Customization: Any design changes from the agreed package must be discussed and priced before the appointment.

6. Allergies: Please inform us of any skin allergies before your appointment. We are not responsible for any allergic reactions if not disclosed.

7. Arrival: Please arrive on time. Late arrivals may result in shortened appointment time.',
    TRUE
  ),
  (
    'package_disclaimer',
    'Package Notes',
    '• All packages include four-side hand henna.
• Feet charges start from Rs. 2,000 depending on design and complexity.
• Customization charges are separate and will be quoted separately.
• Home service charge: Rs. 2,500 (applicable outside studio).
• Organic cones are NOT included — available at additional cost.
• Final pricing depends on design complexity and artist discretion.',
    TRUE
  );

-- ─── Sample Admin User Instructions ──────────────────────────
-- To create an admin user:
-- 1. Register a user through the app at /auth/register
-- 2. In Supabase Dashboard → Table Editor → profiles
-- 3. Find the user row and change role from 'client' to 'admin'
--
-- OR run this SQL (replace USER_ID with the actual auth user ID):
-- UPDATE profiles SET role = 'admin' WHERE id = 'USER_ID';
