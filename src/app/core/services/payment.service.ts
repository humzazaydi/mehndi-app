import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Payment, PaymentMethod, PaymentType } from '../models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

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
  }

  async verifyPayment(paymentId: string, bookingId: string, paidAmount: number): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    const { error } = await this.supabase.client
      .from('payments')
      .update({ status: 'verified', verified_by: userId, verified_at: new Date().toISOString() })
      .eq('id', paymentId);
    if (error) throw error;

    // Update booking paid_amount and remaining_amount
    const { data: booking } = await this.supabase.client
      .from('bookings')
      .select('paid_amount, total_amount')
      .eq('id', bookingId)
      .single();

    if (booking) {
      const newPaid = (booking as { paid_amount: number; total_amount: number }).paid_amount + paidAmount;
      const newRemaining = (booking as { paid_amount: number; total_amount: number }).total_amount - newPaid;
      await this.supabase.client
        .from('bookings')
        .update({ paid_amount: newPaid, remaining_amount: Math.max(0, newRemaining) })
        .eq('id', bookingId);
    }
  }

  async rejectPayment(paymentId: string, notes: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    const { error } = await this.supabase.client
      .from('payments')
      .update({ status: 'rejected', verified_by: userId, verified_at: new Date().toISOString(), notes })
      .eq('id', paymentId);
    if (error) throw error;
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
      .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days
    return data?.signedUrl ?? '';
  }
}
