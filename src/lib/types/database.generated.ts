
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
                },"follows": {
                  Row: {
                    "created_at": string,"followee_id": string,"follower_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"followee_id": string,"follower_id": string
                  }
                  Update: {
                    "created_at"?: string,"followee_id"?: string,"follower_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "follows_followee_id_fkey"
      columns: ["followee_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "follows_followee_id_fkey"
      columns: ["followee_id"]
isOneToOne: false
      referencedRelation: "members_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "follows_follower_id_fkey"
      columns: ["follower_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "follows_follower_id_fkey"
      columns: ["follower_id"]
isOneToOne: false
      referencedRelation: "members_public"
      referencedColumns: ["id"]
    }
                  ]
                },"members": {
                  Row: {
                    "avatar_url": string | null,"birth_year": number | null,"city": string | null,"created_at": string,"display_name": string | null,"gender": string | null,"id": string,"joined_at": string | null,"level": number,"level_updated_at": string | null,"club_points": number,"member_code": string,"member_type": string | null,"phone": string | null,"profile_onboarded_at": string | null,"rejection_reason": string | null,"role": string,"share_private_in_totals": boolean,"share_stats_with_club": boolean,"status": string,"strava_athlete_id": number,"strava_connected": boolean,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"birth_year"?: number | null,"city"?: string | null,"created_at"?: string,"display_name"?: string | null,"gender"?: string | null,"id": string,"joined_at"?: string | null,"level"?: number,"level_updated_at"?: string | null,"club_points"?: number,"member_code"?: string,"member_type"?: string | null,"phone"?: string | null,"profile_onboarded_at"?: string | null,"rejection_reason"?: string | null,"role"?: string,"share_private_in_totals"?: boolean,"share_stats_with_club"?: boolean,"status"?: string,"strava_athlete_id": number,"strava_connected"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"birth_year"?: number | null,"city"?: string | null,"created_at"?: string,"display_name"?: string | null,"gender"?: string | null,"id"?: string,"joined_at"?: string | null,"level"?: number,"level_updated_at"?: string | null,"club_points"?: number,"member_code"?: string,"member_type"?: string | null,"phone"?: string | null,"profile_onboarded_at"?: string | null,"rejection_reason"?: string | null,"role"?: string,"share_private_in_totals"?: boolean,"share_stats_with_club"?: boolean,"status"?: string,"strava_athlete_id"?: number,"strava_connected"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"member_stats_period": {
                  Row: {
                    "activity_count": number,"active_days": number,"distance_m": number,"elevation_gain_m": number,"longest_m": number,"member_id": string,"moving_time_s": number,"period_start": string,"period_type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_count": number,"active_days": number,"distance_m": number,"elevation_gain_m": number,"longest_m": number,"member_id": string,"moving_time_s": number,"period_start": string,"period_type": string,"updated_at"?: string
                  }
                  Update: {
                    "activity_count"?: number,"active_days"?: number,"distance_m"?: number,"elevation_gain_m"?: number,"longest_m"?: number,"member_id"?: string,"moving_time_s"?: number,"period_start"?: string,"period_type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "member_stats_period_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"pr_overrides": {
                  Row: {
                    "created_at": string,"distance_name": string,"member_id": string,"note": string | null,"race_result_id": string | null,"source": string,"time_s": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"distance_name": string,"member_id": string,"note"?: string | null,"race_result_id"?: string | null,"source"?: string,"time_s": number
                  }
                  Update: {
                    "created_at"?: string,"distance_name"?: string,"member_id"?: string,"note"?: string | null,"race_result_id"?: string | null,"source"?: string,"time_s"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "pr_overrides_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pr_overrides_race_result_fkey"
      columns: ["race_result_id"]
isOneToOne: false
      referencedRelation: "race_results"
      referencedColumns: ["id"]
    }
                  ]
                },"races": {
                  Row: {
                    "city": string | null,"created_at": string,"created_by": string | null,"id": string,"name": string,"organizer": string | null,"race_date": string,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "city"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"name": string,"organizer"?: string | null,"race_date": string,"url"?: string | null
                  }
                  Update: {
                    "city"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"name"?: string,"organizer"?: string | null,"race_date"?: string,"url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "races_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"race_results": {
                  Row: {
                    "activity_id": number | null,"bib": string | null,"certificate_url": string | null,"chip_time_s": number,"created_at": string,"distance_label": string,"distance_m": number,"gun_time_s": number | null,"id": string,"member_id": string,"race_id": string,"rank_age_group": number | null,"rank_overall": number | null,"verified_at": string | null,"verified_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_id"?: number | null,"bib"?: string | null,"certificate_url"?: string | null,"chip_time_s": number,"created_at"?: string,"distance_label": string,"distance_m": number,"gun_time_s"?: number | null,"id"?: string,"member_id": string,"race_id": string,"rank_age_group"?: number | null,"rank_overall"?: number | null,"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Update: {
                    "activity_id"?: number | null,"bib"?: string | null,"certificate_url"?: string | null,"chip_time_s"?: number,"created_at"?: string,"distance_label"?: string,"distance_m"?: number,"gun_time_s"?: number | null,"id"?: string,"member_id"?: string,"race_id"?: string,"rank_age_group"?: number | null,"rank_overall"?: number | null,"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "race_results_race_id_fkey"
      columns: ["race_id"]
isOneToOne: false
      referencedRelation: "races"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "race_results_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
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
                },"club_rankings": {
                  Row: {
                    "avatar_url": string | null,"club_points": number | null,"display_name": string | null,"gender": string | null,"level": number | null,"member_id": string | null,"member_type": string | null,"month_distance_m": number | null,"year_distance_m": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"member_prs": {
                  Row: {
                    "activity_id": number | null,"distance_name": string | null,"elapsed_time_s": number | null,"member_id": string | null,"start_date": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"member_prs_club": {
                  Row: {
                    "distance_name": string | null,"elapsed_time_s": number | null,"member_id": string | null,"start_date": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"race_results_review": {
                  Row: {
                    "bib": string | null,"certificate_url": string | null,"chip_time_s": number | null,"display_name": string | null,"distance_label": string | null,"distance_m": number | null,"id": string | null,"member_id": string | null,"race_date": string | null,"race_name": string | null,"rank_overall": number | null,"verified_at": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"members_public": {
                  Row: {
                    "avatar_url": string | null,"display_name": string | null,"gender": string | null,"id": string,"joined_at": string | null,"member_type": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "avatar_url"?: string | null,"display_name"?: string | null,"gender"?: string | null,"id"?: string | null,"joined_at"?: string | null,"member_type"?: string | null
                         }
                        Update: {
                           "avatar_url"?: string | null,"display_name"?: string | null,"gender"?: string | null,"id"?: string | null,"joined_at"?: string | null,"member_type"?: string | null
                         }
                        Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "refresh_all_member_stats":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"refresh_member_stats":
{ Args: { "p_member_id": string }; Returns: undefined
                           },
"admin_review_members":
{ Args: { "p_approve": boolean,"p_member_ids": string[],"p_member_type": string,"p_reason": string }; Returns: number
                           },
"admin_verify_race_result":
{ Args: { "p_result_id": string,"p_verified": boolean }; Returns: undefined
                           },
"admin_update_member":
{ Args: { "p_member_id": string,"p_member_type": string,"p_role": string,"p_status": string }; Returns: undefined
                           },
"is_bcn":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_treasurer":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"log_audit":
{ Args: { "p_action": string,"p_after": Json,"p_before": Json,"p_target_id": string,"p_target_table": string }; Returns: undefined
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
