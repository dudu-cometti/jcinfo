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
          condition: Database['public']['Enums']['product_condition']
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
          condition?: Database['public']['Enums']['product_condition']
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          color_name: string
          color_hex: string | null
          price: number
          promo_price: number | null
          stock: number
          sku: string | null
          position: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          color_name: string
          color_hex?: string | null
          price: number
          promo_price?: number | null
          stock?: number
          sku?: string | null
          position?: number
          status?: string
        }
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          variant_id: string | null
          url: string
          position: number
          created_at: string
        }
        Insert: { id?: string; product_id: string; variant_id?: string | null; url: string; position?: number }
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
          orcamento_id: string | null
          freight_value: number
          machine_id: string | null
          payment_method: Database['public']['Enums']['payment_method'] | null
          installments: number | null
          percentage_applied: number | null
          fixed_value_applied: number | null
          card_brand_applied: string | null
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
          show_text_overlay: boolean
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
          show_text_overlay?: boolean
        }
        Update: Partial<Database['public']['Tables']['home_banners']['Insert']>
      }
      payment_machines: {
        Row: {
          id: string
          name: string
          provider_key: string
          min_installments: number
          max_installments: number
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          provider_key?: string
          min_installments?: number
          max_installments?: number
          status?: string
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['payment_machines']['Insert']>
      }
      payment_rate_rules: {
        Row: {
          id: string
          machine_id: string
          channel: Database['public']['Enums']['payment_channel']
          card_brand: string | null
          method: Database['public']['Enums']['payment_method']
          installments: number
          percentage: number
          fixed_value: number | null
          settlement_days: number | null
          infinite_nitro: boolean
          revenue_tier: string | null
          fee_passed_to_customer: boolean
          period_start: string | null
          period_end: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          machine_id: string
          channel?: Database['public']['Enums']['payment_channel']
          card_brand?: string | null
          method: Database['public']['Enums']['payment_method']
          installments?: number
          percentage?: number
          fixed_value?: number | null
          settlement_days?: number | null
          infinite_nitro?: boolean
          revenue_tier?: string | null
          fee_passed_to_customer?: boolean
          period_start?: string | null
          period_end?: string | null
          status?: string
        }
        Update: Partial<Database['public']['Tables']['payment_rate_rules']['Insert']>
      }
      stock_receipts: {
        Row: {
          id: string
          supplier_name: string
          document_number: string | null
          received_at: string
          notes: string | null
          created_by: string
          created_at: string
          reversed_at: string | null
          reversed_by: string | null
          reversal_reason: string | null
        }
        Insert: {
          id?: string
          supplier_name: string
          document_number?: string | null
          received_at?: string
          notes?: string | null
          created_by: string
        }
        Update: Partial<Database['public']['Tables']['stock_receipts']['Insert']>
      }
      stock_receipt_items: {
        Row: {
          id: string
          receipt_id: string
          product_id: string
          variant_id: string | null
          quantity: number
          unit_cost: number
        }
        Insert: {
          id?: string
          receipt_id: string
          product_id: string
          variant_id?: string | null
          quantity: number
          unit_cost: number
        }
        Update: Partial<Database['public']['Tables']['stock_receipt_items']['Insert']>
      }
      orcamentos: {
        Row: {
          id: string
          seller_id: string
          customer_id: string | null
          customer_name_snapshot: string
          status: Database['public']['Enums']['orcamento_status']
          subtotal: number
          discount: number
          freight_value: number
          base_value: number
          machine_id: string | null
          machine_name_snapshot: string | null
          rate_rule_id: string | null
          payment_method: Database['public']['Enums']['payment_method'] | null
          installments: number
          percentage_applied: number | null
          fixed_value_applied: number | null
          rate_period_start: string | null
          rate_period_end: string | null
          card_brand_snapshot: string | null
          final_value: number
          installment_value: number | null
          last_installment_value: number | null
          validity_days: number
          expires_at: string | null
          notes: string | null
          converted_sale_id: string | null
          cancelled_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          customer_id?: string | null
          customer_name_snapshot: string
          status?: Database['public']['Enums']['orcamento_status']
          subtotal?: number
          discount?: number
          freight_value?: number
          base_value?: number
          machine_id?: string | null
          machine_name_snapshot?: string | null
          rate_rule_id?: string | null
          payment_method?: Database['public']['Enums']['payment_method'] | null
          installments?: number
          percentage_applied?: number | null
          fixed_value_applied?: number | null
          rate_period_start?: string | null
          rate_period_end?: string | null
          final_value?: number
          installment_value?: number | null
          last_installment_value?: number | null
          validity_days?: number
          expires_at?: string | null
          notes?: string | null
          cancelled_reason?: string | null
        }
        Update: Partial<Database['public']['Tables']['orcamentos']['Insert']> & {
          status?: Database['public']['Enums']['orcamento_status']
          converted_sale_id?: string | null
        }
      }
      orcamento_items: {
        Row: {
          id: string
          orcamento_id: string
          product_id: string | null
          variant_id: string | null
          product_name_snapshot: string
          variant_color_snapshot: string | null
          image_url_snapshot: string | null
          unit_price_snapshot: number
          quantity: number
          subtotal_snapshot: number
          stock_available_at_creation: number | null
          position: number
        }
        Insert: {
          id?: string
          orcamento_id: string
          product_id?: string | null
          variant_id?: string | null
          product_name_snapshot: string
          variant_color_snapshot?: string | null
          image_url_snapshot?: string | null
          unit_price_snapshot: number
          quantity: number
          subtotal_snapshot: number
          stock_available_at_creation?: number | null
          position?: number
        }
        Update: Partial<Database['public']['Tables']['orcamento_items']['Insert']>
      }
      orcamento_share_tokens: {
        Row: {
          id: string
          orcamento_id: string
          token: string
          revoked: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          orcamento_id: string
          token: string
          revoked?: boolean
          created_by: string
        }
        Update: Partial<Database['public']['Tables']['orcamento_share_tokens']['Insert']>
      }
    }
    Views: {
      products_public_v: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category_id: string | null
          brand_id: string | null
          model: string | null
          condition: Database['public']['Enums']['product_condition']
          price: number
          promo_price: number | null
          stock: number
          min_stock: number
          sku: string | null
          status: Database['public']['Enums']['product_status']
          featured: boolean
          created_at: string
          updated_at: string
        }
      }
    }
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
      receive_stock: {
        Args: {
          p_supplier_name: string
          p_items: Json
          p_document_number?: string | null
          p_received_at?: string
          p_notes?: string | null
        }
        Returns: string
      }
      convert_orcamento_to_sale: {
        Args: { p_orcamento_id: string }
        Returns: string
      }
      get_orcamento_snapshot_by_token: {
        Args: { p_token: string }
        Returns: {
          orcamento_id: string
          customer_name_snapshot: string
          created_at: string
          expires_at: string | null
          status: Database['public']['Enums']['orcamento_status']
          subtotal: number
          discount: number
          freight_value: number
          final_value: number
          machine_name_snapshot: string | null
          payment_method: Database['public']['Enums']['payment_method'] | null
          installments: number
          installment_value: number | null
          last_installment_value: number | null
        }[]
      }
      get_orcamento_items_by_token: {
        Args: { p_token: string }
        Returns: {
          product_name_snapshot: string
          variant_color_snapshot: string | null
          image_url_snapshot: string | null
          unit_price_snapshot: number
          quantity: number
          subtotal_snapshot: number
        }[]
      }
      check_rate_limit: {
        Args: { p_bucket_key: string; p_max_hits: number; p_window_seconds: number }
        Returns: boolean
      }
      check_lead_rate_limit: { Args: { p_ip: string }; Returns: boolean }
      check_preorder_rate_limit: { Args: { p_ip: string }; Returns: boolean }
      check_raffle_rate_limit: { Args: { p_ip: string }; Returns: boolean }
      check_orcamento_image_rate_limit: { Args: { p_ip: string }; Returns: boolean }
      create_orcamento: {
        Args: {
          p_customer_id: string
          p_items: Json
          p_discount?: number
          p_freight_value?: number
          p_machine_id?: string | null
          p_payment_method?: Database['public']['Enums']['payment_method']
          p_card_brand?: string | null
          p_installments?: number
          p_validity_days?: number
          p_notes?: string | null
        }
        Returns: string
      }
      update_orcamento: {
        Args: {
          p_orcamento_id: string
          p_items: Json
          p_discount?: number
          p_freight_value?: number
          p_machine_id?: string | null
          p_payment_method?: Database['public']['Enums']['payment_method']
          p_card_brand?: string | null
          p_installments?: number
          p_validity_days?: number
          p_notes?: string | null
        }
        Returns: void
      }
      send_orcamento: { Args: { p_orcamento_id: string }; Returns: void }
      approve_orcamento: { Args: { p_orcamento_id: string }; Returns: void }
      cancel_orcamento: { Args: { p_orcamento_id: string; p_reason?: string | null }; Returns: void }
      admin_get_product: {
        Args: { p_id: string }
        Returns: Database['public']['Tables']['products']['Row'][]
      }
      admin_list_products: {
        Args: {
          p_search?: string | null
          p_status?: Database['public']['Enums']['product_status'] | null
          p_brand_id?: string | null
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          name: string
          slug: string
          sku: string | null
          price: number
          promo_price: number | null
          stock: number
          min_stock: number
          status: Database['public']['Enums']['product_status']
          featured: boolean
          category_name: string | null
          brand_name: string | null
          total_count: number
        }[]
      }
      admin_category_product_counts: {
        Args: Record<string, never>
        Returns: { category_id: string; product_count: number }[]
      }
      admin_brand_product_counts: {
        Args: Record<string, never>
        Returns: { brand_id: string; product_count: number }[]
      }
      delete_payment_machine: { Args: { p_machine_id: string }; Returns: void }
      delete_payment_rate_rule: { Args: { p_rule_id: string }; Returns: void }
      reverse_stock_receipt: { Args: { p_receipt_id: string; p_reason: string }; Returns: void }
    }
    Enums: {
      user_role: 'admin' | 'vendedor'
      product_status: 'ativo' | 'inativo'
      product_condition: 'novo' | 'seminovo'
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
      payment_channel: 'maquininha' | 'infinitap' | 'link'
      payment_method: 'pix' | 'dinheiro' | 'debito' | 'credito'
      orcamento_status: 'rascunho' | 'enviado' | 'aprovado' | 'expirado' | 'convertido' | 'cancelado'
    }
  }
}
