-- Friend connections schema additions
create extension if not exists "pgcrypto";

create table if not exists friend_requests (
    id uuid primary key default gen_random_uuid(),
    requester_id uuid not null references auth.users (id) on delete cascade,
    recipient_id uuid not null references auth.users (id) on delete cascade,
    status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
    message text,
    created_at timestamptz not null default now(),
    responded_at timestamptz,
    constraint friend_requests_unique_pair unique (requester_id, recipient_id),
    constraint friend_requests_no_self check (requester_id <> recipient_id)
);

create index if not exists idx_friend_requests_recipient_status
    on friend_requests (recipient_id, status);

create index if not exists idx_friend_requests_requester_status
    on friend_requests (requester_id, status);

create table if not exists friendships (
    user_id uuid not null references auth.users (id) on delete cascade,
    friend_id uuid not null references auth.users (id) on delete cascade,
    created_at timestamptz not null default now(),
    request_id uuid references friend_requests (id) on delete set null,
    primary key (user_id, friend_id),
    constraint friendships_no_self check (user_id <> friend_id)
);

create index if not exists idx_friendships_friend on friendships (friend_id);



