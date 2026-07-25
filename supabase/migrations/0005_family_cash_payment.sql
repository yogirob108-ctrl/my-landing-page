-- Track cash delivered directly to the host family separately from the agreed cash amount.
-- The RPC locks the booking row and writes the booking timeline in the same transaction.

alter table public.bookings
  add column if not exists family_cash_paid_usd integer not null default 0
    check (family_cash_paid_usd >= 0),
  add column if not exists family_cash_paid_at timestamptz;

create or replace function public.set_family_cash_payment(
  p_public_reference text,
  p_mark_paid boolean
)
returns table (
  family_cash_due_usd integer,
  family_cash_paid_usd integer,
  family_cash_paid_at timestamptz
)
language plpgsql
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_previous_paid integer;
  v_new_paid integer;
  v_delivered_now integer;
begin
  if p_mark_paid is null then
    raise exception 'p_mark_paid must be true or false' using errcode = '22004';
  end if;

  select *
  into v_booking
  from public.bookings
  where public_reference = p_public_reference
  for update;

  if not found then
    raise exception 'Booking % not found', p_public_reference using errcode = 'P0002';
  end if;

  v_previous_paid := greatest(0, coalesce(v_booking.family_cash_paid_usd, 0));

  if p_mark_paid and greatest(0, coalesce(v_booking.family_cash_due_usd, 0)) = 0 then
    raise exception 'No family cash is currently due for booking %', p_public_reference using errcode = '22023';
  end if;

  if p_mark_paid and v_previous_paid > greatest(0, coalesce(v_booking.family_cash_due_usd, 0)) then
    raise exception 'Recorded family cash exceeds the current agreed amount for booking %; undo or correct the agreed amount first', p_public_reference using errcode = '22023';
  end if;

  v_new_paid := case when p_mark_paid then greatest(0, coalesce(v_booking.family_cash_due_usd, 0)) else 0 end;
  v_delivered_now := greatest(0, v_new_paid - v_previous_paid);

  if (p_mark_paid and v_previous_paid = v_new_paid)
    or (not p_mark_paid and v_previous_paid = 0 and v_booking.family_cash_paid_at is null) then
    return query select v_booking.family_cash_due_usd, v_previous_paid, v_booking.family_cash_paid_at;
    return;
  end if;

  update public.bookings as b
  set
    family_cash_paid_usd = v_new_paid,
    family_cash_paid_at = case when p_mark_paid then now() else null end,
    updated_at = now()
  where b.id = v_booking.id
  returning b.family_cash_due_usd, b.family_cash_paid_usd, b.family_cash_paid_at
  into family_cash_due_usd, family_cash_paid_usd, family_cash_paid_at;

  insert into public.booking_events (
    booking_id,
    event_type,
    direction,
    title,
    body,
    created_by
  ) values (
    v_booking.id,
    'payment',
    'internal',
    case when p_mark_paid then 'Family cash marked paid' else 'Family cash payment undone' end,
    case
      when p_mark_paid then format(
        '$%s additional cash recorded as delivered directly to the family ($%s total of $%s agreed).',
        v_delivered_now,
        v_new_paid,
        greatest(0, coalesce(v_booking.family_cash_due_usd, 0))
      )
      else format('$%s cash payment cleared. Agreed cash amount remains $%s.', v_previous_paid, v_booking.family_cash_due_usd)
    end,
    'ops-pin-user'
  );

  return next;
end;
$$;

revoke all on function public.set_family_cash_payment(text, boolean) from public;
revoke all on function public.set_family_cash_payment(text, boolean) from anon;
revoke all on function public.set_family_cash_payment(text, boolean) from authenticated;
grant execute on function public.set_family_cash_payment(text, boolean) to service_role;
