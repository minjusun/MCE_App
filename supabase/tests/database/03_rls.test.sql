-- Row Level Security: anonymous visitors, owners, other users, and impersonation attempts.
-- ash = 1111..., misty = 2222..., gary = 3333... (auth user without a profile yet)
begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ash@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'misty@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'gary@test.local');
insert into public.profiles (id, username) values
  ('11111111-1111-1111-1111-111111111111', 'ash'),
  ('22222222-2222-2222-2222-222222222222', 'misty');
insert into public.collectibles (id, product_type, name) values
  ('c0000000-0000-0000-0000-000000000001', 'card', 'Charizard ex');
insert into public.holdings (id, owner_id, collectible_id, item_type, condition, open_to_trade) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'near_mint', false), -- ash private
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'lightly_played', true), -- ash open to trade
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'moderately_played', false), -- ash listed
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'near_mint', false); -- misty private
insert into public.holding_costs (holding_id, owner_id, unit_cost) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 95.00),
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 110.00);
insert into public.listings (id, seller_id, holding_id, price, status) values
  ('f0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000003', 80, 'active'),
  ('f0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'b0000000-0000-0000-0000-000000000001', 120, 'cancelled');

-- ---- anonymous visitor ----
set local role anon;
select is((select count(*)::int from public.profiles), 2, 'anon can read public profiles');
select is((select count(*)::int from public.holdings), 2, 'anon sees only open-to-trade and listed holdings');
select is((select count(*)::int from public.listings), 1, 'anon sees only active listings');
select throws_ok('select * from public.holding_costs', '42501', null, 'anon cannot read costs');
select throws_ok('select * from public.trades', '42501', null, 'anon cannot read trades');
select throws_ok($$insert into public.holdings (owner_id, collectible_id, item_type, condition) values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'near_mint')$$,
  '42501', null, 'anon cannot add holdings');
reset role;

-- ---- ash ----
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is((select count(*)::int from public.holdings where owner_id = '11111111-1111-1111-1111-111111111111'), 3, 'ash sees all his own holdings');
select is((select count(*)::int from public.holdings where owner_id = '22222222-2222-2222-2222-222222222222'), 0, 'ash cannot see misty''s private holding');
select is((select count(*)::int from public.holding_costs), 1, 'ash sees only his own costs');
select is((select count(*)::int from public.listings), 1, 'ash does not see misty''s cancelled listing');
select lives_ok($$insert into public.holdings (owner_id, collectible_id, item_type, condition) values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'damaged')$$,
  'ash can add his own holding');
select throws_ok($$insert into public.holdings (owner_id, collectible_id, item_type, condition) values ('22222222-2222-2222-2222-222222222222', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'near_mint')$$,
  '42501', null, 'ash cannot add a holding to misty''s portfolio');
select throws_ok($$update public.holdings set owner_id = '22222222-2222-2222-2222-222222222222' where id = 'a0000000-0000-0000-0000-000000000001'$$,
  '42501', null, 'ash cannot hand a holding to someone else');
update public.holdings set quantity = 99 where id = 'b0000000-0000-0000-0000-000000000001';
delete from public.holdings where id = 'b0000000-0000-0000-0000-000000000001';
update public.holding_costs set unit_cost = 0 where holding_id = 'b0000000-0000-0000-0000-000000000001';
select throws_ok($$insert into public.holding_costs (holding_id, owner_id, unit_cost) values ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 1)$$,
  '42501', null, 'ash cannot write misty''s costs');
select throws_ok($$insert into public.listings (seller_id, holding_id, price) values ('22222222-2222-2222-2222-222222222222', 'b0000000-0000-0000-0000-000000000001', 5)$$,
  '42501', null, 'ash cannot create a listing as misty');
select throws_ok($$insert into public.listings (seller_id, holding_id, price) values ('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000001', 5)$$,
  '23503', null, 'ash cannot list a holding he does not own');
select lives_ok($$insert into public.listings (seller_id, holding_id, price) values ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', 30)$$,
  'ash can list his own holding');
update public.listings set price = 1 where id = 'f0000000-0000-0000-0000-000000000002';
select lives_ok($$update public.profiles set display_name = 'Ash K.' where id = '11111111-1111-1111-1111-111111111111'$$, 'ash can edit his profile');
update public.profiles set display_name = 'hacked' where id = '22222222-2222-2222-2222-222222222222';
select throws_ok($$update public.profiles set id = '33333333-3333-3333-3333-333333333333' where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501', null, 'profile ids cannot be changed');
select throws_ok($$insert into public.profiles (id, username) values ('33333333-3333-3333-3333-333333333333', 'fake_gary')$$,
  '42501', null, 'ash cannot create a profile for another account');
reset role;
set local request.jwt.claims to '';

-- ---- effects checked as the owner role ----
select is((select quantity from public.holdings where id = 'b0000000-0000-0000-0000-000000000001'), 1, 'misty''s holding was not changed or deleted by ash');
select is((select unit_cost from public.holding_costs where holding_id = 'b0000000-0000-0000-0000-000000000001'), 110.00::numeric, 'misty''s cost was not changed by ash');
select is((select price from public.listings where id = 'f0000000-0000-0000-0000-000000000002'), 120.00::numeric, 'misty''s listing was not changed by ash');
select is((select display_name from public.profiles where id = '22222222-2222-2222-2222-222222222222'), null, 'misty''s profile was not changed by ash');

-- ---- gary signs up ----
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select lives_ok($$insert into public.profiles (id, username) values ('33333333-3333-3333-3333-333333333333', 'gary')$$, 'a new user can create their own profile');
reset role;

select * from finish();
rollback;
