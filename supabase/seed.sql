insert into settings (key, value) values
  ('club_name', '"CLR"'),
  ('club_display_mode', '"self_only"')
on conflict (key) do nothing;
