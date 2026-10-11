export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_id: string | null;
          entity_type: string;
          created_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_id?: string | null;
          entity_type: string;
          created_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_id?: string | null;
          entity_type?: string;
          created_at?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      claims: {
        Row: {
          id: string;
          listing_id: string;
          ngo_id: string;
          locked_by_user_id: string;
          state: Database["public"]["Enums"]["claim_status"];
          locked_at: string;
          completed_at: string | null;
          cancelled_at: string | null;
          timed_out_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          ngo_id: string;
          locked_by_user_id: string;
          state?: Database["public"]["Enums"]["claim_status"];
          locked_at?: string;
          completed_at?: string | null;
          cancelled_at?: string | null;
          timed_out_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          ngo_id?: string;
          locked_by_user_id?: string;
          state?: Database["public"]["Enums"]["claim_status"];
          locked_at?: string;
          completed_at?: string | null;
          cancelled_at?: string | null;
          timed_out_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          listing_id: string;
          claim_id: string;
          sender_id: string;
          sender_role: Database["public"]["Enums"]["app_role"];
          message: string;
          shared_phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          claim_id: string;
          sender_id: string;
          sender_role: Database["public"]["Enums"]["app_role"];
          message: string;
          shared_phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          claim_id?: string;
          sender_id?: string;
          sender_role?: Database["public"]["Enums"]["app_role"];
          message?: string;
          shared_phone?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      donation_images: {
        Row: {
          id: string;
          listing_id: string;
          storage_path: string;
          mime_type: string | null;
          size_bytes: number | null;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          storage_path: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          storage_path?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      donation_listings: {
        Row: {
          id: string;
          donor_id: string;
          category: string;
          quantity: number;
          quality: Database["public"]["Enums"]["item_quality"];
          description: string | null;
          address_line1: string;
          landmark: string | null;
          locality: string;
          city: string;
          pincode: string;
          latitude: number;
          longitude: number;
          pickup_window_start: string;
          pickup_window_end: string;
          status: Database["public"]["Enums"]["donation_status"];
          created_at: string;
          updated_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          donor_id?: string;
          category: string;
          quantity: number;
          quality: Database["public"]["Enums"]["item_quality"];
          description?: string | null;
          address_line1: string;
          landmark?: string | null;
          locality: string;
          city?: string;
          pincode: string;
          latitude: number;
          longitude: number;
          pickup_window_start: string;
          pickup_window_end: string;
          status?: Database["public"]["Enums"]["donation_status"];
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          donor_id?: string;
          category?: string;
          quantity?: number;
          quality?: Database["public"]["Enums"]["item_quality"];
          description?: string | null;
          address_line1?: string;
          landmark?: string | null;
          locality?: string;
          city?: string;
          pincode?: string;
          latitude?: number;
          longitude?: number;
          pickup_window_start?: string;
          pickup_window_end?: string;
          status?: Database["public"]["Enums"]["donation_status"];
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          listing_id: string;
          claim_id: string | null;
          author_id: string;
          target_role: Database["public"]["Enums"]["app_role"];
          rating: number;
          comments: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          claim_id?: string | null;
          author_id?: string;
          target_role: Database["public"]["Enums"]["app_role"];
          rating: number;
          comments?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          claim_id?: string | null;
          author_id?: string;
          target_role?: Database["public"]["Enums"]["app_role"];
          rating?: number;
          comments?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ngo_staff: {
        Row: {
          id: string;
          ngo_id: string;
          user_id: string;
          staff_role: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          ngo_id: string;
          user_id: string;
          staff_role?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          ngo_id?: string;
          user_id?: string;
          staff_role?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      ngos: {
        Row: {
          id: string;
          name: string;
          address: string;
          city: string;
          pincode: string;
          ngo_darpan_id: string | null;
          registration_number: string | null;
          contact_phone: string | null;
          service_radius_km: number;
          accepted_categories: string[];
          operating_hours: Json;
          daily_pickup_capacity: number;
          rating_average: number;
          completion_rate: number;
          verified_status: Database["public"]["Enums"]["ngo_verification_status"];
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          city?: string;
          pincode: string;
          ngo_darpan_id?: string | null;
          registration_number?: string | null;
          contact_phone?: string | null;
          service_radius_km?: number;
          accepted_categories?: string[];
          operating_hours?: Json;
          daily_pickup_capacity?: number;
          rating_average?: number;
          completion_rate?: number;
          verified_status?: Database["public"]["Enums"]["ngo_verification_status"];
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          city?: string;
          pincode?: string;
          ngo_darpan_id?: string | null;
          registration_number?: string | null;
          contact_phone?: string | null;
          service_radius_km?: number;
          accepted_categories?: string[];
          operating_hours?: Json;
          daily_pickup_capacity?: number;
          rating_average?: number;
          completion_rate?: number;
          verified_status?: Database["public"]["Enums"]["ngo_verification_status"];
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          channel: string;
          delivery_status: string;
          title: string;
          body: string;
          href: string | null;
          metadata: Json;
          deliver_at: string;
          sent_at: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          channel?: string;
          delivery_status?: string;
          title: string;
          body: string;
          href?: string | null;
          metadata?: Json;
          deliver_at?: string;
          sent_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          channel?: string;
          delivery_status?: string;
          title?: string;
          body?: string;
          href?: string | null;
          metadata?: Json;
          deliver_at?: string;
          sent_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      pickup_tasks: {
        Row: {
          id: string;
          listing_id: string;
          claim_id: string;
          scheduled_start: string;
          scheduled_end: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          claim_id: string;
          scheduled_start: string;
          scheduled_end: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          claim_id?: string;
          scheduled_start?: string;
          scheduled_end?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["app_role"];
          city: string | null;
          pincode: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          city?: string | null;
          pincode?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          city?: string | null;
          pincode?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      complete_locked_claim: {
        Args: {
          listing_uuid: string;
        };
        Returns: string;
      };
      listing_detail_for_current_user: {
        Args: {
          listing_uuid: string;
        };
        Returns: {
          id: string;
          category: string;
          quantity: number;
          quality: Database["public"]["Enums"]["item_quality"];
          description: string | null;
          status: Database["public"]["Enums"]["donation_status"];
          locality: string;
          city: string;
          pincode: string;
          landmark: string | null;
          exact_address: string | null;
          latitude: number;
          longitude: number;
          pickup_window_start: string;
          pickup_window_end: string;
          distance_km: number | null;
          match_score: number | null;
          ngo_rating_average: number | null;
          ngo_completion_rate: number | null;
          donor_full_name: string | null;
          donor_phone: string | null;
          address_visible: boolean;
          current_claim_id: string | null;
          current_claim_state: Database["public"]["Enums"]["claim_status"] | null;
          current_ngo_name: string | null;
        }[];
      };
      log_audit_event: {
        Args: {
          event_action: string;
          event_entity_type: string;
          event_entity_id: string;
          event_metadata?: Json;
        };
        Returns: string;
      };
      lock_listing: {
        Args: {
          listing_uuid: string;
        };
        Returns: string;
      };
      nearby_live_listings: {
        Args: {
          max_radius_km?: number | null;
          filter_category?: string | null;
        };
        Returns: {
          id: string;
          category: string;
          quantity: number;
          quality: Database["public"]["Enums"]["item_quality"];
          description: string | null;
          locality: string;
          city: string;
          pincode: string;
          pickup_window_start: string;
          pickup_window_end: string;
          distance_km: number;
          match_score: number;
          ngo_rating_average: number;
          ngo_completion_rate: number;
          status: Database["public"]["Enums"]["donation_status"];
        }[];
      };
      queue_notification: {
        Args: {
          target_user_id: string;
          notification_kind: string;
          notification_title: string;
          notification_body: string;
          notification_href?: string | null;
          notification_channel?: string;
          notification_metadata?: Json;
          scheduled_for?: string;
        };
        Returns: string;
      };
      send_chat_message: {
        Args: {
          listing_uuid: string;
          message_body: string;
          share_phone?: boolean;
        };
        Returns: string;
      };
      sync_profile_from_auth_user: {
        Args: {
          target_user_id?: string | null;
        };
        Returns: Database["public"]["Enums"]["app_role"] | null;
      };
    };
    Enums: {
      app_role: "donor" | "ngo" | "admin";
      claim_status: "locked" | "completed" | "cancelled" | "timed_out";
      donation_status:
        | "submitted"
        | "live"
        | "locked"
        | "picked_up"
        | "cancelled"
        | "expired";
      item_quality: "new" | "excellent" | "good" | "fair";
      ngo_verification_status:
        | "pending"
        | "verified"
        | "rejected"
        | "suspended";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
