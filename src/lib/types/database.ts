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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
