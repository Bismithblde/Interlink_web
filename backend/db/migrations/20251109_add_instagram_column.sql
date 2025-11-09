alter table if exists public.match_profiles
  add column if not exists instagram text;

comment on column public.match_profiles.instagram is 'Normalized Instagram handle (without @).';

