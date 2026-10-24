create table draws (
  id uuid primary key default gen_random_uuid(),
  title text not null check (btrim(title) <> ''),
  source_type text not null check (source_type in ('challenge_completed', 'event_checked_in', 'manual')),
  source_id uuid,
  status text not null default 'draft' check (status in ('draft', 'live', 'done', 'cancelled')),
  -- sha256 của seed, công bố khi chốt danh sách; seed thật nằm ở draw_secrets cho tới khi quay xong
  seed_commit text,
  seed_reveal text,
  cancel_reason text,
  created_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index draws_status_idx on draws (status, created_at desc);

create table draw_secrets (
  draw_id uuid primary key references draws (id) on delete cascade,
  seed text not null
);

create table draw_prizes (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references draws (id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  quantity int not null check (quantity > 0),
  sort int not null default 0
);

create index draw_prizes_draw_idx on draw_prizes (draw_id, sort);

-- Danh sách chốt trước khi quay, không đổi trong lúc quay
create table draw_participants (
  draw_id uuid not null references draws (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  weight int not null default 1 check (weight > 0),
  primary key (draw_id, member_id)
);

create table draw_results (
  draw_id uuid not null references draws (id) on delete cascade,
  draw_order int not null check (draw_order > 0),
  prize_id uuid not null references draw_prizes (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  drawn_at timestamptz not null default now(),
  -- Mọi máy dừng hiệu ứng đúng lúc này nên các máy dừng cùng một tên
  reveal_at timestamptz not null,
  primary key (draw_id, draw_order)
);

alter table draws enable row level security;
alter table draw_secrets enable row level security;
alter table draw_prizes enable row level security;
alter table draw_participants enable row level security;
alter table draw_results enable row level security;

-- Ghi mọi bảng quay số chỉ qua service role trong server action của BCN; draw_secrets không có policy nào.
create policy draws_select on draws
  for select to authenticated using (is_bcn() or (is_active_member() and status <> 'draft'));

create function can_view_draw(p_draw_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from draws
    where id = p_draw_id and (is_bcn() or (is_active_member() and status <> 'draft'))
  );
$$;

create policy draw_prizes_select on draw_prizes
  for select to authenticated using (can_view_draw(draw_id));
create policy draw_participants_select on draw_participants
  for select to authenticated using (can_view_draw(draw_id));
create policy draw_results_select on draw_results
  for select to authenticated using (can_view_draw(draw_id));

alter table rewards drop constraint rewards_source_type_check;
alter table rewards
  add constraint rewards_source_type_check check (source_type in ('challenge', 'event', 'manual', 'draw'));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table draw_results;
    alter publication supabase_realtime add table draws;
  end if;
end;
$$;
