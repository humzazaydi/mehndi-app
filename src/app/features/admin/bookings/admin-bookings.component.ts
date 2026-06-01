import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { BookingService } from '../../../core/services/booking.service';
import { ArtistService } from '../../../core/services/artist.service';
import { BookingStatus } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [
    RouterLink, FormsModule,
    DatePipe, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule,
    MatInputModule, MatTableModule, MatSortModule,
    StatusBadgeComponent, CurrencyPkPipe, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <div class="admin-page">
      <div class="flex items-center justify-between mb-6">
        <h1 class="page-title mb-0">Bookings</h1>
        <span class="text-gray-500 text-sm">{{ bookingService.bookings().length }} total</span>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3 mb-6">
        <mat-form-field appearance="outline" class="w-40">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
            <mat-option value="">All</mat-option>
            @for (s of statuses; track s.value) {
              <mat-option [value]="s.value">{{ s.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-48">
          <mat-label>Artist</mat-label>
          <mat-select [(ngModel)]="artistFilter" (ngModelChange)="applyFilters()">
            <mat-option value="">All Artists</mat-option>
            @for (a of artistService.artists(); track a.id) {
              <mat-option [value]="a.id">{{ a.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-40">
          <mat-label>From Date</mat-label>
          <input matInput type="date" [(ngModel)]="dateFrom" (ngModelChange)="applyFilters()">
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-40">
          <mat-label>To Date</mat-label>
          <input matInput type="date" [(ngModel)]="dateTo" (ngModelChange)="applyFilters()">
        </mat-form-field>

        <button mat-stroked-button (click)="clearFilters()">
          <mat-icon>clear</mat-icon> Clear
        </button>
      </div>

      @if (bookingService.loading()) {
        <app-loading-spinner />
      } @else if (filtered().length === 0) {
        <app-empty-state icon="event_note" title="No bookings found" />
      } @else {
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="filtered()" class="w-full">
              <ng-container matColumnDef="booking_number">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Booking #</th>
                <td mat-cell *matCellDef="let b">
                  <a [routerLink]="['/admin/bookings', b.id]" class="font-semibold text-rose-700">{{ b.booking_number }}</a>
                </td>
              </ng-container>

              <ng-container matColumnDef="client">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Client</th>
                <td mat-cell *matCellDef="let b">
                  <p class="font-medium">{{ b.full_name }}</p>
                  <p class="text-xs text-gray-400">{{ b.phone }}</p>
                </td>
              </ng-container>

              <ng-container matColumnDef="artist">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Artist</th>
                <td mat-cell *matCellDef="let b">{{ b.artists?.name ?? '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Date</th>
                <td mat-cell *matCellDef="let b">{{ b.date | date:'mediumDate' }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Status</th>
                <td mat-cell *matCellDef="let b"><app-status-badge [status]="b.status" /></td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Total</th>
                <td mat-cell *matCellDef="let b" class="font-semibold text-rose-700">{{ b.total_amount | pkr }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let b">
                  <a mat-icon-button [routerLink]="['/admin/bookings', b.id]">
                    <mat-icon>open_in_new</mat-icon>
                  </a>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;" class="hover:bg-gray-50"></tr>
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminBookingsComponent implements OnInit {
  bookingService = inject(BookingService);
  artistService = inject(ArtistService);

  statusFilter = '';
  artistFilter = '';
  dateFrom = '';
  dateTo = '';
  filtered = signal(this.bookingService.bookings());

  columns = ['booking_number', 'client', 'artist', 'date', 'status', 'amount', 'actions'];

  statuses: { value: BookingStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rejected', label: 'Rejected' },
  ];

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.bookingService.loadAllBookings(),
      this.artistService.loadArtists(false),
    ]);
    this.applyFilters();
  }

  applyFilters(): void {
    let data = this.bookingService.bookings();
    if (this.statusFilter) data = data.filter(b => b.status === this.statusFilter);
    if (this.artistFilter) data = data.filter(b => b.artist_id === this.artistFilter);
    if (this.dateFrom) data = data.filter(b => b.date >= this.dateFrom);
    if (this.dateTo) data = data.filter(b => b.date <= this.dateTo);
    this.filtered.set(data);
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.artistFilter = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.applyFilters();
  }
}
