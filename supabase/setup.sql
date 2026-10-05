-- Dedicated demonstration project only. Open demo portals intentionally share synthetic records.
-- No names, phone numbers, payments, or operational data should be entered.
create table public.service_categories (id text primary key, name text not null, enabled boolean not null default false);
insert into public.service_categories values ('Transport','Transport',true),('Food','Food',false),('Stay','Stay',false),('Local Products','Local Products',false);
create table public.providers (
 id uuid primary key default gen_random_uuid(), name text not null check(name like 'Demo %'),
 service_category text not null references public.service_categories(id) default 'Transport',
 transport_mode text not null, verification_status text not null default 'Verified for prototype',
 availability boolean not null default true, is_demo boolean not null default true check(is_demo=true)
);
create table public.requests (
 id uuid primary key default gen_random_uuid(), service_category text not null default 'Transport' references public.service_categories(id) check(service_category='Transport'),
 destination text not null check(length(trim(destination)) between 1 and 100), passenger_count integer not null check(passenger_count between 1 and 20),
 preferred_mode text not null check(preferred_mode in ('Taxi','Auto','Bus')),requested_for text not null check(length(requested_for) between 1 and 80),
 note text not null default '' check(length(note)<=300), provider_id uuid not null references public.providers(id),
 status text not null default 'Requested' check(status in ('Requested','Accepted','Fulfilled','Declined')),
 created_at timestamptz not null default now(),completed_at timestamptz,
 check((status='Fulfilled')=(completed_at is not null))
);
create table public.feedback (
 id uuid primary key default gen_random_uuid(),request_id uuid not null unique references public.requests(id),
 fulfilled boolean not null,comment text not null default '' check(length(comment)<=300),created_at timestamptz not null default now()
);
insert into public.providers(id,name,transport_mode) values
 ('00000000-0000-4000-8000-000000000001','Demo Local Taxi 01','Taxi'),
 ('00000000-0000-4000-8000-000000000002','Demo Local Auto 01','Auto'),
 ('00000000-0000-4000-8000-000000000003','Demo Transport Collective','Taxi / Shared Transport');
alter table public.service_categories enable row level security;
alter table public.providers enable row level security;
alter table public.requests enable row level security;
alter table public.feedback enable row level security;
revoke all on public.service_categories,public.providers,public.requests,public.feedback from anon,authenticated;
grant select on public.service_categories,public.providers,public.requests,public.feedback to anon,authenticated;
grant insert on public.requests,public.feedback to anon,authenticated;
grant update(status,completed_at) on public.requests to anon,authenticated;
grant update(availability) on public.providers to anon,authenticated;
create policy demo_categories_read on public.service_categories for select to anon,authenticated using(true);
create policy demo_providers_read on public.providers for select to anon,authenticated using(is_demo);
create policy demo_availability on public.providers for update to anon,authenticated using(is_demo) with check(is_demo);
create policy demo_requests_read on public.requests for select to anon,authenticated using(true);
create policy demo_requests_insert on public.requests for insert to anon,authenticated with check(status='Requested' and completed_at is null and exists(select 1 from public.providers p where p.id=provider_id and p.availability and p.is_demo and (p.transport_mode=preferred_mode or (preferred_mode='Taxi' and p.transport_mode='Taxi / Shared Transport'))));
create policy demo_requests_update on public.requests for update to anon,authenticated using(status in ('Requested','Accepted')) with check(status in ('Accepted','Declined','Fulfilled'));
create policy demo_feedback_read on public.feedback for select to anon,authenticated using(true);
create policy demo_feedback_insert on public.feedback for insert to anon,authenticated with check(exists(select 1 from public.requests r where r.id=request_id and r.status='Fulfilled'));
create function public.validate_demo_transition() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if not ((old.status='Requested' and new.status in ('Accepted','Declined')) or (old.status='Accepted' and new.status='Fulfilled')) then raise exception 'Invalid request transition'; end if;
 return new;
end $$;
create trigger demo_transition before update on public.requests for each row execute function public.validate_demo_transition();
create index requests_created_at_idx on public.requests(created_at desc);
create index requests_provider_id_idx on public.requests(provider_id);
alter publication supabase_realtime add table public.requests,public.providers,public.feedback;

-- Additional presentation transport options.
insert into public.providers(id,name,transport_mode) values
 ('00000000-0000-4000-8000-000000000004','Demo City Hatchback 01','Taxi'),
 ('00000000-0000-4000-8000-000000000005','Demo Local SUV 01','Taxi')
on conflict (id) do nothing;


-- Illustrative listings; existing requests remain unchanged.
insert into public.providers(id,name,transport_mode) values
 ('00000000-0000-4000-8000-000000000006','Demo Town Auto Connect','Auto'),
 ('00000000-0000-4000-8000-000000000007','Demo Green E-Rickshaw','Auto'),
 ('00000000-0000-4000-8000-000000000008','Demo Rupaidiha Bus Connect','Bus'),
 ('00000000-0000-4000-8000-000000000009','Demo Regional Bus Service','Bus'),
 ('00000000-0000-4000-8000-000000000010','Demo Local Mini Bus','Bus')
on conflict (id) do nothing;

alter table public.providers add column base_fare numeric(10,2) not null default 150 check(base_fare between 100 and 250);
update public.providers set base_fare=case right(id::text,3) when '001' then 200 when '002' then 100 when '003' then 250 when '004' then 180 when '005' then 250 when '006' then 120 when '007' then 100 when '008' then 150 when '009' then 200 when '010' then 130 else 150 end;
alter table public.requests add column base_fare numeric(10,2), add column platform_fee numeric(10,2);
alter table public.requests disable trigger demo_transition;
update public.requests r set base_fare=p.base_fare,platform_fee=round(p.base_fare*0.02,2) from public.providers p where p.id=r.provider_id;
alter table public.requests enable trigger demo_transition;
alter table public.requests alter column base_fare set not null, alter column platform_fee set not null;
create function public.snapshot_request_fare() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 select base_fare into new.base_fare from public.providers where id=new.provider_id;
 new.platform_fee:=round(new.base_fare*0.02,2);
 return new;
end $$;
create trigger request_fare before insert on public.requests for each row execute function public.snapshot_request_fare();
create table public.payments (
 request_id uuid primary key references public.requests(id),
 paid_at timestamptz not null default now(),
 is_simulated boolean not null default true check(is_simulated=true)
);
alter table public.payments enable row level security;
revoke all on public.payments from anon,authenticated;
grant select on public.payments to anon,authenticated;
grant insert(request_id) on public.payments to anon,authenticated;
create policy payments_read on public.payments for select to anon,authenticated using(true);
create policy payments_confirm on public.payments for insert to anon,authenticated with check(exists(select 1 from public.requests r where r.id=request_id and r.status='Fulfilled'));
alter publication supabase_realtime add table public.payments;
