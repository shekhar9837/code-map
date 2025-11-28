export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Add your database table types here
      // Example:
      // profiles: {
      //   Row: {
      //     id: string
      //     created_at: string
      //     // ... other fields
      //   }
      //   Insert: {
      //     id?: string
      //     created_at?: string
      //     // ... other fields
      //   }
      //   Update: {
      //     id?: string
      //     created_at?: string
      //     // ... other fields
      //   }
      // }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
