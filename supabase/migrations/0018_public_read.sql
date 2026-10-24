-- Khách (chưa đăng nhập) và thành viên chưa được duyệt xem được phần công khai của CLB:
-- bài viết đã đăng, event và challenge đã công bố, danh bạ (tên, ảnh), bảng level.
-- Danh sách người tham gia, ảnh event, bình luận, km của từng người vẫn chỉ dành cho thành viên đã duyệt.

create policy posts_select_public on posts
  for select to anon, authenticated
  using (deleted_at is null and published_at is not null and published_at <= now());

create policy events_select_public on events
  for select to anon, authenticated
  using (status <> 'draft');

create policy challenges_select_public on challenges
  for select to anon, authenticated
  using (status <> 'draft');

create policy challenge_categories_select_public on challenge_categories
  for select to anon, authenticated
  using (
    exists (
      select 1 from challenges where challenges.id = challenge_categories.challenge_id and challenges.status <> 'draft'
    )
  );

-- Không mở cột gender cho khách
grant select (id, display_name, avatar_url, member_type, joined_at) on members_public to anon;

-- Bảng level không có cột km nên mở được cho khách; cùng điều kiện lọc với club_rankings
create view club_rankings_levels as
  select m.id as member_id, m.display_name, m.avatar_url, m.member_type, m.gender, m.level, m.club_points
  from members m
  where m.status = 'active'
    and m.share_stats_with_club
    and exists (select 1 from settings where key = 'club_display_mode' and value = '"full_opt_in"'::jsonb);

grant select on club_rankings_levels to anon, authenticated;
