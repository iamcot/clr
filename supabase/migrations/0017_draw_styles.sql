alter table draws add column style text not null default 'reel' check (style in ('reel', 'race', 'duck'));

-- Người xem mở được trang quay số ngay khi BCN đã chốt danh sách (để thấy "Chờ BCN mở quay số")
create or replace function can_view_draw(p_draw_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from draws
    where id = p_draw_id
      and (is_bcn() or (is_active_member() and (status <> 'draft' or seed_commit is not null)))
  );
$$;

drop policy draws_select on draws;
create policy draws_select on draws
  for select to authenticated
  using (is_bcn() or (is_active_member() and (status <> 'draft' or seed_commit is not null)));

-- Người trúng chỉ đọc được từ reveal_at; trước đó chỉ server (service role) biết và trả về ở những giây cuối
drop policy draw_results_select on draw_results;
create policy draw_results_select on draw_results
  for select to authenticated using (can_view_draw(draw_id) and reveal_at <= now());
