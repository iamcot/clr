-- Năm sinh chỉ lộ cho người có kết quả giải đã xác minh, để xếp kỷ lục theo nhóm tuổi.
create view record_member_info as
  select m.id, m.birth_year
  from members m
  where m.status = 'active'
    and exists (select 1 from race_results r where r.member_id = m.id and r.verified_at is not null);

revoke all on record_member_info from anon;
grant select on record_member_info to authenticated;
