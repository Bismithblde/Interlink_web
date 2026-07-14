alter table public.availability_slots
  add column if not exists color text;

comment on column public.availability_slots.color is
  'Calendar display color supplied by the schedule UI.';
