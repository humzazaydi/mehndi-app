import { Component, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';

@Component({
  selector: 'app-cones-manager-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe, MatButtonModule, MatIconModule, MatCardModule, LoadingSpinnerComponent, CurrencyPkPipe],
  template: `
    <div class="page-container py-10">
      <div class="mb-8">
        <p class="text-xs uppercase tracking-[0.25em] text-[var(--mehndi-link)] font-semibold mb-2">Cones Manager Portal</p>
        <h1 class="text-3xl sm:text-4xl font-bold">Boutique Operations</h1>
        <p class="text-[var(--mehndi-muted)] mt-1">Manage Henna cone orders, packaging queues, shipping status, and boutique metrics.</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
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
        <a mat-raised-button color="primary" routerLink="/cones-manager/orders">
          <mat-icon class="mr-2">shopping_bag</mat-icon> Process Store Orders
        </a>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Recent Orders Queue -->
        <div class="lg:col-span-2">
          <h2 class="text-2xl font-semibold mb-4">Pending Packaging Queue</h2>
          
          @if (orderService.loading()) {
            <app-loading-spinner />
          } @else if (pendingOrders().length === 0) {
            <div class="premium-card p-10 text-center">
              <mat-icon style="font-size:64px;width:64px;height:64px;opacity:0.2">shopping_bag</mat-icon>
              <h3 class="font-semibold mt-4 mb-2">Queue is empty!</h3>
              <p class="text-[var(--mehndi-muted)] text-sm">All store orders have been packaged and processed.</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (order of pendingOrders().slice(0, 5); track order.id) {
                <a [routerLink]="['/cones-manager/orders', order.id]"
                   class="block premium-card p-5 transition-colors no-underline">
                  <div class="flex items-center justify-between gap-4">
                    <div>
                      <div class="flex items-center gap-3 mb-1">
                        <span class="font-semibold text-[var(--mehndi-deep)]">{{ order.order_number }}</span>
                        <span class="status-badge {{ order.order_status }} scale-90">{{ order.order_status | titlecase }}</span>
                      </div>
                      <p class="text-sm text-[var(--mehndi-muted)]">
                        {{ order.customer_name }} | {{ order.city }} | {{ order.created_at | date:'mediumDate' }}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="font-bold text-[var(--mehndi-gold)]">{{ order.total_amount | pkr }}</p>
                      <span class="text-xs text-rose-700 font-semibold flex items-center justify-end gap-0.5">
                        Process <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
                      </span>
                    </div>
                  </div>
                </a>
              }
            </div>
            @if (pendingOrders().length > 5) {
              <div class="text-center mt-4">
                <a mat-button routerLink="/cones-manager/orders">View All Pending Queue ({{ pendingOrders().length }})</a>
              </div>
            }
          }
        </div>

        <!-- Order Statistics Sidebar -->
        <div>
          <div class="premium-card p-6 sticky top-24">
            <h2 class="text-xl font-bold mb-4 text-[var(--mehndi-deep)]">Inventory Status</h2>
            <div class="space-y-4 text-sm">
              <div class="flex justify-between border-b pb-2">
                <span class="text-[var(--mehndi-muted)]">Total Orders Placed</span>
                <span class="font-bold text-gray-900">{{ orderService.orders().length }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-[var(--mehndi-muted)]">Delivered Successfully</span>
                <span class="font-semibold text-green-700">{{ deliveredCount() }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-[var(--mehndi-muted)]">Cancelled Orders</span>
                <span class="font-semibold text-red-600">{{ cancelledCount() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ConesManagerDashboardComponent implements OnInit, OnDestroy {
  orderService = inject(OrderService);
  auth = inject(AuthService);

  private orderSub: any;

  // Compute stats based on loaded orders
  stats = computed(() => {
    const orders = this.orderService.orders();
    const pending = orders.filter(o => o.order_status === 'pending');
    const processing = orders.filter(o => o.order_status === 'processing');
    const shipped = orders.filter(o => o.order_status === 'shipped');
    
    // Revenue sum of all paid orders
    const totalSales = orders
      .filter(o => o.payment_status === 'paid' && o.order_status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    return [
      { label: 'Pending Orders', value: pending.length, icon: 'hourglass_empty', color: '#f59e0b' },
      { label: 'In Packaging', value: processing.length, icon: 'inventory_2', color: '#3b82f6' },
      { label: 'Shipped (Transit)', value: shipped.length, icon: 'local_shipping', color: '#009688' },
      { label: 'Total Revenue', value: 'Rs. ' + totalSales.toLocaleString('en-PK'), icon: 'payments', color: '#8f1d4d' },
    ];
  });

  pendingOrders = computed(() => {
    return this.orderService.orders().filter(o => o.order_status === 'pending' || o.order_status === 'processing');
  });

  deliveredCount = computed(() => {
    return this.orderService.orders().filter(o => o.order_status === 'delivered').length;
  });

  cancelledCount = computed(() => {
    return this.orderService.orders().filter(o => o.order_status === 'cancelled').length;
  });

  async ngOnInit(): Promise<void> {
    await this.orderService.loadAllOrders();

    this.orderSub = this.orderService.subscribeToOrders(() => {
      this.orderService.loadAllOrders();
    });
  }

  ngOnDestroy(): void {
    if (this.orderSub) {
      this.orderSub.unsubscribe();
    }
  }
}
