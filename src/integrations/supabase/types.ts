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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alert_settings: {
        Row: {
          alert_type: string
          created_at: string
          days_before: number
          id: string
          is_enabled: boolean
          message_template: string | null
          updated_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          days_before?: number
          id?: string
          is_enabled?: boolean
          message_template?: string | null
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          days_before?: number
          id?: string
          is_enabled?: boolean
          message_template?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          created_at: string
          display_name: string
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cars: {
        Row: {
          created_at: string
          current_delegate_id: string | null
          delegation_end: string | null
          delegation_start: string | null
          downtime_end: string | null
          downtime_reason: string | null
          downtime_start: string | null
          id: string
          plate: string
          status: string
          temporary_end_date: string | null
          temporary_start_date: string | null
          temporary_vehicle_plate: string | null
          temporary_vehicle_type: string | null
          type: string
          updated_at: string
          photo_url: string | null
          brand: string | null
          model: string | null
          year: number | null
          color: string | null
          chassis_number: string | null
          inspection_expiry: string | null
          insurance_expiry: string | null
          operation_card_expiry: string | null
        }
        Insert: {
          created_at?: string
          current_delegate_id?: string | null
          delegation_end?: string | null
          delegation_start?: string | null
          downtime_end?: string | null
          downtime_reason?: string | null
          downtime_start?: string | null
          id?: string
          plate: string
          status?: string
          temporary_end_date?: string | null
          temporary_start_date?: string | null
          temporary_vehicle_plate?: string | null
          temporary_vehicle_type?: string | null
          type: string
          updated_at?: string
          photo_url?: string | null
          brand?: string | null
          model?: string | null
          year?: number | null
          color?: string | null
          chassis_number?: string | null
          inspection_expiry?: string | null
          insurance_expiry?: string | null
          operation_card_expiry?: string | null
        }
        Update: {
          created_at?: string
          current_delegate_id?: string | null
          delegation_end?: string | null
          delegation_start?: string | null
          downtime_end?: string | null
          downtime_reason?: string | null
          downtime_start?: string | null
          id?: string
          plate?: string
          status?: string
          temporary_end_date?: string | null
          temporary_start_date?: string | null
          temporary_vehicle_plate?: string | null
          temporary_vehicle_type?: string | null
          type?: string
          updated_at?: string
          photo_url?: string | null
          brand?: string | null
          model?: string | null
          year?: number | null
          color?: string | null
          chassis_number?: string | null
          inspection_expiry?: string | null
          insurance_expiry?: string | null
          operation_card_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_current_delegate_id_fkey"
            columns: ["current_delegate_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          commercial_register: string | null
          company_name: string
          created_at: string
          headquarters_location: string | null
          id: string
          legal_name: string | null
          official_email: string | null
          phone_numbers: string[] | null
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          commercial_register?: string | null
          company_name?: string
          created_at?: string
          headquarters_location?: string | null
          id?: string
          legal_name?: string | null
          official_email?: string | null
          phone_numbers?: string[] | null
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          commercial_register?: string | null
          company_name?: string
          created_at?: string
          headquarters_location?: string | null
          id?: string
          legal_name?: string | null
          official_email?: string | null
          phone_numbers?: string[] | null
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      delegation_history: {
        Row: {
          car_id: string
          created_at: string
          driver_id: string
          end_date: string | null
          id: string
          start_date: string
        }
        Insert: {
          car_id: string
          created_at?: string
          driver_id: string
          end_date?: string | null
          id?: string
          start_date: string
        }
        Update: {
          car_id?: string
          created_at?: string
          driver_id?: string
          end_date?: string | null
          id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegation_history_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegation_history_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_applications: {
        Row: {
          application_id: string
          created_at: string
          driver_id: string
          employee_id: string | null
          end_date: string | null
          id: string
          is_verified: boolean
          last_import_date: string | null
          orders_count: number | null
          start_date: string
          updated_at: string
          working_days: number | null
        }
        Insert: {
          application_id: string
          created_at?: string
          driver_id: string
          employee_id?: string | null
          end_date?: string | null
          id?: string
          is_verified?: boolean
          last_import_date?: string | null
          orders_count?: number | null
          start_date: string
          updated_at?: string
          working_days?: number | null
        }
        Update: {
          application_id?: string
          created_at?: string
          driver_id?: string
          employee_id?: string | null
          end_date?: string | null
          id?: string
          is_verified?: boolean
          last_import_date?: string | null
          orders_count?: number | null
          start_date?: string
          updated_at?: string
          working_days?: number | null
        }
        Relationships: []
      }
      driver_documents: {
        Row: {
          id: string
          driver_id: string
          doc_type: string
          file_url: string | null
          file_name: string | null
          file_size: number | null
          mime_type: string | null
          expiry_date: string | null
          status: string
          notes: string | null
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          doc_type: string
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          expiry_date?: string | null
          status?: string
          notes?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          doc_type?: string
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          expiry_date?: string | null
          status?: string
          notes?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          }
        ]
      }
      drivers: {
        Row: {
          archived_reason: string | null
          created_at: string
          end_date: string | null
          full_name: string
          id: string
          iqama: string
          iqama_expiry: string
          license_expiry: string
          manager: string | null
          medical_expiry: string
          status: string
          updated_at: string
          using_app: boolean | null
          photo_url: string | null
          nationality: string | null
          phone: string | null
          city: string | null
          profession: string | null
          ajeer_expiry: string | null
          performance_score: number | null
          working_hours: number | null
          orders_count: number | null
          app_name: string | null
        }
        Insert: {
          archived_reason?: string | null
          created_at?: string
          end_date?: string | null
          full_name: string
          id?: string
          iqama: string
          iqama_expiry: string
          license_expiry: string
          manager?: string | null
          medical_expiry: string
          status?: string
          updated_at?: string
          using_app?: boolean | null
          photo_url?: string | null
          nationality?: string | null
          phone?: string | null
          city?: string | null
          profession?: string | null
          ajeer_expiry?: string | null
          performance_score?: number | null
          working_hours?: number | null
          orders_count?: number | null
          app_name?: string | null
        }
        Update: {
          archived_reason?: string | null
          created_at?: string
          end_date?: string | null
          full_name?: string
          id?: string
          iqama?: string
          iqama_expiry?: string
          license_expiry?: string
          manager?: string | null
          medical_expiry?: string
          status?: string
          updated_at?: string
          using_app?: boolean | null
          photo_url?: string | null
          nationality?: string | null
          phone?: string | null
          city?: string | null
          profession?: string | null
          ajeer_expiry?: string | null
          performance_score?: number | null
          working_hours?: number | null
          orders_count?: number | null
          app_name?: string | null
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          application_id: string
          created_at: string
          end_date: string | null
          file_name: string | null
          id: string
          imported_by: string | null
          mismatches_count: number | null
          records_count: number | null
          start_date: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          end_date?: string | null
          file_name?: string | null
          id?: string
          imported_by?: string | null
          mismatches_count?: number | null
          records_count?: number | null
          start_date?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          end_date?: string | null
          file_name?: string | null
          id?: string
          imported_by?: string | null
          mismatches_count?: number | null
          records_count?: number | null
          start_date?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          target_id: string | null
          target_type: string | null
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          target_id?: string | null
          target_type?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          target_id?: string | null
          target_type?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          full_name: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          resource: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          resource: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          resource?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_with_profile: {
        Args: {
          department?: string
          email: string
          full_name: string
          password: string
          user_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_permission: {
        Args: { perm: string; res: string; user_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "employee" | "accountant"
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
  public: {
    Enums: {
      app_role: ["admin", "manager", "employee", "accountant"],
    },
  },
} as const
