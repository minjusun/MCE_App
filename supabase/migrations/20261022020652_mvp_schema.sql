-- MVP schema: profiles, collectibles catalog, holdings (+ private costs), listings, trades.
-- Design notes, ER diagram and the access model: docs/MCE/Database.md
-- All money is numeric(12,2) in USD. Never use float for prices.

create extension if not exists pg_trgm with schema extensions;

-- Helper functions live here: not exposed through the Data API.
create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.product_type as enum ('card', 'sealed');
create type public.item_type as enum ('raw_card', 'graded_card', 'sealed_product');
create type public.card_condition as enum ('near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged');
create type public.grading_company as enum ('PSA', 'BGS', 'CGC', 'SGC', 'TAG');
create type public.listing_status as enum ('active', 'sold', 'cancelled');
create type public.trade_status as enum ('pending', 'accepted', 'declined', 'cancelled', 'countered');
create type public.trade_party as enum ('proposer', 'recipient');

create function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: public identity only. Email and other account data stay in auth.users.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text check (char_length(display_name) between 1 and 50),
  avatar_url text check (avatar_url ~ '^https://' and char_length(avatar_url) <= 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- collectibles: shared catalog of products (a card printing or a sealed product).
-- Condition and grade belong to a physical copy, so they live on holdings.
-- ---------------------------------------------------------------------------
create table public.collectibles (
  id uuid primary key default gen_random_uuid(),
  product_type public.product_type not null,
  name text not null check (char_length(name) between 1 and 200),
  game text not null default 'pokemon' check (game ~ '^[a-z0-9_]{1,30}$'),
  set_name text check (char_length(set_name) <= 200),
  card_number text check (char_length(card_number) <= 30),
  image_url text check (image_url ~ '^https://' and char_length(image_url) <= 2048),
  external_source text check (external_source ~ '^[a-z0-9_]{1,30}$'),
  external_id text check (char_length(external_id) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collectibles_external_pair check ((external_source is null) = (external_id is null)),
  constraint collectibles_external_unique unique (external_source, external_id),
  constraint collectibles_card_number_only_for_cards check (product_type = 'card' or card_number is null)
);
create index collectibles_name_trgm_idx on public.collectibles using gin (name extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- holdings: physical items a user owns. Raw cards and sealed products have one row per variant
-- (more copies = higher quantity); each graded slab is its own row.
-- ---------------------------------------------------------------------------
create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  collectible_id uuid not null references public.collectibles (id) on delete restrict,
  item_type public.item_type not null,
  condition public.card_condition,
  grading_company public.grading_company,
  grade numeric(3,1) check (grade between 1 and 10 and grade * 2 = trunc(grade * 2)),
  cert_number text check (char_length(cert_number) between 1 and 40),
  quantity integer not null default 1 check (quantity > 0),
  open_to_trade boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- lets listings and trade items reference (holding, owner) together, so ownership is enforced by FK
  constraint holdings_id_owner_key unique (id, owner_id),
  constraint holdings_variant_attributes check (
       (item_type = 'raw_card'       and condition is not null and grading_company is null and grade is null and cert_number is null)
    or (item_type = 'graded_card'    and condition is null and grading_company is not null and grade is not null)
    or (item_type = 'sealed_product' and condition is null and grading_company is null and grade is null and cert_number is null)
  ),
  constraint holdings_graded_is_single check (item_type <> 'graded_card' or quantity = 1)
);
create unique index holdings_one_row_per_variant on public.holdings (owner_id, collectible_id, item_type, condition)
  nulls not distinct where item_type <> 'graded_card';
create index holdings_owner_id_idx on public.holdings (owner_id);
create index holdings_collectible_id_idx on public.holdings (collectible_id);
create index holdings_open_to_trade_idx on public.holdings (collectible_id) where open_to_trade;

-- Private purchase data, 1:1 with holdings and visible only to the owner.
create table public.holding_costs (
  holding_id uuid primary key,
  owner_id uuid not null,
  unit_cost numeric(12,2) check (unit_cost >= 0 and unit_cost <= 10000000),
  acquired_on date check (acquired_on >= date '1990-01-01'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- no ON UPDATE CASCADE: a future ownership transfer must delete this row, never hand it to the new owner
  foreign key (holding_id, owner_id) references public.holdings (id, owner_id) on delete cascade
);
create index holding_costs_owner_id_idx on public.holding_costs (owner_id);

-- ---------------------------------------------------------------------------
-- listings: a holding offered for sale. Seller must own the holding (composite FK).
-- ---------------------------------------------------------------------------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null,
  holding_id uuid not null,
  price numeric(12,2) not null check (price > 0 and price <= 10000000),
  quantity integer not null default 1 check (quantity > 0),
  status public.listing_status not null default 'active',
  description text check (char_length(description) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (holding_id, seller_id) references public.holdings (id, owner_id) on delete cascade
);
create unique index listings_one_active_per_holding on public.listings (holding_id) where status = 'active';
create index listings_holding_id_idx on public.listings (holding_id);
create index listings_seller_id_idx on public.listings (seller_id);
create index listings_active_created_at_idx on public.listings (created_at desc) where status = 'active';

-- ---------------------------------------------------------------------------
-- trades and trade_items
-- ---------------------------------------------------------------------------
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  proposer_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  status public.trade_status not null default 'pending',
  cash_amount numeric(12,2) not null default 0 check (cash_amount >= 0 and cash_amount <= 10000000),
  cash_paid_by public.trade_party,
  message text check (char_length(message) <= 500),
  counter_of uuid references public.trades (id) on delete set null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trades_distinct_parties check (proposer_id <> recipient_id),
  constraint trades_cash_payer check ((cash_amount = 0) = (cash_paid_by is null))
);
create index trades_proposer_created_idx on public.trades (proposer_id, created_at desc);
create index trades_recipient_created_idx on public.trades (recipient_id, created_at desc);
create unique index trades_one_counter_per_trade on public.trades (counter_of) where counter_of is not null;

-- side = which party gives the item: 'proposer' (offered) or 'recipient' (requested).
create table public.trade_items (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades (id) on delete cascade,
  holding_id uuid not null,
  owner_id uuid not null,
  side public.trade_party not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  constraint trade_items_unique_holding unique (trade_id, holding_id),
  -- deleting a holding is blocked by trigger while it is in a pending or accepted trade;
  -- once a trade is finished its items no longer hold the holding hostage
  foreign key (holding_id, owner_id) references public.holdings (id, owner_id) on delete cascade
);
create index trade_items_holding_id_idx on public.trade_items (holding_id);

-- ---------------------------------------------------------------------------
-- Integrity triggers (SECURITY INVOKER: they run with the caller's rights and RLS)
-- ---------------------------------------------------------------------------
create function private.check_holding_product_type() returns trigger
language plpgsql set search_path = '' as $$
declare
  kind public.product_type;
begin
  select c.product_type into kind from public.collectibles c where c.id = new.collectible_id;
  if kind = 'sealed' and new.item_type <> 'sealed_product'
     or kind = 'card' and new.item_type = 'sealed_product' then
    raise exception 'item_type % does not match a % collectible', new.item_type, kind using errcode = '23514';
  end if;
  return new;
end;
$$;

create function private.check_listing_quantity() returns trigger
language plpgsql set search_path = '' as $$
declare
  available integer;
begin
  select h.quantity into available from public.holdings h where h.id = new.holding_id;
  if new.quantity > available then
    raise exception 'listing quantity % exceeds holding quantity %', new.quantity, available using errcode = '23514';
  end if;
  return new;
end;
$$;

create function private.check_trade_item() returns trigger
language plpgsql set search_path = '' as $$
declare
  t public.trades;
  h public.holdings;
  uid uuid := auth.uid();
begin
  select * into t from public.trades where id = new.trade_id;
  if not found then
    raise exception 'trade not found' using errcode = '23503';
  end if;
  if t.status <> 'pending' then
    raise exception 'items can only be added to a pending trade' using errcode = '23514';
  end if;
  if uid is not null and uid <> t.proposer_id then
    raise exception 'only the proposer can add items' using errcode = '42501';
  end if;
  -- terms are fixed once sent: items only in the transaction that created the trade (see propose_trade)
  if uid is not null and t.created_at <> now() then
    raise exception 'items can only be added when the trade is created' using errcode = '23514';
  end if;
  if new.owner_id <> (case new.side when 'proposer' then t.proposer_id else t.recipient_id end) then
    raise exception 'owner of the item does not match its side of the trade' using errcode = '23514';
  end if;
  -- RLS decides what the caller can see: their own holdings, or the other party's open_to_trade ones
  select * into h from public.holdings where id = new.holding_id;
  if not found then
    raise exception 'holding not found or not available for trade' using errcode = '23503';
  end if;
  if new.side = 'recipient' and not h.open_to_trade then
    raise exception 'requested holding is not open to trade' using errcode = '23514';
  end if;
  if new.quantity > h.quantity then
    raise exception 'quantity % exceeds holding quantity %', new.quantity, h.quantity using errcode = '23514';
  end if;
  return new;
end;
$$;

create function private.check_new_trade() returns trigger
language plpgsql set search_path = '' as $$
declare
  parent public.trades;
begin
  if new.status <> 'pending' then
    raise exception 'new trades must be pending' using errcode = '23514';
  end if;
  -- limit unsolicited offers: at most 5 pending trades from one user to the same recipient
  if (select count(*) from public.trades t
      where t.proposer_id = new.proposer_id and t.recipient_id = new.recipient_id and t.status = 'pending') >= 5 then
    raise exception 'too many pending offers to this user' using errcode = '23514';
  end if;
  if new.counter_of is not null then
    -- lock the original so two counter offers cannot both see it as pending
    select * into parent from public.trades where id = new.counter_of for update;
    if not found or parent.status <> 'pending'
       or parent.recipient_id <> new.proposer_id or parent.proposer_id <> new.recipient_id then
      raise exception 'a counter offer must answer a pending trade sent to you, with the parties swapped' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create function private.mark_countered() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.counter_of is not null then
    update public.trades set status = 'countered' where id = new.counter_of;
  end if;
  return null;
end;
$$;

create function private.enforce_trade_transition() returns trigger
language plpgsql set search_path = '' as $$
declare
  uid uuid := auth.uid();
  bad_items integer;
begin
  if (new.proposer_id, new.recipient_id, new.cash_amount, new.cash_paid_by, new.message, new.counter_of, new.created_at)
     is distinct from (old.proposer_id, old.recipient_id, old.cash_amount, old.cash_paid_by, old.message, old.counter_of, old.created_at) then
    raise exception 'only the status of a trade can change' using errcode = '42501';
  end if;
  if new.status = old.status then
    return new;
  end if;
  if old.status <> 'pending' then
    raise exception 'trade is already %', old.status using errcode = '23514';
  end if;
  -- uid is null for trusted server-side callers (service role); clients are always checked
  if uid is not null then
    if new.status in ('accepted', 'declined', 'countered') and uid <> old.recipient_id then
      raise exception 'only the recipient can mark a trade %', new.status using errcode = '42501';
    end if;
    if new.status = 'cancelled' and uid <> old.proposer_id then
      raise exception 'only the proposer can cancel a trade' using errcode = '42501';
    end if;
  end if;
  if new.status = 'accepted' then
    if not exists (select 1 from public.trade_items where trade_id = new.id) then
      raise exception 'a trade needs at least one item before it can be accepted' using errcode = '23514';
    end if;
    select count(*) into bad_items
    from public.trade_items ti
    left join public.holdings h on h.id = ti.holding_id and h.owner_id = ti.owner_id
    where ti.trade_id = new.id and (h.id is null or ti.quantity > h.quantity);
    if bad_items > 0 then
      raise exception 'some items are no longer available in the offered quantity' using errcode = '23514';
    end if;
  end if;
  new.responded_at := now();
  return new;
end;
$$;

create function private.protect_holdings_in_open_trades() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- when the whole account is being deleted, the profile is already gone: let the cascade through
  if exists (select 1 from public.profiles p where p.id = old.owner_id)
     and exists (select 1 from public.trade_items ti join public.trades t on t.id = ti.trade_id
                 where ti.holding_id = old.id and t.status in ('pending', 'accepted')) then
    raise exception 'this holding is part of a pending or accepted trade' using errcode = '23503';
  end if;
  return old;
end;
$$;

create function private.check_holding_quantity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.listings l
             where l.holding_id = new.id and l.status = 'active' and l.quantity > new.quantity) then
    raise exception 'an active listing needs more than % of this holding; lower or cancel it first', new.quantity using errcode = '23514';
  end if;
  return new;
end;
$$;

-- Creates a trade and its items in one transaction, so the terms are complete when the recipient sees them.
-- SECURITY INVOKER: runs as the caller, so every RLS policy and trigger above still applies.
-- p_items: [{"holding_id": "<uuid>", "side": "proposer" | "recipient", "quantity": 1}, ...]
create function public.propose_trade(
  p_recipient uuid,
  p_items jsonb,
  p_cash_amount numeric default 0,
  p_cash_paid_by public.trade_party default null,
  p_message text default null,
  p_counter_of uuid default null
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  uid uuid := auth.uid();
  new_id uuid;
  item jsonb;
begin
  if uid is null then
    raise exception 'sign in to propose a trade' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'a trade needs at least one item' using errcode = '22023';
  end if;
  insert into public.trades (proposer_id, recipient_id, cash_amount, cash_paid_by, message, counter_of)
  values (uid, p_recipient, coalesce(p_cash_amount, 0), p_cash_paid_by, p_message, p_counter_of)
  returning id into new_id;
  for item in select value from jsonb_array_elements(p_items) loop
    insert into public.trade_items (trade_id, holding_id, owner_id, side, quantity)
    values (new_id, (item ->> 'holding_id')::uuid,
            case item ->> 'side' when 'proposer' then uid else p_recipient end,
            (item ->> 'side')::public.trade_party,
            coalesce((item ->> 'quantity')::integer, 1));
  end loop;
  return new_id;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger collectibles_set_updated_at before update on public.collectibles for each row execute function private.set_updated_at();
create trigger holdings_set_updated_at before update on public.holdings for each row execute function private.set_updated_at();
create trigger holding_costs_set_updated_at before update on public.holding_costs for each row execute function private.set_updated_at();
create trigger listings_set_updated_at before update on public.listings for each row execute function private.set_updated_at();
create trigger trades_set_updated_at before update on public.trades for each row execute function private.set_updated_at();

create trigger holdings_check_product_type before insert or update of collectible_id, item_type on public.holdings
  for each row execute function private.check_holding_product_type();
create trigger listings_check_quantity before insert or update of quantity, holding_id on public.listings
  for each row execute function private.check_listing_quantity();
create trigger holdings_check_quantity before update of quantity on public.holdings
  for each row execute function private.check_holding_quantity();
create trigger holdings_protect_open_trades before delete on public.holdings
  for each row execute function private.protect_holdings_in_open_trades();
create trigger trades_check_new before insert on public.trades for each row execute function private.check_new_trade();
create trigger trades_mark_countered after insert on public.trades for each row execute function private.mark_countered();
create trigger trades_enforce_transition before update on public.trades for each row execute function private.enforce_trade_transition();
create trigger trade_items_check before insert on public.trade_items for each row execute function private.check_trade_item();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.collectibles enable row level security;
alter table public.holdings enable row level security;
alter table public.holding_costs enable row level security;
alter table public.listings enable row level security;
alter table public.trades enable row level security;
alter table public.trade_items enable row level security;

-- profiles: anyone can read public identity; users create and edit only their own
create policy "profiles are public" on public.profiles for select to anon, authenticated using (true);
create policy "users create their own profile" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy "users update their own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- collectibles: read-only catalog for clients; written by trusted imports (service role)
create policy "catalog is public" on public.collectibles for select to anon, authenticated using (true);

-- holdings: owner sees everything; others see items that are open to trade, actively listed,
-- or part of a trade they are in
create policy "owners see their holdings" on public.holdings for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "tradeable and listed holdings are public" on public.holdings for select to anon, authenticated
  using (open_to_trade or exists (
    select 1 from public.listings l where l.holding_id = holdings.id and l.status = 'active'));
create policy "trade participants see traded holdings" on public.holdings for select to authenticated
  using (exists (
    select 1 from public.trade_items ti join public.trades t on t.id = ti.trade_id
    where ti.holding_id = holdings.id and t.status in ('pending', 'accepted')
      and (select auth.uid()) in (t.proposer_id, t.recipient_id)));
create policy "owners add holdings" on public.holdings for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "owners edit holdings" on public.holdings for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "owners remove holdings" on public.holdings for delete to authenticated
  using (owner_id = (select auth.uid()));

-- holding_costs: owner only
create policy "owners manage their costs" on public.holding_costs for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- listings: active listings are public; sellers manage their own
create policy "active listings are public" on public.listings for select to anon, authenticated
  using (status = 'active');
create policy "sellers see their listings" on public.listings for select to authenticated
  using (seller_id = (select auth.uid()));
create policy "sellers create listings" on public.listings for insert to authenticated
  with check (seller_id = (select auth.uid()));
create policy "sellers edit listings" on public.listings for update to authenticated
  using (seller_id = (select auth.uid())) with check (seller_id = (select auth.uid()));
create policy "sellers remove listings" on public.listings for delete to authenticated
  using (seller_id = (select auth.uid()));

-- trades: only the two participants can see or respond; transitions enforced by trigger
create policy "participants see trades" on public.trades for select to authenticated
  using ((select auth.uid()) in (proposer_id, recipient_id));
create policy "users propose trades as themselves" on public.trades for insert to authenticated
  with check (proposer_id = (select auth.uid()) and status = 'pending');
create policy "participants respond to trades" on public.trades for update to authenticated
  using ((select auth.uid()) in (proposer_id, recipient_id))
  with check ((select auth.uid()) in (proposer_id, recipient_id));

create policy "participants see trade items" on public.trade_items for select to authenticated
  using (exists (select 1 from public.trades t
    where t.id = trade_items.trade_id and (select auth.uid()) in (t.proposer_id, t.recipient_id)));
create policy "proposers add items to pending trades" on public.trade_items for insert to authenticated
  with check (exists (select 1 from public.trades t
    where t.id = trade_items.trade_id and t.proposer_id = (select auth.uid()) and t.status = 'pending'));

-- ---------------------------------------------------------------------------
-- Privileges. New tables are no longer exposed to the Data API automatically,
-- so grant exactly what clients need (RLS still decides which rows).
-- ---------------------------------------------------------------------------
revoke all on public.profiles, public.collectibles, public.holdings, public.holding_costs,
  public.listings, public.trades, public.trade_items from anon, authenticated;

grant select on public.profiles, public.collectibles, public.holdings, public.listings to anon;

-- Column lists keep owners (beyond RLS), timestamps and server-managed fields out of clients' hands.
-- Clients may supply their own uuid ids (a collision just fails the unique key).
grant select on public.profiles, public.collectibles, public.holdings, public.holding_costs,
  public.listings, public.trades, public.trade_items to authenticated;
grant insert (id, username, display_name, avatar_url) on public.profiles to authenticated;
grant update (username, display_name, avatar_url) on public.profiles to authenticated;
grant insert (id, owner_id, collectible_id, item_type, condition, grading_company, grade, cert_number, quantity, open_to_trade)
  on public.holdings to authenticated;
grant update (collectible_id, item_type, condition, grading_company, grade, cert_number, quantity, open_to_trade)
  on public.holdings to authenticated;
grant delete on public.holdings to authenticated;
grant insert (holding_id, owner_id, unit_cost, acquired_on) on public.holding_costs to authenticated;
grant update (unit_cost, acquired_on) on public.holding_costs to authenticated;
grant delete on public.holding_costs to authenticated;
grant insert (id, seller_id, holding_id, price, quantity, description) on public.listings to authenticated;
grant update (price, quantity, status, description) on public.listings to authenticated;
grant delete on public.listings to authenticated;
grant insert (id, proposer_id, recipient_id, cash_amount, cash_paid_by, message, counter_of) on public.trades to authenticated;
grant update (status) on public.trades to authenticated;
grant insert (id, trade_id, holding_id, owner_id, side, quantity) on public.trade_items to authenticated;

revoke execute on function public.propose_trade(uuid, jsonb, numeric, public.trade_party, text, uuid) from public, anon;
grant execute on function public.propose_trade(uuid, jsonb, numeric, public.trade_party, text, uuid) to authenticated, service_role;

grant all on public.profiles, public.collectibles, public.holdings, public.holding_costs,
  public.listings, public.trades, public.trade_items to service_role;

revoke all on schema private from public;
