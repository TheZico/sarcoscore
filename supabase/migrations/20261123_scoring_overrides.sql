-- Migration: Add scoring_overrides table for Admin-customizable symptom points and lab ranges
-- Defaults always come from src/data/model.json (never modified).
-- Only Admin can INSERT, UPDATE, or DELETE overrides via Row Level Security; other authenticated roles can only SELECT.

begin;

create table if not exists public.scoring_overrides (
  item_id text primary key,
  item_type text not null check (item_type in ('symptom', 'lab')),
  new_value jsonb not null,
  base_model_version text not null,
  override_version integer not null default 1 check (override_version >= 1),
  edited_by uuid references public.profiles(id) on delete set null,
  edited_by_email text not null,
  edited_at timestamptz not null default now()
);

-- Server-side validation trigger enforcing symptom points (-2..5 integer) and lab ranges (low < high, max_points >= 0 integer)
create or replace function public.validate_scoring_override()
returns trigger
language plpgsql
as $$
declare
  v_points numeric;
  v_low numeric;
  v_high numeric;
  v_max_points numeric;
begin
  if new.item_type = 'symptom' then
    if not (new.new_value ? 'points') then
      raise exception 'Symptom override must include integer "points".';
    end if;
    v_points := (new.new_value ->> 'points')::numeric;
    if v_points <> trunc(v_points) or v_points < -2 or v_points > 5 then
      raise exception 'Symptom points must be a whole number between -2 and 5.';
    end if;
  elsif new.item_type = 'lab' then
    if not (new.new_value ? 'low' and new.new_value ? 'high' and new.new_value ? 'max_points') then
      raise exception 'Lab override must include "low", "high", and "max_points".';
    end if;
    v_low := (new.new_value ->> 'low')::numeric;
    v_high := (new.new_value ->> 'high')::numeric;
    v_max_points := (new.new_value ->> 'max_points')::numeric;
    if v_low < 0 or v_low >= v_high then
      raise exception 'Normal low must be >= 0 and less than normal high.';
    end if;
    if v_max_points <> trunc(v_max_points) or v_max_points < 0 then
      raise exception 'Lab max points must be a whole number of 0 or more.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_scoring_override on public.scoring_overrides;
create trigger trg_validate_scoring_override
before insert or update on public.scoring_overrides
for each row execute function public.validate_scoring_override();

-- Row Level Security: authenticated users can SELECT; ONLY Admin can INSERT, UPDATE, or DELETE
alter table public.scoring_overrides enable row level security;

revoke all on public.scoring_overrides from anon;

drop policy if exists "scoring_overrides_read_authenticated" on public.scoring_overrides;
create policy "scoring_overrides_read_authenticated" on public.scoring_overrides
  for select to authenticated
  using (true);

drop policy if exists "scoring_overrides_admin_insert" on public.scoring_overrides;
create policy "scoring_overrides_admin_insert" on public.scoring_overrides
  for insert to authenticated
  with check (public.current_user_role() = 'admin');

drop policy if exists "scoring_overrides_admin_update" on public.scoring_overrides;
create policy "scoring_overrides_admin_update" on public.scoring_overrides
  for update to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists "scoring_overrides_admin_delete" on public.scoring_overrides;
create policy "scoring_overrides_admin_delete" on public.scoring_overrides
  for delete to authenticated
  using (public.current_user_role() = 'admin');

commit;
