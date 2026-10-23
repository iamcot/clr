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
          share_stats_with_club: boolean
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
          share_stats_with_club?: boolean
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
      activities: {
        Row: {
          id: number
          member_id: string
          name: string
          sport_type: string
          start_date: string
          start_date_local: string
          timezone: string | null
          distance_m: number
          moving_time_s: number
          elapsed_time_s: number
          elevation_gain_m: number
          average_heartrate: number | null
          max_heartrate: number | null
          average_cadence: number | null
          manual: boolean
          trainer: boolean
          visibility: 'everyone' | 'followers_only' | 'only_me'
          private: boolean
          summary_polyline: string | null
          start_latlng: string | null
          passes_rules: boolean
          flagged_invalid: boolean
          invalid_reason: string | null
          counts_for_club: boolean
          detail_fetched: boolean
          raw: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Pick<
          Database['public']['Tables']['activities']['Row'],
          'id' | 'member_id' | 'sport_type' | 'start_date' | 'start_date_local'
        > &
          Partial<
            Omit<
              Database['public']['Tables']['activities']['Row'],
              'id' | 'member_id' | 'sport_type' | 'start_date' | 'start_date_local' | 'counts_for_club'
            >
          >
        Update: Partial<Database['public']['Tables']['activities']['Insert']>
        Relationships: []
      }
      activity_best_efforts: {
        Row: { activity_id: number; name: string; distance_m: number; elapsed_time_s: number; pr_rank: number | null }
        Insert: {
          activity_id: number
          name: string
          distance_m: number
          elapsed_time_s: number
          pr_rank?: number | null
        }
        Update: Partial<Database['public']['Tables']['activity_best_efforts']['Insert']>
        Relationships: []
      }
      strava_rate_state: {
        Row: {
          window_name: 'read_15m' | 'read_day' | 'all_15m' | 'all_day'
          request_limit: number
          usage: number
          updated_at: string
        }
        Insert: {
          window_name: 'read_15m' | 'read_day' | 'all_15m' | 'all_day'
          request_limit: number
          usage: number
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['strava_rate_state']['Insert']>
        Relationships: []
      }
      strava_events: {
        Row: {
          id: number
          object_type: string
          object_id: number
          aspect_type: string
          owner_id: number
          updates: Json | null
          event_time: string
          received_at: string
          processed_at: string | null
          error: string | null
          attempts: number
          next_attempt_at: string
        }
        Insert: {
          object_type: string
          object_id: number
          aspect_type: string
          owner_id: number
          event_time: string
          updates?: Json | null
          processed_at?: string | null
          error?: string | null
          attempts?: number
          next_attempt_at?: string
        }
        Update: Partial<Database['public']['Tables']['strava_events']['Insert']>
        Relationships: []
      }
      backfill_jobs: {
        Row: {
          member_id: string
          from_date: string
          cursor_before: string | null
          pages_done: number
          status: 'pending' | 'done' | 'failed'
          last_run_at: string | null
          error: string | null
        }
        Insert: {
          member_id: string
          from_date: string
          cursor_before?: string | null
          pages_done?: number
          status?: 'pending' | 'done' | 'failed'
          last_run_at?: string | null
          error?: string | null
        }
        Update: Partial<Database['public']['Tables']['backfill_jobs']['Insert']>
        Relationships: []
      }
    }
    Views: {
      activities_club: {
        Row: {
          id: number | null
          member_id: string | null
          sport_type: string | null
          start_date: string | null
          start_date_local: string | null
          distance_m: number | null
          moving_time_s: number | null
          elapsed_time_s: number | null
          elevation_gain_m: number | null
          counts_for_club: boolean | null
        }
        Relationships: []
      }
      activities_review: {
        Row: {
          id: number | null
          member_id: string | null
          display_name: string | null
          name: string | null
          sport_type: string | null
          start_date: string | null
          distance_m: number | null
          moving_time_s: number | null
          manual: boolean | null
          passes_rules: boolean | null
          flagged_invalid: boolean | null
          invalid_reason: string | null
          counts_for_club: boolean | null
        }
        Relationships: []
      }
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
      set_activity_flag: {
        Args: { p_activity_id: number; p_flagged: boolean; p_reason: string | null }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
