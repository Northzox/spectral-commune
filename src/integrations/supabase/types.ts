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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appeals: {
        Row: {
          ban_id: string
          created_at: string | null
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["appeal_status"] | null
          user_id: string
        }
        Insert: {
          ban_id: string
          created_at?: string | null
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["appeal_status"] | null
          user_id: string
        }
        Update: {
          ban_id?: string
          created_at?: string | null
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["appeal_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appeals_ban_id_fkey"
            columns: ["ban_id"]
            isOneToOne: false
            referencedRelation: "bans"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      bans: {
        Row: {
          banned_by: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          is_global: boolean | null
          reason: string | null
          server_id: string | null
          user_id: string
        }
        Insert: {
          banned_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          is_global?: boolean | null
          reason?: string | null
          server_id?: string | null
          user_id: string
        }
        Update: {
          banned_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          is_global?: boolean | null
          reason?: string | null
          server_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bans_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_categories: {
        Row: {
          id: string
          name: string
          position: number | null
          server_id: string
        }
        Insert: {
          id?: string
          name: string
          position?: number | null
          server_id: string
        }
        Update: {
          id?: string
          name?: string
          position?: number | null
          server_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_categories_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          name: string
          position: number | null
          server_id: string
          topic: string | null
          type: Database["public"]["Enums"]["channel_type"] | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          position?: number | null
          server_id: string
          topic?: string | null
          type?: Database["public"]["Enums"]["channel_type"] | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          position?: number | null
          server_id?: string
          topic?: string | null
          type?: Database["public"]["Enums"]["channel_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "channel_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_id: string
          channel_id: string
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          pinned: boolean | null
          reply_to: string | null
          thread_id: string | null
        }
        Insert: {
          author_id: string
          channel_id: string
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          pinned?: boolean | null
          reply_to?: string | null
          thread_id?: string | null
        }
        Update: {
          author_id?: string
          channel_id?: string
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          pinned?: boolean | null
          reply_to?: string | null
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string | null
          custom_status: string | null
          email: string | null
          id: string
          phone: string | null
          presence: Database["public"]["Enums"]["user_presence"] | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_status?: string | null
          email?: string | null
          id: string
          phone?: string | null
          presence?: Database["public"]["Enums"]["user_presence"] | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_status?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          presence?: Database["public"]["Enums"]["user_presence"] | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      server_invites: {
        Row: {
          code: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          max_uses: number | null
          server_id: string
          uses: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          server_id: string
          uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          server_id?: string
          uses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "server_invites_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      server_member_roles: {
        Row: {
          id: string
          server_member_id: string
          server_role_id: string
        }
        Insert: {
          id?: string
          server_member_id: string
          server_role_id: string
        }
        Update: {
          id?: string
          server_member_id?: string
          server_role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_member_roles_server_member_id_fkey"
            columns: ["server_member_id"]
            isOneToOne: false
            referencedRelation: "server_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "server_member_roles_server_role_id_fkey"
            columns: ["server_role_id"]
            isOneToOne: false
            referencedRelation: "server_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      server_members: {
        Row: {
          id: string
          joined_at: string | null
          server_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          server_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          server_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_members_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      server_roles: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          permissions: Json | null
          position: number | null
          server_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          permissions?: Json | null
          position?: number | null
          server_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          permissions?: Json | null
          position?: number | null
          server_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_roles_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      servers: {
        Row: {
          banner_url: string | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_server_member: {
        Args: { _server_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      appeal_status: "pending" | "approved" | "denied"
      channel_type: "text" | "voice" | "stage" | "announcement" | "forum"
      user_presence: "online" | "idle" | "dnd" | "invisible" | "offline"
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
      app_role: ["admin", "moderator", "user"],
      appeal_status: ["pending", "approved", "denied"],
      channel_type: ["text", "voice", "stage", "announcement", "forum"],
      user_presence: ["online", "idle", "dnd", "invisible", "offline"],
    },
  },
} as const
