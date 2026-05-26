-- Railway migration schema
-- Run this first in psql connected to Railway.

create extension if not exists pgcrypto;

create or replace function public.set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.products (
  id uuid not null default gen_random_uuid(),
  name text not null,
  description text null,
  price numeric(10, 2) not null,
  available boolean not null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  category text not null,
  constraint products_pkey primary key (id)
);

drop trigger if exists set_timestamp_trigger on public.products;
create trigger set_timestamp_trigger
before insert or update on public.products
for each row
execute function public.set_timestamp();

create table if not exists public.product_images (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null,
  image_url text not null,
  display_order integer null default 0,
  created_at timestamp with time zone null default now(),
  size bigint null,
  constraint product_images_pkey primary key (id),
  constraint product_images_product_id_fkey
    foreign key (product_id) references public.products (id) on delete cascade
);

create index if not exists idx_product_images_product
  on public.product_images using btree (product_id);

create table if not exists public.admin_credentials (
  id uuid not null default gen_random_uuid(),
  username text not null,
  password_hash text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint admin_credentials_pkey primary key (id),
  constraint admin_credentials_username_key unique (username)
);

create index if not exists idx_admin_credentials_username
  on public.admin_credentials using btree (username);

create table if not exists public.store_info (
  id uuid not null default gen_random_uuid(),
  label text null,
  phone_display text null,
  whatsapp_number text null,
  address text null,
  lat text null,
  lng text null,
  hours text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint store_info_pkey primary key (id)
);

drop trigger if exists set_timestamp_trigger_store_info on public.store_info;
create trigger set_timestamp_trigger_store_info
before update on public.store_info
for each row
execute function public.set_timestamp();

create table if not exists public.store_whatsapp_contacts (
  id uuid not null default gen_random_uuid(),
  store_id uuid null,
  name text not null,
  phone text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint store_whatsapp_contacts_pkey primary key (id),
  constraint store_whatsapp_contacts_store_id_fkey
    foreign key (store_id) references public.store_info (id) on delete cascade
);

drop trigger if exists set_timestamp_trigger_store_whatsapp on public.store_whatsapp_contacts;
create trigger set_timestamp_trigger_store_whatsapp
before update on public.store_whatsapp_contacts
for each row
execute function public.set_timestamp();

-- seed admin_credentials
insert into public.admin_credentials (id, username, password_hash, created_at, updated_at)
values (
  'fbfffbbc-55f0-4e58-8c8d-c903460171e7',
  'mercedes',
  'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f',
  '2026-04-07 23:32:01.168532+00',
  '2026-04-08 00:11:35.687+00'
)
on conflict (id) do update
set
  username = excluded.username,
  password_hash = excluded.password_hash,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

-- seed store_info
insert into public.store_info (id, label, phone_display, whatsapp_number, address, lat, lng, hours, created_at, updated_at)
values (
  '837bcf3e-a25b-4d1a-a10a-da375760f353',
  'Casa Ensueño',
  '+53 5 2490476',
  '53592490476',
  '46 / 7ma y 7ma A, Miramar, Municipio Playa, La Habana',
  '23.112022',
  '-82.430786',
  'Lun / Sáb • 09:30 am - 6:00 pm',
  '2026-01-25 14:46:38.901804+00',
  '2026-04-16 00:14:18.936343+00'
)
on conflict (id) do update
set
  label = excluded.label,
  phone_display = excluded.phone_display,
  whatsapp_number = excluded.whatsapp_number,
  address = excluded.address,
  lat = excluded.lat,
  lng = excluded.lng,
  hours = excluded.hours,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

-- After creating the schema, insert the products with an import script or a generated INSERT file.
