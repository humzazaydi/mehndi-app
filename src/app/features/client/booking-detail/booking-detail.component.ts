import { Component, inject, OnInit, signal, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { BookingService } from '../../../core/services/booking.service';
import { PaymentService } from '../../../core/services/payment.service';
import { SettingsService } from '../../../core/services/settings.service';
import { Booking, Payment } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PaymentFormDialogComponent } from './payment-form-dialog.component';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [
    RouterLink, DatePipe, TitleCasePipe, MatButtonModule, MatIconModule, MatTabsModule, MatDialogModule,
    StatusBadgeComponent, CurrencyPkPipe, LoadingSpinnerComponent,
  ],
  template: `
    @if (loading()) {
      <div class="page-container py-12"><app-loading-spinner /></div>
    } @else if (booking()) {
      <div class="page-container py-10 max-w-4xl">
        <!-- Back -->
        <a mat-button routerLink="/client/bookings" class="mb-6 block">
          <mat-icon>arrow_back</mat-icon> My Bookings
        </a>

        <!-- Header -->
        <div class="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 class="text-2xl font-bold">{{ booking()!.booking_number }}</h1>
            <p class="text-gray-500 text-sm mt-1">Created {{ booking()!.created_at | date:'mediumDate' }}</p>
          </div>
          <app-status-badge [status]="booking()!.status" />
        </div>

        <mat-tab-group>
          <!-- Details Tab -->
          <mat-tab label="Details">
            <div class="py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Booking Info -->
              <div class="bg-white rounded-xl p-5 shadow-sm">
                <h3 class="font-semibold mb-4">Appointment</h3>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between"><span class="text-gray-500">Artist</span><span class="font-medium">{{ booking()!.artists?.name }}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Package</span><span class="font-medium">{{ booking()!.packages?.name }}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Date</span><span class="font-medium">{{ booking()!.date | date:'fullDate' }}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Time</span><span class="font-medium">{{ booking()!.time_slot }}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Address</span><span class="font-medium text-right max-w-48">{{ booking()!.address }}</span></div>
                </div>
              </div>

              <!-- Payment Summary -->
              <div class="bg-white rounded-xl p-5 shadow-sm">
                <h3 class="font-semibold mb-4">Payment Summary</h3>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between"><span class="text-gray-500">Total</span><span class="font-bold text-rose-700">{{ booking()!.total_amount | pkr }}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Paid</span><span class="font-medium text-green-700">{{ booking()!.paid_amount | pkr }}</span></div>
                  <div class="flex justify-between font-semibold pt-2 border-t"><span>Remaining</span><span [class.text-amber-600]="booking()!.remaining_amount > 0">{{ booking()!.remaining_amount | pkr }}</span></div>
                </div>

                @if (booking()!.remaining_amount > 0 && booking()!.status !== 'rejected' && booking()!.status !== 'cancelled') {
                  <button mat-raised-button color="primary" class="w-full mt-4" (click)="openPaymentForm()">
                    <mat-icon class="mr-2">payment</mat-icon> Submit Payment
                  </button>
                }
              </div>
            </div>
          </mat-tab>

          <!-- Payments Tab -->
          <mat-tab label="Payment History">
            <div class="py-6">
              @if (paymentService.payments().length === 0) {
                <p class="text-gray-400 text-center py-8">No payments recorded yet</p>
              } @else {
                <div class="space-y-3">
                  @for (payment of paymentService.payments(); track payment.id) {
                    <div class="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                      <div>
                        <div class="flex items-center gap-2 mb-1">
                          <span class="status-badge {{ payment.status }}">{{ payment.status }}</span>
                          <span class="text-xs text-gray-400">{{ payment.payment_date | date:'mediumDate' }}</span>
                        </div>
                        <p class="text-sm text-gray-600">{{ payment.payment_method | titlecase }} · {{ payment.payment_type | titlecase }}</p>
                        @if (payment.transaction_id) {
                          <p class="text-xs text-gray-400">TXN: {{ payment.transaction_id }}</p>
                        }
                      </div>
                      <p class="font-bold text-rose-700">{{ payment.amount | pkr }}</p>
                    </div>
                  }
                </div>
              }
            </div>
          </mat-tab>

          <!-- History Tab -->
          <mat-tab label="Status History">
            <div class="py-6">
              @if (!booking()!.booking_status_history?.length) {
                <p class="text-gray-400 text-center py-8">No history yet</p>
              } @else {
                <div class="space-y-3">
                  @for (h of booking()!.booking_status_history; track h.id) {
                    <div class="flex gap-4 items-start">
                      <div class="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0"></div>
                      <div>
                        <div class="flex items-center gap-2">
                          <app-status-badge [status]="h.status" />
                          <span class="text-xs text-gray-400">{{ h.created_at | date:'medium' }}</span>
                        </div>
                        @if (h.notes) {
                          <p class="text-sm text-gray-500 mt-1">{{ h.notes }}</p>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    }
  `,
})
export class BookingDetailComponent implements OnInit {
  @Input() id!: string;

  private bookingService = inject(BookingService);
  paymentService = inject(PaymentService);
  private settings = inject(SettingsService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  booking = signal<Booking | null>(null);

  async ngOnInit(): Promise<void> {
    const [booking] = await Promise.all([
      this.bookingService.getById(this.id),
      this.paymentService.loadPaymentsForBooking(this.id),
    ]);
    this.booking.set(booking);
    this.loading.set(false);
  }

  openPaymentForm(): void {
    this.dialog.open(PaymentFormDialogComponent, {
      width: '500px',
      data: { bookingId: this.id, amount: this.booking()!.remaining_amount, banking: this.settings.banking() },
    }).afterClosed().subscribe(async result => {
      if (result) {
        const booking = await this.bookingService.getById(this.id);
        this.booking.set(booking);
        await this.paymentService.loadPaymentsForBooking(this.id);
      }
    });
  }
}
