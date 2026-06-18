import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { Booking, BookingStatus, BookingWizardData, NotificationType } from '../models';

const BOOKING_SELECT = `
  *,
  artists(id, name, photo_url),
  packages(id, name, base_price),
  profiles(id, full_name, phone),
  booking_addons(*, addons(id, name, price)),
  booking_status_history(*, profiles(full_name))
`;

interface BookingStatusNotif {
  title: string;
  message: (bookingNumber: string) => string;
  type: NotificationType;
}

const STATUS_NOTIF: Partial<Record<BookingStatus, BookingStatusNotif>> = {
  confirmed: {
    title: 'Booking Confirmed',
    message: n => `Your booking #${n} has been confirmed. We look forward to serving you!`,
    type: 'booking_confirmed',
  },
  rejected: {
    title: 'Booking Rejected',
    message: n => `Your booking #${n} could not be accepted. Please contact us for details.`,
    type: 'booking_rejected',
  },
  in_progress: {
    title: 'Service In Progress',
    message: n => `Your booking #${n} is now in progress. Enjoy your session!`,
    type: 'booking_in_progress',
  },
  completed: {
    title: 'Service Completed',
    message: n => `Your booking #${n} is complete. Thank you for choosing Henna Studio!`,
    type: 'booking_completed',
  },
  cancelled: {
    title: 'Booking Cancelled',
    message: n => `Your booking #${n} has been cancelled.`,
    type: 'booking_cancelled',
  },
};

@Injectable({ providedIn: 'root' })
export class BookingService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private notif = inject(NotificationService);

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

  async loadArtistBookings(): Promise<void> {
    const artistId = this.auth.artist()?.id;
    if (!artistId) {
      this.bookings.set([]);
      return;
    }
    this.loading.set(true);
    const { data } = await this.supabase.client
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('artist_id', artistId)
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true });
    this.bookings.set((data ?? []) as Booking[]);
    this.loading.set(false);
  }

  subscribeToArtistBookings(artistId: string, callback: (payload: any) => void) {
    return this.supabase.client
      .channel(`artist-bookings-${artistId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `artist_id=eq.${artistId}` },
        (payload) => callback(payload)
      )
      .subscribe();
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

    // Fire-and-forget notifications — don't let failures affect the booking
    this.sendNewBookingNotifications(created, wizardData).catch(() => {});

    return created;
  }

  private async sendNewBookingNotifications(booking: Booking, wizardData: BookingWizardData): Promise<void> {
    const data = { booking_id: booking.id };
    const tasks: Promise<void>[] = [
      this.notif.notifyAdmins(
        'New Booking Received',
        `${wizardData.fullName} submitted a new booking for ${wizardData.date} at ${wizardData.timeSlot}.`,
        'booking_created',
        data
      ),
    ];
    if (wizardData.artistId) {
      tasks.push(
        this.notif.notifyArtist(
          wizardData.artistId,
          'New Booking Assigned',
          `You have a new booking on ${wizardData.date} at ${wizardData.timeSlot}.`,
          'booking_created',
          data
        )
      );
    }
    await Promise.all(tasks);
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

    // Notify client of status change
    this.sendStatusChangeNotification(bookingId, status).catch(() => {});
  }

  private async sendStatusChangeNotification(bookingId: string, status: BookingStatus): Promise<void> {
    const notifTemplate = STATUS_NOTIF[status];
    if (!notifTemplate) return;

    const { data } = await this.supabase.client
      .from('bookings')
      .select('client_id, artist_id, booking_number')
      .eq('id', bookingId)
      .single();
    if (!data) return;

    const b = data as { client_id: string; artist_id: string; booking_number: string };

    await this.notif.createNotification(
      b.client_id,
      notifTemplate.title,
      notifTemplate.message(b.booking_number),
      notifTemplate.type,
      { booking_id: bookingId, booking_number: b.booking_number }
    );

    // Also notify artist when booking is cancelled so they free the slot
    if (status === 'cancelled') {
      await this.notif.notifyArtist(
        b.artist_id,
        'Booking Cancelled',
        `A booking on your schedule has been cancelled.`,
        'booking_cancelled',
        { booking_id: bookingId }
      );
    }
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
