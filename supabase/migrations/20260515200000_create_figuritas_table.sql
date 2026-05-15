-- Catalogo de las 980 figuritas del album Panini Mundial 2026.
-- Tabla de referencia de solo lectura: la app lee desde aca y el seed usa service_role.

create table if not exists public.figuritas (
  id              text primary key,          -- "wc2026:base:ARG001"
  numero_orden    smallint not null unique,  -- 1..980
  seccion         text not null,             -- "Apertura", "Grupo A", ..., "Cierre"
  subseccion      text not null,             -- "Mexico", "Argentina", ...
  codigo_figura   text not null unique,      -- "ARG001"
  pais_equipo     text not null default '',
  nombre_figura   text not null default '',
  nombre_jugador  text not null default '',
  tipo_figura     text not null,             -- "jugador", "escudo", ...
  tipo_coleccion  text not null default 'normal',
  es_especial     boolean not null default false,
  acabado         text not null default 'standard'
);

create index if not exists idx_figuritas_codigo on public.figuritas (codigo_figura);
create index if not exists idx_figuritas_subseccion on public.figuritas (subseccion);

alter table public.figuritas enable row level security;

create policy "Figuritas are publicly readable"
  on public.figuritas for select
  using (true);

-- No insert/update/delete policies: solo service_role o migraciones pueden escribir.
