import { Component, inject, OnInit, signal, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TitleCasePipe } from '@angular/common';
import { OrderService } from '../../../../core/services/order.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { Order, OrderStatus } from '../../../../core/models';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyPkPipe } from '../../../../shared/pipes/currency-pk.pipe';

@Component({
  selector: 'app-cones-manager-order-detail',
  standalone: true,
  imports: [
    RouterLink, FormsModule, TitleCasePipe,
    MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule,
    LoadingSpinnerComponent, CurrencyPkPipe,
  ],
  template: `
    @if (loading()) {
      <div class="page-container py-10"><app-loading-spinner /></div>
    } @else if (order()) {
      <div class="page-container py-10">
        <!-- Header -->
        <div class="flex items-center gap-4 mb-6">
          <a mat-icon-button routerLink="/cones-manager/orders"><mat-icon>arrow_back</mat-icon></a>
          <div>
            <span class="text-xs uppercase tracking-widest text-[var(--mehndi-link)] font-semibold">Store Order Detail</span>
            <h1 class="text-2xl sm:text-3xl font-bold mt-1">{{ order()!.order_number }}</h1>
          </div>
          <div class="ml-auto flex items-center gap-2">
            <span class="status-badge {{ order()!.order_status }}">{{ order()!.order_status | titlecase }}</span>
            <span class="text-sm px-3 py-1 rounded border {{ order()!.payment_status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200' }}">
              Payment: {{ order()!.payment_status | titlecase }}
            </span>
          </div>
        </div>

        <!-- Status Management Actions -->
        <div class="premium-card p-6 mb-8">
          <h3 class="font-semibold text-lg mb-4">Operations Control</h3>
          <div class="flex flex-wrap items-center gap-4">
            
            <!-- Shipping Status Dropdown -->
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-400 font-medium">Order & Shipping Status</span>
              <mat-form-field appearance="outline" class="w-56 !mb-0">
                <mat-select [value]="order()!.order_status" (selectionChange)="updateStatus($event.value)">
                  <mat-option value="pending">Pending</mat-option>
                  <mat-option value="processing">In Packaging / Processing</mat-option>
                  <mat-option value="shipped">Shipped / Transit</mat-option>
                  <mat-option value="delivered">Delivered</mat-option>
                  <mat-option value="cancelled">Cancelled</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Payment Status Dropdown -->
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-400 font-medium">Payment Verification</span>
              <mat-form-field appearance="outline" class="w-48 !mb-0">
                <mat-select [value]="order()!.payment_status" (selectionChange)="updatePaymentStatus($event.value)">
                  <mat-option value="pending">Unpaid / Pending</mat-option>
                  <mat-option value="paid">Paid</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <!-- Customer Shipping Info -->
            <div class="premium-card p-6">
              <h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--mehndi-deep)]">
                <mat-icon>local_shipping</mat-icon> Shipping Details
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-[var(--mehndi-muted)]">Customer Name</p>
                  <p class="font-semibold text-base text-gray-950">{{ order()!.customer_name }}</p>
                </div>
                <div>
                  <p class="text-[var(--mehndi-muted)]">Phone Number</p>
                  <p class="font-semibold text-base text-gray-950">
                    <a [href]="'tel:' + order()!.customer_phone" class="text-[var(--mehndi-link)] no-underline flex items-center gap-1">
                      <mat-icon style="font-size:16px;width:16px;height:16px">phone</mat-icon>
                      {{ order()!.customer_phone }}
                    </a>
                  </p>
                </div>
                <div>
                  <p class="text-[var(--mehndi-muted)]">Email Address</p>
                  <p class="font-medium text-gray-900">{{ order()!.customer_email || '—' }}</p>
                </div>
                <div>
                  <p class="text-[var(--mehndi-muted)]">City</p>
                  <p class="font-medium text-gray-950">{{ order()!.city }}</p>
                </div>
                <div class="col-span-1 sm:col-span-2">
                  <p class="text-[var(--mehndi-muted)]">Full Shipping Address</p>
                  <p class="font-medium text-gray-950 mt-1">{{ order()!.address }}</p>
                </div>
              </div>

              @if (order()!.notes) {
                <div class="border-t pt-4 mt-4">
                  <p class="text-[var(--mehndi-muted)] text-sm">Order Special Instructions</p>
                  <p class="text-gray-800 italic mt-1 bg-gray-50 dark:bg-gray-800 p-3 rounded border">
                    "{{ order()!.notes }}"
                  </p>
                </div>
              }
            </div>

            <!-- Items List -->
            <div class="premium-card p-6">
              <h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--mehndi-deep)]">
                <mat-icon>shopping_cart</mat-icon> Ordered Products
              </h2>
              <div class="space-y-4">
                @for (item of order()!.order_items; track item.id) {
                  <div class="flex items-center justify-between py-3 border-b last:border-0 text-sm gap-4">
                    <div>
                      <p class="font-semibold text-base text-gray-950">{{ item.products?.name }}</p>
                      <p class="text-xs text-[var(--mehndi-muted)]">Type: {{ item.products?.type | titlecase }}</p>
                      <p class="text-xs text-gray-400 mt-0.5">{{ item.unit_price | pkr }} x {{ item.quantity }}</p>
                    </div>
                    <span class="font-bold text-gray-900 text-base">{{ (item.unit_price * item.quantity) | pkr }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Total Calculation Card -->
          <div>
            <div class="premium-card p-6 sticky top-24">
              <h2 class="text-xl font-bold mb-4 text-[var(--mehndi-deep)]">Payment Details</h2>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-[var(--mehndi-muted)]">Payment Option</span>
                  <span class="font-semibold uppercase text-gray-800">{{ order()!.payment_method }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[var(--mehndi-muted)]">Subtotal Products</span>
                  <span>{{ getSubtotal() | pkr }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[var(--mehndi-muted)]">Delivery Charges</span>
                  <span>{{ order()!.delivery_charge | pkr }}</span>
                </div>
                <div class="flex justify-between font-bold pt-2 border-t text-base text-[var(--mehndi-link)]">
                  <span>Grand Total</span>
                  <span>{{ order()!.total_amount | pkr }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="page-container py-10 text-center">
        <h2 class="font-semibold text-lg text-red-500">Order not found</h2>
        <a mat-button routerLink="/cones-manager/orders" class="mt-4">Back to orders</a>
      </div>
    }
  `,
})
export class ConesManagerOrderDetailComponent implements OnInit {
  @Input() id!: string;

  orderService = inject(OrderService);
  private supabase = inject(SupabaseService);
  private snackbar = inject(SnackbarService);

  loading = signal(true);
  order = signal<Order | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      await this.orderService.loadAllOrders();
      this.refreshLocalOrder();
    } catch (err) {
      console.error(err);
      this.snackbar.error('Failed to load order details');
    } finally {
      this.loading.set(false);
    }
  }

  private refreshLocalOrder(): void {
    const found = this.orderService.orders().find(o => o.id === this.id);
    this.order.set(found || null);
  }

  getSubtotal(): number {
    const o = this.order();
    if (!o || !o.order_items) return 0;
    return o.order_items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  }

  async updateStatus(newStatus: OrderStatus): Promise<void> {
    try {
      await this.orderService.updateOrderStatus(this.id, newStatus);
      this.refreshLocalOrder();
      this.snackbar.success(`Order status changed to ${newStatus}`);
    } catch (err: unknown) {
      this.snackbar.error(err instanceof Error ? err.message : 'Failed to update order status');
    }
  }

  async updatePaymentStatus(newStatus: 'pending' | 'paid'): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', this.id);
      if (error) throw error;
      
      this.snackbar.success(`Payment status changed to ${newStatus}`);
      await this.orderService.loadAllOrders();
      this.refreshLocalOrder();
    } catch (err: unknown) {
      this.snackbar.error(err instanceof Error ? err.message : 'Failed to update payment status');
    }
  }
}
