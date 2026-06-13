import { Package } from './package.model';

export interface Artist {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  is_active: boolean;
  profile_id?: string | null;
  created_at: string;
  updated_at: string;
  artist_packages?: ArtistPackage[];
}

export interface ArtistPackage {
  id: string;
  artist_id: string;
  package_id: string;
  custom_price: number | null;
  is_available: boolean;
  packages?: Package;
}
