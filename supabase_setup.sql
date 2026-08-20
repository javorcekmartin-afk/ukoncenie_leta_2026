-- Cloud sync pre Stánok – bezpečný prístup cez event kód + PIN.
-- Spusti celý skript v Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.event_states (
  event_code text primary key,
  pin_hash text not null,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.event_states enable row level security;

-- Priamy prístup k tabuľke z klienta nepovoľujeme.
revoke all on table public.event_states from anon, authenticated;

create or replace function public.cloud_get_state(p_event_code text, p_pin text)
returns table(state jsonb, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select e.state, e.updated_at
  from public.event_states e
  where e.event_code = upper(trim(p_event_code))
    and e.pin_hash = crypt(p_pin, e.pin_hash);
end;
$$;

create or replace function public.cloud_save_state(p_event_code text, p_pin text, p_state jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_event_code));
  v_now timestamptz := now();
  v_hash text;
begin
  if v_code is null or length(v_code) < 3 then
    raise exception 'Neplatný kód akcie';
  end if;
  if p_pin is null or length(p_pin) < 4 then
    raise exception 'PIN musí mať aspoň 4 znaky';
  end if;

  select pin_hash into v_hash from public.event_states where event_code = v_code;

  if v_hash is null then
    insert into public.event_states(event_code, pin_hash, state, updated_at)
    values(v_code, crypt(p_pin, gen_salt('bf')), p_state, v_now);
  else
    if v_hash <> crypt(p_pin, v_hash) then
      raise exception 'Nesprávny PIN';
    end if;
    update public.event_states set state = p_state, updated_at = v_now where event_code = v_code;
  end if;

  return v_now;
end;
$$;

revoke all on function public.cloud_get_state(text,text) from public;
revoke all on function public.cloud_save_state(text,text,jsonb) from public;
grant execute on function public.cloud_get_state(text,text) to anon, authenticated;
grant execute on function public.cloud_save_state(text,text,jsonb) to anon, authenticated;
