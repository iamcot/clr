export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Placeholder: ghi đè bằng `npm run db:types` sau khi `supabase start`
export type Database = {
  public: {
    Tables: {
      settings: {
        Row: { key: string; value: Json; updated_at: string }
        Insert: { key: string; value: Json; updated_at?: string }
        Update: { key?: string; value?: Json; updated_at?: string }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: number
          actor_id: string | null
          action: string
          target_table: string
          target_id: string | null
          before: Json | null
          after: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          actor_id?: string | null
          action: string
          target_table: string
          target_id?: string | null
          before?: Json | null
          after?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
        Relationships: []
      }
      members: {
        Row: {
          id: string
          strava_athlete_id: number
          display_name: string | null
          avatar_url: string | null
          gender: 'M' | 'F' | 'X' | null
          birth_year: number | null
          city: string | null
          phone: string | null
          role: 'guest' | 'member' | 'bcn' | 'treasurer'
          member_type: 'official' | 'free' | null
          status: 'pending' | 'active' | 'inactive' | 'rejected'
          member_code: string
          share_private_in_totals: boolean
          strava_connected: boolean
          joined_at: string | null
          profile_onboarded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          strava_athlete_id: number
          display_name?: string | null
          avatar_url?: string | null
          gender?: 'M' | 'F' | 'X' | null
          birth_year?: number | null
          city?: string | null
          phone?: string | null
          role?: 'guest' | 'member' | 'bcn' | 'treasurer'
          member_type?: 'official' | 'free' | null
          status?: 'pending' | 'active' | 'inactive' | 'rejected'
          member_code?: string
          share_private_in_totals?: boolean
          strava_connected?: boolean
          joined_at?: string | null
          profile_onboarded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['members']['Insert']>
        Relationships: []
      }
      strava_tokens: {
        Row: {
          member_id: string
          access_token: string
          refresh_token: string
          expires_at: string
          scope: string
          updated_at: string
        }
        Insert: {
          member_id: string
          access_token: string
          refresh_token: string
          expires_at: string
          scope: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['strava_tokens']['Insert']>
        Relationships: []
      }
    }
    Views: {
      members_public: {
        Row: {
          id: string | null
          display_name: string | null
          avatar_url: string | null
          member_type: 'official' | 'free' | null
          gender: 'M' | 'F' | 'X' | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_bcn: { Args: Record<string, never>; Returns: boolean }
      is_treasurer: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
