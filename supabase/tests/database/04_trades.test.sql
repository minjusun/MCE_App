-- Trades: proposing, item ownership, visibility, allowed status transitions and counter offers.
-- ash = 1111... (proposer), misty = 2222... (recipient), brock = 3333... (outsider)
begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ash@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'misty@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'brock@test.local');
insert into public.profiles (id, username) values
  ('11111111-1111-1111-1111-111111111111', 'ash'),
  ('22222222-2222-2222-2222-222222222222', 'misty'),
  ('33333333-3333-3333-3333-333333333333', 'brock');
insert into public.collectibles (id, product_type, name) values ('c0000000-0000-0000-0000-000000000001', 'card', 'Charizard ex');
insert into public.holdings (id, owner_id, collectible_id, item_type, condition, quantity, open_to_trade) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'near_mint', 1, false),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'lightly_played', 2, false),
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'near_mint', 1, true),
  ('b0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'damaged', 1, false);

-- ---- ash proposes trade 1 to misty ----
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok($$insert into public.trades (id, proposer_id, recipient_id, cash_amount, cash_paid_by) values ('d0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 20, 'proposer')$$,
  'ash can propose a trade');
select lives_ok($$insert into public.trade_items (trade_id, holding_id, owner_id, side) values ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'proposer')$$,
  'ash can offer his own holding');
select lives_ok($$insert into public.trade_items (trade_id, holding_id, owner_id, side) values ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'recipient')$$,
  'ash can request misty''s open-to-trade holding');
select throws_ok($$insert into public.trade_items (trade_id, holding_id, owner_id, side) values ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'recipient')$$,
  '23503', null, 'ash cannot request a holding misty has not opened to trade');
select throws_ok($$insert into public.trade_items (trade_id, holding_id, owner_id, side) values ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'recipient')$$,
  '23514', null, 'an item must come from the party on its side of the trade');
select throws_ok($$insert into public.trade_items (trade_id, holding_id, owner_id, side, quantity) values ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'proposer', 5)$$,
  '23514', null, 'cannot offer more than you hold');
select throws_ok($$insert into public.trades (proposer_id, recipient_id) values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111')$$,
  '42501', null, 'ash cannot propose a trade as misty');
select throws_ok($$insert into public.trades (proposer_id, recipient_id, status) values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'accepted')$$,
  '42501', null, 'clients cannot choose a new trade''s status (it always starts pending)');
select throws_ok($$update public.trades set status = 'accepted' where id = 'd0000000-0000-0000-0000-000000000001'$$,
  '42501', null, 'the proposer cannot accept his own offer');
select throws_ok($$delete from public.holdings where id = 'a0000000-0000-0000-0000-000000000001'$$,
  '23503', null, 'a holding in a trade cannot be deleted');
reset role;

-- ---- brock is not part of the trade ----
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is((select count(*)::int from public.trades), 0, 'outsiders cannot see the trade');
select is((select count(*)::int from public.trade_items), 0, 'outsiders cannot see trade items');
update public.trades set status = 'declined' where id = 'd0000000-0000-0000-0000-000000000001';
reset role;

-- ---- misty responds ----
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is((select status::text from public.trades where id = 'd0000000-0000-0000-0000-000000000001'), 'pending', 'an outsider could not change the trade');
select is((select count(*)::int from public.trade_items where trade_id = 'd0000000-0000-0000-0000-000000000001'), 2, 'misty sees both items');
select is((select count(*)::int from public.holdings where id = 'a0000000-0000-0000-0000-000000000001'), 1, 'misty can see the private holding ash offered her');
select throws_ok($$update public.trades set cash_amount = 500 where id = 'd0000000-0000-0000-0000-000000000001'$$,
  '42501', null, 'the terms of a trade cannot be edited');
select lives_ok($$update public.trades set status = 'accepted' where id = 'd0000000-0000-0000-0000-000000000001'$$, 'misty can accept');
select isnt((select responded_at from public.trades where id = 'd0000000-0000-0000-0000-000000000001'), null, 'the response time is recorded');
select throws_ok($$update public.trades set status = 'declined' where id = 'd0000000-0000-0000-0000-000000000001'$$,
  '23514', null, 'an accepted trade cannot change again');
reset role;

-- ---- counter offers ----
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
insert into public.trades (id, proposer_id, recipient_id) values ('d0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
insert into public.trade_items (trade_id, holding_id, owner_id, side, quantity) values ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'proposer', 2);
select throws_ok($$insert into public.trade_items (trade_id, holding_id, owner_id, side) values ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'proposer')$$,
  '23514', null, 'items cannot be added after a trade is accepted');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok($$insert into public.trades (id, proposer_id, recipient_id, counter_of) values ('d0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'd0000000-0000-0000-0000-000000000002')$$,
  'misty can counter ash''s offer');
select is((select status::text from public.trades where id = 'd0000000-0000-0000-0000-000000000002'), 'countered', 'the original offer is marked countered');
select throws_ok($$insert into public.trades (proposer_id, recipient_id, counter_of) values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'd0000000-0000-0000-0000-000000000001')$$,
  '23514', null, 'a closed trade cannot be countered');
select throws_ok($$update public.trades set status = 'accepted' where id = 'd0000000-0000-0000-0000-000000000003'$$,
  '42501', null, 'misty cannot accept her own counter offer');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok($$update public.trades set status = 'accepted' where id = 'd0000000-0000-0000-0000-000000000003'$$,
  '23514', null, 'a trade with no items cannot be accepted');
reset role;

-- ash offers 2 copies, then ends up holding only 1 before misty accepts
insert into public.trades (id, proposer_id, recipient_id) values ('d0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
insert into public.trade_items (trade_id, holding_id, owner_id, side, quantity) values ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'proposer', 2);
update public.holdings set quantity = 1 where id = 'a0000000-0000-0000-0000-000000000002';
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok($$update public.trades set status = 'accepted' where id = 'd0000000-0000-0000-0000-000000000004'$$,
  '23514', null, 'cannot accept when the offered quantity is no longer held');
reset role;

select * from finish();
rollback;
