
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
                },"events": {
                  Row: {
                    "absent_penalty": boolean,"capacity": number | null,"cover_url": string | null,"created_at": string,"created_by": string | null,"description_md": string,"ends_at": string,"fee": number | null,"id": string,"kind": string,"location_lat": number | null,"location_lng": number | null,"location_name": string,"race_id": string | null,"registration_closes_at": string | null,"route_distance_m": number | null,"starts_at": string,"status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "absent_penalty"?: boolean,"capacity"?: number | null,"cover_url"?: string | null,"created_at"?: string,"created_by"?: string | null,"description_md"?: string,"ends_at": string,"fee"?: number | null,"id"?: string,"kind"?: string,"location_lat"?: number | null,"location_lng"?: number | null,"location_name"?: string,"race_id"?: string | null,"registration_closes_at"?: string | null,"route_distance_m"?: number | null,"starts_at": string,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "absent_penalty"?: boolean,"capacity"?: number | null,"cover_url"?: string | null,"created_at"?: string,"created_by"?: string | null,"description_md"?: string,"ends_at"?: string,"fee"?: number | null,"id"?: string,"kind"?: string,"location_lat"?: number | null,"location_lng"?: number | null,"location_name"?: string,"race_id"?: string | null,"registration_closes_at"?: string | null,"route_distance_m"?: number | null,"starts_at"?: string,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "events_race_id_fkey"
      columns: ["race_id"]
isOneToOne: false
      referencedRelation: "races"
      referencedColumns: ["id"]
    }
                  ]
                },"event_attendees": {
                  Row: {
                    "activity_id": number | null,"checked_in_at": string | null,"checked_in_by": string | null,"created_at": string,"event_id": string,"member_id": string,"note": string,"status": string,"status_changed_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_id"?: number | null,"checked_in_at"?: string | null,"checked_in_by"?: string | null,"created_at"?: string,"event_id": string,"member_id": string,"note"?: string,"status": string,"status_changed_at"?: string
                  }
                  Update: {
                    "activity_id"?: number | null,"checked_in_at"?: string | null,"checked_in_by"?: string | null,"created_at"?: string,"event_id"?: string,"member_id"?: string,"note"?: string,"status"?: string,"status_changed_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_attendees_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "event_attendees_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "event_attendees_checked_in_by_fkey"
      columns: ["checked_in_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "event_attendees_activity_id_fkey"
      columns: ["activity_id"]
isOneToOne: false
      referencedRelation: "activities"
      referencedColumns: ["id"]
    }
                  ]
                },"event_photos": {
                  Row: {
                    "bytes": number,"caption": string,"created_at": string,"event_id": string,"height": number,"hidden": boolean,"id": string,"object_key": string,"taken_at": string | null,"thumb_key": string,"uploaded_by": string | null,"width": number
                  }
                  ComputedFields: never
                  Insert: {
                    "bytes": number,"caption"?: string,"created_at"?: string,"event_id": string,"height": number,"hidden"?: boolean,"id"?: string,"object_key": string,"taken_at"?: string | null,"thumb_key": string,"uploaded_by"?: string | null,"width": number
                  }
                  Update: {
                    "bytes"?: number,"caption"?: string,"created_at"?: string,"event_id"?: string,"height"?: number,"hidden"?: boolean,"id"?: string,"object_key"?: string,"taken_at"?: string | null,"thumb_key"?: string,"uploaded_by"?: string | null,"width"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_photos_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "event_photos_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"event_photo_tags": {
                  Row: {
                    "created_at": string,"member_id": string,"photo_id": string,"tagged_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"member_id": string,"photo_id": string,"tagged_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"member_id"?: string,"photo_id"?: string,"tagged_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_photo_tags_photo_id_fkey"
      columns: ["photo_id"]
isOneToOne: false
      referencedRelation: "event_photos"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "event_photo_tags_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "event_photo_tags_tagged_by_fkey"
      columns: ["tagged_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"honors": {
                  Row: {
                    "approved": boolean,"challenge_id": string | null,"created_at": string,"created_by": string | null,"dedupe_key": string | null,"detail": string,"honor_date": string,"id": string,"image_url": string | null,"kind": string,"member_id": string,"race_result_id": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved"?: boolean,"challenge_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"dedupe_key"?: string | null,"detail"?: string,"honor_date": string,"id"?: string,"image_url"?: string | null,"kind": string,"member_id": string,"race_result_id"?: string | null,"title": string
                  }
                  Update: {
                    "approved"?: boolean,"challenge_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"dedupe_key"?: string | null,"detail"?: string,"honor_date"?: string,"id"?: string,"image_url"?: string | null,"kind"?: string,"member_id"?: string,"race_result_id"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "honors_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "honors_race_result_id_fkey"
      columns: ["race_result_id"]
isOneToOne: false
      referencedRelation: "race_results"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "honors_challenge_id_fkey"
      columns: ["challenge_id"]
isOneToOne: false
      referencedRelation: "challenges"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "honors_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"draws": {
                  Row: {
                    "cancel_reason": string | null,"created_at": string,"created_by": string | null,"finished_at": string | null,"id": string,"seed_commit": string | null,"seed_reveal": string | null,"source_id": string | null,"source_type": string,"started_at": string | null,"status": string,"style": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cancel_reason"?: string | null,"created_at"?: string,"created_by"?: string | null,"finished_at"?: string | null,"id"?: string,"seed_commit"?: string | null,"seed_reveal"?: string | null,"source_id"?: string | null,"source_type": string,"started_at"?: string | null,"status"?: string,"style"?: string,"title": string
                  }
                  Update: {
                    "cancel_reason"?: string | null,"created_at"?: string,"created_by"?: string | null,"finished_at"?: string | null,"id"?: string,"seed_commit"?: string | null,"seed_reveal"?: string | null,"source_id"?: string | null,"source_type"?: string,"started_at"?: string | null,"status"?: string,"style"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "draws_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"draw_secrets": {
                  Row: {
                    "draw_id": string,"seed": string
                  }
                  ComputedFields: never
                  Insert: {
                    "draw_id": string,"seed": string
                  }
                  Update: {
                    "draw_id"?: string,"seed"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "draw_secrets_draw_id_fkey"
      columns: ["draw_id"]
isOneToOne: false
      referencedRelation: "draws"
      referencedColumns: ["id"]
    }
                  ]
                },"fund_accounts": {
                  Row: {
                    "id": string,"name": string,"kind": string,"bank_bin": string | null,"account_no": string | null,"account_name": string | null,"active": boolean,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name": string,"kind": string,"bank_bin"?: string | null,"account_no"?: string | null,"account_name"?: string | null,"active"?: boolean,"created_at"?: string
                  }
                  Update: {
                    "id"?: string,"name"?: string,"kind"?: string,"bank_bin"?: string | null,"account_no"?: string | null,"account_name"?: string | null,"active"?: boolean,"created_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"fund_categories": {
                  Row: {
                    "id": string,"direction": string,"name": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"direction": string,"name": string,"sort"?: number
                  }
                  Update: {
                    "id"?: string,"direction"?: string,"name"?: string,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"bank_webhook_events": {
                  Row: {
                    "id": string,"provider": string,"provider_txn_id": string,"direction": string,"amount": number,"content": string,"account_no": string,"transferred_at": string,"raw": Json,"received_at": string,"match_status": string,"matched_intent_id": string | null,"suggested_member_id": string | null,"processed_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"provider": string,"provider_txn_id": string,"direction": string,"amount": number,"content"?: string,"account_no"?: string,"transferred_at": string,"raw": Json,"received_at"?: string,"match_status"?: string,"matched_intent_id"?: string | null,"suggested_member_id"?: string | null,"processed_at"?: string | null
                  }
                  Update: {
                    "id"?: string,"provider"?: string,"provider_txn_id"?: string,"direction"?: string,"amount"?: number,"content"?: string,"account_no"?: string,"transferred_at"?: string,"raw"?: Json,"received_at"?: string,"match_status"?: string,"matched_intent_id"?: string | null,"suggested_member_id"?: string | null,"processed_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"payment_intents": {
                  Row: {
                    "id": string,"member_id": string,"ref": string,"method": string,"amount": number,"penalty_ids": string[],"status": string,"created_at": string,"expires_at": string,"paid_at": string | null,"bank_event_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"member_id": string,"ref": string,"method"?: string,"amount": number,"penalty_ids": string[],"status"?: string,"created_at"?: string,"expires_at": string,"paid_at"?: string | null,"bank_event_id"?: string | null
                  }
                  Update: {
                    "id"?: string,"member_id"?: string,"ref"?: string,"method"?: string,"amount"?: number,"penalty_ids"?: string[],"status"?: string,"created_at"?: string,"expires_at"?: string,"paid_at"?: string | null,"bank_event_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"fund_transactions": {
                  Row: {
                    "id": string,"account_id": string,"direction": string,"amount": number,"category_id": string | null,"occurred_at": string,"description": string,"member_id": string | null,"penalty_id": string | null,"event_id": string | null,"intent_id": string | null,"bank_event_id": string | null,"receipt_url": string | null,"created_by": string | null,"created_at": string,"voided_at": string | null,"void_reason": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"account_id": string,"direction": string,"amount": number,"category_id"?: string | null,"occurred_at"?: string,"description"?: string,"member_id"?: string | null,"penalty_id"?: string | null,"event_id"?: string | null,"intent_id"?: string | null,"bank_event_id"?: string | null,"receipt_url"?: string | null,"created_by"?: string | null,"created_at"?: string,"voided_at"?: string | null,"void_reason"?: string | null
                  }
                  Update: {
                    "id"?: string,"account_id"?: string,"direction"?: string,"amount"?: number,"category_id"?: string | null,"occurred_at"?: string,"description"?: string,"member_id"?: string | null,"penalty_id"?: string | null,"event_id"?: string | null,"intent_id"?: string | null,"bank_event_id"?: string | null,"receipt_url"?: string | null,"created_by"?: string | null,"created_at"?: string,"voided_at"?: string | null,"void_reason"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"fund_reconciliations": {
                  Row: {
                    "id": string,"account_id": string,"as_of": string,"statement_balance": number,"app_balance": number,"difference": number,"note": string,"created_by": string | null,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"account_id": string,"as_of": string,"statement_balance": number,"app_balance": number,"difference": number,"note"?: string,"created_by"?: string | null,"created_at"?: string
                  }
                  Update: {
                    "id"?: string,"account_id"?: string,"as_of"?: string,"statement_balance"?: number,"app_balance"?: number,"difference"?: number,"note"?: string,"created_by"?: string | null,"created_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"draw_prizes": {
                  Row: {
                    "draw_id": string,"id": string,"name": string,"quantity": number,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "draw_id": string,"id"?: string,"name": string,"quantity": number,"sort"?: number
                  }
                  Update: {
                    "draw_id"?: string,"id"?: string,"name"?: string,"quantity"?: number,"sort"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "draw_prizes_draw_id_fkey"
      columns: ["draw_id"]
isOneToOne: false
      referencedRelation: "draws"
      referencedColumns: ["id"]
    }
                  ]
                },"draw_participants": {
                  Row: {
                    "draw_id": string,"member_id": string,"weight": number
                  }
                  ComputedFields: never
                  Insert: {
                    "draw_id": string,"member_id": string,"weight"?: number
                  }
                  Update: {
                    "draw_id"?: string,"member_id"?: string,"weight"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "draw_participants_draw_id_fkey"
      columns: ["draw_id"]
isOneToOne: false
      referencedRelation: "draws"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "draw_participants_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"draw_results": {
                  Row: {
                    "draw_id": string,"draw_order": number,"drawn_at": string,"member_id": string,"prize_id": string,"reveal_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "draw_id": string,"draw_order": number,"drawn_at"?: string,"member_id": string,"prize_id": string,"reveal_at": string
                  }
                  Update: {
                    "draw_id"?: string,"draw_order"?: number,"drawn_at"?: string,"member_id"?: string,"prize_id"?: string,"reveal_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "draw_results_draw_id_fkey"
      columns: ["draw_id"]
isOneToOne: false
      referencedRelation: "draws"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "draw_results_prize_id_fkey"
      columns: ["prize_id"]
isOneToOne: false
      referencedRelation: "draw_prizes"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "draw_results_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"challenges": {
                  Row: {
                    "activity_filter": Json,"closed_at": string | null,"closed_by": string | null,"cover_url": string | null,"created_at": string,"created_by": string | null,"description": string,"ends_at": string,"goal_type": string,"id": string,"participation": string,"penalty_rule": Json,"ranking": string,"registration_closes_at": string | null,"reward_rule": Json,"starts_at": string,"status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_filter"?: Json,"closed_at"?: string | null,"closed_by"?: string | null,"cover_url"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"ends_at": string,"goal_type": string,"id"?: string,"participation"?: string,"penalty_rule"?: Json,"ranking"?: string,"registration_closes_at"?: string | null,"reward_rule"?: Json,"starts_at": string,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "activity_filter"?: Json,"closed_at"?: string | null,"closed_by"?: string | null,"cover_url"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"ends_at"?: string,"goal_type"?: string,"id"?: string,"participation"?: string,"penalty_rule"?: Json,"ranking"?: string,"registration_closes_at"?: string | null,"reward_rule"?: Json,"starts_at"?: string,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "challenges_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"challenge_categories": {
                  Row: {
                    "challenge_id": string,"gender": string | null,"goal_value": number,"id": string,"member_type": string | null,"name": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "challenge_id": string,"gender"?: string | null,"goal_value": number,"id"?: string,"member_type"?: string | null,"name": string,"sort"?: number
                  }
                  Update: {
                    "challenge_id"?: string,"gender"?: string | null,"goal_value"?: number,"id"?: string,"member_type"?: string | null,"name"?: string,"sort"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "challenge_categories_challenge_id_fkey"
      columns: ["challenge_id"]
isOneToOne: false
      referencedRelation: "challenges"
      referencedColumns: ["id"]
    }
                  ]
                },"challenge_entries": {
                  Row: {
                    "category_id": string,"challenge_id": string,"completed": boolean,"completed_at": string | null,"excluded": boolean,"excluded_reason": string | null,"joined_at": string,"last_activity_at": string | null,"member_id": string,"penalty_waived": boolean,"progress_pct": number,"rank": number | null,"updated_at": string,"value": number,"waived_reason": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"challenge_id": string,"completed"?: boolean,"completed_at"?: string | null,"excluded"?: boolean,"excluded_reason"?: string | null,"joined_at"?: string,"last_activity_at"?: string | null,"member_id": string,"penalty_waived"?: boolean,"progress_pct"?: number,"rank"?: number | null,"updated_at"?: string,"value"?: number,"waived_reason"?: string | null
                  }
                  Update: {
                    "category_id"?: string,"challenge_id"?: string,"completed"?: boolean,"completed_at"?: string | null,"excluded"?: boolean,"excluded_reason"?: string | null,"joined_at"?: string,"last_activity_at"?: string | null,"member_id"?: string,"penalty_waived"?: boolean,"progress_pct"?: number,"rank"?: number | null,"updated_at"?: string,"value"?: number,"waived_reason"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "challenge_entries_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "challenge_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "challenge_entries_challenge_id_fkey"
      columns: ["challenge_id"]
isOneToOne: false
      referencedRelation: "challenges"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "challenge_entries_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"challenge_entry_activities": {
                  Row: {
                    "activity_id": number,"challenge_id": string,"counted_value": number,"member_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_id": number,"challenge_id": string,"counted_value": number,"member_id": string
                  }
                  Update: {
                    "activity_id"?: number,"challenge_id"?: string,"counted_value"?: number,"member_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "challenge_entry_activities_activity_id_fkey"
      columns: ["activity_id"]
isOneToOne: false
      referencedRelation: "activities"
      referencedColumns: ["id"]
    }
                  ]
                },"penalty_types": {
                  Row: {
                    "id": string,"code": string,"name": string,"default_amount": number,"active": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"code": string,"name": string,"default_amount"?: number,"active"?: boolean
                  }
                  Update: {
                    "id"?: string,"code"?: string,"name"?: string,"default_amount"?: number,"active"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"penalties": {
                  Row: {
                    "id": string,"member_id": string,"type_id": string,"amount": number,"reason": string,"source_type": string | null,"source_id": string | null,"status": string,"created_by": string | null,"created_at": string,"paid_at": string | null,"paid_method": string | null,"confirmed_by": string | null,"waived_reason": string | null,"payment_ref": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"member_id": string,"type_id": string,"amount": number,"reason"?: string,"source_type"?: string | null,"source_id"?: string | null,"status"?: string,"created_by"?: string | null,"created_at"?: string,"paid_at"?: string | null,"paid_method"?: string | null,"confirmed_by"?: string | null,"waived_reason"?: string | null,"payment_ref"?: string | null
                  }
                  Update: {
                    "id"?: string,"member_id"?: string,"type_id"?: string,"amount"?: number,"reason"?: string,"source_type"?: string | null,"source_id"?: string | null,"status"?: string,"created_by"?: string | null,"created_at"?: string,"paid_at"?: string | null,"paid_method"?: string | null,"confirmed_by"?: string | null,"waived_reason"?: string | null,"payment_ref"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "penalties_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "penalties_type_id_fkey"
      columns: ["type_id"]
isOneToOne: false
      referencedRelation: "penalty_types"
      referencedColumns: ["id"]
    }
                  ]
                },"rewards": {
                  Row: {
                    "id": string,"member_id": string,"title": string,"amount": number | null,"item": string | null,"source_type": string | null,"source_id": string | null,"status": string,"given_at": string | null,"created_by": string | null,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"member_id": string,"title": string,"amount"?: number | null,"item"?: string | null,"source_type"?: string | null,"source_id"?: string | null,"status"?: string,"given_at"?: string | null,"created_by"?: string | null,"created_at"?: string
                  }
                  Update: {
                    "id"?: string,"member_id"?: string,"title"?: string,"amount"?: number | null,"item"?: string | null,"source_type"?: string | null,"source_id"?: string | null,"status"?: string,"given_at"?: string | null,"created_by"?: string | null,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rewards_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "id": string,"author_id": string | null,"kind": string,"title": string,"body_md": string,"cover_url": string | null,"pinned": boolean,"pinned_until": string | null,"require_ack": boolean,"source_key": string | null,"published_at": string | null,"created_at": string,"updated_at": string,"deleted_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"author_id"?: string | null,"kind"?: string,"title": string,"body_md"?: string,"cover_url"?: string | null,"pinned"?: boolean,"pinned_until"?: string | null,"require_ack"?: boolean,"source_key"?: string | null,"published_at"?: string | null,"created_at"?: string,"updated_at"?: string,"deleted_at"?: string | null
                  }
                  Update: {
                    "id"?: string,"author_id"?: string | null,"kind"?: string,"title"?: string,"body_md"?: string,"cover_url"?: string | null,"pinned"?: boolean,"pinned_until"?: string | null,"require_ack"?: boolean,"source_key"?: string | null,"published_at"?: string | null,"created_at"?: string,"updated_at"?: string,"deleted_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"post_reactions": {
                  Row: {
                    "post_id": string,"member_id": string,"emoji": string,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "post_id": string,"member_id": string,"emoji": string,"created_at"?: string
                  }
                  Update: {
                    "post_id"?: string,"member_id"?: string,"emoji"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_reactions_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_reactions_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"post_comments": {
                  Row: {
                    "id": string,"post_id": string,"member_id": string,"body": string,"parent_id": string | null,"created_at": string,"deleted_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"post_id": string,"member_id": string,"body": string,"parent_id"?: string | null,"created_at"?: string,"deleted_at"?: string | null
                  }
                  Update: {
                    "id"?: string,"post_id"?: string,"member_id"?: string,"body"?: string,"parent_id"?: string | null,"created_at"?: string,"deleted_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_comments_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_comments_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "post_comments"
      referencedColumns: ["id"]
    }
                  ]
                },"post_reads": {
                  Row: {
                    "post_id": string,"member_id": string,"read_at": string,"acked_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "post_id": string,"member_id": string,"read_at"?: string,"acked_at"?: string | null
                  }
                  Update: {
                    "post_id"?: string,"member_id"?: string,"read_at"?: string,"acked_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_reads_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_reads_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"level_changes": {
                  Row: {
                    "id": string,"member_id": string,"old_level": number,"new_level": number,"changed_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"member_id": string,"old_level": number,"new_level": number,"changed_at"?: string
                  }
                  Update: {
                    "id"?: string,"member_id"?: string,"old_level"?: number,"new_level"?: number,"changed_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "level_changes_member_id_fkey"
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
                },"club_rankings_masked": {
                  Row: {
                    "avatar_url": string | null,"club_points": number | null,"display_name": string | null,"gender": string | null,"level": number | null,"member_id": string | null,"member_type": string | null,"month_distance_m": number | null,"year_distance_m": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"club_rankings_levels": {
                  Row: {
                    "avatar_url": string | null,"club_points": number | null,"display_name": string | null,"gender": string | null,"level": number | null,"member_id": string | null,"member_type": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"members_masked": {
                  Row: {
                    "avatar_url": string | null,"display_name": string | null,"id": string | null,"joined_at": string | null,"member_type": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"hall_of_fame_members": {
                  Row: {
                    "avatar_url": string | null,"display_name": string | null,"id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"hall_of_fame_records": {
                  Row: {
                    "age_at_race": number | null,"avatar_url": string | null,"chip_time_s": number | null,"display_name": string | null,"distance_m": number | null,"gender": string | null,"id": string | null,"member_id": string | null,"race_date": string | null,"race_name": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"draw_members": {
                  Row: {
                    "display_name": string | null,"id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"fund_balances": {
                  Row: {
                    "account_id": string | null,"balance": number | null,"kind": string | null,"name": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"event_counts": {
                  Row: {
                    "event_id": string | null,"going_count": number | null,"maybe_count": number | null,"photo_count": number | null,"waitlist_count": number | null
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
                },"record_member_info": {
                  Row: {
                    "birth_year": number | null,"id": string
                  }
                  ComputedFields: never
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
"advance_challenge_statuses":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           },
"auto_enroll_member":
{ Args: { "p_member_id": string }; Returns: undefined
                           },
"join_challenge":
{ Args: { "p_category_id": string,"p_challenge_id": string }; Returns: undefined
                           },
"pick_challenge_category":
{ Args: { "p_challenge_id": string,"p_gender": string,"p_member_type": string }; Returns: string
                           },
"publish_challenge":
{ Args: { "p_challenge_id": string }; Returns: undefined
                           },
"rank_challenge":
{ Args: { "p_challenge_id": string }; Returns: undefined
                           },
"can_view_member_stats":
{ Args: { "p_member_id": string }; Returns: boolean
                           },
"is_active_member":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"can_manage_fund":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"get_fund_receiving_account":
{ Args: Record<PropertyKey, never>; Returns: { bank_bin: string; account_no: string; account_name: string }[]
                           },
"create_payment_intent":
{ Args: { "p_penalty_ids": string[]; "p_method": string }; Returns: string
                           },
"settle_payment_intent":
{ Args: { "p_intent_id": string; "p_event_id": string | null; "p_actor": string | null }; Returns: boolean
                           },
"record_bank_event":
{ Args: { "p_provider": string; "p_txn_id": string; "p_direction": string; "p_amount": number; "p_content": string; "p_account_no": string; "p_transferred_at": string; "p_raw": Json }; Returns: { event_id: string; is_new: boolean; processed: boolean }[]
                           },
"finish_bank_event":
{ Args: { "p_event_id": string; "p_status": string; "p_intent_id": string | null; "p_member_id": string | null }; Returns: undefined
                           },
"resolve_bank_event":
{ Args: { "p_event_id": string; "p_intent_id": string }; Returns: undefined
                           },
"confirm_cash_payment":
{ Args: { "p_intent_id": string }; Returns: undefined
                           },
"cancel_payment_intent":
{ Args: { "p_intent_id": string }; Returns: undefined
                           },
"add_fund_transaction":
{ Args: { "p_account_id": string; "p_direction": string; "p_amount": number; "p_category_id": string | null; "p_occurred_at": string; "p_description": string; "p_member_id": string | null; "p_event_id": string | null; "p_receipt_url": string | null }; Returns: string
                           },
"void_fund_transaction":
{ Args: { "p_id": string; "p_reason": string }; Returns: undefined
                           },
"classify_fund_transaction":
{ Args: { "p_id": string; "p_category_id": string | null; "p_member_id": string | null; "p_description": string | null }; Returns: undefined
                           },
"record_fund_reconciliation":
{ Args: { "p_account_id": string; "p_as_of": string; "p_statement_balance": number; "p_note": string }; Returns: number
                           },
"mark_penalties_paid":
{ Args: { "p_ids": string[]; "p_method": string; "p_ref": string }; Returns: number
                           },
"waive_penalties":
{ Args: { "p_ids": string[]; "p_reason": string }; Returns: number
                           },
"unmark_penalty_paid":
{ Args: { "p_id": string; "p_reason": string }; Returns: undefined
                           },
"penalty_totals":
{ Args: { "p_from": string; "p_to": string }; Returns: { member_id: string; display_name: string | null; total_amount: number; unpaid_amount: number }[]
                           },
"post_is_readable":
{ Args: { "p_post_id": string }; Returns: boolean
                           },
"delete_post_comment":
{ Args: { "p_comment_id": string }; Returns: undefined
                           },
"unread_post_count":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"admin_review_members":
{ Args: { "p_approve": boolean,"p_member_ids": string[],"p_member_type": string,"p_reason": string }; Returns: number
                           },
"generate_honors":
{ Args: { "p_first_marathon_min_m": number,"p_milestones_km": number[] }; Returns: number
                           },
"admin_verify_race_result":
{ Args: { "p_result_id": string,"p_verified": boolean }; Returns: undefined
                           },
"admin_update_member":
{ Args: { "p_member_id": string,"p_member_type": string,"p_role": string,"p_status": string }; Returns: undefined
                           },
"set_event_attendance":
{ Args: { "p_event_id": string,"p_note"?: string,"p_status": string }; Returns: string
                           },
"promote_event_waitlist_bcn":
{ Args: { "p_event_id": string }; Returns: string[]
                           },
"event_checkin_code":
{ Args: { "p_event_id": string }; Returns: { code: string; expires_in_s: number }[]
                           },
"self_check_in":
{ Args: { "p_event_id": string,"p_code": string }; Returns: string
                           },
"event_run_summary":
{ Args: { "p_event_id": string }; Returns: { attended_count: number; runner_count: number; total_distance_m: number; total_moving_time_s: number }[]
                           },
"admin_event_stats":
{ Args: { "p_from": string,"p_to": string }; Returns: { event_id: string; title: string; starts_at: string; registered_count: number; attended_count: number; total_distance_m: number }[]
                           },
"admin_event_top_attendees":
{ Args: { "p_from": string,"p_limit": number,"p_to": string }; Returns: { member_id: string; display_name: string | null; event_count: number }[]
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
