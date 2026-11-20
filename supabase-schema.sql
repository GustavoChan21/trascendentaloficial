-- Trascendental Oficial - Ejecutar una sola vez en Supabase SQL Editor.
-- La clave PUBLICABLE es segura en frontend SOLO con RLS habilitado.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.site_state (
  id text primary key default 'main' check (id = 'main'),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site_state (id,content) values ('main','{}'::jsonb) on conflict(id) do nothing;

create table if not exists public.tour_bookings (
  id uuid primary key default gen_random_uuid(),
  folio text unique not null,
  service_id text not null,
  service_date date not null,
  service_time time not null,
  people int not null check (people between 1 and 100),
  expires_at timestamptz not null,
  status text not null default 'awaiting_transfer' check (status in ('awaiting_transfer','proof_uploaded','confirmed','rejected','cancelled','expired')),
  payload jsonb not null,
  claim_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create index if not exists tour_bookings_capacity on public.tour_bookings(service_id,service_date,service_time,status,expires_at);

alter table public.admin_users enable row level security;
alter table public.site_state enable row level security;
alter table public.tour_bookings enable row level security;

drop policy if exists "admin can read own row" on public.admin_users;
create policy "admin can read own row" on public.admin_users for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "visitors can read site" on public.site_state;
create policy "visitors can read site" on public.site_state for select to anon,authenticated using (true);
drop policy if exists "admins can edit site" on public.site_state;
create policy "admins can edit site" on public.site_state for update to authenticated
 using (exists(select 1 from public.admin_users where user_id = (select auth.uid())))
 with check (exists(select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists "admins can read bookings" on public.tour_bookings;
create policy "admins can read bookings" on public.tour_bookings for select to authenticated
 using (exists(select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists "admins can change bookings" on public.tour_bookings;
create policy "admins can change bookings" on public.tour_bookings for update to authenticated
 using (exists(select 1 from public.admin_users where user_id = (select auth.uid())))
 with check (exists(select 1 from public.admin_users where user_id = (select auth.uid())));

-- Clientes anónimos consultan sólo disponibilidad agregada, nunca datos de otros clientes.
create or replace function public.available_seats(p_service_id text,p_date date,p_time time)
returns integer language plpgsql security definer set search_path = '' as $$
declare c jsonb; s jsonb; cap integer; busy integer;
begin
 select content into c from public.site_state where id='main';
 select x into s from jsonb_array_elements(coalesce(c->'services','[]'::jsonb)) x where x->>'id'=p_service_id and (x->>'active')::boolean=true limit 1;
 if s is null then return 0; end if;
 cap := greatest(0,least(100,coalesce((s->>'capacity')::integer,0)));
 select coalesce(sum(people),0) into busy from public.tour_bookings
 where service_id=p_service_id and service_date=p_date and service_time=p_time
 and (status='confirmed' or (status in ('awaiting_transfer','proof_uploaded') and expires_at>now()));
 return greatest(0,cap-busy);
end $$;

-- Bloqueo transaccional por servicio, fecha y horario para impedir doble venta.
create or replace function public.create_tour_booking(
 p_service_id text,p_date date,p_time time,p_people integer,
 p_name text,p_phone text,p_email text,p_notes text default ''
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare c jsonb; s jsonb; rec public.tour_bookings%rowtype; v_total numeric; v_deposit numeric; v_hours numeric; v_folio text;
begin
 if p_date < current_date or p_people not between 1 and 100 or length(trim(p_name)) not between 2 and 150
 or length(trim(p_phone)) not between 7 and 40 or length(trim(p_email)) not between 5 and 180 then
  raise exception 'Datos de reserva inválidos';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_service_id || p_date::text || p_time::text,0));
 select content into c from public.site_state where id='main';
 select x into s from jsonb_array_elements(coalesce(c->'services','[]'::jsonb)) x where x->>'id'=p_service_id and (x->>'active')::boolean=true limit 1;
 if s is null then raise exception 'Servicio no disponible'; end if;
 if public.available_seats(p_service_id,p_date,p_time)<p_people then raise exception 'No hay cupo suficiente para esa salida'; end if;
 v_total := greatest(0,(s->>'price')::numeric)*p_people;
 v_deposit := round(v_total*greatest(0,least(100,(s->>'depositPercent')::numeric))/100,2);
 v_hours := greatest(0.25,least(24,coalesce((c->'transfer'->>'holdHours')::numeric,2)));
 v_folio := upper(left(regexp_replace(coalesce(c->'transfer'->>'referencePrefix','GUIA'),'[^A-Za-z0-9]','','g'),12)) || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
 insert into public.tour_bookings(folio,service_id,service_date,service_time,people,expires_at,payload)
 values(v_folio,p_service_id,p_date,p_time,p_people,now()+v_hours*interval '1 hour',
 jsonb_build_object('folio',v_folio,'serviceId',p_service_id,'serviceName',s->>'name','date',p_date,'time',p_time,'people',p_people,
 'customer',jsonb_build_object('name',trim(p_name),'phone',trim(p_phone),'email',trim(p_email)),'notes',left(coalesce(p_notes,''),2000),
 'total',v_total,'deposit',v_deposit,'currency',coalesce(s->>'currency','MXN')))
 returning * into rec;
 return rec.payload || jsonb_build_object('id',rec.id,'status',rec.status,'createdAt',rec.created_at,'expiresAt',rec.expires_at,'claimToken',rec.claim_token);
end $$;

-- En esta fase sólo registra el NOMBRE; NO almacena el archivo del comprobante.
create or replace function public.register_proof_name(p_booking_id uuid,p_token uuid,p_name text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
 if length(trim(p_name)) not between 1 and 200 then return false; end if;
 update public.tour_bookings set status='proof_uploaded',payload=payload||jsonb_build_object('proofName',left(trim(p_name),200))
 where id=p_booking_id and claim_token=p_token and status='awaiting_transfer' and expires_at>now();
 return found;
end $$;

revoke all on function public.available_seats(text,date,time) from public;
revoke all on function public.create_tour_booking(text,date,time,integer,text,text,text,text) from public;
revoke all on function public.register_proof_name(uuid,uuid,text) from public;
grant execute on function public.available_seats(text,date,time) to anon,authenticated;
grant execute on function public.create_tour_booking(text,date,time,integer,text,text,text,text) to anon,authenticated;
grant execute on function public.register_proof_name(uuid,uuid,text) to anon,authenticated;
grant select on public.site_state to anon,authenticated;
grant select on public.admin_users to authenticated;
grant select,update on public.tour_bookings to authenticated;
grant update on public.site_state to authenticated;

-- Después de crear el primer usuario en Authentication > Users, autorizarlo explícitamente:
-- insert into public.admin_users (user_id) values ('UUID-DEL-USUARIO');
