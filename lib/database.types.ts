export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          status: "active" | "less-active"
          skills: string[] | null
          fhe_group_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          status?: "active" | "less-active"
          skills?: string[] | null
          fhe_group_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          status?: "active" | "less-active"
          skills?: string[] | null
          fhe_group_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      callings: {
        Row: {
          id: string
          title: string
          organization: string
          status: "filled" | "vacant"
          member_id: string | null
          sustained_date: string | null
          is_set_apart: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          organization: string
          status?: "filled" | "vacant"
          member_id?: string | null
          sustained_date?: string | null
          is_set_apart?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          organization?: string
          status?: "filled" | "vacant"
          member_id?: string | null
          sustained_date?: string | null
          is_set_apart?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      fhe_groups: {
        Row: {
          id: string
          name: string
          leader_id: string | null
          location: string | null
          meeting_time: string | null
          activity_image: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          leader_id?: string | null
          location?: string | null
          meeting_time?: string | null
          activity_image?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          leader_id?: string | null
          location?: string | null
          meeting_time?: string | null
          activity_image?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          date: string
          time: string
          location: string | null
          description: string | null
          attendees: string[] | null
          type: "meeting" | "activity" | "service" | "other"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          date: string
          time: string
          location?: string | null
          description?: string | null
          attendees?: string[] | null
          type?: "meeting" | "activity" | "service" | "other"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          date?: string
          time?: string
          location?: string | null
          description?: string | null
          attendees?: string[] | null
          type?: "meeting" | "activity" | "service" | "other"
          created_at?: string
          updated_at?: string
        }
      }
      survey_responses: {
        Row: {
          id: string
          full_name: string
          record_number: string | null
          birth_date: string | null
          email: string | null
          phone: string | null
          address: string | null
          family_members: string | null
          marital_status: string | null
          previous_ward: string | null
          previous_stake: string | null
          move_in_date: string | null
          is_homeowner: boolean
          is_renting: boolean
          skills: string | null
          interests: string | null
          calling_preferences: string | null
          additional_info: string | null
          submitted_at: string
          processed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          record_number?: string | null
          birth_date?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          family_members?: string | null
          marital_status?: string | null
          previous_ward?: string | null
          previous_stake?: string | null
          move_in_date?: string | null
          is_homeowner?: boolean
          is_renting?: boolean
          skills?: string | null
          interests?: string | null
          calling_preferences?: string | null
          additional_info?: string | null
          submitted_at?: string
          processed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          record_number?: string | null
          birth_date?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          family_members?: string | null
          marital_status?: string | null
          previous_ward?: string | null
          previous_stake?: string | null
          move_in_date?: string | null
          is_homeowner?: boolean
          is_renting?: boolean
          skills?: string | null
          interests?: string | null
          calling_preferences?: string | null
          additional_info?: string | null
          submitted_at?: string
          processed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      lcr_update_tasks: {
        Row: {
          id: string
          type: "calling_sustained" | "calling_set_apart" | "new_member" | "released_from_calling" | "other"
          description: string
          details: Json
          created_at: string
          created_by: string
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          type: "calling_sustained" | "calling_set_apart" | "new_member" | "released_from_calling" | "other"
          description: string
          details: Json
          created_at?: string
          created_by: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          type?: "calling_sustained" | "calling_set_apart" | "new_member" | "released_from_calling" | "other"
          description?: string
          details?: Json
          created_at?: string
          created_by?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          permissions: Json | null
          last_login: string | null
          status: "active" | "inactive"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: string
          permissions?: Json | null
          last_login?: string | null
          status?: "active" | "inactive"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          permissions?: Json | null
          last_login?: string | null
          status?: "active" | "inactive"
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
