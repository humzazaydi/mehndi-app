import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';
import { Order, OrderStatus } from '../../../core/models';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-store',
  standalone: true,
  imports: [FormsModule, TitleCasePipe, DatePipe, MatButtonModule, MatIconModule, MatSelectModule,
    MatFormFieldModule, MatTableModule, CurrencyPkPipe, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="admin-page">
      <h1 class="page-title">Cone Store Orders</h1>

      @if (orderService.loading()) {
        <app-loading-spinner />
      } @else if (orderService.orders().length === 0) {
        <app-empty-state icon="shopping_bag" title="No orders yet" />
      } @else {
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="orderService.orders()">
              <ng-container matColumnDef="order_number">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Order #</th>
                <td mat-cell *matCellDef="let o" class="font-semibold text-rose-700">{{ o.order_number }}</td>
              </ng-container>
              <ng-container matColumnDef="customer">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Customer</th>
                <td mat-cell *matCellDef="let o">
                  <p class="font-medium">{{ o.customer_name }}</p>
                  <p class="text-xs text-gray-400">{{ o.customer_phone }}</p>
                </td>
              </ng-container>
              <ng-container matColumnDef="city">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">City</th>
                <td mat-cell *matCellDef="let o">{{ o.city }}</td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Total</th>
                <td mat-cell *matCellDef="let o" class="font-semibold text-rose-700">{{ o.total_amount | pkr }}</td>
              </ng-container>
              <ng-container matColumnDef="payment">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Payment</th>
                <td mat-cell *matCellDef="let o">
                  <span class="status-badge {{ o.payment_status }}">{{ o.payment_status }}</span>
                  <span class="text-xs text-gray-400 ml-2">{{ o.payment_method | titlecase }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Status</th>
                <td mat-cell *matCellDef="let o">
                  <mat-select [(ngModel)]="o.order_status" (ngModelChange)="updateStatus(o, $event)" class="text-sm">
                    <mat-option value="pending">Pending</mat-option>
                    <mat-option value="processing">Processing</mat-option>
                    <mat-option value="shipped">Shipped</mat-option>
                    <mat-option value="delivered">Delivered</mat-option>
                    <mat-option value="cancelled">Cancelled</mat-option>
                  </mat-select>
                </td>
              </ng-container>
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Date</th>
                <td mat-cell *matCellDef="let o" class="text-sm">{{ o.created_at | date:'mediumDate' }}</td>
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
export class AdminStoreComponent implements OnInit {
  orderService = inject(OrderService);
  private snackbar = inject(SnackbarService);

  columns = ['order_number', 'customer', 'city', 'total', 'payment', 'status', 'date'];

  async ngOnInit(): Promise<void> {
    await this.orderService.loadAllOrders();
  }

  async updateStatus(order: Order, status: OrderStatus): Promise<void> {
    try {
      await this.orderService.updateOrderStatus(order.id, status);
      this.snackbar.success('Order status updated');
    } catch {
      this.snackbar.error('Failed to update order');
    }
  }
}
