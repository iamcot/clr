-- Khách và người chưa được duyệt chỉ thấy tên đã che chữ cuối và không thấy ảnh đại diện.
-- Che ngay trong DB để không ai lấy được tên đầy đủ bằng anon key.

-- 'Trương Công Thắng' -> 'Trương Công T*', 'SO D.K' -> 'SO D*'
create function mask_member_name(p_name text)
returns text
language sql
immutable
as $$
  select case
    when p_name is null or btrim(p_name) = '' then p_name
    else regexp_replace(btrim(p_name), '(\S)\S*$', '\1*')
  end;
$$;

-- Thay quyền đọc trực tiếp members_public của anon (0018) bằng view đã che
revoke select (id, display_name, avatar_url, member_type, joined_at) on members_public from anon;

create view members_masked as
  select id, mask_member_name(display_name) as display_name, null::text as avatar_url, member_type, joined_at
  from members
  where status = 'active';

grant select on members_masked to anon, authenticated;

create or replace view club_rankings_levels as
  select m.id as member_id, mask_member_name(m.display_name) as display_name, null::text as avatar_url,
    m.member_type, m.gender, m.level, m.club_points
  from members m
  where m.status = 'active'
    and m.share_stats_with_club
    and exists (select 1 from settings where key = 'club_display_mode' and value = '"full_opt_in"'::jsonb);
