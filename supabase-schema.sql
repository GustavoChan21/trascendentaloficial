-- Esquema propuesto para migrar la demo a producción con Supabase.

create extension if not exists pgcrypto;

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text,
  short_description text,
  image_url text,
  duration_label text,
  price numeric(12,2) not null default 0,
  currency text not null default 'MXN',
  capacity integer not null default 1 check (capacity > 0),
  deposit_percent numeric(5,2) not null default 100 check (deposit_percent between 0 and 100),
  highlights text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type booking_status as enum (
  'awaiting_transfer',
  'proof_uploaded',
  'confirmed',
  'rejected',
  'cancelled',
  'expired'
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  folio text unique not null,
  service_id uuid not null references public.services(id),
  service_date date not null,
  service_time time,
  people integer not null check (people > 0),
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  notes text,
  total numeric(12,2) not null,
  deposit numeric(12,2) not null,
  currency text not null default 'MXN',
  status booking_status not null default 'awaiting_transfer',
  proof_path text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_service_date_idx on public.bookings(service_id, service_date, status);
create index bookings_expires_idx on public.bookings(expires_at, status);

-- Regla crítica en producción:
-- calcular cupo usando una transacción/RPC con bloqueo para impedir que dos clientes
-- reserven simultáneamente los últimos lugares. No confiar sólo en el frontend.
