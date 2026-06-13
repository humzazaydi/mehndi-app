import { Component, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-artist-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, MatButtonModule, MatIconModule, MatCardModule, StatusBadgeComponent, CurrencyPkPipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container py-10">
      <div class="mb-8">
        <p class="text-xs uppercase tracking-[0.25em] text-[var(--mehndi-link)] font-semibold mb-2">Artist Portal</p>
        <h1 class="text-3xl sm:text-4xl font-bold">Welcome, {{ auth.profile()?.full_name ?? 'Artist' }}</h1>
        <p class="text-[var(--mehndi-muted)] mt-1">Manage your bookings, schedules, and profile availability in real time.</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        @for (stat of stats(); track stat.label) {
          <div class="premium-card p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center" [style.background]="stat.color + '20'">
                <mat-icon [style.color]="stat.color" style="font-size:20px;width:20px;height:20px">{{ stat.icon }}</mat-icon>
              </div>
              <span class="text-2xl font-bold">{{ stat.value }}</span>
            </div>
            <p class="text-[var(--mehndi-muted)] text-sm">{{ stat.label }}</p>
          </div>
        }
      </div>

      <!-- Quick Actions -->
      <div class="flex flex-wrap gap-3 mb-10">
        <a mat-raised-button color="primary" routerLink="/artist/bookings">
          <mat-icon class="mr-2">event_note</mat-icon> View My Bookings
        </a>
        <a mat-stroked-button routerLink="/artist/profile">
          <mat-icon class="mr-2">person</mat-icon> Manage Profile
        </a>
      </div>

      <!-- Next Session Highlight -->
      @if (nextSession(); as session) {
        <h2 class="text-2xl font-semibold mb-4">Next Session</h2>
        <div class="premium-card p-6 border-l-4 border-[var(--mehndi-link)] mb-10">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <span class="text-lg font-bold text-[var(--mehndi-deep)]">{{ session.booking_number }}</span>
                <app-status-badge [status]="session.status" />
              </div>
              <p class="text-xl font-semibold">{{ session.full_name }}</p>
              <p class="text-sm text-[var(--mehndi-muted)]">
                <mat-icon class="align-middle mr-1 !w-4 !h-4 text-xs">schedule</mat-icon>
                {{ session.date | date:'longDate' }} at {{ session.time_slot }}
              </p>
              <p class="text-sm text-[var(--mehndi-muted)]">
                <mat-icon class="align-middle mr-1 !w-4 !h-4 text-xs">place</mat-icon>
                {{ session.address }}
              </p>
              @if (session.notes) {
                <p class="text-xs italic bg-gray-50 dark:bg-gray-800 p-2 rounded mt-2 border">
                  "{{ session.notes }}"
                </p>
              }
            </div>
            <div class="flex flex-col items-end justify-between h-full gap-6">
              <div class="text-right">
                <p class="text-xs text-[var(--mehndi-muted)]">Package Price</p>
                <p class="font-bold text-[var(--mehndi-gold)] text-lg">{{ session.total_amount | pkr }}</p>
              </div>
              <a mat-raised-button color="primary" [routerLink]="['/artist/bookings', session.id]">
                Start / Manage Session
              </a>
            </div>
          </div>
        </div>
      }

      <h2 class="text-2xl font-semibold mb-4">Upcoming Schedule</h2>

      @if (bookingService.loading()) {
        <app-loading-spinner />
      } @else if (bookingService.bookings().length === 0) {
        <div class="premium-card p-10 text-center">
          <mat-icon style="font-size:64px;width:64px;height:64px;opacity:0.2">event_note</mat-icon>
          <h3 class="font-semibold mt-4 mb-2">No bookings assigned</h3>
          <p class="text-[var(--mehndi-muted)] text-sm">You have no upcoming bookings assigned by the administrator.</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (booking of bookingService.bookings().slice(0, 10); track booking.id) {
            <a [routerLink]="['/artist/bookings', booking.id]"
               class="block premium-card p-5 transition-colors no-underline">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <div class="flex items-center gap-3 mb-1">
                    <span class="font-semibold text-[var(--mehndi-deep)]">{{ booking.booking_number }}</span>
                    <app-status-badge [status]="booking.status" />
                  </div>
                  <p class="text-sm text-[var(--mehndi-muted)]">
                    {{ booking.full_name }} | {{ booking.packages?.name }} | {{ booking.date | date:'mediumDate' }} at {{ booking.time_slot }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-[var(--mehndi-gold)]">{{ booking.total_amount | pkr }}</p>
                  <mat-icon class="text-gray-400">chevron_right</mat-icon>
                </div>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class ArtistDashboardComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  bookingService = inject(BookingService);

  private bookingSub: any;

  // Compute stats based on loaded bookings
  stats = computed(() => {
    const bookings = this.bookingService.bookings();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = bookings.filter(b => b.date === todayStr && b.status !== 'cancelled' && b.status !== 'rejected').length;
    return [
      { label: 'Today\'s Sessions', value: todayCount, icon: 'today', color: '#b5263a' },
      { label: 'Pending Approvals', value: bookings.filter(b => b.status === 'pending').length, icon: 'hourglass_empty', color: '#f59e0b' },
      { label: 'Confirmed Bookings', value: bookings.filter(b => b.status === 'confirmed').length, icon: 'check_circle', color: '#009688' },
      { label: 'Completed Sessions', value: bookings.filter(b => b.status === 'completed').length, icon: 'task_alt', color: '#8f1d4d' },
    ];
  });

  // Next upcoming active booking
  nextSession = computed(() => {
    const active = this.bookingService.bookings().filter(b => b.status === 'confirmed' || b.status === 'in_progress');
    return active.length > 0 ? active[0] : null;
  });

  async ngOnInit(): Promise<void> {
    await this.bookingService.loadArtistBookings();

    const artistId = this.auth.artist()?.id;
    if (artistId) {
      this.bookingSub = this.bookingService.subscribeToArtistBookings(artistId, () => {
        this.bookingService.loadArtistBookings();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.bookingSub) {
      this.bookingSub.unsubscribe();
    }
  }
}
