import { Artist } from './artist.model';
import { Package, Addon } from './package.model';
import { Profile } from './user.model';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface Booking {
  id: string;
  booking_number: string;
  client_id: string;
  artist_id: string;
  package_id: string;
  status: BookingStatus;
  date: string;
  time_slot: string;
  full_name: string;
  phone: string;
  alt_phone: string | null;
  email: string;
  address: string;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  notes: string | null;
  total_amount: number;
  advance_amount: number;
  paid_amount: number;
  remaining_amount: number;
  terms_accepted: boolean;
  created_at: string;
  updated_at: string;
  artists?: Artist;
  packages?: Package;
  profiles?: Profile;
  booking_addons?: BookingAddon[];
  booking_status_history?: BookingStatusHistory[];
}

export interface BookingAddon {
  id: string;
  booking_id: string;
  addon_id: string;
  price_at_booking: number;
  addons?: Addon;
}

export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  status: BookingStatus;
  changed_by: string;
  notes: string | null;
  created_at: string;
  profiles?: Profile;
}

export interface BookingWizardData {
  artistId: string | null;
  packageId: string | null;
  addonIds: string[];
  date: string | null;
  timeSlot: string | null;
  fullName: string;
  phone: string;
  altPhone: string;
  email: string;
  address: string;
  locationLat: number | null;
  locationLng: number | null;
  locationAddress: string | null;
  notes: string;
  totalAmount: number;
  advanceAmount: number;
  termsAccepted: boolean;
}
