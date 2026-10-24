create table event_photo_tags (
  photo_id uuid not null references event_photos (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  tagged_by uuid references members (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (photo_id, member_id)
);

create index event_photo_tags_member_idx on event_photo_tags (member_id);

alter table event_photo_tags enable row level security;

create function photo_uploaded_by_me(p_photo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from event_photos where id = p_photo_id and uploaded_by = auth.uid());
$$;

-- Thấy thẻ tên của ảnh mà mình xem được (event_photos đã lọc ảnh ẩn bằng RLS của nó)
create policy event_photo_tags_select on event_photo_tags
  for select to authenticated
  using (exists (select 1 from event_photos where event_photos.id = photo_id));

-- Tự gắn mình, hoặc người upload gắn người khác
create policy event_photo_tags_insert on event_photo_tags
  for insert to authenticated
  with check (
    is_active_member()
    and (member_id = (select auth.uid()) or photo_uploaded_by_me(photo_id))
    and exists (select 1 from event_photos where event_photos.id = photo_id)
  );

create policy event_photo_tags_delete on event_photo_tags
  for delete to authenticated
  using (member_id = (select auth.uid()) or photo_uploaded_by_me(photo_id) or is_bcn());
