-- Gỡ toàn bộ dữ liệu giả của seed_demo.sql (thành viên giả kéo theo hoạt động, kết quả giải, danh hiệu... qua cascade).
delete from challenges where id = '00000000-0000-4000-b000-000000000001';
delete from races where id in (
  '00000000-0000-4000-9000-000000000001',
  '00000000-0000-4000-9000-000000000002',
  '00000000-0000-4000-9000-000000000003'
);
delete from posts where source_key like 'club-record:00000000-0000-4000-a000-%';
delete from auth.users where email like 'demo+%@clr.local';
