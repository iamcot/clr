-- Bảng vàng và quay số là nơi vinh danh thành viên nên khách và người chưa được duyệt xem được, hiện tên và ảnh thật.
-- Danh sách người tham gia vẫn do giao diện ẩn với người chưa được duyệt.

-- Danh hiệu đã duyệt
create policy honors_select_public on honors
  for select to anon, authenticated using (approved);

-- Tên và ảnh của người có danh hiệu đã duyệt hoặc kết quả giải đã xác minh
create view hall_of_fame_members as
  select m.id, m.display_name, m.avatar_url
  from members m
  where m.status = 'active'
    and (
      exists (select 1 from honors h where h.member_id = m.id and h.approved)
      or exists (select 1 from race_results r where r.member_id = m.id and r.verified_at is not null)
    );

-- Kết quả giải đã xác minh để xếp kỷ lục; chỉ lộ tuổi lúc chạy (để chia nhóm tuổi), không lộ năm sinh
create view hall_of_fame_records as
  select r.id, r.member_id, m.display_name, m.avatar_url, m.gender,
    case when m.birth_year is null then null else extract(year from races.race_date)::int - m.birth_year end as age_at_race,
    r.distance_m, r.chip_time_s, races.name as race_name, races.race_date
  from race_results r
  join members m on m.id = r.member_id
  join races on races.id = r.race_id
  where r.verified_at is not null and m.status = 'active';

grant select on hall_of_fame_members, hall_of_fame_records to anon, authenticated;

-- Quay số: ai cũng xem được đợt đã công khai (không còn nháp chưa chốt)
create or replace function can_view_draw(p_draw_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from draws
    where id = p_draw_id and (is_bcn() or status <> 'draft' or seed_commit is not null)
  );
$$;

drop policy draws_select on draws;
create policy draws_select on draws
  for select to anon, authenticated
  using (is_bcn() or status <> 'draft' or seed_commit is not null);

drop policy draw_prizes_select on draw_prizes;
create policy draw_prizes_select on draw_prizes
  for select to anon, authenticated using (can_view_draw(draw_id));
drop policy draw_participants_select on draw_participants;
create policy draw_participants_select on draw_participants
  for select to anon, authenticated using (can_view_draw(draw_id));
drop policy draw_results_select on draw_results;
create policy draw_results_select on draw_results
  for select to anon, authenticated using (can_view_draw(draw_id) and reveal_at <= now());

-- Tên người tham gia và người trúng của các đợt quay đã công khai
create view draw_members as
  select m.id, m.display_name
  from members m
  where exists (select 1 from draw_participants p where p.member_id = m.id and can_view_draw(p.draw_id))
     or exists (select 1 from draw_results r where r.member_id = m.id and can_view_draw(r.draw_id) and r.reveal_at <= now());

grant select on draw_members to anon, authenticated;
