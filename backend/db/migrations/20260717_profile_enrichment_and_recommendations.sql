begin;

alter table public.match_profiles add column if not exists avatar_url text;
alter table public.match_profiles add column if not exists open_to text[] not null default '{}';

create table if not exists public.canonical_tags (
  id text primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  label text not null check (char_length(label) between 1 and 80),
  category text not null check (category in ('academic','hobby','community','social','topic')),
  active boolean not null default true,
  created_by text not null default 'seed' check (created_by in ('seed','deepseek','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.tag_aliases (
  alias text primary key,
  tag_id text not null references public.canonical_tags(id) on delete cascade
);

create table if not exists public.profile_tags (
  user_id uuid not null references public.match_profiles(id) on delete cascade,
  tag_id text not null references public.canonical_tags(id) on delete cascade,
  source text not null check (source in ('explicit','deterministic','alias','deepseek','deepseek-created')),
  confidence numeric(4,3) not null default 1 check (confidence between 0 and 1),
  confirmed boolean not null default false,
  content_hash text,
  created_at timestamptz not null default now(),
  primary key (user_id, tag_id)
);

create table if not exists public.profile_tag_suppressions (
  user_id uuid not null references public.match_profiles(id) on delete cascade,
  tag_id text not null references public.canonical_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tag_id)
);

create table if not exists public.profile_enrichment_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.match_profiles(id) on delete cascade,
  content_hash text not null,
  profile_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','complete','failed','stale')),
  attempts integer not null default 0 check (attempts between 0 and 4),
  next_attempt_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, content_hash)
);

create table if not exists public.recommendation_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('impression','profile_open','dwell','skip','request','accept','reciprocal_action')),
  user_id uuid not null references public.match_profiles(id) on delete cascade,
  candidate_id uuid not null references public.match_profiles(id) on delete cascade,
  request_id uuid not null,
  match_version text not null,
  dwell_seconds integer check (event_type <> 'dwell' or dwell_seconds >= 8),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists canonical_tags_active_category_idx on public.canonical_tags(active, category);
create index if not exists profile_tags_tag_user_idx on public.profile_tags(tag_id, user_id);
create index if not exists enrichment_jobs_due_idx on public.profile_enrichment_jobs(status, next_attempt_at);
create index if not exists recommendation_events_user_time_idx on public.recommendation_events(user_id, occurred_at desc);
create index if not exists recommendation_events_candidate_time_idx on public.recommendation_events(candidate_id, occurred_at desc);

alter table public.canonical_tags enable row level security;
alter table public.tag_aliases enable row level security;
alter table public.profile_tags enable row level security;
alter table public.profile_tag_suppressions enable row level security;
alter table public.profile_enrichment_jobs enable row level security;
alter table public.recommendation_events enable row level security;

with seed(category, slugs) as (values
  ('academic', array['computer-science','engineering','design','business','biology','chemistry','physics','mathematics','psychology','sociology','history','literature','economics','political-science','environmental-science','data-science','artificial-intelligence','robotics','cybersecurity','entrepreneurship']),
  ('hobby', array['gaming','board-games','chess','reading','writing','photography','filmmaking','painting','drawing','pottery','knitting','cooking','baking','coffee','tea','gardening','hiking','camping','cycling','running','swimming','climbing','yoga','dance','theater','music','guitar','piano','singing','podcasts']),
  ('community', array['volunteering','mentoring','student-government','cultural-clubs','faith-community','lgbtq-community','international-students','first-generation-students','accessibility','sustainability','social-impact','campus-events','study-groups','hackathons','career-networking','language-exchange','book-club','debate','public-speaking','peer-support']),
  ('social', array['study-buddy','project-partner','new-friends','casual-hangout','coffee-chat','meal-buddy','workout-partner','gaming-group','creative-collaboration','professional-networking','accountability-partner','campus-exploration','event-companion','language-practice','outdoor-adventures','quiet-company','group-study','research-collaboration','startup-team','music-jam']),
  ('topic', array['web-development','mobile-development','product-design','user-research','machine-learning','cloud-computing','open-source','fintech','health-tech','climate-tech','space','astronomy','neuroscience','philosophy','ethics','education','journalism','fashion','architecture','urban-planning','sports','basketball','soccer','tennis','baseball','formula-one','anime','comics','science-fiction','fantasy'])
), expanded as (
  select category, unnest(slugs) slug from seed
)
insert into public.canonical_tags(id, slug, label, category, created_by)
select slug, slug, initcap(replace(slug, '-', ' ')), category, 'seed' from expanded
on conflict (id) do nothing;

insert into public.tag_aliases(alias, tag_id) values
  ('ai','artificial-intelligence'), ('ml','machine-learning'), ('cs','computer-science'),
  ('video-games','gaming'), ('videogames','gaming'), ('ux','user-research'), ('ui','product-design')
on conflict (alias) do nothing;

create or replace function public.create_guarded_canonical_tags(proposals jsonb)
returns setof public.canonical_tags
language plpgsql
security definer
set search_path = public
as $$
declare proposal jsonb;
declare inserted public.canonical_tags;
declare created_count integer := 0;
begin
  perform pg_advisory_xact_lock(hashtext('canonical-tag-registry'));
  if jsonb_typeof(proposals) <> 'array' or jsonb_array_length(proposals) > 3 then
    raise exception 'between 1 and 3 canonical tag proposals are required';
  end if;
  for proposal in select value from jsonb_array_elements(proposals)
  loop
    exit when created_count >= 3;
    if (select count(*) from public.canonical_tags) >= 5000 then
      raise exception 'canonical tag registry limit reached';
    end if;
    if exists(select 1 from public.tag_aliases where alias = proposal->>'slug') then
      continue;
    end if;
    insert into public.canonical_tags(id, slug, label, category, created_by)
    values(proposal->>'slug', proposal->>'slug', proposal->>'label', proposal->>'category', 'deepseek')
    on conflict do nothing returning * into inserted;
    if inserted.id is not null then
      created_count := created_count + 1;
      return next inserted;
    end if;
    inserted := null;
  end loop;
end;
$$;

revoke all on function public.create_guarded_canonical_tags(jsonb) from public, anon, authenticated;
grant execute on function public.create_guarded_canonical_tags(jsonb) to service_role;

commit;
