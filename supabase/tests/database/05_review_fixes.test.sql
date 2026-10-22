-- Regression tests for the security audit and code review of the first migration.
-- ash = 1111..., misty = 2222...
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ash@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'misty@test.local');
insert into public.profiles (id, username) values
  ('11111111-1111-1111-1111-111111111111', 'ash'),
  ('22222222-2222-2222-2222-222222222222', 'misty');
insert into public.collectibles (id, product_type, name) values
  ('c0000000-0000-0000-0000-000000000001', 'card', 'Charizard ex'),
  ('c0000000-0000-0000-0000-000000000002', 'card', 'Mew ex');
insert into public.holdings (id, owner_id, collectible_id, item_type, condition, quantity, open_to_trade) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'near_mint', 3, false),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'lightly_played', 1, false),
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'near_mint', 1, true),
  ('b0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'c0000000-0000-0000-0000-000000000002', 'raw_card', 'near_mint', 1, true);
insert into public.listings (seller_id, holding_id, price, quantity) values
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 100, 3);

-- ---- propose_trade creates a trade and its items in one call ----
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select isnt(public.propose_trade('22222222-2222-2222-2222-222222222222',
  '[{"holding_id":"a0000000-0000-0000-0000-000000000002","side":"proposer"},{"holding_id":"b0000000-0000-0000-0000-000000000001","side":"recipient"}]'::jsonb),
  null, 'propose_trade returns the new trade id');
select is((select count(*)::int from public.trade_items ti join public.trades t on t.id = ti.trade_id
           where t.proposer_id = '11111111-1111-1111-1111-111111111111'), 2, 'propose_trade stored both items');
select throws_ok($$select public.propose_trade('22222222-2222-2222-2222-222222222222', '[]'::jsonb)$$,
  '22023', null, 'propose_trade rejects a trade with no items');
reset role;

set local role anon;
select throws_ok($$select public.propose_trade('22222222-2222-2222-2222-222222222222', '[{"holding_id":"b0000000-0000-0000-0000-000000000001","side":"recipient"}]'::jsonb)$$,
  '42501', null, 'anonymous visitors cannot call propose_trade');
reset role;

-- ---- only one counter offer per trade ----
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
insert into public.trades (id, proposer_id, recipient_id) values ('d0000000-0000-0000-0000-000000000020', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111');
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok($$insert into public.trades (id, proposer_id, recipient_id, counter_of) values ('d0000000-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'd0000000-0000-0000-0000-000000000020')$$,
  'ash counters misty''s offer');
select throws_ok($$insert into public.trades (proposer_id, recipient_id, counter_of) values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'd0000000-0000-0000-0000-000000000020')$$,
  '23514', null, 'a trade can only be countered once');

-- ---- limit on pending offers to one user (ash already has 2 pending to misty) ----
insert into public.trades (id, proposer_id, recipient_id) values
  ('d0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('d0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('d0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
select throws_ok($$insert into public.trades (proposer_id, recipient_id) values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')$$,
  '23514', null, 'a sixth pending offer to the same user is refused');
reset role;

-- ---- terms are fixed once a trade has been sent ----
alter table public.trades disable trigger trades_enforce_transition;
update public.trades set created_at = now() - interval '1 hour' where id = 'd0000000-0000-0000-0000-000000000001';
alter table public.trades enable trigger trades_enforce_transition;
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok($$insert into public.trade_items (trade_id, holding_id, owner_id, side) values ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'recipient')$$,
  '23514', null, 'items cannot be added to a trade after it was sent');
reset role;

-- ---- after misty declines, she can make her holding private and delete it ----
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok($$update public.trades set status = 'declined'
  where id = (select trade_id from public.trade_items where holding_id = 'b0000000-0000-0000-0000-000000000001')$$, 'misty declines ash''s offer');
update public.holdings set open_to_trade = false where id = 'b0000000-0000-0000-0000-000000000001';
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is((select count(*)::int from public.holdings where id = 'b0000000-0000-0000-0000-000000000001'), 0,
  'after a declined trade, ash no longer sees misty''s now-private holding');
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok($$delete from public.holdings where id = 'b0000000-0000-0000-0000-000000000001'$$,
  'a holding from a finished trade can be deleted by its owner');
reset role;

-- ---- holdings: quantity vs listings, one row per variant, server-managed columns ----
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok($$update public.holdings set quantity = 1 where id = 'a0000000-0000-0000-0000-000000000001'$$,
  '23514', null, 'cannot drop below the quantity of an active listing');
select throws_ok($$insert into public.holdings (owner_id, collectible_id, item_type, condition) values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'near_mint')$$,
  '23505', null, 'the same raw variant is one holding with a quantity, not two rows');
select lives_ok($$insert into public.holdings (owner_id, collectible_id, item_type, grading_company, grade) values
  ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'graded_card', 'PSA', 10),
  ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'graded_card', 'PSA', 10)$$,
  'two identical graded slabs are two holdings');
select throws_ok($$insert into public.listings (seller_id, holding_id, price, status) values ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', 5, 'sold')$$,
  '42501', null, 'clients cannot set a listing''s status when creating it');
select throws_ok($$insert into public.trades (proposer_id, recipient_id, responded_at) values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', now())$$,
  '42501', null, 'clients cannot set server-managed trade fields');
select throws_ok($$insert into public.holdings (owner_id, collectible_id, item_type, condition, created_at) values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000002', 'raw_card', 'damaged', now() - interval '1 year')$$,
  '42501', null, 'clients cannot backdate rows');
reset role;
set local request.jwt.claims to '';

-- ---- a future ownership transfer cannot carry the seller's cost along ----
-- a9 has a cost row and nothing else (no listing, no trade), so only the cost row can block the change
insert into public.holdings (id, owner_id, collectible_id, item_type, condition) values
  ('a0000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000002', 'raw_card', 'heavily_played');
insert into public.holding_costs (holding_id, owner_id, unit_cost) values
  ('a0000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 40);
select throws_ok($$update public.holdings set owner_id = '22222222-2222-2222-2222-222222222222' where id = 'a0000000-0000-0000-0000-000000000009'$$,
  '23503', null, 'changing a holding''s owner is blocked while its private cost row exists');

-- ---- deleting an account works even with a pending trade ----
insert into public.trades (id, proposer_id, recipient_id) values ('d0000000-0000-0000-0000-000000000030', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111');
insert into public.trade_items (trade_id, holding_id, owner_id, side) values ('d0000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'proposer');
select lives_ok($$delete from auth.users where id = '22222222-2222-2222-2222-222222222222'$$,
  'an account with a pending trade can still be deleted');
select is((select count(*)::int from public.trades where '22222222-2222-2222-2222-222222222222' in (proposer_id, recipient_id)), 0,
  'the deleted account''s trades are gone');

select * from finish();
rollback;
