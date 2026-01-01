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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          barter_percentage: number | null
          business_name: string
          category: string
          contact_method: string
          created_at: string
          description: string
          estimated_value: number | null
          id: string
          images: string[] | null
          location: string
          services_offered: string[]
          status: string
          updated_at: string
          user_id: string
          wanting_in_return: string[]
        }
        Insert: {
          barter_percentage?: number | null
          business_name: string
          category: string
          contact_method: string
          created_at?: string
          description: string
          estimated_value?: number | null
          id?: string
          images?: string[] | null
          location: string
          services_offered?: string[]
          status?: string
          updated_at?: string
          user_id: string
          wanting_in_return?: string[]
        }
        Update: {
          barter_percentage?: number | null
          business_name?: string
          category?: string
          contact_method?: string
          created_at?: string
          description?: string
          estimated_value?: number | null
          id?: string
          images?: string[] | null
          location?: string
          services_offered?: string[]
          status?: string
          updated_at?: string
          user_id?: string
          wanting_in_return?: string[]
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          listing_id: string | null
          message_type: string
          read: boolean | null
          recipient_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          listing_id?: string | null
          message_type?: string
          read?: boolean | null
          recipient_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          message_type?: string
          read?: boolean | null
          recipient_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_states: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          provider: string
          state_token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider: string
          state_token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          state_token?: string
          user_id?: string
        }
        Relationships: []
      }
      pos_integrations: {
        Row: {
          access_token: string
          access_token_encrypted: string | null
          auth_method: string | null
          config: Json | null
          created_at: string
          encryption_nonce: string | null
          id: string
          last_sync_at: string | null
          merchant_id: string | null
          provider: string
          refresh_token: string | null
          refresh_token_encrypted: string | null
          scopes: string[] | null
          status: string
          store_id: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          access_token_encrypted?: string | null
          auth_method?: string | null
          config?: Json | null
          created_at?: string
          encryption_nonce?: string | null
          id?: string
          last_sync_at?: string | null
          merchant_id?: string | null
          provider: string
          refresh_token?: string | null
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          status?: string
          store_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          access_token_encrypted?: string | null
          auth_method?: string | null
          config?: Json | null
          created_at?: string
          encryption_nonce?: string | null
          id?: string
          last_sync_at?: string | null
          merchant_id?: string | null
          provider?: string
          refresh_token?: string | null
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          status?: string
          store_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pos_transactions: {
        Row: {
          barter_amount: number | null
          barter_percentage: number | null
          card_amount: number | null
          cash_amount: number | null
          created_at: string
          currency: string
          customer_info: Json | null
          discount_amount: number | null
          external_transaction_id: string
          id: string
          items: Json | null
          location_id: string | null
          merchant_id: string
          payment_methods: Json | null
          pos_integration_id: string | null
          pos_provider: string
          raw_webhook_data: Json | null
          status: string
          synced_at: string | null
          tax_amount: number | null
          tip_amount: number | null
          total_amount: number
          transaction_date: string
          updated_at: string
          webhook_signature: string | null
        }
        Insert: {
          barter_amount?: number | null
          barter_percentage?: number | null
          card_amount?: number | null
          cash_amount?: number | null
          created_at?: string
          currency?: string
          customer_info?: Json | null
          discount_amount?: number | null
          external_transaction_id: string
          id?: string
          items?: Json | null
          location_id?: string | null
          merchant_id: string
          payment_methods?: Json | null
          pos_integration_id?: string | null
          pos_provider: string
          raw_webhook_data?: Json | null
          status?: string
          synced_at?: string | null
          tax_amount?: number | null
          tip_amount?: number | null
          total_amount: number
          transaction_date: string
          updated_at?: string
          webhook_signature?: string | null
        }
        Update: {
          barter_amount?: number | null
          barter_percentage?: number | null
          card_amount?: number | null
          cash_amount?: number | null
          created_at?: string
          currency?: string
          customer_info?: Json | null
          discount_amount?: number | null
          external_transaction_id?: string
          id?: string
          items?: Json | null
          location_id?: string | null
          merchant_id?: string
          payment_methods?: Json | null
          pos_integration_id?: string | null
          pos_provider?: string
          raw_webhook_data?: Json | null
          status?: string
          synced_at?: string | null
          tax_amount?: number | null
          tip_amount?: number | null
          total_amount?: number
          transaction_date?: string
          updated_at?: string
          webhook_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_transactions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pos_transactions_pos_integration_id_fkey"
            columns: ["pos_integration_id"]
            isOneToOne: false
            referencedRelation: "pos_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          barter_enabled: boolean | null
          created_at: string | null
          description: string | null
          id: string
          is_restricted: boolean | null
          name: string
          restriction_reason: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          barter_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_restricted?: boolean | null
          name: string
          restriction_reason?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          barter_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_restricted?: boolean | null
          name?: string
          restriction_reason?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_sync_progress: {
        Row: {
          completed_at: string | null
          current_item_name: string | null
          current_step: string | null
          error: string | null
          error_items: number
          id: string
          pos_integration_id: string | null
          processed_items: number
          skipped_items: number
          started_at: string
          status: string
          synced_items: number
          total_items: number
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          current_item_name?: string | null
          current_step?: string | null
          error?: string | null
          error_items?: number
          id?: string
          pos_integration_id?: string | null
          processed_items?: number
          skipped_items?: number
          started_at?: string
          status?: string
          synced_items?: number
          total_items?: number
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          current_item_name?: string | null
          current_step?: string | null
          error?: string | null
          error_items?: number
          id?: string
          pos_integration_id?: string | null
          processed_items?: number
          skipped_items?: number
          started_at?: string
          status?: string
          synced_items?: number
          total_items?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_sync_progress_pos_integration_id_fkey"
            columns: ["pos_integration_id"]
            isOneToOne: false
            referencedRelation: "pos_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          barter_enabled: boolean | null
          category_id: string | null
          cost: number | null
          created_at: string | null
          currency: string | null
          custom_barter_percentage: number | null
          description: string | null
          external_product_id: string
          external_variant_id: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          is_archived: boolean | null
          last_synced_at: string | null
          low_stock_threshold: number | null
          merchant_id: string
          metadata: Json | null
          name: string
          pos_integration_id: string
          price: number
          show_stock_publicly: boolean | null
          sku: string | null
          stock_quantity: number | null
          sync_error: string | null
          sync_status: string | null
          upc: string | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          barter_enabled?: boolean | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          custom_barter_percentage?: number | null
          description?: string | null
          external_product_id: string
          external_variant_id?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_archived?: boolean | null
          last_synced_at?: string | null
          low_stock_threshold?: number | null
          merchant_id: string
          metadata?: Json | null
          name: string
          pos_integration_id: string
          price?: number
          show_stock_publicly?: boolean | null
          sku?: string | null
          stock_quantity?: number | null
          sync_error?: string | null
          sync_status?: string | null
          upc?: string | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          barter_enabled?: boolean | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          custom_barter_percentage?: number | null
          description?: string | null
          external_product_id?: string
          external_variant_id?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_archived?: boolean | null
          last_synced_at?: string | null
          low_stock_threshold?: number | null
          merchant_id?: string
          metadata?: Json | null
          name?: string
          pos_integration_id?: string
          price?: number
          show_stock_publicly?: boolean | null
          sku?: string | null
          stock_quantity?: number | null
          sync_error?: string | null
          sync_status?: string | null
          upc?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "products_pos_integration_id_fkey"
            columns: ["pos_integration_id"]
            isOneToOne: false
            referencedRelation: "pos_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          barter_percentage: number | null
          bio: string | null
          business_name: string | null
          business_verified: boolean | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          location: string | null
          onboarding_completed: boolean | null
          phone: string | null
          pos_setup_preference: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          barter_percentage?: number | null
          bio?: string | null
          business_name?: string | null
          business_verified?: boolean | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          pos_setup_preference?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          barter_percentage?: number | null
          bio?: string | null
          business_name?: string | null
          business_verified?: boolean | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          pos_setup_preference?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      tax_info: {
        Row: {
          account_number: string | null
          address: string
          business_name: string | null
          business_type: string
          certification_agreed: boolean | null
          city: string
          created_at: string
          exempt_from_backup_withholding: boolean | null
          id: string
          legal_name: string
          llc_classification: string | null
          signature: string | null
          signature_date: string | null
          state: string
          tax_id: string
          tax_id_type: string
          updated_at: string
          user_id: string
          zip_code: string
        }
        Insert: {
          account_number?: string | null
          address: string
          business_name?: string | null
          business_type: string
          certification_agreed?: boolean | null
          city: string
          created_at?: string
          exempt_from_backup_withholding?: boolean | null
          id?: string
          legal_name: string
          llc_classification?: string | null
          signature?: string | null
          signature_date?: string | null
          state: string
          tax_id: string
          tax_id_type: string
          updated_at?: string
          user_id: string
          zip_code: string
        }
        Update: {
          account_number?: string | null
          address?: string
          business_name?: string | null
          business_type?: string
          certification_agreed?: boolean | null
          city?: string
          created_at?: string
          exempt_from_backup_withholding?: boolean | null
          id?: string
          legal_name?: string
          llc_classification?: string | null
          signature?: string | null
          signature_date?: string | null
          state?: string
          tax_id?: string
          tax_id_type?: string
          updated_at?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          points_amount: number
          service_description: string | null
          status: string
          to_user_id: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          points_amount: number
          service_description?: string | null
          status?: string
          to_user_id: string
          transaction_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          points_amount?: number
          service_description?: string | null
          status?: string
          to_user_id?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          available_credits: number
          created_at: string
          earned_credits: number
          id: string
          spent_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_credits?: number
          created_at?: string
          earned_credits?: number
          id?: string
          spent_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_credits?: number
          created_at?: string
          earned_credits?: number
          id?: string
          spent_credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          payload: Json
          provider: string
          signature: string | null
          status: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          payload: Json
          provider: string
          signature?: string | null
          status: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          payload?: Json
          provider?: string
          signature?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      business_listings: {
        Row: {
          barter_percentage: number | null
          business_name: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          location: string | null
          services_offered: string[] | null
          status: string | null
          user_id: string | null
          wanting_in_return: string[] | null
        }
        Insert: {
          barter_percentage?: number | null
          business_name?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location?: string | null
          services_offered?: string[] | null
          status?: string | null
          user_id?: never
          wanting_in_return?: string[] | null
        }
        Update: {
          barter_percentage?: number | null
          business_name?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location?: string | null
          services_offered?: string[] | null
          status?: string | null
          user_id?: never
          wanting_in_return?: string[] | null
        }
        Relationships: []
      }
      products_for_customers: {
        Row: {
          barcode: string | null
          barter_enabled: boolean | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          merchant_id: string | null
          name: string | null
          price: number | null
          sku: string | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          barter_enabled?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          merchant_id?: string | null
          name?: string | null
          price?: number | null
          sku?: string | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          barter_enabled?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          merchant_id?: string | null
          name?: string | null
          price?: number | null
          sku?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      products_with_eligibility: {
        Row: {
          barcode: string | null
          barter_enabled: boolean | null
          category_barter_enabled: boolean | null
          category_id: string | null
          category_is_restricted: boolean | null
          category_name: string | null
          cost: number | null
          created_at: string | null
          currency: string | null
          custom_barter_percentage: number | null
          description: string | null
          effective_barter_percentage: number | null
          external_product_id: string | null
          external_variant_id: string | null
          id: string | null
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          is_archived: boolean | null
          is_barter_eligible: boolean | null
          last_synced_at: string | null
          low_stock_threshold: number | null
          merchant_id: string | null
          metadata: Json | null
          name: string | null
          pos_integration_id: string | null
          pos_provider: string | null
          pos_store_id: string | null
          price: number | null
          restriction_reason: string | null
          sku: string | null
          stock_quantity: number | null
          sync_error: string | null
          sync_status: string | null
          upc: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "products_pos_integration_id_fkey"
            columns: ["pos_integration_id"]
            isOneToOne: false
            referencedRelation: "pos_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      credit_merchant_balance: {
        Args: { p_amount: number; p_merchant_id: string }
        Returns: undefined
      }
      debit_user_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      get_product_barter_eligibility: {
        Args: { product_id: string }
        Returns: {
          barter_percentage: number
          is_eligible: boolean
          reason: string
        }[]
      }
      get_public_profile_info: {
        Args: { profile_user_id: string }
        Returns: {
          full_name: string
          id: string
        }[]
      }
      is_product_available: { Args: { p_product_id: string }; Returns: boolean }
      is_product_restricted: { Args: { product_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
