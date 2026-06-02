import { Component, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe, MatButtonModule, MatIconModule, MatCardModule, StatusBadgeComponent, CurrencyPkPipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container py-10">
      <!-- Welcome -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold">Welcome, {{ auth.profile()?.full_name ?? 'there' }} 👋</h1>
        <p class="text-gray-500 mt-1">Manage your bookings and appointments</p>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        @for (stat of stats(); track stat.label) {
          <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center" [style.background]="stat.color + '20'">
                <mat-icon [style.color]="stat.color" style="font-size:20px;width:20px;height:20px">{{ stat.icon }}</mat-icon>
              </div>
              <span class="text-2xl font-bold">{{ stat.value }}</span>
            </div>
            <p class="text-gray-500 text-sm">{{ stat.label }}</p>
          </div>
        }
      </div>

      <!-- Quick Actions -->
      <div class="flex flex-wrap gap-3 mb-10">
        <a mat-raised-button color="primary" routerLink="/booking">
          <mat-icon class="mr-2">add</mat-icon> New Booking
        </a>
        <a mat-stroked-button routerLink="/client/bookings">
          <mat-icon class="mr-2">event_note</mat-icon> All Bookings
        </a>
        <a mat-stroked-button routerLink="/client/orders">
          <mat-icon class="mr-2">shopping_bag</mat-icon> My Orders
        </a>
        <a mat-stroked-button routerLink="/store">
          <mat-icon class="mr-2">storefront</mat-icon> Henna Store
        </a>
      </div>

      <!-- Recent Bookings -->
      <h2 class="text-lg font-semibold mb-4">Recent Bookings</h2>

      @if (bookingService.loading()) {
        <app-loading-spinner />
      } @else if (bookingService.bookings().length === 0) {
        <div class="bg-white rounded-2xl p-10 text-center shadow-sm">
          <mat-icon style="font-size:64px;width:64px;height:64px;opacity:0.2">event_note</mat-icon>
          <h3 class="font-semibold mt-4 mb-2">No bookings yet</h3>
          <p class="text-gray-500 text-sm mb-6">Book your first mehndi session to get started!</p>
          <a mat-raised-button color="primary" routerLink="/booking">Book Now</a>
        </div>
      } @else {
        <div class="space-y-3">
          @for (booking of bookingService.bookings().slice(0, 5); track booking.id) {
            <a [routerLink]="['/client/bookings', booking.id]"
               class="block bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-rose-300 transition-colors no-underline">
              <div class="flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-3 mb-1">
                    <span class="font-semibold text-gray-900">{{ booking.booking_number }}</span>
                    <app-status-badge [status]="booking.status" />
                  </div>
                  <p class="text-sm text-gray-500">
                    {{ booking.artists?.name }} · {{ booking.packages?.name }} · {{ booking.date | date:'mediumDate' }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-rose-700">{{ booking.total_amount | pkr }}</p>
                  @if (booking.remaining_amount > 0) {
                    <p class="text-xs text-gray-400">{{ booking.remaining_amount | pkr }} remaining</p>
                  }
                </div>
              </div>
            </a>
          }
        </div>
        @if (bookingService.bookings().length > 5) {
          <div class="text-center mt-6">
            <a mat-button routerLink="/client/bookings">View All Bookings</a>
          </div>
        }
      }

      <!-- Recent Orders -->
      @if (orderService.myOrders().length > 0) {
        <h2 class="text-lg font-semibold mb-4 mt-10">Recent Store Orders</h2>
        <div class="space-y-3">
          @for (order of orderService.myOrders().slice(0, 3); track order.id) {
            <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div class="flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-3 mb-1">
                    <span class="font-semibold text-gray-900">{{ order.order_number }}</span>
                    <span class="status-badge {{ order.order_status }}">{{ order.order_status | titlecase }}</span>
                  </div>
                  <p class="text-sm text-gray-500">{{ order.city }} · {{ order.created_at | date:'mediumDate' }}</p>
                </div>
                <p class="font-bold text-rose-700">{{ order.total_amount | pkr }}</p>
              </div>
            </div>
          }
        </div>
        <div class="text-center mt-4">
          <a mat-button routerLink="/client/orders">View All Orders</a>
        </div>
      }
    </div>
  `,
})
export class ClientDashboardComponent implements OnInit {
  auth = inject(AuthService);
  bookingService = inject(BookingService);
  orderService = inject(OrderService);

  stats = computed(() => {
    const bookings = this.bookingService.bookings();
    return [
      { label: 'Total Bookings', value: bookings.length, icon: 'event_note', color: '#b5263a' },
      { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, icon: 'check_circle', color: '#065f46' },
      { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, icon: 'hourglass_empty', color: '#92400e' },
      { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, icon: 'star', color: '#4c1d95' },
    ];
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.bookingService.loadMyBookings(),
      this.orderService.loadMyOrders(),
    ]);
  }
}
