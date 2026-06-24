export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agrovet_products: {
        Row: {
          active: boolean
          agrovet_id: string
          category: Database["public"]["Enums"]["agrovet_category"]
          created_at: string
          description: string | null
          id: string
          image_path: string | null
          name: string
          price_kes: number
          stock: number
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          agrovet_id: string
          category: Database["public"]["Enums"]["agrovet_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          name: string
          price_kes: number
          stock?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          agrovet_id?: string
          category?: Database["public"]["Enums"]["agrovet_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          name?: string
          price_kes?: number
          stock?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string
          farm_id: string | null
          id: string
          message: string
          payload: Json
          read_at: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_id?: string | null
          id?: string
          message: string
          payload?: Json
          read_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          farm_id?: string | null
          id?: string
          message?: string
          payload?: Json
          read_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          type?: Database["public"]["Enums"]["alert_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          last_message_at: string
          listing_id: string
          seller_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id: string
          seller_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnoses: {
        Row: {
          confidence: string | null
          created_at: string
          diagnosis: string
          farm_id: string
          id: string
          image_path: string | null
          raw_response: Json | null
          subject_name: string | null
          subject_type: string
          treatment: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: string | null
          created_at?: string
          diagnosis: string
          farm_id: string
          id?: string
          image_path?: string | null
          raw_response?: Json | null
          subject_name?: string | null
          subject_type: string
          treatment?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: string | null
          created_at?: string
          diagnosis?: string
          farm_id?: string
          id?: string
          image_path?: string | null
          raw_response?: Json | null
          subject_name?: string | null
          subject_type?: string
          treatment?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_activities: {
        Row: {
          cost_kes: number | null
          created_at: string
          farm_id: string
          id: string
          notes: string | null
          occurred_at: string
          quantity: number | null
          title: string
          type: Database["public"]["Enums"]["farm_activity_type"]
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_kes?: number | null
          created_at?: string
          farm_id: string
          id?: string
          notes?: string | null
          occurred_at?: string
          quantity?: number | null
          title: string
          type: Database["public"]["Enums"]["farm_activity_type"]
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_kes?: number | null
          created_at?: string
          farm_id?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          quantity?: number | null
          title?: string
          type?: Database["public"]["Enums"]["farm_activity_type"]
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_activities_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          created_at: string
          crops: string[] | null
          hectares: number | null
          id: string
          livestock: string[] | null
          location: string | null
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          crops?: string[] | null
          hectares?: number | null
          id?: string
          livestock?: string[] | null
          location?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          crops?: string[] | null
          hectares?: number | null
          id?: string
          livestock?: string[] | null
          location?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          category: Database["public"]["Enums"]["listing_category"]
          created_at: string
          currency: string | null
          description: string | null
          farm_id: string
          id: string
          image_path: string | null
          location: string | null
          price: number | null
          quantity: number | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["listing_category"]
          created_at?: string
          currency?: string | null
          description?: string | null
          farm_id: string
          id?: string
          image_path?: string | null
          location?: string | null
          price?: number | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["listing_category"]
          created_at?: string
          currency?: string | null
          description?: string | null
          farm_id?: string
          id?: string
          image_path?: string | null
          location?: string | null
          price?: number | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      market_prices: {
        Row: {
          created_at: string
          crop: string
          currency: string
          id: string
          market: string | null
          observed_at: string
          price: number
          unit: string
        }
        Insert: {
          created_at?: string
          crop: string
          currency?: string
          id?: string
          market?: string | null
          observed_at?: string
          price: number
          unit?: string
        }
        Update: {
          created_at?: string
          crop?: string
          currency?: string
          id?: string
          market?: string | null
          observed_at?: string
          price?: number
          unit?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          name: string
          order_id: string
          product_id: string | null
          quantity: number
          subtotal_kes: number
          unit_price_kes: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_id: string
          product_id?: string | null
          quantity: number
          subtotal_kes: number
          unit_price_kes: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          subtotal_kes?: number
          unit_price_kes?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "agrovet_products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          agrovet_id: string
          buyer_id: string
          contact_phone: string | null
          created_at: string
          delivery_notes: string | null
          id: string
          status: Database["public"]["Enums"]["order_status"]
          total_kes: number
          updated_at: string
        }
        Insert: {
          agrovet_id: string
          buyer_id: string
          contact_phone?: string | null
          created_at?: string
          delivery_notes?: string | null
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_kes?: number
          updated_at?: string
        }
        Update: {
          agrovet_id?: string
          buyer_id?: string
          contact_phone?: string | null
          created_at?: string
          delivery_notes?: string | null
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_kes?: number
          updated_at?: string
        }
        Relationships: []
      }
      price_alert_prefs: {
        Row: {
          active: boolean
          created_at: string
          crop: string
          currency: string
          direction: Database["public"]["Enums"]["price_direction"]
          id: string
          target_price: number
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          crop: string
          currency?: string
          direction?: Database["public"]["Enums"]["price_direction"]
          id?: string
          target_price: number
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          crop?: string
          currency?: string
          direction?: Database["public"]["Enums"]["price_direction"]
          id?: string
          target_price?: number
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          language: string | null
          phone: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          language?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          agrovet_id: string
          buyer_id: string
          contact_phone: string | null
          created_at: string
          id: string
          message: string | null
          product_id: string
          quantity: number
          quoted_note: string | null
          quoted_price_kes: number | null
          status: string
          updated_at: string
        }
        Insert: {
          agrovet_id: string
          buyer_id: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          message?: string | null
          product_id: string
          quantity: number
          quoted_note?: string | null
          quoted_price_kes?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          agrovet_id?: string
          buyer_id?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          message?: string | null
          product_id?: string
          quantity?: number
          quoted_note?: string | null
          quoted_price_kes?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "agrovet_products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      agrovet_category:
        | "seed"
        | "fertilizer"
        | "pesticide"
        | "feed"
        | "equipment"
        | "other"
      alert_severity: "info" | "warning" | "critical"
      alert_type: "weather" | "price"
      app_role: "admin" | "agrovet" | "buyer"
      farm_activity_type:
        | "planting"
        | "harvest"
        | "treatment"
        | "fertilizer"
        | "irrigation"
        | "pest_control"
        | "vaccination"
        | "sale"
        | "other"
      listing_category:
        | "vegetable"
        | "fruit"
        | "staple"
        | "livestock"
        | "dairy"
        | "other"
      listing_status: "active" | "sold" | "draft"
      order_status: "pending" | "confirmed" | "cancelled" | "fulfilled"
      price_direction: "above" | "below"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agrovet_category: [
        "seed",
        "fertilizer",
        "pesticide",
        "feed",
        "equipment",
        "other",
      ],
      alert_severity: ["info", "warning", "critical"],
      alert_type: ["weather", "price"],
      app_role: ["admin", "agrovet", "buyer"],
      farm_activity_type: [
        "planting",
        "harvest",
        "treatment",
        "fertilizer",
        "irrigation",
        "pest_control",
        "vaccination",
        "sale",
        "other",
      ],
      listing_category: [
        "vegetable",
        "fruit",
        "staple",
        "livestock",
        "dairy",
        "other",
      ],
      listing_status: ["active", "sold", "draft"],
      order_status: ["pending", "confirmed", "cancelled", "fulfilled"],
      price_direction: ["above", "below"],
    },
  },
} as const
