import { Component, inject, OnInit, signal, Input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { BookingService } from '../../../../core/services/booking.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { Booking, BookingStatus } from '../../../../core/models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { CurrencyPkPipe } from '../../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-artist-booking-detail',
  standalone: true,
  imports: [
    RouterLink, FormsModule, DatePipe, TitleCasePipe,
    MatButtonModule, MatIconModule, StatusBadgeComponent,
    CurrencyPkPipe, LoadingSpinnerComponent,
  ],
  template: `
    @if (loading()) {
      <div class="page-container py-10"><app-loading-spinner /></div>
    } @else if (booking()) {
      <div class="page-container py-10">
        <!-- Back and title header -->
        <div class="flex items-center gap-4 mb-6">
          <a mat-icon-button routerLink="/artist/bookings"><mat-icon>arrow_back</mat-icon></a>
          <div>
            <span class="text-xs uppercase tracking-widest text-[var(--mehndi-link)] font-semibold">Booking Details</span>
            <h1 class="text-2xl sm:text-3xl font-bold mt-1">{{ booking()!.booking_number }}</h1>
          </div>
          <div class="ml-auto">
            <app-status-badge [status]="booking()!.status" />
          </div>
        </div>

        <!-- Action Stepper / Buttons -->
        <div class="premium-card p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 class="font-semibold text-lg">Action Center</h3>
            <p class="text-sm text-[var(--mehndi-muted)] mt-1">Manage state transition of this mehndi session.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            @if (booking()!.status === 'confirmed') {
              <button mat-raised-button color="primary" class="!px-6 !py-3" (click)="changeStatus('in_progress')">
                <mat-icon class="mr-2">play_circle</mat-icon> Start Session
              </button>
            }
            @if (booking()!.status === 'in_progress') {
              <button mat-raised-button color="primary" class="!px-6 !py-3" (click)="changeStatus('completed')">
                <mat-icon class="mr-2">task_alt</mat-icon> Mark Completed
              </button>
            }
            @if (booking()!.status === 'confirmed' || booking()!.status === 'pending' || booking()!.status === 'in_progress') {
              <button mat-stroked-button color="warn" (click)="changeStatus('cancelled')">
                <mat-icon class="mr-1">cancel</mat-icon> Cancel Session
              </button>
            }
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <!-- Client Details -->
            <div class="premium-card p-6">
              <h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--mehndi-deep)]">
                <mat-icon>person</mat-icon> Client Information
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-[var(--mehndi-muted)]">Full Name</p>
                  <p class="font-semibold text-base text-gray-950">{{ booking()!.full_name }}</p>
                </div>
                <div>
                  <p class="text-[var(--mehndi-muted)]">Phone Number</p>
                  <p class="font-semibold text-base text-gray-950">
                    <a [href]="'tel:' + booking()!.phone" class="text-[var(--mehndi-link)] no-underline flex items-center gap-1">
                      <mat-icon style="font-size:16px;width:16px;height:16px">phone</mat-icon>
                      {{ booking()!.phone }}
                    </a>
                  </p>
                </div>
                <div>
                  <p class="text-[var(--mehndi-muted)]">Email Address</p>
                  <p class="font-medium text-gray-900">{{ booking()!.email }}</p>
                </div>
                @if (booking()!.alt_phone) {
                  <div>
                    <p class="text-[var(--mehndi-muted)]">Alternative Phone</p>
                    <p class="font-medium text-gray-900">
                      <a [href]="'tel:' + booking()!.alt_phone" class="text-gray-800 no-underline">{{ booking()!.alt_phone }}</a>
                    </p>
                  </div>
                }
              </div>
            </div>

            <!-- Service Details -->
            <div class="premium-card p-6">
              <h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--mehndi-deep)]">
                <mat-icon>brush</mat-icon> Session Details
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <p class="text-[var(--mehndi-muted)]">Service Date</p>
                  <p class="font-semibold text-base text-gray-950">{{ booking()!.date | date:'fullDate' }}</p>
                </div>
                <div>
                  <p class="text-[var(--mehndi-muted)]">Time Slot</p>
                  <p class="font-semibold text-base text-gray-950">{{ booking()!.time_slot }}</p>
                </div>
                <div>
                  <p class="text-[var(--mehndi-muted)]">Selected Package</p>
                  <p class="font-semibold text-base text-gray-950">{{ booking()!.packages?.name ?? '—' }}</p>
                </div>
                <div>
                  <p class="text-[var(--mehndi-muted)]">Package Price</p>
                  <p class="font-semibold text-base text-gray-950 text-rose-700">{{ booking()!.packages?.base_price | pkr }}</p>
                </div>
              </div>

              <div class="border-t pt-4">
                <p class="text-[var(--mehndi-muted)] text-sm">Service Location / Address</p>
                <p class="font-medium text-gray-950 mt-1 mb-2">{{ booking()!.address }}</p>
                @if (booking()!.location_lat && booking()!.location_lng) {
                  <a mat-stroked-button color="primary" 
                     [href]="'https://www.google.com/maps/search/?api=1&query=' + booking()!.location_lat + ',' + booking()!.location_lng"
                     target="_blank" class="mt-2">
                    <mat-icon>map</mat-icon> Open in Google Maps
                  </a>
                }
              </div>

              @if (booking()!.notes) {
                <div class="border-t pt-4 mt-4">
                  <p class="text-[var(--mehndi-muted)] text-sm">Client Notes</p>
                  <p class="text-gray-800 italic mt-1 bg-gray-50 dark:bg-gray-800 p-3 rounded border">
                    "{{ booking()!.notes }}"
                  </p>
                </div>
              }
            </div>

            <!-- Booking Add-ons -->
            @if ((booking()!.booking_addons?.length ?? 0) > 0) {
              <div class="premium-card p-6">
                <h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--mehndi-deep)]">
                  <mat-icon>featured_play_list</mat-icon> Add-ons Selected
                </h2>
                <div class="space-y-2">
                  @for (item of booking()!.booking_addons; track item.id) {
                    <div class="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                      <div>
                        <p class="font-medium text-gray-900">{{ item.addons?.name }}</p>
                      </div>
                      <span class="font-bold text-gray-700">{{ item.price_at_booking | pkr }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Price & Payment Summary -->
          <div>
            <div class="space-y-6 sticky top-24">
              <div class="premium-card p-6">
                <h2 class="text-xl font-bold mb-4 text-[var(--mehndi-deep)]">Financial Summary</h2>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <span class="text-[var(--mehndi-muted)]">Subtotal Package</span>
                    <span>{{ booking()!.packages?.base_price | pkr }}</span>
                  </div>
                  @if ((booking()!.booking_addons?.length ?? 0) > 0) {
                    <div class="flex justify-between">
                      <span class="text-[var(--mehndi-muted)]">Add-ons Total</span>
                      <span>{{ addonsTotal() | pkr }}</span>
                    </div>
                  }
                  <div class="flex justify-between font-bold pt-2 border-t text-base text-[var(--mehndi-link)]">
                    <span>Total Amount</span>
                    <span>{{ booking()!.total_amount | pkr }}</span>
                  </div>
                  <div class="flex justify-between text-green-700 font-semibold pt-1">
                    <span>Amount Paid</span>
                    <span>{{ booking()!.paid_amount | pkr }}</span>
                  </div>
                  <div class="flex justify-between font-bold pt-2 border-t-2 text-base">
                    <span>Remaining Due</span>
                    <span [class.text-amber-600]="booking()!.remaining_amount > 0" [class.text-green-700]="booking()!.remaining_amount === 0">
                      {{ booking()!.remaining_amount | pkr }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Payments list -->
              <div class="premium-card p-6">
                <h2 class="text-lg font-bold mb-3">Verification History</h2>
                @if (paymentService.payments().length === 0) {
                  <p class="text-gray-400 text-sm italic">No payment receipts loaded.</p>
                } @else {
                  <div class="space-y-3">
                    @for (p of paymentService.payments(); track p.id) {
                      <div class="border border-gray-100 dark:border-gray-800 rounded-xl p-3 bg-gray-50/50 dark:bg-gray-800/20 text-xs">
                        <div class="flex items-center justify-between mb-1">
                          <span class="status-badge {{ p.status }} font-semibold scale-90">{{ p.status | titlecase }}</span>
                          <span class="font-bold text-rose-700">{{ p.amount | pkr }}</span>
                        </div>
                        <p class="text-gray-500">{{ p.payment_method | titlecase }} · {{ p.payment_type | titlecase }}</p>
                        <p class="text-gray-400 mt-0.5">{{ p.payment_date | date:'mediumDate' }}</p>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="page-container py-10 text-center">
        <h2 class="font-semibold text-lg text-red-500">Booking not found</h2>
        <a mat-button routerLink="/artist/bookings" class="mt-4">Back to bookings</a>
      </div>
    }
  `,
})
export class ArtistBookingDetailComponent implements OnInit {
  @Input() id!: string;

  private bookingService = inject(BookingService);
  paymentService = inject(PaymentService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  booking = signal<Booking | null>(null);

  addonsTotal = computed(() => {
    const b = this.booking();
    if (!b || !b.booking_addons) return 0;
    return b.booking_addons.reduce((sum, item) => sum + item.price_at_booking, 0);
  });

  async ngOnInit(): Promise<void> {
    try {
      const b = await this.bookingService.getById(this.id);
      this.booking.set(b);
      await this.paymentService.loadPaymentsForBooking(this.id);
    } catch (err) {
      console.error(err);
      this.snackbar.error('Failed to load booking details');
    } finally {
      this.loading.set(false);
    }
  }

  async changeStatus(status: BookingStatus): Promise<void> {
    const label = status.replace('_', ' ');
    
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Transition to "${label}"`,
        message: `Are you sure you want to mark this booking as "${label}"?`,
        confirmText: 'Yes, update',
        confirmColor: status === 'cancelled' ? 'warn' : 'primary',
      },
    }).afterClosed().subscribe(async confirmed => {
      if (!confirmed) return;
      try {
        await this.bookingService.updateStatus(this.id, status);
        const b = await this.bookingService.getById(this.id);
        this.booking.set(b);
        this.snackbar.success(`Booking status changed to: ${label}`);
      } catch (err: unknown) {
        this.snackbar.error(err instanceof Error ? err.message : 'Failed to update status');
      }
    });
  }
}
