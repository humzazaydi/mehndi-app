import { Component, inject, OnInit } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [DatePipe, TitleCasePipe, MatButtonModule, MatIconModule, RouterLink,
    CurrencyPkPipe, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container py-10">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold">My Orders</h1>
          <p class="text-gray-500 text-sm mt-1">{{ orderService.myOrders().length }} order(s)</p>
        </div>
        <a mat-raised-button color="primary" routerLink="/store">
          <mat-icon class="mr-2">shopping_bag</mat-icon> Shop
        </a>
      </div>

      @if (orderService.loading()) {
        <app-loading-spinner />
      } @else if (orderService.myOrders().length === 0) {
        <app-empty-state icon="shopping_bag" title="No orders yet"
          subtitle="Visit the Henna Cone Store to place your first order!" />
      } @else {
        <div class="space-y-4">
          @for (order of orderService.myOrders(); track order.id) {
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div class="flex items-center gap-3 flex-wrap mb-1">
                    <span class="font-bold text-gray-900">{{ order.order_number }}</span>
                    <span class="status-badge {{ order.order_status }}">{{ order.order_status | titlecase }}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full border"
                      [class]="order.payment_status === 'paid' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'">
                      Payment: {{ order.payment_status | titlecase }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500">
                    {{ order.created_at | date:'mediumDate' }} · {{ order.city }}
                    · {{ order.payment_method === 'cod' ? 'Cash on Delivery' : 'Bank Transfer' }}
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <p class="font-bold text-rose-700 text-lg">{{ order.total_amount | pkr }}</p>
                  @if (order.delivery_charge > 0) {
                    <p class="text-xs text-gray-400">incl. {{ order.delivery_charge | pkr }} delivery</p>
                  }
                </div>
              </div>

              @if (order.order_items && order.order_items.length > 0) {
                <div class="border-t pt-3 mt-2">
                  <p class="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Items</p>
                  <div class="space-y-1">
                    @for (item of order.order_items; track item.id) {
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-700">{{ item.products?.name ?? 'Product' }} × {{ item.quantity }}</span>
                        <span class="font-medium text-gray-900">{{ (item.unit_price * item.quantity) | pkr }}</span>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Order status progress -->
              <div class="mt-4 pt-3 border-t">
                <div class="flex items-center gap-2 text-xs">
                  @for (step of statusSteps; track step.status) {
                    <div class="flex items-center gap-1">
                      <div class="w-2 h-2 rounded-full"
                        [class]="isStepReached(order.order_status, step.status) ? 'bg-rose-600' : 'bg-gray-200'">
                      </div>
                      <span [class]="isStepReached(order.order_status, step.status) ? 'text-rose-700 font-medium' : 'text-gray-400'">
                        {{ step.label }}
                      </span>
                      @if (!$last) {
                        <span class="text-gray-200 mx-1">—</span>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MyOrdersComponent implements OnInit {
  orderService = inject(OrderService);

  statusSteps = [
    { status: 'pending', label: 'Placed' },
    { status: 'processing', label: 'Processing' },
    { status: 'shipped', label: 'Shipped' },
    { status: 'delivered', label: 'Delivered' },
  ];

  private readonly statusOrder = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  isStepReached(currentStatus: string, stepStatus: string): boolean {
    if (currentStatus === 'cancelled') return stepStatus === 'pending';
    return this.statusOrder.indexOf(currentStatus) >= this.statusOrder.indexOf(stepStatus);
  }

  async ngOnInit(): Promise<void> {
    await this.orderService.loadMyOrders();
  }
}
