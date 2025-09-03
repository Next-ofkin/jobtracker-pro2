export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          company: string | null;
          url: string;
          source: string;
          created_at: string;
          posted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          company?: string | null;
          url: string;
          source: string;
          created_at?: string;
          posted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          company?: string | null;
          url?: string;
          source?: string;
          created_at?: string;
          posted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
