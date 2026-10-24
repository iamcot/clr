create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references members (id) on delete set null,
  kind text not null default 'announcement' check (kind in ('announcement', 'result', 'event', 'system')),
  title text not null check (btrim(title) <> ''),
  body_md text not null default '',
  cover_url text,
  pinned boolean not null default false,
  pinned_until timestamptz,
  require_ack boolean not null default false,
  -- Khoá chống sinh trùng bài tự động, ví dụ 'challenge:<id>' hoặc 'level-digest:2026-10-26'
  source_key text unique,
  -- null là bản nháp; có giá trị trong tương lai là hẹn giờ đăng
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index posts_feed_idx on posts (published_at desc) where deleted_at is null;

create trigger posts_set_updated_at
  before update on posts
  for each row execute function set_updated_at();

create table post_reactions (
  post_id uuid not null references posts (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  emoji text not null check (emoji in ('like', 'fire', 'clap', 'heart')),
  created_at timestamptz not null default now(),
  primary key (post_id, member_id)
);

create table post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  parent_id uuid references post_comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index post_comments_post_idx on post_comments (post_id, created_at);

create table post_reads (
  post_id uuid not null references posts (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  read_at timestamptz not null default now(),
  acked_at timestamptz,
  primary key (post_id, member_id)
);

create table level_changes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  old_level int not null,
  new_level int not null,
  changed_at timestamptz not null default now()
);

create index level_changes_changed_idx on level_changes (changed_at desc);

alter table posts enable row level security;
alter table post_reactions enable row level security;
alter table post_comments enable row level security;
alter table post_reads enable row level security;
alter table level_changes enable row level security;

create function post_is_readable(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_bcn() or (
    is_active_member() and exists (
      select 1 from posts
      where id = p_post_id and deleted_at is null and published_at is not null and published_at <= now()
    )
  );
$$;

create policy posts_select on posts
  for select to authenticated
  using (
    is_bcn()
    or (is_active_member() and deleted_at is null and published_at is not null and published_at <= now())
  );
create policy posts_write_bcn on posts
  for all to authenticated using (is_bcn()) with check (is_bcn());

create policy post_reactions_select on post_reactions
  for select to authenticated using (post_is_readable(post_id));
create policy post_reactions_insert_own on post_reactions
  for insert to authenticated
  with check (member_id = (select auth.uid()) and post_is_readable(post_id));
create policy post_reactions_update_own on post_reactions
  for update to authenticated
  using (member_id = (select auth.uid()))
  with check (member_id = (select auth.uid()) and post_is_readable(post_id));
create policy post_reactions_delete_own on post_reactions
  for delete to authenticated using (member_id = (select auth.uid()));

create policy post_comments_select on post_comments
  for select to authenticated
  using (post_is_readable(post_id) and (deleted_at is null or is_bcn()));
create policy post_comments_insert_own on post_comments
  for insert to authenticated
  with check (
    member_id = (select auth.uid()) and is_active_member() and deleted_at is null and post_is_readable(post_id)
  );

create policy post_reads_select on post_reads
  for select to authenticated using (member_id = (select auth.uid()) or is_bcn());
create policy post_reads_insert_own on post_reads
  for insert to authenticated
  with check (member_id = (select auth.uid()) and post_is_readable(post_id));
create policy post_reads_update_own on post_reads
  for update to authenticated
  using (member_id = (select auth.uid()))
  with check (member_id = (select auth.uid()));

create policy level_changes_select_bcn on level_changes
  for select to authenticated using (is_bcn());

-- Bình luận trả lời chỉ một cấp và cùng bài với bình luận gốc
create function post_comments_check_parent()
returns trigger
language plpgsql
as $$
begin
  if new.parent_id is not null and not exists (
    select 1 from post_comments where id = new.parent_id and post_id = new.post_id and parent_id is null
  ) then
    raise exception 'Chỉ trả lời được bình luận gốc của cùng bài';
  end if;
  return new;
end;
$$;

create trigger post_comments_check_parent_trigger
  before insert on post_comments
  for each row execute function post_comments_check_parent();

-- Xoá mềm: chủ bình luận hoặc BCN
create function delete_post_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update post_comments
  set deleted_at = now()
  where deleted_at is null
    and (id = p_comment_id or parent_id = p_comment_id)
    and exists (
      select 1 from post_comments c where c.id = p_comment_id and (c.member_id = auth.uid() or is_bcn())
    );
  if is_bcn() then
    insert into audit_logs (actor_id, action, target_table, target_id, before, after)
    values (auth.uid(), 'hide_post_comment', 'post_comments', p_comment_id::text, null, null);
  end if;
end;
$$;

revoke execute on function delete_post_comment(uuid) from public, anon;
grant execute on function delete_post_comment(uuid) to authenticated;

-- Số bài chưa đọc trong 30 ngày gần nhất (người mới vào không bị badge dồn bài cũ)
create function unread_post_count()
returns int
language sql
stable
set search_path = public
as $$
  select count(*)::int
  from posts p
  where p.deleted_at is null
    and p.published_at is not null
    and p.published_at <= now()
    and p.published_at > now() - interval '30 days'
    and not exists (
      select 1 from post_reads r where r.post_id = p.id and r.member_id = auth.uid()
    );
$$;

revoke execute on function unread_post_count() from public, anon;
grant execute on function unread_post_count() to authenticated;

-- Ghi lại mỗi lần đổi level để làm bài tổng kết tuần
create function record_level_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.level is distinct from old.level then
    insert into level_changes (member_id, old_level, new_level) values (new.id, old.level, new.level);
  end if;
  return new;
end;
$$;

create trigger members_record_level_change
  after update of level on members
  for each row execute function record_level_change();

insert into settings (key, value) values ('auto_posts_publish', 'true'::jsonb) on conflict (key) do nothing;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table post_comments;
  end if;
end;
$$;
