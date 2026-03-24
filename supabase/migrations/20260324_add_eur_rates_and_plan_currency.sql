alter table public.configuracion
add column if not exists tasa_eur numeric(12,2);

alter table public.planes
add column if not exists moneda_referencia text;

update public.planes
set moneda_referencia = 'USD'
where moneda_referencia is null;

alter table public.planes
alter column moneda_referencia set default 'USD';

alter table public.planes
alter column moneda_referencia set not null;

alter table public.pagos
add column if not exists moneda_divisa text;

alter table public.pagos
add column if not exists monto_divisa numeric(12,2);

update public.pagos
set moneda_divisa = coalesce(moneda_divisa, 'USD'),
    monto_divisa = coalesce(monto_divisa, monto_usd)
where moneda_divisa is null
   or monto_divisa is null;
