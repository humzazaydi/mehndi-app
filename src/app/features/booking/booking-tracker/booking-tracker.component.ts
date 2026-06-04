import { Component, inject, OnInit, signal, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { BookingService } from '../../../core/services/booking.service';
import { Booking, BookingStatus } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

const STATUS_ORDER: BookingStatus[] = ['pending', 'confirmed', 'in_progress', 'completed'];

@Component({
  selector: 'app-booking-tracker',
  standalone: true,
  imports: [RouterLink, DatePipe, MatButtonModule, MatIconModule, StatusBadgeComponent, CurrencyPkPipe, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <div class="page-container py-12">
        <app-loading-spinner />
      </div>
    } @else if (booking()) {
      <div class="page-container py-10">
        <div class="max-w-2xl mx-auto">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h1 class="text-2xl font-bold">Booking Tracker</h1>
              <p class="text-gray-500 text-sm">{{ booking()!.booking_number }}</p>
            </div>
            <app-status-badge [status]="booking()!.status" />
          </div>

          <!-- Timeline -->
          <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 class="font-semibold mb-4">Progress</h2>
            <div class="space-y-4">
              @for (step of timelineSteps; track step.status) {
                <div class="flex items-start gap-4">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                       [class.brand-gradient]="isPast(step.status)"
                       [class.border-2]="!isPast(step.status)"
                       [class.border-gray-200]="!isPast(step.status)">
                    @if (isPast(step.status)) {
                      <mat-icon class="text-white" style="font-size:16px;width:16px;height:16px">check</mat-icon>
                    }
                  </div>
                  <div [class.opacity-40]="!isPast(step.status)">
                    <p class="font-medium">{{ step.label }}</p>
                    <p class="text-sm text-gray-500">{{ step.description }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Details -->
          <div class="bg-white rounded-lg shadow-sm p-6 mb-6 space-y-3">
            <h2 class="font-semibold mb-4">Booking Details</h2>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div><span class="text-gray-500">Date</span><p class="font-medium">{{ booking()!.date | date }}</p></div>
              <div><span class="text-gray-500">Time</span><p class="font-medium">{{ booking()!.time_slot }}</p></div>
              <div><span class="text-gray-500">Total</span><p class="font-medium text-rose-700">{{ booking()!.total_amount | pkr }}</p></div>
              <div><span class="text-gray-500">Remaining</span><p class="font-medium">{{ booking()!.remaining_amount | pkr }}</p></div>
            </div>
          </div>

          <a mat-button routerLink="/client/bookings"><mat-icon>arrow_back</mat-icon> All Bookings</a>
        </div>
      </div>
    }
  `,
})
export class BookingTrackerComponent implements OnInit {
  @Input() id!: string;
  private bookingService = inject(BookingService);

  loading = signal(true);
  booking = signal<Booking | null>(null);

  timelineSteps = [
    { status: 'pending' as BookingStatus, label: 'Booking Submitted', description: 'Awaiting admin review' },
    { status: 'confirmed' as BookingStatus, label: 'Booking Confirmed', description: 'Your appointment is confirmed' },
    { status: 'in_progress' as BookingStatus, label: 'In Progress', description: 'Your session has started' },
    { status: 'completed' as BookingStatus, label: 'Completed', description: 'Service completed successfully' },
  ];

  async ngOnInit(): Promise<void> {
    const data = await this.bookingService.getById(this.id);
    this.booking.set(data);
    this.loading.set(false);
  }

  isPast(status: BookingStatus): boolean {
    const current = this.booking()?.status;
    if (!current) return false;
    return STATUS_ORDER.indexOf(current) >= STATUS_ORDER.indexOf(status);
  }
}
