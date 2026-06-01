export interface Package {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  sort_order: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Addon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
