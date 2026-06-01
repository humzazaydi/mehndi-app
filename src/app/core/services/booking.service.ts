import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Booking, BookingStatus, BookingWizardData } from '../models';

const BOOKING_SELECT = `
  *,
  artists(id, name, photo_url),
  packages(id, name, base_price),
  profiles(id, full_name, phone),
  booking_addons(*, addons(id, name, price)),
  booking_status_history(*, profiles(full_name))
`;

@Injectable({ providedIn: 'root' })
export class BookingService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  readonly bookings = signal<Booking[]>([]);
  readonly loading = signal(false);
  readonly selectedBooking = signal<Booking | null>(null);

  async loadMyBookings(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    this.loading.set(true);
    const { data } = await this.supabase.client
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('client_id', userId)
      .order('created_at', { ascending: false });
    this.bookings.set((data ?? []) as Booking[]);
    this.loading.set(false);
  }

  async loadAllBookings(filters?: { status?: BookingStatus; artistId?: string; dateFrom?: string; dateTo?: string }): Promise<void> {
    this.loading.set(true);
    let q = this.supabase.client
      .from('bookings')
      .select(BOOKING_SELECT)
      .order('created_at', { ascending: false });

    if (filters?.status) q = q.eq('status', filters.status);
    if (filters?.artistId) q = q.eq('artist_id', filters.artistId);
    if (filters?.dateFrom) q = q.gte('date', filters.dateFrom);
    if (filters?.dateTo) q = q.lte('date', filters.dateTo);

    const { data } = await q;
    this.bookings.set((data ?? []) as Booking[]);
    this.loading.set(false);
  }

  async getById(id: string): Promise<Booking | null> {
    const { data } = await this.supabase.client
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('id', id)
      .single();
    this.selectedBooking.set((data as Booking) ?? null);
    return (data as Booking) ?? null;
  }

  async create(wizardData: BookingWizardData): Promise<Booking> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    const booking = {
      client_id: userId,
      artist_id: wizardData.artistId,
      package_id: wizardData.packageId,
      status: 'pending' as BookingStatus,
      date: wizardData.date,
      time_slot: wizardData.timeSlot,
      full_name: wizardData.fullName,
      phone: wizardData.phone,
      alt_phone: wizardData.altPhone || null,
      email: wizardData.email,
      address: wizardData.address,
      location_lat: wizardData.locationLat,
      location_lng: wizardData.locationLng,
      location_address: wizardData.locationAddress,
      notes: wizardData.notes || null,
      total_amount: wizardData.totalAmount,
      advance_amount: wizardData.advanceAmount,
      paid_amount: 0,
      remaining_amount: wizardData.totalAmount,
      terms_accepted: wizardData.termsAccepted,
    };

    const { data, error } = await this.supabase.client
      .from('bookings')
      .insert(booking)
      .select()
      .single();
    if (error) throw error;

    const created = data as Booking;

    if (wizardData.addonIds.length > 0) {
      // Fetch addon prices
      const { data: addonData } = await this.supabase.client
        .from('addons')
        .select('id, price')
        .in('id', wizardData.addonIds);

      const bookingAddons = (addonData ?? []).map((a: { id: string; price: number }) => ({
        booking_id: created.id,
        addon_id: a.id,
        price_at_booking: a.price,
      }));
      await this.supabase.client.from('booking_addons').insert(bookingAddons);
    }

    return created;
  }

  async updateStatus(bookingId: string, status: BookingStatus, notes?: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    const { error } = await this.supabase.client
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);
    if (error) throw error;

    await this.supabase.client.from('booking_status_history').insert({
      booking_id: bookingId,
      status,
      changed_by: userId,
      notes: notes ?? null,
    });
  }

  async getAvailableTimeSlots(artistId: string, date: string): Promise<string[]> {
    const ALL_SLOTS = [
      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
    ];
    const { data } = await this.supabase.client
      .from('bookings')
      .select('time_slot')
      .eq('artist_id', artistId)
      .eq('date', date)
      .not('status', 'in', '(cancelled,rejected)');
    const booked = new Set((data ?? []).map((b: { time_slot: string }) => b.time_slot));
    return ALL_SLOTS.filter(s => !booked.has(s));
  }

  subscribeToBookingUpdates(userId: string, callback: (booking: Booking) => void) {
    return this.supabase.client
      .channel('booking-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `client_id=eq.${userId}` },
        (payload) => callback(payload.new as Booking)
      )
      .subscribe();
  }
}
