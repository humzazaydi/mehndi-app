import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { PaymentService } from '../../../core/services/payment.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Payment } from '../../../core/models';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [
    RouterLink, FormsModule, TitleCasePipe, DatePipe,
    MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatTableModule,
    CurrencyPkPipe, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <div class="admin-page">
      <h1 class="page-title">Payments</h1>

      <!-- Filters -->
      <div class="flex gap-3 mb-6">
        <mat-form-field appearance="outline" class="w-40">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (ngModelChange)="load()">
            <mat-option value="">All</mat-option>
            <mat-option value="pending">Pending</mat-option>
            <mat-option value="verified">Verified</mat-option>
            <mat-option value="rejected">Rejected</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (paymentService.loading()) {
        <app-loading-spinner />
      } @else if (paymentService.payments().length === 0) {
        <app-empty-state icon="payments" title="No payments found" />
      } @else {
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="paymentService.payments()">
              <ng-container matColumnDef="booking">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Booking</th>
                <td mat-cell *matCellDef="let p">
                  <a [routerLink]="['/admin/bookings', p.booking_id]" class="text-rose-700 font-medium">
                    View Booking
                  </a>
                </td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Amount</th>
                <td mat-cell *matCellDef="let p" class="font-bold text-rose-700">{{ p.amount | pkr }}</td>
              </ng-container>
              <ng-container matColumnDef="method">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Method</th>
                <td mat-cell *matCellDef="let p">{{ p.payment_method | titlecase }}</td>
              </ng-container>
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Type</th>
                <td mat-cell *matCellDef="let p">{{ p.payment_type | titlecase }}</td>
              </ng-container>
              <ng-container matColumnDef="txn">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">TXN ID</th>
                <td mat-cell *matCellDef="let p" class="text-sm text-gray-500">{{ p.transaction_id ?? '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Date</th>
                <td mat-cell *matCellDef="let p">{{ p.payment_date | date:'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Status</th>
                <td mat-cell *matCellDef="let p"><span class="status-badge {{ p.status }}">{{ p.status }}</span></td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let p">
                  <div class="flex gap-1">
                    @if (p.receipt_url) {
                      <a [href]="p.receipt_url" target="_blank" mat-icon-button title="View Receipt">
                        <mat-icon>attach_file</mat-icon>
                      </a>
                    }
                    @if (p.status === 'pending') {
                      <button mat-icon-button color="primary" title="Verify" (click)="verify(p)">
                        <mat-icon>check_circle</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" title="Reject" (click)="reject(p)">
                        <mat-icon>cancel</mat-icon>
                      </button>
                    }
                  </div>
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
export class AdminPaymentsComponent implements OnInit {
  paymentService = inject(PaymentService);
  private supabase = inject(SupabaseService);
  private snackbar = inject(SnackbarService);

  statusFilter = 'pending';
  columns = ['booking', 'amount', 'method', 'type', 'txn', 'date', 'status', 'actions'];

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    await this.paymentService.loadAllPayments(this.statusFilter ? { status: this.statusFilter } : undefined);
  }

  async verify(payment: Payment): Promise<void> {
    try {
      await this.paymentService.verifyPayment(payment.id, payment.booking_id, payment.amount);
      await this.load();
      this.snackbar.success('Payment verified');
    } catch (err: unknown) {
      this.snackbar.error(err instanceof Error ? err.message : 'Failed');
    }
  }

  async reject(payment: Payment): Promise<void> {
    try {
      await this.paymentService.rejectPayment(payment.id, 'Rejected by admin');
      await this.load();
      this.snackbar.success('Payment rejected');
    } catch (err: unknown) {
      this.snackbar.error(err instanceof Error ? err.message : 'Failed');
    }
  }
}
