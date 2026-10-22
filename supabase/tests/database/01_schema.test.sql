-- Structure: tables, keys, money types, indexes, RLS and privileges.
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

select has_table('public', t, format('table %s exists', t))
from unnest(array['profiles', 'collectibles', 'holdings', 'holding_costs', 'listings', 'trades', 'trade_items']) t;

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0, 'every table in public has row level security enabled');

select col_type_is('public', 'listings', 'price', 'numeric(12,2)', 'listing price is numeric(12,2)');
select col_type_is('public', 'holding_costs', 'unit_cost', 'numeric(12,2)', 'unit cost is numeric(12,2)');
select col_type_is('public', 'trades', 'cash_amount', 'numeric(12,2)', 'trade cash is numeric(12,2)');
select is(
  (select count(*)::int from information_schema.columns
   where table_schema = 'public' and data_type in ('real', 'double precision', 'money')),
  0, 'no float or money columns anywhere in public');

select fk_ok('public', 'profiles', array['id'], 'auth', 'users', array['id'], 'profiles belong to auth users');
select fk_ok('public', 'holdings', array['owner_id'], 'public', 'profiles', array['id'], 'holdings belong to profiles');
select fk_ok('public', 'holdings', array['collectible_id'], 'public', 'collectibles', array['id'], 'holdings reference the catalog');
select fk_ok('public', 'listings', array['holding_id', 'seller_id'], 'public', 'holdings', array['id', 'owner_id'], 'listing seller must own the holding');
select fk_ok('public', 'trade_items', array['holding_id', 'owner_id'], 'public', 'holdings', array['id', 'owner_id'], 'trade item owner must own the holding');
select fk_ok('public', 'trade_items', array['trade_id'], 'public', 'trades', array['id'], 'trade items belong to trades');
select fk_ok('public', 'holding_costs', array['holding_id', 'owner_id'], 'public', 'holdings', array['id', 'owner_id'], 'costs belong to the holding owner');

select has_index('public', 'holdings', 'holdings_owner_id_idx', 'holdings.owner_id is indexed');
select has_index('public', 'listings', 'listings_seller_id_idx', 'listings.seller_id is indexed');
select has_index('public', 'listings', 'listings_one_active_per_holding', 'one active listing per holding');
select has_index('public', 'trades', 'trades_recipient_created_idx', 'trade inbox (recipient, newest first) is indexed');

select hasnt_column('public', 'profiles', 'email', 'profiles do not expose email');

select ok(not has_table_privilege('anon', 'public.holding_costs', 'select'), 'anon cannot read costs');
select ok(not has_table_privilege('anon', 'public.trades', 'select'), 'anon cannot read trades');
select ok(not has_table_privilege('anon', 'public.listings', 'insert'), 'anon cannot create listings');
select ok(not has_table_privilege('authenticated', 'public.collectibles', 'insert'), 'clients cannot write the catalog');
select ok(not has_column_privilege('authenticated', 'public.trades', 'cash_amount', 'update'), 'clients cannot change trade terms');
select ok(has_column_privilege('authenticated', 'public.trades', 'status', 'update'), 'clients can change trade status (rules enforced by trigger)');
select ok(not has_schema_privilege('anon', 'private', 'usage'), 'private helper schema is not usable by anon');

select * from finish();
rollback;
