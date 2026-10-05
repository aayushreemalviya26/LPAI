-- Illustrative listings; existing requests remain unchanged.
insert into public.providers(id,name,transport_mode) values
 ('00000000-0000-4000-8000-000000000006','Demo Town Auto Connect','Auto'),
 ('00000000-0000-4000-8000-000000000007','Demo Green E-Rickshaw','Auto'),
 ('00000000-0000-4000-8000-000000000008','Demo Rupaidiha Bus Connect','Bus'),
 ('00000000-0000-4000-8000-000000000009','Demo Regional Bus Service','Bus'),
 ('00000000-0000-4000-8000-000000000010','Demo Local Mini Bus','Bus')
on conflict (id) do nothing;
