import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { BookingStatus } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [RouterLink, DatePipe, MatButtonModule, MatIconModule, MatSelectModule, FormsModule,
    StatusBadgeComponent, CurrencyPkPipe, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container py-10">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold">My Bookings</h1>
          <p class="text-gray-500 text-sm mt-1">{{ filtered().length }} booking(s)</p>
        </div>
        <a mat-raised-button color="primary" routerLink="/booking">
          <mat-icon class="mr-2">add</mat-icon> New
        </a>
      </div>

      <!-- Filter -->
      <mat-select [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()" placeholder="All Statuses" class="mb-6">
        <mat-option value="">All Statuses</mat-option>
        @for (s of statuses; track s.value) {
          <mat-option [value]="s.value">{{ s.label }}</mat-option>
        }
      </mat-select>

      @if (bookingService.loading()) {
        <app-loading-spinner />
      } @else if (filtered().length === 0) {
        <app-empty-state icon="event_note" title="No bookings found" subtitle="Try a different filter or create a new booking" />
      } @else {
        <div class="space-y-4">
          @for (booking of filtered(); track booking.id) {
            <a [routerLink]="['/client/bookings', booking.id]"
               class="block bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-rose-300 hover:shadow-md transition-all no-underline p-6">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 flex-wrap mb-2">
                    <span class="font-bold text-gray-900">{{ booking.booking_number }}</span>
                    <app-status-badge [status]="booking.status" />
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                    <div>
                      <span class="text-gray-400">Artist</span>
                      <p class="font-medium">{{ booking.artists?.name ?? '—' }}</p>
                    </div>
                    <div>
                      <span class="text-gray-400">Package</span>
                      <p class="font-medium">{{ booking.packages?.name ?? '—' }}</p>
                    </div>
                    <div>
                      <span class="text-gray-400">Date</span>
                      <p class="font-medium">{{ booking.date | date:'mediumDate' }}</p>
                    </div>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <p class="font-bold text-rose-700 text-lg">{{ booking.total_amount | pkr }}</p>
                  @if (booking.remaining_amount > 0) {
                    <p class="text-xs text-amber-600">{{ booking.remaining_amount | pkr }} outstanding</p>
                  } @else {
                    <p class="text-xs text-green-600">Fully paid</p>
                  }
                </div>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class MyBookingsComponent implements OnInit {
  bookingService = inject(BookingService);

  statusFilter = '';
  filtered = signal(this.bookingService.bookings());

  statuses: { value: BookingStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rejected', label: 'Rejected' },
  ];

  async ngOnInit(): Promise<void> {
    await this.bookingService.loadMyBookings();
    this.applyFilter();
  }

  applyFilter(): void {
    const all = this.bookingService.bookings();
    this.filtered.set(this.statusFilter ? all.filter(b => b.status === this.statusFilter) : all);
  }
}
