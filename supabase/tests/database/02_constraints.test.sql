-- Required fields, value ranges, variant rules and referential integrity (run as the table owner).
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ash@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'misty@test.local');
insert into public.profiles (id, username) values
  ('11111111-1111-1111-1111-111111111111', 'ash'),
  ('22222222-2222-2222-2222-222222222222', 'misty');
insert into public.collectibles (id, product_type, name, set_name, card_number) values
  ('c0000000-0000-0000-0000-000000000001', 'card', 'Charizard ex', 'Scarlet & Violet 151', '199/165'),
  ('c0000000-0000-0000-0000-000000000002', 'sealed', 'Evolving Skies Booster Box', 'Evolving Skies', null);
insert into public.holdings (id, owner_id, collectible_id, item_type, condition, quantity) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'near_mint', 2);

-- profiles
select throws_ok($$insert into public.profiles (id, username) values ('22222222-2222-2222-2222-222222222222', 'Bad Name')$$,
  '23514', null, 'username must be lowercase letters, digits or underscores');
select throws_ok($$insert into public.profiles (id, username) values ('22222222-2222-2222-2222-222222222222', 'ash')$$,
  '23505', null, 'usernames are unique');
select throws_ok($$insert into public.profiles (id, username) values ('99999999-9999-9999-9999-999999999999', 'ghost')$$,
  '23503', null, 'a profile needs an auth user');

-- collectibles
select throws_ok($$insert into public.collectibles (product_type, name, external_source) values ('card', 'X', 'scrydex')$$,
  '23514', null, 'external source and id come as a pair');
select throws_ok($$insert into public.collectibles (product_type, name, card_number) values ('sealed', 'Box', '1/100')$$,
  '23514', null, 'sealed products have no card number');
select throws_ok($$insert into public.collectibles (product_type) values ('card')$$,
  '23502', null, 'collectible name is required');

-- holdings: variant rules
select throws_ok($$insert into public.holdings (owner_id, collectible_id, item_type) values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'raw_card')$$,
  '23514', null, 'raw cards need a condition');
select throws_ok($$insert into public.holdings (owner_id, collectible_id, item_type, grading_company) values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'graded_card', 'PSA')$$,
  '23514', null, 'graded cards need a grade');
select throws_ok($$insert into public.holdings (owner_id, collectible_id, item_type, condition, grading_company, grade) values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'graded_card', 'near_mint', 'PSA', 10)$$,
  '23514', null, 'graded cards do not also carry a raw condition');
select throws_ok($$insert into public.holdings (owner_id, collectible_id, item_type, grading_company, grade, quantity) values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'graded_card', 'PSA', 10, 2)$$,
  '23514', null, 'each graded slab is its own holding (quantity 1)');
select throws_ok($$insert into public.holdings (owner_id, collectible_id, item_type, grading_company, grade) values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'graded_card', 'PSA', 9.3)$$,
  '23514', null, 'grades are whole or half steps');
select throws_ok($$insert into public.holdings (owner_id, collectible_id, item_type, grading_company, grade) values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'graded_card', 'PSA', 11)$$,
  '23514', null, 'grades are between 1 and 10');
select throws_ok($$insert into public.holdings (owner_id, collectible_id, item_type, condition, quantity) values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'raw_card', 'near_mint', 0)$$,
  '23514', null, 'quantity must be positive');
select throws_ok($$insert into public.holdings (owner_id, collectible_id, item_type) values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'sealed_product')$$,
  '23514', null, 'a card cannot be held as a sealed product');
select throws_ok($$insert into public.holdings (owner_id, collectible_id, item_type, condition) values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000002', 'raw_card', 'near_mint')$$,
  '23514', null, 'a sealed product cannot be held as a raw card');
select lives_ok($$insert into public.holdings (owner_id, collectible_id, item_type, grading_company, grade, cert_number) values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'graded_card', 'PSA', 9.5, '12345678')$$,
  'a valid graded holding is accepted');

-- money
select throws_ok($$insert into public.holding_costs (holding_id, owner_id, unit_cost) values ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', -1)$$,
  '23514', null, 'unit cost cannot be negative');
select throws_ok($$insert into public.listings (seller_id, holding_id, price) values ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 0)$$,
  '23514', null, 'listing price must be above zero');
select throws_ok($$insert into public.listings (seller_id, holding_id, price) values ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 123456789012.00)$$,
  '22003', null, 'prices beyond numeric(12,2) are rejected, not truncated');
select throws_ok($$insert into public.listings (seller_id, holding_id, price, quantity) values ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 10, 3)$$,
  '23514', null, 'cannot list more than the holding quantity');
select lives_ok($$insert into public.listings (seller_id, holding_id, price) values ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 118.50)$$,
  'a valid listing is accepted');
select throws_ok($$insert into public.listings (seller_id, holding_id, price) values ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 120)$$,
  '23505', null, 'only one active listing per holding');

-- trades
select throws_ok($$insert into public.trades (proposer_id, recipient_id) values ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111')$$,
  '23514', null, 'cannot trade with yourself');
select throws_ok($$insert into public.trades (proposer_id, recipient_id, cash_amount) values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 20)$$,
  '23514', null, 'cash in a trade needs a payer');
select throws_ok($$insert into public.trades (proposer_id, recipient_id, cash_amount, cash_paid_by) values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', -5, 'proposer')$$,
  '23514', null, 'trade cash cannot be negative');

-- referential integrity
-- Postgres 17 reports this as 23503 and Postgres 18 as 23001 (restrict_violation), so match the message
select throws_matching($$delete from public.collectibles where id = 'c0000000-0000-0000-0000-000000000001'$$,
  'violates .*foreign key constraint "holdings_collectible_id_fkey"', 'catalog items that people hold cannot be deleted');
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
select is(
  (select count(*)::int from public.holdings where owner_id = '11111111-1111-1111-1111-111111111111')
  + (select count(*)::int from public.listings where seller_id = '11111111-1111-1111-1111-111111111111'),
  0, 'deleting a user removes their profile, holdings and listings');

select * from finish();
rollback;
