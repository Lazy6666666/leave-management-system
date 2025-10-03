export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      company_documents: {
        Row: {
          created_at: string | null
          document_type: string | null
          expiry_date: string | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          name: string
          storage_path: string
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          expiry_date?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name: string
          storage_path: string
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          expiry_date?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name?: string
          storage_path?: string
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_notifiers: {
        Row: {
          created_at: string | null
          custom_frequency_days: number | null
          document_id: string
          id: string
          last_notification_sent: string | null
          notification_frequency: Database["public"]["Enums"]["notification_frequency"]
          status: Database["public"]["Enums"]["notifier_status"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_frequency_days?: number | null
          document_id: string
          id?: string
          last_notification_sent?: string | null
          notification_frequency: Database["public"]["Enums"]["notification_frequency"]
          status?: Database["public"]["Enums"]["notifier_status"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_frequency_days?: number | null
          document_id?: string
          id?: string
          last_notification_sent?: string | null
          notification_frequency?: Database["public"]["Enums"]["notification_frequency"]
          status?: Database["public"]["Enums"]["notifier_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_notifiers_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "company_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_notifiers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          allocated_days: number
          carried_forward_days: number
          created_at: string | null
          employee_id: string
          id: string
          leave_type_id: string
          updated_at: string | null
          used_days: number
          year: number
        }
        Insert: {
          allocated_days?: number
          carried_forward_days?: number
          created_at?: string | null
          employee_id: string
          id?: string
          leave_type_id: string
          updated_at?: string | null
          used_days?: number
          year: number
        }
        Update: {
          allocated_days?: number
          carried_forward_days?: number
          created_at?: string | null
          employee_id?: string
          id?: string
          leave_type_id?: string
          updated_at?: string | null
          used_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          accrual_rules: Json | null
          created_at: string | null
          default_allocation_days: number
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          accrual_rules?: Json | null
          created_at?: string | null
          default_allocation_days?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          accrual_rules?: Json | null
          created_at?: string | null
          default_allocation_days?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      leaves: {
        Row: {
          approved_at: string | null
          approver_id: string | null
          comments: string | null
          created_at: string | null
          days_count: number
          end_date: string
          id: string
          leave_type_id: string
          metadata: Json | null
          reason: string | null
          requester_id: string
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approver_id?: string | null
          comments?: string | null
          created_at?: string | null
          days_count: number
          end_date: string
          id?: string
          leave_type_id: string
          metadata?: Json | null
          reason?: string | null
          requester_id: string
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approver_id?: string | null
          comments?: string | null
          created_at?: string | null
          days_count?: number
          end_date?: string
          id?: string
          leave_type_id?: string
          metadata?: Json | null
          reason?: string | null
          requester_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaves_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          document_id: string | null
          error_message: string | null
          id: string
          notifier_id: string | null
          recipient_email: string
          result: Json | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_delivery_status"]
        }
        Insert: {
          document_id?: string | null
          error_message?: string | null
          id?: string
          notifier_id?: string | null
          recipient_email: string
          result?: Json | null
          sent_at?: string | null
          status: Database["public"]["Enums"]["notification_delivery_status"]
        }
        Update: {
          document_id?: string | null
          error_message?: string | null
          id?: string
          notifier_id?: string | null
          recipient_email?: string
          result?: Json | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_delivery_status"]
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "company_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_notifier_id_fkey"
            columns: ["notifier_id"]
            isOneToOne: false
            referencedRelation: "document_notifiers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          full_name: string
          id: string
          metadata: Json | null
          photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          full_name: string
          id: string
          metadata?: Json | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          full_name?: string
          id?: string
          metadata?: Json | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_leave_conflicts: {
        Args: {
          p_employee_id: string
          p_end_date: string
          p_exclude_leave_id?: string
          p_start_date: string
        }
        Returns: boolean
      }
      get_available_leave_days: {
        Args: { p_employee_id: string; p_leave_type_id: string; p_year: number }
        Returns: number
      }
      get_leave_statistics: {
        Args: { p_user_id: string; p_year: number }
        Returns: Json
      }
      get_team_leave_calendar: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: {
          employee_id: string
          employee_name: string
          leave_end: string
          leave_start: string
          leave_type: string
          status: Database["public"]["Enums"]["leave_status"]
        }[]
      }
      update_leave_balance: {
        Args: {
          p_days_used: number
          p_employee_id: string
          p_leave_type_id: string
          p_year: number
        }
        Returns: undefined
      }
    }
    Enums: {
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      notification_delivery_status: "sent" | "failed" | "pending" | "retrying"
      notification_frequency: "weekly" | "monthly" | "custom"
      notifier_status: "active" | "inactive"
      user_role: "employee" | "manager" | "admin" | "hr"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      notification_delivery_status: ["sent", "failed", "pending", "retrying"],
      notification_frequency: ["weekly", "monthly", "custom"],
      notifier_status: ["active", "inactive"],
      user_role: ["employee", "manager", "admin", "hr"],
    },
  },
} as const
