// App-level aliases for the generated database types (types/database.ts, regenerated with `npm run db:types`).
import type { Database, Enums, Tables, TablesInsert } from './database';

export type { Database };

export type Profile = Tables<'profiles'>;
export type Collectible = Tables<'collectibles'>;
export type Holding = Tables<'holdings'>;
export type HoldingCost = Tables<'holding_costs'>;
export type Listing = Tables<'listings'>;
export type Trade = Tables<'trades'>;
export type TradeItem = Tables<'trade_items'>;

export type NewHolding = TablesInsert<'holdings'>;
export type NewListing = TablesInsert<'listings'>;

export type ItemType = Enums<'item_type'>;
export type CardCondition = Enums<'card_condition'>;
export type GradingCompany = Enums<'grading_company'>;
export type ListingStatus = Enums<'listing_status'>;
export type TradeStatus = Enums<'trade_status'>;
