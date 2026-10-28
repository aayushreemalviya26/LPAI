alter table public.requests drop constraint requests_service_category_check;
alter table public.requests drop constraint requests_preferred_mode_check;
alter table public.requests add constraint requests_preferred_mode_check check(preferred_mode in ('Taxi','Auto','Bus','Room','Pickup'));
alter table public.providers drop constraint providers_base_fare_check;
alter table public.providers add constraint providers_base_fare_check check((service_category='Transport' and base_fare between 100 and 250) or (service_category<>'Transport' and base_fare>0 and base_fare<=10000));
update public.service_categories set enabled=true;
insert into public.providers(id,name,service_category,transport_mode,base_fare) values
('00000000-0000-4000-8000-000000000101','Demo Rupaidiha Rasoi','Food','Pickup',150),
('00000000-0000-4000-8000-000000000102','Demo Border Chai & Snacks','Food','Pickup',60),
('00000000-0000-4000-8000-000000000103','Demo Terai Momo Kitchen','Food','Pickup',100),
('00000000-0000-4000-8000-000000000104','Demo Terai Comfort Stay','Stay','Room',1200),
('00000000-0000-4000-8000-000000000105','Demo Rupaidiha Traveller Inn','Stay','Room',900),
('00000000-0000-4000-8000-000000000106','Demo Gateway Family Lodge','Stay','Room',1800),
('00000000-0000-4000-8000-000000000107','Demo Terai Basket House','Local Products','Pickup',250),
('00000000-0000-4000-8000-000000000108','Demo Rupaidiha Textile Corner','Local Products','Pickup',200),
('00000000-0000-4000-8000-000000000109','Demo Local Spice Pantry','Local Products','Pickup',180)
on conflict(id) do nothing;
alter policy demo_requests_insert on public.requests with check(status='Requested' and completed_at is null and exists(select 1 from public.providers p where p.id=provider_id and p.service_category=requests.service_category and p.availability and p.is_demo and (p.transport_mode=preferred_mode or (preferred_mode='Taxi' and p.transport_mode='Taxi / Shared Transport'))));
create or replace function public.snapshot_request_fare() returns trigger language plpgsql security invoker set search_path=public as $$
declare category text;
begin
 select base_fare,service_category into new.base_fare,category from public.providers where id=new.provider_id;
 if category<>new.service_category then raise exception 'Provider category mismatch'; end if;
 if category<>'Transport' then new.base_fare:=new.base_fare*new.passenger_count; end if;
 if category='Stay' and new.requested_for::timestamptz::date < (now() at time zone 'Asia/Kolkata')::date then raise exception 'Check-in must be today or later'; end if;
 new.platform_fee:=round(new.base_fare*0.02,2);
 return new;
end $$;
