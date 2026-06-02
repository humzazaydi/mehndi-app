import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService } from '../../../core/services/payment.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { BankingSettings } from '../../../core/models';

@Component({
  selector: 'app-payment-form-dialog',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatProgressSpinnerModule, CurrencyPkPipe, FileUploadComponent],
  template: `
    <h2 mat-dialog-title>Submit Payment</h2>
    <mat-dialog-content class="max-h-[80vh] overflow-y-auto">
      <p class="text-sm text-gray-500 mb-4">Outstanding: <strong>{{ data.amount | pkr }}</strong></p>

      @if (data.banking) {
        <div class="bg-amber-50 rounded-xl p-4 mb-4 text-sm">
          <p class="font-semibold mb-2">Transfer to:</p>
          <p>Meezan: {{ data.banking.meezan.accountNumber }}</p>
          <p>HBL: {{ data.banking.hbl.accountNumber }}</p>
          <p>EasyPaisa/JazzCash: {{ data.banking.easypaisa }}</p>
        </div>
      }

      <form [formGroup]="form">
        <div class="space-y-3">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Amount Paid *</mat-label>
            <input matInput type="number" formControlName="amount">
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Payment Method *</mat-label>
            <mat-select formControlName="paymentMethod">
              <mat-option value="meezan">Meezan Bank</mat-option>
              <mat-option value="hbl">HBL</mat-option>
              <mat-option value="easypaisa">EasyPaisa</mat-option>
              <mat-option value="jazzcash">JazzCash</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Payment Type *</mat-label>
            <mat-select formControlName="paymentType">
              <mat-option value="advance">Advance</mat-option>
              <mat-option value="balance">Balance</mat-option>
              <mat-option value="full">Full Payment</mat-option>
            </mat-select>
          </mat-form-field>

          <app-file-upload
            label="Upload Payment Receipt"
            hint="Screenshot, photo, or PDF of your payment"
            (fileSelected)="receiptFile = $event"
          />
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(false)">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || loading()" (click)="submit()">
        @if (loading()) { <mat-spinner diameter="16" class="inline-block mr-2" /> }
        Submit Payment
      </button>
    </mat-dialog-actions>
  `,
})
export class PaymentFormDialogComponent {
  data = inject<{ bookingId: string; amount: number; banking: BankingSettings | null }>(MAT_DIALOG_DATA);
  ref = inject(MatDialogRef<PaymentFormDialogComponent>);
  private fb = inject(FormBuilder);
  private paymentService = inject(PaymentService);
  private snackbar = inject(SnackbarService);

  loading = signal(false);
  receiptFile: File | undefined;

  form = this.fb.group({
    amount: [this.data.amount, [Validators.required, Validators.min(1)]],
    paymentMethod: ['', Validators.required],
    paymentType: ['advance', Validators.required],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    try {
      await this.paymentService.submitPayment({
        bookingId: this.data.bookingId,
        amount: this.form.value.amount!,
        paymentMethod: this.form.value.paymentMethod as never,
        paymentType: this.form.value.paymentType as never,
        receiptFile: this.receiptFile,
        paymentDate: new Date().toISOString().split('T')[0],
      });
      this.snackbar.success('Payment submitted! Pending admin verification.');
      this.ref.close(true);
    } catch (err: unknown) {
      this.snackbar.error(err instanceof Error ? err.message : 'Failed to submit payment');
    } finally {
      this.loading.set(false);
    }
  }
}
