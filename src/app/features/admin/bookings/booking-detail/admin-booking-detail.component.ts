import { Component, inject, OnInit, signal, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { BookingService } from '../../../../core/services/booking.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { ArtistService } from '../../../../core/services/artist.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { Booking, BookingStatus, Payment } from '../../../../core/models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { CurrencyPkPipe } from '../../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-booking-detail',
  standalone: true,
  imports: [
    RouterLink, FormsModule, DatePipe, TitleCasePipe,
    MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule,
    StatusBadgeComponent, CurrencyPkPipe, LoadingSpinnerComponent,
  ],
  template: `
    @if (loading()) {
      <div class="admin-page"><app-loading-spinner /></div>
    } @else if (booking()) {
      <div class="admin-page">
        <div class="flex items-center gap-4 mb-6">
          <a mat-icon-button routerLink="/admin/bookings"><mat-icon>arrow_back</mat-icon></a>
          <div>
            <h1 class="page-title mb-0">{{ booking()!.booking_number }}</h1>
            <p class="text-gray-500 text-sm">{{ booking()!.full_name }} · {{ booking()!.date | date:'fullDate' }}</p>
          </div>
          <div class="ml-auto">
            <app-status-badge [status]="booking()!.status" />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3 mb-8">
          @if (booking()!.status === 'pending') {
            <button mat-raised-button color="primary" (click)="changeStatus('confirmed')">
              <mat-icon class="mr-1">check_circle</mat-icon> Approve
            </button>
            <button mat-raised-button color="warn" (click)="changeStatus('rejected')">
              <mat-icon class="mr-1">cancel</mat-icon> Reject
            </button>
          }
          @if (booking()!.status === 'confirmed') {
            <button mat-raised-button color="primary" (click)="changeStatus('in_progress')">
              <mat-icon class="mr-1">play_circle</mat-icon> Start Session
            </button>
          }
          @if (booking()!.status === 'in_progress') {
            <button mat-raised-button color="primary" (click)="changeStatus('completed')">
              <mat-icon class="mr-1">task_alt</mat-icon> Mark Complete
            </button>
          }

          <!-- Assign Artist -->
          <mat-form-field appearance="outline" class="w-48">
            <mat-label>Assign Artist</mat-label>
            <mat-select [(ngModel)]="selectedArtist">
              @for (a of artistService.artists(); track a.id) {
                <mat-option [value]="a.id">{{ a.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-stroked-button (click)="assignArtist()" [disabled]="!selectedArtist">Assign</button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <!-- Info -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h2 class="section-title">Booking Information</h2>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div><p class="text-gray-500">Client</p><p class="font-medium">{{ booking()!.full_name }}</p></div>
                <div><p class="text-gray-500">Phone</p><p class="font-medium">{{ booking()!.phone }}</p></div>
                <div><p class="text-gray-500">Email</p><p class="font-medium">{{ booking()!.email }}</p></div>
                <div><p class="text-gray-500">Alt Phone</p><p class="font-medium">{{ booking()!.alt_phone ?? '—' }}</p></div>
                <div><p class="text-gray-500">Artist</p><p class="font-medium">{{ booking()!.artists?.name ?? '—' }}</p></div>
                <div><p class="text-gray-500">Package</p><p class="font-medium">{{ booking()!.packages?.name ?? '—' }}</p></div>
                <div><p class="text-gray-500">Date</p><p class="font-medium">{{ booking()!.date | date:'fullDate' }}</p></div>
                <div><p class="text-gray-500">Time</p><p class="font-medium">{{ booking()!.time_slot }}</p></div>
                <div class="col-span-2"><p class="text-gray-500">Address</p><p class="font-medium">{{ booking()!.address }}</p></div>
                @if (booking()!.notes) {
                  <div class="col-span-2"><p class="text-gray-500">Notes</p><p class="font-medium">{{ booking()!.notes }}</p></div>
                }
              </div>
            </div>

            <!-- Payments -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h2 class="section-title">Payments</h2>
              @if (paymentService.payments().length === 0) {
                <p class="text-gray-400 text-sm">No payments submitted yet</p>
              } @else {
                <div class="space-y-3">
                  @for (p of paymentService.payments(); track p.id) {
                    <div class="border border-gray-100 rounded-xl p-4">
                      <div class="flex items-center justify-between mb-2">
                        <span class="status-badge {{ p.status }}">{{ p.status }}</span>
                        <span class="font-bold text-rose-700">{{ p.amount | pkr }}</span>
                      </div>
                      <div class="text-sm text-gray-600 space-y-1">
                        <p>{{ p.payment_method | titlecase }} · {{ p.payment_type | titlecase }}</p>
                        @if (p.transaction_id) { <p>TXN: {{ p.transaction_id }}</p> }
                        <p>{{ p.payment_date | date:'mediumDate' }}</p>
                      </div>
                      @if (p.receipt_url) {
                        <a [href]="p.receipt_url" target="_blank" mat-button class="mt-2 !text-xs">
                          <mat-icon class="mr-1" style="font-size:14px">attach_file</mat-icon> Receipt
                        </a>
                      }
                      @if (p.status === 'pending') {
                        <div class="flex gap-2 mt-2">
                          <button mat-stroked-button color="primary" class="!text-xs" (click)="verifyPayment(p)">
                            <mat-icon style="font-size:14px">check</mat-icon> Verify
                          </button>
                          <button mat-stroked-button color="warn" class="!text-xs" (click)="rejectPayment(p)">
                            <mat-icon style="font-size:14px">close</mat-icon> Reject
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Summary -->
          <div>
            <div class="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 class="section-title">Payment Summary</h2>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between"><span class="text-gray-500">Total</span><span class="font-bold text-rose-700">{{ booking()!.total_amount | pkr }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">Advance Due</span><span>{{ booking()!.advance_amount | pkr }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">Paid</span><span class="text-green-700 font-semibold">{{ booking()!.paid_amount | pkr }}</span></div>
                <div class="flex justify-between font-bold pt-2 border-t">
                  <span>Remaining</span>
                  <span [class.text-amber-600]="booking()!.remaining_amount > 0">{{ booking()!.remaining_amount | pkr }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminBookingDetailComponent implements OnInit {
  @Input() id!: string;

  private bookingService = inject(BookingService);
  paymentService = inject(PaymentService);
  artistService = inject(ArtistService);
  private supabase = inject(SupabaseService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  booking = signal<Booking | null>(null);
  selectedArtist = '';

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.bookingService.getById(this.id).then(b => { this.booking.set(b); this.selectedArtist = b?.artist_id ?? ''; }),
      this.paymentService.loadPaymentsForBooking(this.id),
      this.artistService.loadArtists(false),
    ]);
    this.loading.set(false);
  }

  async changeStatus(status: BookingStatus): Promise<void> {
    const label = status.replace('_', ' ');
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Change to "${label}"`,
        message: `Are you sure you want to change this booking status to "${label}"?`,
        confirmText: 'Yes, proceed',
        confirmColor: status === 'rejected' ? 'warn' : 'primary',
      },
    }).afterClosed().subscribe(async confirmed => {
      if (!confirmed) return;
      try {
        await this.bookingService.updateStatus(this.id, status);
        const b = await this.bookingService.getById(this.id);
        this.booking.set(b);
        this.snackbar.success(`Booking marked as ${label}`);
      } catch (err: unknown) {
        this.snackbar.error(err instanceof Error ? err.message : 'Failed to update status');
      }
    });
  }

  async assignArtist(): Promise<void> {
    if (!this.selectedArtist) return;
    const { error } = await this.supabase.client
      .from('bookings').update({ artist_id: this.selectedArtist }).eq('id', this.id);
    if (error) { this.snackbar.error('Failed to assign artist'); return; }
    const b = await this.bookingService.getById(this.id);
    this.booking.set(b);
    this.snackbar.success('Artist assigned');
  }

  async verifyPayment(payment: Payment): Promise<void> {
    try {
      await this.paymentService.verifyPayment(payment.id, this.id, payment.amount);
      await this.paymentService.loadPaymentsForBooking(this.id);
      const b = await this.bookingService.getById(this.id);
      this.booking.set(b);
      this.snackbar.success('Payment verified');
    } catch (err: unknown) {
      this.snackbar.error(err instanceof Error ? err.message : 'Failed');
    }
  }

  async rejectPayment(payment: Payment): Promise<void> {
    try {
      await this.paymentService.rejectPayment(payment.id, 'Rejected by admin');
      await this.paymentService.loadPaymentsForBooking(this.id);
      this.snackbar.success('Payment rejected');
    } catch (err: unknown) {
      this.snackbar.error(err instanceof Error ? err.message : 'Failed');
    }
  }
}
