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
          minutes_used: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month_year: string
          minutes_used?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month_year?: string
          minutes_used?: number
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