import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OrderService } from '../../../core/services/order.service';
import { OrderStatus } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-cones-manager-orders',
  standalone: true,
  imports: [
    RouterLink, FormsModule, DatePipe, TitleCasePipe, MatButtonModule, MatIconModule,
    MatSelectModule, MatFormFieldModule, MatInputModule, LoadingSpinnerComponent,
    CurrencyPkPipe, EmptyStateComponent,
  ],
  template: `
    <div class="page-container py-10">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold">Store Orders</h1>
          <p class="text-gray-500 text-sm mt-1">{{ filtered().length }} order(s) found</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Search Customer / Order #</mat-label>
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

      @if (orderService.loading()) {
        <app-loading-spinner />
      } @else if (filtered().length === 0) {
        <app-empty-state icon="shopping_bag" title="No orders found" subtitle="Try modifying your search or status filter." />
      } @else {
        <div class="space-y-4">
          @for (order of filtered(); track order.id) {
            <a [routerLink]="['/cones-manager/orders', order.id]"
               class="block bg-white rounded-lg shadow-sm border border-gray-100 hover:border-[var(--mehndi-link)] hover:shadow-md transition-all no-underline p-6">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 flex-wrap mb-2">
                    <span class="font-bold text-gray-900">{{ order.order_number }}</span>
                    <span class="status-badge {{ order.order_status }}">{{ order.order_status | titlecase }}</span>
                    <span class="text-xs px-2 py-0.5 rounded {{ order.payment_status === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200' }}">
                      {{ order.payment_status | titlecase }}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                    <div>
                      <span class="text-gray-400">Customer</span>
                      <p class="font-medium text-gray-950">{{ order.customer_name }}</p>
                    </div>
                    <div>
                      <span class="text-gray-400">City / Shipping</span>
                      <p class="font-medium">{{ order.city }}</p>
                    </div>
                    <div>
                      <span class="text-gray-400">Placed Date</span>
                      <p class="font-medium">{{ order.created_at | date:'mediumDate' }}</p>
                    </div>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <p class="font-bold text-rose-700 text-lg">{{ order.total_amount | pkr }}</p>
                  <span class="text-xs text-rose-700 font-semibold flex items-center justify-end gap-0.5 mt-2">
                    View Details <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
                  </span>
                </div>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class ConesManagerOrdersComponent implements OnInit, OnDestroy {
  orderService = inject(OrderService);

  searchQuery = '';
  statusFilter = '';
  filtered = signal<any[]>([]);

  private orderSub: any;

  statuses: { value: OrderStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing / Packaging' },
    { value: 'shipped', label: 'Shipped / In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  async ngOnInit(): Promise<void> {
    await this.orderService.loadAllOrders();
    this.applyFilters();

    this.orderSub = this.orderService.subscribeToOrders(() => {
      this.orderService.loadAllOrders().then(() => this.applyFilters());
    });
  }

  ngOnDestroy(): void {
    if (this.orderSub) {
      this.orderSub.unsubscribe();
    }
  }

  applyFilters(): void {
    let list = this.orderService.orders();
    if (this.statusFilter) {
      list = list.filter(o => o.order_status === this.statusFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(o => 
        o.order_number.toLowerCase().includes(q) || 
        o.customer_name.toLowerCase().includes(q) || 
        (o.customer_phone && o.customer_phone.includes(q))
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
