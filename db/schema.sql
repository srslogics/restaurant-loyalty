create table if not exists venues (
  slug text primary key,
  name text not null,
  tagline text not null default '',
  table_prefix text not null default 'T',
  default_table_count integer not null default 12,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists feedback_responses (
  id bigserial primary key,
  reference_id text not null unique,
  venue_slug text not null references venues(slug) on update cascade,
  venue_name text not null,
  table_code text not null,
  overall_score smallint not null check (overall_score between 1 and 5),
  visit_type text not null default 'Not specified',
  food_score smallint check (food_score between 0 and 5),
  service_score smallint check (service_score between 0 and 5),
  ambience_score smallint check (ambience_score between 0 and 5),
  cleanliness_score smallint check (cleanliness_score between 0 and 5),
  highlights text[] not null default '{}',
  comments text not null default '',
  guest_name text not null default '',
  guest_phone text not null default '',
  source text not null default 'qr',
  created_at timestamptz not null default now()
);

create index if not exists feedback_responses_venue_slug_idx on feedback_responses (venue_slug);
create index if not exists feedback_responses_created_at_idx on feedback_responses (created_at desc);
create index if not exists feedback_responses_score_idx on feedback_responses (overall_score);
