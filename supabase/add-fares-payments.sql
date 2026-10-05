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
