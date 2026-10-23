
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "collectibles": {
                  Row: {
                    "card_number": string | null,"created_at": string,"external_id": string | null,"external_source": string | null,"game": string,"id": string,"image_url": string | null,"name": string,"product_type": Database["public"]['Enums']["product_type"],"set_name": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "card_number"?: string | null,"created_at"?: string,"external_id"?: string | null,"external_source"?: string | null,"game"?: string,"id"?: string,"image_url"?: string | null,"name": string,"product_type": Database["public"]['Enums']["product_type"],"set_name"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "card_number"?: string | null,"created_at"?: string,"external_id"?: string | null,"external_source"?: string | null,"game"?: string,"id"?: string,"image_url"?: string | null,"name"?: string,"product_type"?: Database["public"]['Enums']["product_type"],"set_name"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"holding_costs": {
                  Row: {
                    "acquired_on": string | null,"created_at": string,"holding_id": string,"owner_id": string,"unit_cost": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "acquired_on"?: string | null,"created_at"?: string,"holding_id": string,"owner_id": string,"unit_cost"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "acquired_on"?: string | null,"created_at"?: string,"holding_id"?: string,"owner_id"?: string,"unit_cost"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "holding_costs_holding_id_owner_id_fkey"
      columns: ["holding_id","owner_id"]
isOneToOne: false
      referencedRelation: "holdings"
      referencedColumns: ["id","owner_id"]
    }
                  ]
                },"holdings": {
                  Row: {
                    "cert_number": string | null,"collectible_id": string,"condition": Database["public"]['Enums']["card_condition"] | null,"created_at": string,"grade": number | null,"grading_company": Database["public"]['Enums']["grading_company"] | null,"id": string,"item_type": Database["public"]['Enums']["item_type"],"open_to_trade": boolean,"owner_id": string,"quantity": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cert_number"?: string | null,"collectible_id": string,"condition"?: Database["public"]['Enums']["card_condition"] | null,"created_at"?: string,"grade"?: number | null,"grading_company"?: Database["public"]['Enums']["grading_company"] | null,"id"?: string,"item_type": Database["public"]['Enums']["item_type"],"open_to_trade"?: boolean,"owner_id": string,"quantity"?: number,"updated_at"?: string
                  }
                  Update: {
                    "cert_number"?: string | null,"collectible_id"?: string,"condition"?: Database["public"]['Enums']["card_condition"] | null,"created_at"?: string,"grade"?: number | null,"grading_company"?: Database["public"]['Enums']["grading_company"] | null,"id"?: string,"item_type"?: Database["public"]['Enums']["item_type"],"open_to_trade"?: boolean,"owner_id"?: string,"quantity"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "holdings_collectible_id_fkey"
      columns: ["collectible_id"]
isOneToOne: false
      referencedRelation: "collectibles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "holdings_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"listings": {
                  Row: {
                    "created_at": string,"description": string | null,"holding_id": string,"id": string,"price": number,"quantity": number,"seller_id": string,"status": Database["public"]['Enums']["listing_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"holding_id": string,"id"?: string,"price": number,"quantity"?: number,"seller_id": string,"status"?: Database["public"]['Enums']["listing_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"holding_id"?: string,"id"?: string,"price"?: number,"quantity"?: number,"seller_id"?: string,"status"?: Database["public"]['Enums']["listing_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "listings_holding_id_seller_id_fkey"
      columns: ["holding_id","seller_id"]
isOneToOne: false
      referencedRelation: "holdings"
      referencedColumns: ["id","owner_id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"display_name": string | null,"id": string,"updated_at": string,"username": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"updated_at"?: string,"username": string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"updated_at"?: string,"username"?: string
                  }
                  Relationships: [
                    
                  ]
                },"trade_items": {
                  Row: {
                    "created_at": string,"holding_id": string,"id": string,"owner_id": string,"quantity": number,"side": Database["public"]['Enums']["trade_party"],"trade_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"holding_id": string,"id"?: string,"owner_id": string,"quantity"?: number,"side": Database["public"]['Enums']["trade_party"],"trade_id": string
                  }
                  Update: {
                    "created_at"?: string,"holding_id"?: string,"id"?: string,"owner_id"?: string,"quantity"?: number,"side"?: Database["public"]['Enums']["trade_party"],"trade_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trade_items_holding_id_owner_id_fkey"
      columns: ["holding_id","owner_id"]
isOneToOne: false
      referencedRelation: "holdings"
      referencedColumns: ["id","owner_id"]
    },{
      foreignKeyName: "trade_items_trade_id_fkey"
      columns: ["trade_id"]
isOneToOne: false
      referencedRelation: "trades"
      referencedColumns: ["id"]
    }
                  ]
                },"trades": {
                  Row: {
                    "cash_amount": number,"cash_paid_by": Database["public"]['Enums']["trade_party"] | null,"counter_of": string | null,"created_at": string,"id": string,"message": string | null,"proposer_id": string,"recipient_id": string,"responded_at": string | null,"status": Database["public"]['Enums']["trade_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cash_amount"?: number,"cash_paid_by"?: Database["public"]['Enums']["trade_party"] | null,"counter_of"?: string | null,"created_at"?: string,"id"?: string,"message"?: string | null,"proposer_id": string,"recipient_id": string,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["trade_status"],"updated_at"?: string
                  }
                  Update: {
                    "cash_amount"?: number,"cash_paid_by"?: Database["public"]['Enums']["trade_party"] | null,"counter_of"?: string | null,"created_at"?: string,"id"?: string,"message"?: string | null,"proposer_id"?: string,"recipient_id"?: string,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["trade_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trades_counter_of_fkey"
      columns: ["counter_of"]
isOneToOne: false
      referencedRelation: "trades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trades_proposer_id_fkey"
      columns: ["proposer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trades_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "propose_trade":
{ Args: { "p_cash_amount"?: number,"p_cash_paid_by"?: Database["public"]['Enums']["trade_party"],"p_counter_of"?: string,"p_items": Json,"p_message"?: string,"p_recipient": string }; Returns: string
                           }
          }
          Enums: {
            "card_condition": "near_mint"|"lightly_played"|"moderately_played"|"heavily_played"|"damaged","grading_company": "PSA"|"BGS"|"CGC"|"SGC"|"TAG","item_type": "raw_card"|"graded_card"|"sealed_product","listing_status": "active"|"sold"|"cancelled","product_type": "card"|"sealed","trade_party": "proposer"|"recipient","trade_status": "pending"|"accepted"|"declined"|"cancelled"|"countered"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "card_condition": ["near_mint", "lightly_played", "moderately_played", "heavily_played", "damaged"],"grading_company": ["PSA", "BGS", "CGC", "SGC", "TAG"],"item_type": ["raw_card", "graded_card", "sealed_product"],"listing_status": ["active", "sold", "cancelled"],"product_type": ["card", "sealed"],"trade_party": ["proposer", "recipient"],"trade_status": ["pending", "accepted", "declined", "cancelled", "countered"]
          }
        }
} as const
