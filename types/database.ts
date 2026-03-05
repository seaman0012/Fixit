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
          email: string
          full_name: string
          role: 'resident' | 'admin'
          room_number: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'resident' | 'admin'
          room_number?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'resident' | 'admin'
          room_number?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          category: 'electrical' | 'plumbing' | 'air_conditioning' | 'furniture' | 'other'
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high'
          room_number: string
          image_urls: string[]
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          category: 'electrical' | 'plumbing' | 'air_conditioning' | 'furniture' | 'other'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high'
          room_number: string
          image_urls?: string[]
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          category?: 'electrical' | 'plumbing' | 'air_conditioning' | 'furniture' | 'other'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high'
          room_number?: string
          image_urls?: string[]
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          user_id?: string
          message?: string
          created_at?: string
        }
      }
      ticket_history: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          action: string
          old_status: string | null
          new_status: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id: string
          action: string
          old_status?: string | null
          new_status?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          user_id?: string
          action?: string
          old_status?: string | null
          new_status?: string | null
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}
