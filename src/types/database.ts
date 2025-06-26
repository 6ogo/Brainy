export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public_bolt: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
      }
      stripe_customers: {
        Row: {
          id: string
          user_id: string
          customer_id: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          customer_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          customer_id?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      stripe_subscriptions: {
        Row: {
          id: string
          customer_id: string
          subscription_id: string | null
          price_id: string | null
          subscription_level: 'free' | 'premium' | 'ultimate'
          status: string
          current_period_start: number | null
          current_period_end: number | null
          cancel_at_period_end: boolean | null
          payment_method_brand: string | null
          payment_method_last4: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          subscription_id?: string | null
          price_id?: string | null
          subscription_level?: 'free' | 'premium' | 'ultimate'
          status?: string
          current_period_start?: number | null
          current_period_end?: number | null
          cancel_at_period_end?: boolean | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          subscription_id?: string | null
          price_id?: string | null
          subscription_level?: 'free' | 'premium' | 'ultimate'
          status?: string
          current_period_start?: number | null
          current_period_end?: number | null
          cancel_at_period_end?: boolean | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stripe_orders: {
        Row: {
          id: string
          checkout_session_id: string
          payment_intent_id: string | null
          customer_id: string
          amount_subtotal: number | null
          amount_total: number | null
          currency: string | null
          payment_status: string
          status: string
          order_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          checkout_session_id: string
          payment_intent_id?: string | null
          customer_id: string
          amount_subtotal?: number | null
          amount_total?: number | null
          currency?: string | null
          payment_status?: string
          status?: string
          order_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          checkout_session_id?: string
          payment_intent_id?: string | null
          customer_id?: string
          amount_subtotal?: number | null
          amount_total?: number | null
          currency?: string | null
          payment_status?: string
          status?: string
          order_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          user_message: string
          ai_response: string
          duration: number
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          user_message: string
          ai_response: string
          duration?: number
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_message?: string
          ai_response?: string
          duration?: number
          timestamp?: string
        }
      }
      user_usage: {
        Row: {
          id: string
          user_id: string
          month_year: string
          date: string
          conversation_minutes: number
          video_call_minutes: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month_year: string
          date: string
          conversation_minutes?: number
          video_call_minutes?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month_year?: string
          date?: string
          conversation_minutes?: number
          video_call_minutes?: number
          updated_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          subject: string
          duration: number
          created_at: string
          completed_at: string | null
          xp_earned: number
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          duration?: number
          created_at?: string
          completed_at?: string | null
          xp_earned?: number
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          duration?: number
          created_at?: string
          completed_at?: string | null
          xp_earned?: number
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          icon: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          icon: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          icon?: string
          unlocked_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          subject: string
          level: number
          xp: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          level?: number
          xp?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          level?: number
          xp?: number
          updated_at?: string
        }
      }
    }
  }
}