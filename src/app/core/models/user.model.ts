export type UserRole = 'admin' | 'client' | 'artist' | 'cones_manager';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}
