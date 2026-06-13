import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { BookingStatus } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-artist-bookings',
  standalone: true,
  imports: [
    RouterLink, FormsModule, DatePipe, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule,
    MatInputModule, StatusBadgeComponent, CurrencyPkPipe, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <div class="page-container py-10">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold">My Assigned Bookings</h1>
          <p class="text-gray-500 text-sm mt-1">{{ filtered().length }} booking(s)</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Search Client / Booking #</mat-label>
          <input matInput [(ngModel)]="searchQuery" (ngModelChange)="applyFilters()" placeholder="Search...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Filter Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
            <mat-option value="">All Statuses</mat-option>
            @for (s of statuses; track s.value) {
              <mat-option [value]="s.value">{{ s.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="flex items-center">
          <button mat-stroked-button color="primary" (click)="clearFilters()" class="h-[56px] w-full border border-gray-300">
            <mat-icon>clear</mat-icon> Clear Filters
          </button>
        </div>
      </div>

      @if (bookingService.loading()) {
        <app-loading-spinner />
      } @else if (filtered().length === 0) {
        <app-empty-state icon="event_note" title="No bookings found" subtitle="Try modifying your search or status filter." />
      } @else {
        <div class="space-y-4">
          @for (booking of filtered(); track booking.id) {
            <a [routerLink]="['/artist/bookings', booking.id]"
               class="block bg-white rounded-lg shadow-sm border border-gray-100 hover:border-[var(--mehndi-link)] hover:shadow-md transition-all no-underline p-6">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 flex-wrap mb-2">
                    <span class="font-bold text-gray-900">{{ booking.booking_number }}</span>
                    <app-status-badge [status]="booking.status" />
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                    <div>
                      <span class="text-gray-400">Client</span>
                      <p class="font-medium text-gray-950">{{ booking.full_name }}</p>
                    </div>
                    <div>
                      <span class="text-gray-400">Package</span>
                      <p class="font-medium">{{ booking.packages?.name ?? '—' }}</p>
                    </div>
                    <div>
                      <span class="text-gray-400">Date & Slot</span>
                      <p class="font-medium">{{ booking.date | date:'mediumDate' }} ({{ booking.time_slot }})</p>
                    </div>
                  </div>
                  <div class="mt-2 text-xs text-gray-400">
                    <mat-icon style="font-size:12px;width:12px;height:12px;vertical-align:middle" class="mr-1">place</mat-icon>
                    {{ booking.address }}
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
export class ArtistBookingsComponent implements OnInit, OnDestroy {
  bookingService = inject(BookingService);
  auth = inject(AuthService);

  searchQuery = '';
  statusFilter = '';
  filtered = signal<any[]>([]);

  private bookingSub: any;

  statuses: { value: BookingStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rejected', label: 'Rejected' },
  ];

  async ngOnInit(): Promise<void> {
    await this.bookingService.loadArtistBookings();
    this.applyFilters();

    const artistId = this.auth.artist()?.id;
    if (artistId) {
      this.bookingSub = this.bookingService.subscribeToArtistBookings(artistId, () => {
        this.bookingService.loadArtistBookings().then(() => this.applyFilters());
      });
    }
  }

  ngOnDestroy(): void {
    if (this.bookingSub) {
      this.bookingSub.unsubscribe();
    }
  }

  applyFilters(): void {
    let list = this.bookingService.bookings();
    if (this.statusFilter) {
      list = list.filter(b => b.status === this.statusFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(b => 
        b.booking_number.toLowerCase().includes(q) || 
        b.full_name.toLowerCase().includes(q) || 
        (b.phone && b.phone.includes(q))
      );
    }
    this.filtered.set(list);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.statusFilter = '';
    this.applyFilters();
  }
}
