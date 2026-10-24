-- Bảng xếp hạng hiện đủ cho khách và người chưa được duyệt, chỉ che tên và bỏ ảnh đại diện (km vẫn hiện)
create view club_rankings_masked as
  select m.id as member_id, mask_member_name(m.display_name) as display_name, null::text as avatar_url,
    m.member_type, m.gender, m.level, m.club_points,
    coalesce(month_stats.distance_m, 0) as month_distance_m,
    coalesce(year_stats.distance_m, 0) as year_distance_m
  from members m
  left join member_stats_period month_stats
    on month_stats.member_id = m.id and month_stats.period_type = 'month'
    and month_stats.period_start = date_trunc('month', now() at time zone 'Asia/Ho_Chi_Minh')::date
  left join member_stats_period year_stats
    on year_stats.member_id = m.id and year_stats.period_type = 'year'
    and year_stats.period_start = date_trunc('year', now() at time zone 'Asia/Ho_Chi_Minh')::date
  where m.status = 'active'
    and m.share_stats_with_club
    and exists (select 1 from settings where key = 'club_display_mode' and value = '"full_opt_in"'::jsonb);

grant select on club_rankings_masked to anon, authenticated;
