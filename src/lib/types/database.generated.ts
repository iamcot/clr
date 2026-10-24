
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "activities": {
                  Row: {
                    "average_cadence": number | null,"average_heartrate": number | null,"counts_for_club": boolean | null,"created_at": string,"detail_fetched": boolean,"distance_m": number,"elapsed_time_s": number,"elevation_gain_m": number,"flagged_invalid": boolean,"id": number,"invalid_reason": string | null,"manual": boolean,"max_heartrate": number | null,"member_id": string,"moving_time_s": number,"name": string,"passes_rules": boolean,"private": boolean,"raw": Json | null,"sport_type": string,"start_date": string,"start_date_local": string,"start_latlng": unknown,"summary_polyline": string | null,"timezone": string | null,"trainer": boolean,"updated_at": string,"visibility": string
                  }
                  ComputedFields: never
                  Insert: {
                    "average_cadence"?: number | null,"average_heartrate"?: number | null,"counts_for_club"?: never,"created_at"?: string,"detail_fetched"?: boolean,"distance_m"?: number,"elapsed_time_s"?: number,"elevation_gain_m"?: number,"flagged_invalid"?: boolean,"id": number,"invalid_reason"?: string | null,"manual"?: boolean,"max_heartrate"?: number | null,"member_id": string,"moving_time_s"?: number,"name"?: string,"passes_rules"?: boolean,"private"?: boolean,"raw"?: Json | null,"sport_type": string,"start_date": string,"start_date_local": string,"start_latlng"?: unknown,"summary_polyline"?: string | null,"timezone"?: string | null,"trainer"?: boolean,"updated_at"?: string,"visibility"?: string
                  }
                  Update: {
                    "average_cadence"?: number | null,"average_heartrate"?: number | null,"counts_for_club"?: never,"created_at"?: string,"detail_fetched"?: boolean,"distance_m"?: number,"elapsed_time_s"?: number,"elevation_gain_m"?: number,"flagged_invalid"?: boolean,"id"?: number,"invalid_reason"?: string | null,"manual"?: boolean,"max_heartrate"?: number | null,"member_id"?: string,"moving_time_s"?: number,"name"?: string,"passes_rules"?: boolean,"private"?: boolean,"raw"?: Json | null,"sport_type"?: string,"start_date"?: string,"start_date_local"?: string,"start_latlng"?: unknown,"summary_polyline"?: string | null,"timezone"?: string | null,"trainer"?: boolean,"updated_at"?: string,"visibility"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "activities_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activities_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members_public"
      referencedColumns: ["id"]
    }
                  ]
                },"activity_best_efforts": {
                  Row: {
                    "activity_id": number,"distance_m": number,"elapsed_time_s": number,"name": string,"pr_rank": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_id": number,"distance_m": number,"elapsed_time_s": number,"name": string,"pr_rank"?: number | null
                  }
                  Update: {
                    "activity_id"?: number,"distance_m"?: number,"elapsed_time_s"?: number,"name"?: string,"pr_rank"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_best_efforts_activity_id_fkey"
      columns: ["activity_id"]
isOneToOne: false
      referencedRelation: "activities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_best_efforts_activity_id_fkey"
      columns: ["activity_id"]
isOneToOne: false
      referencedRelation: "activities_club"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_best_efforts_activity_id_fkey"
      columns: ["activity_id"]
isOneToOne: false
      referencedRelation: "activities_review"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"after": Json | null,"before": Json | null,"created_at": string,"id": number,"target_id": string | null,"target_table": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"after"?: Json | null,"before"?: Json | null,"created_at"?: string,"id"?: never,"target_id"?: string | null,"target_table": string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"after"?: Json | null,"before"?: Json | null,"created_at"?: string,"id"?: never,"target_id"?: string | null,"target_table"?: string
                  }
                  Relationships: [
                    
                  ]
                },"backfill_jobs": {
                  Row: {
                    "cursor_before": string | null,"error": string | null,"from_date": string,"last_run_at": string | null,"member_id": string,"pages_done": number,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cursor_before"?: string | null,"error"?: string | null,"from_date": string,"last_run_at"?: string | null,"member_id": string,"pages_done"?: number,"status"?: string
                  }
                  Update: {
                    "cursor_before"?: string | null,"error"?: string | null,"from_date"?: string,"last_run_at"?: string | null,"member_id"?: string,"pages_done"?: number,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "backfill_jobs_member_id_fkey"
      columns: ["member_id"]
isOneToOne: true
      referencedRelation: "members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "backfill_jobs_member_id_fkey"
      columns: ["member_id"]
isOneToOne: true
      referencedRelation: "members_public"
      referencedColumns: ["id"]
    }
                  ]
                },"members": {
                  Row: {
                    "avatar_url": string | null,"birth_year": number | null,"city": string | null,"created_at": string,"display_name": string | null,"gender": string | null,"id": string,"joined_at": string | null,"member_code": string,"member_type": string | null,"phone": string | null,"profile_onboarded_at": string | null,"role": string,"share_private_in_totals": boolean,"share_stats_with_club": boolean,"status": string,"strava_athlete_id": number,"strava_connected": boolean,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"birth_year"?: number | null,"city"?: string | null,"created_at"?: string,"display_name"?: string | null,"gender"?: string | null,"id": string,"joined_at"?: string | null,"member_code"?: string,"member_type"?: string | null,"phone"?: string | null,"profile_onboarded_at"?: string | null,"role"?: string,"share_private_in_totals"?: boolean,"share_stats_with_club"?: boolean,"status"?: string,"strava_athlete_id": number,"strava_connected"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"birth_year"?: number | null,"city"?: string | null,"created_at"?: string,"display_name"?: string | null,"gender"?: string | null,"id"?: string,"joined_at"?: string | null,"member_code"?: string,"member_type"?: string | null,"phone"?: string | null,"profile_onboarded_at"?: string | null,"role"?: string,"share_private_in_totals"?: boolean,"share_stats_with_club"?: boolean,"status"?: string,"strava_athlete_id"?: number,"strava_connected"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"settings": {
                  Row: {
                    "key": string,"updated_at": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "key": string,"updated_at"?: string,"value": NonNullable<Json>
                  }
                  Update: {
                    "key"?: string,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"strava_events": {
                  Row: {
                    "aspect_type": string,"attempts": number,"error": string | null,"event_time": string,"id": number,"next_attempt_at": string,"object_id": number,"object_type": string,"owner_id": number,"processed_at": string | null,"received_at": string,"updates": Json | null
                  }
                  ComputedFields: never
                  Insert: {
                    "aspect_type": string,"attempts"?: number,"error"?: string | null,"event_time": string,"id"?: never,"next_attempt_at"?: string,"object_id": number,"object_type": string,"owner_id": number,"processed_at"?: string | null,"received_at"?: string,"updates"?: Json | null
                  }
                  Update: {
                    "aspect_type"?: string,"attempts"?: number,"error"?: string | null,"event_time"?: string,"id"?: never,"next_attempt_at"?: string,"object_id"?: number,"object_type"?: string,"owner_id"?: number,"processed_at"?: string | null,"received_at"?: string,"updates"?: Json | null
                  }
                  Relationships: [
                    
                  ]
                },"strava_rate_state": {
                  Row: {
                    "request_limit": number,"updated_at": string,"usage": number,"window_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "request_limit": number,"updated_at"?: string,"usage": number,"window_name": string
                  }
                  Update: {
                    "request_limit"?: number,"updated_at"?: string,"usage"?: number,"window_name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"strava_tokens": {
                  Row: {
                    "access_token": string,"expires_at": string,"member_id": string,"refresh_token": string,"scope": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "access_token": string,"expires_at": string,"member_id": string,"refresh_token": string,"scope": string,"updated_at"?: string
                  }
                  Update: {
                    "access_token"?: string,"expires_at"?: string,"member_id"?: string,"refresh_token"?: string,"scope"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "strava_tokens_member_id_fkey"
      columns: ["member_id"]
isOneToOne: true
      referencedRelation: "members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "strava_tokens_member_id_fkey"
      columns: ["member_id"]
isOneToOne: true
      referencedRelation: "members_public"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "activities_club": {
                  Row: {
                    "counts_for_club": boolean | null,"distance_m": number,"elapsed_time_s": number,"elevation_gain_m": number,"id": number,"member_id": string,"moving_time_s": number,"sport_type": string,"start_date": string,"start_date_local": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "activities_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activities_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members_public"
      referencedColumns: ["id"]
    }
                  ]
                },"activities_review": {
                  Row: {
                    "counts_for_club": boolean | null,"display_name": string | null,"distance_m": number,"flagged_invalid": boolean,"id": number,"invalid_reason": string | null,"manual": boolean,"member_id": string,"moving_time_s": number,"name": string,"passes_rules": boolean,"sport_type": string,"start_date": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "activities_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activities_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members_public"
      referencedColumns: ["id"]
    }
                  ]
                },"members_public": {
                  Row: {
                    "avatar_url": string | null,"display_name": string | null,"gender": string | null,"id": string,"member_type": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "avatar_url"?: string | null,"display_name"?: string | null,"gender"?: string | null,"id"?: string | null,"member_type"?: string | null
                         }
                        Update: {
                           "avatar_url"?: string | null,"display_name"?: string | null,"gender"?: string | null,"id"?: string | null,"member_type"?: string | null
                         }
                        Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "is_bcn":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_treasurer":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"set_activity_flag":
{ Args: { "p_activity_id": number,"p_flagged": boolean,"p_reason": string }; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
