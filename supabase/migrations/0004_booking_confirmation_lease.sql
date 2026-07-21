-- Coordinate payment-confirmation sends with operator cancellation.
-- The webhook holds this short lease while external confirmation emails are in flight;
-- cancellation must atomically win before the lease or wait until it is released/expired.
alter table bookings
  add column if not exists payment_confirmation_token text,
  add column if not exists payment_confirmation_claimed_at timestamptz;

comment on column bookings.payment_confirmation_token is
  'Short-lived webhook lease coordinating payment confirmation emails with cancellation.';
comment on column bookings.payment_confirmation_claimed_at is
  'Timestamp used to expire a crashed payment-confirmation email lease.';
