import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { Payment, PaymentMethod, PaymentType } from '../models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private notif = inject(NotificationService);

  readonly payments = signal<Payment[]>([]);
  readonly loading = signal(false);

  async loadPaymentsForBooking(bookingId: string): Promise<void> {
    this.loading.set(true);
    const { data } = await this.supabase.client
      .from('payments')
      .select('*, profiles(full_name)')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });
    this.payments.set((data ?? []) as Payment[]);
    this.loading.set(false);
  }

  async loadAllPayments(filters?: { status?: string }): Promise<void> {
    this.loading.set(true);
    let q = this.supabase.client
      .from('payments')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });
    if (filters?.status) q = q.eq('status', filters.status);
    const { data } = await q;
    this.payments.set((data ?? []) as Payment[]);
    this.loading.set(false);
  }

  async submitPayment(params: {
    bookingId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentType: PaymentType;
    transactionId?: string;
    receiptFile?: File;
    paymentDate: string;
    notes?: string;
  }): Promise<void> {
    let receiptUrl: string | null = null;

    if (params.receiptFile) {
      receiptUrl = await this.uploadReceipt(params.bookingId, params.receiptFile);
    }

    const { error } = await this.supabase.client.from('payments').insert({
      booking_id: params.bookingId,
      amount: params.amount,
      payment_method: params.paymentMethod,
      payment_type: params.paymentType,
      transaction_id: params.transactionId ?? null,
      receipt_url: receiptUrl,
      payment_date: params.paymentDate,
      status: 'pending',
      notes: params.notes ?? null,
    });
    if (error) throw error;

    // Notify admins that a payment is awaiting review
    this.notifyAdminsPaymentSubmitted(params.bookingId, params.amount).catch(() => {});
  }

  private async notifyAdminsPaymentSubmitted(bookingId: string, amount: number): Promise<void> {
    const { data } = await this.supabase.client
      .from('bookings')
      .select('booking_number')
      .eq('id', bookingId)
      .single();
    if (!data) return;
    const { booking_number } = data as { booking_number: string };
    await this.notif.notifyAdmins(
      'Payment Submitted',
      `A payment of Rs. ${amount.toLocaleString()} is pending review for booking #${booking_number}.`,
      'payment_submitted',
      { booking_id: bookingId, amount }
    );
  }

  async verifyPayment(paymentId: string, bookingId: string, paidAmount: number): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    const { error } = await this.supabase.client
      .from('payments')
      .update({ status: 'verified', verified_by: userId, verified_at: new Date().toISOString() })
      .eq('id', paymentId);
    if (error) throw error;

    const { data: booking } = await this.supabase.client
      .from('bookings')
      .select('paid_amount, total_amount, client_id, booking_number')
      .eq('id', bookingId)
      .single();

    if (booking) {
      const b = booking as { paid_amount: number; total_amount: number; client_id: string; booking_number: string };
      const newPaid = b.paid_amount + paidAmount;
      const newRemaining = b.total_amount - newPaid;
      await this.supabase.client
        .from('bookings')
        .update({ paid_amount: newPaid, remaining_amount: Math.max(0, newRemaining) })
        .eq('id', bookingId);

      // Notify the client
      this.notif.createNotification(
        b.client_id,
        'Payment Verified',
        `Your payment of Rs. ${paidAmount.toLocaleString()} for booking #${b.booking_number} has been verified.`,
        'payment_verified',
        { booking_id: bookingId, amount: paidAmount }
      ).catch(() => {});
    }
  }

  async rejectPayment(paymentId: string, notes: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;

    // Fetch payment before updating so we can notify the client
    const { data: paymentData } = await this.supabase.client
      .from('payments')
      .select('amount, booking_id')
      .eq('id', paymentId)
      .single();

    const { error } = await this.supabase.client
      .from('payments')
      .update({ status: 'rejected', verified_by: userId, verified_at: new Date().toISOString(), notes })
      .eq('id', paymentId);
    if (error) throw error;

    if (paymentData) {
      const p = paymentData as { amount: number; booking_id: string };
      this.notifyClientPaymentRejected(p.booking_id, p.amount).catch(() => {});
    }
  }

  private async notifyClientPaymentRejected(bookingId: string, amount: number): Promise<void> {
    const { data } = await this.supabase.client
      .from('bookings')
      .select('client_id, booking_number')
      .eq('id', bookingId)
      .single();
    if (!data) return;
    const b = data as { client_id: string; booking_number: string };
    await this.notif.createNotification(
      b.client_id,
      'Payment Rejected',
      `Your payment of Rs. ${amount.toLocaleString()} for booking #${b.booking_number} was not accepted. Please re-submit with correct details.`,
      'payment_rejected',
      { booking_id: bookingId, amount }
    );
  }

  private async uploadReceipt(bookingId: string, file: File): Promise<string> {
    const userId = this.auth.currentUser()?.id;
    const ext = file.name.split('.').pop();
    const timestamp = Date.now();
    const path = `${userId}/${bookingId}/${timestamp}.${ext}`;
    const { error } = await this.supabase.storage
      .from('payment-receipts')
      .upload(path, file);
    if (error) throw error;
    const { data } = await this.supabase.storage
      .from('payment-receipts')
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    return data?.signedUrl ?? '';
  }
}
