-- Update 8 Lakes Tours current public/default pricing.
-- Historical booking rows are intentionally not rewritten; they may reflect the price
-- in effect when the guest submitted their booking.

alter table bookings
  alter column total_trip_value_usd set default 1999,
  alter column online_due_usd set default 999,
  alter column family_cash_due_usd set default 1000;

update tour_projects
set
  default_online_due_usd = 999,
  default_family_cash_due_usd = 1000,
  default_total_trip_value_usd = 1999,
  updated_at = now()
where slug = '8-lakes-tours';
