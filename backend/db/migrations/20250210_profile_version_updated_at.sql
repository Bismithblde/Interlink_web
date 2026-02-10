-- Ensure updated_at is refreshed on row update for profile versioning.
-- Used by compatibility cache to decide when to recompute top-k matches.

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists match_profiles_updated_at on public.match_profiles;
create trigger match_profiles_updated_at
  before update on public.match_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists availability_slots_updated_at on public.availability_slots;
create trigger availability_slots_updated_at
  before update on public.availability_slots
  for each row execute function public.set_updated_at();

comment on function public.set_updated_at is 'Sets updated_at to now() for profile/schedule versioning.';
