-- Run only when connecting an existing installation. Does not alter requests.
insert into public.providers(id,name,transport_mode) values
 ('00000000-0000-4000-8000-000000000004','Demo City Hatchback 01','Taxi'),
 ('00000000-0000-4000-8000-000000000005','Demo Local SUV 01','Taxi')
on conflict (id) do nothing;
