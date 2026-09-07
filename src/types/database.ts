// Hand-written to match supabase/migrations/*.sql while there is no linked
// Supabase project yet. Once linked, regenerate with:
//   npx supabase gen types typescript --linked > src/types/database.ts
// (see docs/database.md)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: Database['public']['Enums']['user_role']
          phone: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: Database['public']['Enums']['user_role']
          phone?: string | null
          active?: boolean
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: { id?: string; name: string; slug: string }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      brands: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: { id?: string; name: string; slug: string }
        Update: Partial<Database['public']['Tables']['brands']['Insert']>
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category_id: string | null
          brand_id: string | null
          model: string | null
          price: number
          promo_price: number | null
          cost: number | null
          stock: number
          min_stock: number
          sku: string | null
          internal_code: string | null
          status: Database['public']['Enums']['product_status']
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          category_id?: string | null
          brand_id?: string | null
          model?: string | null
          price: number
          promo_price?: number | null
          cost?: number | null
          stock?: number
          min_stock?: number
          sku?: string | null
          internal_code?: string | null
          status?: Database['public']['Enums']['product_status']
          featured?: boolean
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          position: number
          created_at: string
        }
        Insert: { id?: string; product_id: string; url: string; position?: number }
        Update: Partial<Database['public']['Tables']['product_images']['Insert']>
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          cpf: string | null
          auth_user_id: string | null
          points: number
          total_spent: number
          last_purchase_at: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          cpf?: string | null
          auth_user_id?: string | null
          points?: number
          total_spent?: number
          last_purchase_at?: string | null
          status?: string
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      sales: {
        Row: {
          id: string
          customer_id: string
          seller_id: string
          status: Database['public']['Enums']['sale_status']
          subtotal: number
          discount: number
          total: number
          origin: string
          notes: string | null
          points_generated: number
          created_at: string
          confirmed_at: string | null
          cancelled_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          seller_id: string
          status?: Database['public']['Enums']['sale_status']
          subtotal: number
          discount?: number
          total: number
          origin?: string
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['sales']['Insert']>
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string
          quantity: number
          unit_price: number
          discount: number
          subtotal: number
        }
        Insert: {
          id?: string
          sale_id: string
          product_id: string
          quantity: number
          unit_price: number
          discount?: number
          subtotal: number
        }
        Update: Partial<Database['public']['Tables']['sale_items']['Insert']>
      }
      inventory_movements: {
        Row: {
          id: string
          product_id: string
          type: Database['public']['Enums']['inventory_movement_type']
          quantity: number
          reason: string | null
          sale_id: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          type: Database['public']['Enums']['inventory_movement_type']
          quantity: number
          reason?: string | null
          sale_id?: string | null
          user_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['inventory_movements']['Insert']>
      }
      points_transactions: {
        Row: {
          id: string
          customer_id: string
          type: Database['public']['Enums']['points_movement_type']
          points: number
          reason: string
          sale_id: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          type: Database['public']['Enums']['points_movement_type']
          points: number
          reason: string
          sale_id?: string | null
          user_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['points_transactions']['Insert']>
      }
      rewards: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          quantity: number
          points_required: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          quantity?: number
          points_required: number
          status?: string
        }
        Update: Partial<Database['public']['Tables']['rewards']['Insert']>
      }
      point_campaigns: {
        Row: {
          id: string
          name: string
          description: string | null
          min_points: number
          start_date: string
          end_date: string
          status: Database['public']['Enums']['campaign_status']
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          min_points: number
          start_date: string
          end_date: string
          status?: Database['public']['Enums']['campaign_status']
          featured?: boolean
        }
        Update: Partial<Database['public']['Tables']['point_campaigns']['Insert']>
      }
      campaign_rewards: {
        Row: { id: string; campaign_id: string; reward_id: string; created_at: string }
        Insert: { id?: string; campaign_id: string; reward_id: string }
        Update: Partial<Database['public']['Tables']['campaign_rewards']['Insert']>
      }
      raffles: {
        Row: {
          id: string
          name: string
          description: string | null
          reward_id: string | null
          campaign_id: string | null
          raffle_date: string
          status: Database['public']['Enums']['raffle_status']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          reward_id?: string | null
          campaign_id?: string | null
          raffle_date: string
          status?: Database['public']['Enums']['raffle_status']
        }
        Update: Partial<Database['public']['Tables']['raffles']['Insert']>
      }
      raffle_entries: {
        Row: { id: string; raffle_id: string; customer_id: string; created_at: string }
        Insert: { id?: string; raffle_id: string; customer_id: string }
        Update: Partial<Database['public']['Tables']['raffle_entries']['Insert']>
      }
      raffle_winners: {
        Row: {
          id: string
          raffle_id: string
          customer_id: string
          drawn_by: string
          drawn_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          raffle_id: string
          customer_id: string
          drawn_by: string
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['raffle_winners']['Insert']>
      }
      commission_rules: {
        Row: {
          id: string
          name: string
          percentage: number | null
          fixed_value: number | null
          description: string | null
          period_start: string | null
          period_end: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          percentage?: number | null
          fixed_value?: number | null
          description?: string | null
          period_start?: string | null
          period_end?: string | null
          status?: string
        }
        Update: Partial<Database['public']['Tables']['commission_rules']['Insert']>
      }
      commissions: {
        Row: {
          id: string
          sale_id: string
          seller_id: string
          rule_id: string | null
          sale_amount: number
          percentage_applied: number | null
          fixed_value_applied: number | null
          commission_amount: number
          status: Database['public']['Enums']['commission_status']
          period: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sale_id: string
          seller_id: string
          rule_id?: string | null
          sale_amount: number
          percentage_applied?: number | null
          fixed_value_applied?: number | null
          commission_amount: number
          status?: Database['public']['Enums']['commission_status']
          period?: string | null
        }
        Update: Partial<Database['public']['Tables']['commissions']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_table: string
          resource_id: string | null
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_table: string
          resource_id?: string | null
          data?: Json | null
        }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
      site_settings: {
        Row: { key: string; value: Json; updated_at: string }
        Insert: { key: string; value: Json }
        Update: Partial<Database['public']['Tables']['site_settings']['Insert']>
      }
      preorder_campaigns: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          expected_price: number | null
          expected_date: string | null
          discount_percentage: number | null
          reward_id: string | null
          status: Database['public']['Enums']['preorder_status']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          expected_price?: number | null
          expected_date?: string | null
          discount_percentage?: number | null
          reward_id?: string | null
          status?: Database['public']['Enums']['preorder_status']
        }
        Update: Partial<Database['public']['Tables']['preorder_campaigns']['Insert']>
      }
      preorder_signups: {
        Row: {
          id: string
          campaign_id: string
          customer_id: string
          converted: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          customer_id: string
          converted?: boolean
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['preorder_signups']['Insert']>
      }
      home_banners: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          cta_label: string | null
          cta_href: string | null
          image_url: string | null
          image_url_mobile: string | null
          position: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          cta_label?: string | null
          cta_href?: string | null
          image_url?: string | null
          image_url_mobile?: string | null
          position?: number
          active?: boolean
        }
        Update: Partial<Database['public']['Tables']['home_banners']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: {
      register_sale: {
        Args: {
          p_customer_id: string
          p_items: Json
          p_discount?: number
          p_notes?: string | null
          p_origin?: string
        }
        Returns: string
      }
      confirm_sale: { Args: { p_sale_id: string }; Returns: void }
      cancel_sale: { Args: { p_sale_id: string; p_reason?: string | null }; Returns: void }
      complete_sale: { Args: { p_sale_id: string }; Returns: void }
      reverse_sale: { Args: { p_sale_id: string; p_reason: string }; Returns: void }
      adjust_stock: {
        Args: {
          p_product_id: string
          p_type: Database['public']['Enums']['inventory_movement_type']
          p_quantity: number
          p_reason: string
        }
        Returns: void
      }
      get_my_rank: {
        Args: Record<string, never>
        Returns: number
      }
      log_audit: {
        Args: {
          p_action: string
          p_resource_table: string
          p_resource_id: string | null
          p_data?: Json | null
        }
        Returns: void
      }
    }
    Enums: {
      user_role: 'admin' | 'vendedor'
      product_status: 'ativo' | 'inativo'
      sale_status: 'pendente' | 'confirmada' | 'concluida' | 'cancelada' | 'estornada'
      inventory_movement_type:
        | 'entrada'
        | 'saida'
        | 'ajuste'
        | 'venda'
        | 'cancelamento'
        | 'estorno'
      points_movement_type: 'entrada' | 'saida' | 'ajuste' | 'estorno'
      campaign_status: 'rascunho' | 'ativa' | 'encerrada'
      raffle_status: 'aberto' | 'encerrado' | 'cancelado'
      commission_status: 'pendente' | 'aprovada' | 'paga' | 'cancelada'
      preorder_status: 'aberta' | 'encerrada' | 'cancelada'
    }
  }
}
