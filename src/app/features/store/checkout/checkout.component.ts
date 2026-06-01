import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';
import { SettingsService } from '../../../core/services/settings.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatRadioModule, MatDividerModule, MatProgressSpinnerModule,
    CurrencyPkPipe,
  ],
  template: `
    <div class="page-container py-12">
      <h1 class="text-3xl font-bold mb-8" style="font-family:'Playfair Display',serif">Checkout</h1>

      @if (orderService.cart().length === 0) {
        <div class="text-center py-16">
          <mat-icon style="font-size:64px;width:64px;height:64px;opacity:0.2">shopping_cart</mat-icon>
          <h3 class="font-semibold mt-4 mb-4">Your cart is empty</h3>
          <a mat-raised-button color="primary" routerLink="/store">Browse Store</a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Form -->
          <div class="lg:col-span-2">
            <form [formGroup]="form" class="space-y-6">
              <!-- Customer Info -->
              <div class="bg-white rounded-2xl p-6 shadow-sm">
                <h2 class="section-title">Contact Details</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <mat-form-field appearance="outline" class="sm:col-span-2">
                    <mat-label>Full Name *</mat-label>
                    <input matInput formControlName="customerName">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Phone *</mat-label>
                    <input matInput formControlName="customerPhone">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input matInput type="email" formControlName="customerEmail">
                  </mat-form-field>
                </div>
              </div>

              <!-- Delivery -->
              <div class="bg-white rounded-2xl p-6 shadow-sm">
                <h2 class="section-title">Delivery Address</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <mat-form-field appearance="outline">
                    <mat-label>City *</mat-label>
                    <mat-select formControlName="city" (selectionChange)="onCityChange()">
                      <mat-option value="Karachi">Karachi</mat-option>
                      <mat-option value="Lahore">Lahore</mat-option>
                      <mat-option value="Islamabad">Islamabad</mat-option>
                      <mat-option value="Other">Other City</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="sm:col-span-2">
                    <mat-label>Full Address *</mat-label>
                    <textarea matInput formControlName="address" rows="2"></textarea>
                  </mat-form-field>
                </div>
              </div>

              <!-- Payment -->
              <div class="bg-white rounded-2xl p-6 shadow-sm">
                <h2 class="section-title">Payment Method</h2>
                <mat-radio-group formControlName="paymentMethod" class="flex flex-col gap-3">
                  @if (isKarachi()) {
                    <mat-radio-button value="cod">
                      Cash on Delivery (Karachi only)
                    </mat-radio-button>
                  }
                  <mat-radio-button value="bank_transfer">
                    Bank Transfer / EasyPaisa / JazzCash
                  </mat-radio-button>
                </mat-radio-group>

                @if (form.value.paymentMethod === 'bank_transfer' && settings.banking()) {
                  <div class="mt-4 bg-amber-50 rounded-xl p-4 text-sm">
                    <p class="font-semibold mb-2">Transfer to:</p>
                    <p>Meezan: {{ settings.banking()!.meezan.accountNumber }}</p>
                    <p>EasyPaisa: {{ settings.banking()!.easypaisa }}</p>
                    <p class="text-xs text-gray-400 mt-2">Send payment after placing order. Include order number in transfer notes.</p>
                  </div>
                }
              </div>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Order Notes (optional)</mat-label>
                <textarea matInput formControlName="notes" rows="2"></textarea>
              </mat-form-field>
            </form>
          </div>

          <!-- Order Summary -->
          <div>
            <div class="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 class="section-title">Order Summary</h2>
              <div class="space-y-3 mb-4">
                @for (item of orderService.cart(); track item.product.id) {
                  <div class="flex justify-between text-sm">
                    <span>{{ item.product.name }} × {{ item.quantity }}</span>
                    <span class="font-medium">{{ (item.product.price * item.quantity) | pkr }}</span>
                  </div>
                }
                <mat-divider />
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Subtotal</span>
                  <span>{{ orderService.getCartTotal() | pkr }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Delivery</span>
                  <span>{{ deliveryCharge() | pkr }}</span>
                </div>
                <div class="flex justify-between font-bold pt-1 border-t">
                  <span>Total</span>
                  <span class="text-rose-700">{{ (orderService.getCartTotal() + deliveryCharge()) | pkr }}</span>
                </div>
              </div>

              <button mat-raised-button color="primary" class="w-full !py-3"
                      [disabled]="form.invalid || submitting()"
                      (click)="placeOrder()">
                @if (submitting()) { <mat-spinner diameter="20" class="inline-block mr-2" /> }
                Place Order
              </button>

              <a routerLink="/store" mat-button class="w-full mt-2">
                <mat-icon class="mr-1">arrow_back</mat-icon> Continue Shopping
              </a>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CheckoutComponent implements OnInit {
  orderService = inject(OrderService);
  settings = inject(SettingsService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  submitting = signal(false);
  isKarachi = computed(() => this.form?.value?.city === 'Karachi');
  deliveryCharge = computed(() => {
    const biz = this.settings.business();
    return this.isKarachi() ? biz.karachiDeliveryCharge : biz.otherCitiesDeliveryCharge;
  });

  form = this.fb.group({
    customerName: ['', Validators.required],
    customerPhone: ['', Validators.required],
    customerEmail: [''],
    city: ['Karachi', Validators.required],
    address: ['', Validators.required],
    paymentMethod: ['cod', Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    // COD only for Karachi; auto-switch if non-Karachi
    this.form.get('city')?.valueChanges.subscribe(city => {
      if (city !== 'Karachi' && this.form.value.paymentMethod === 'cod') {
        this.form.patchValue({ paymentMethod: 'bank_transfer' });
      }
    });
  }

  onCityChange(): void {
    if (!this.isKarachi() && this.form.value.paymentMethod === 'cod') {
      this.form.patchValue({ paymentMethod: 'bank_transfer' });
    }
  }

  async placeOrder(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    try {
      const v = this.form.value;
      const order = await this.orderService.placeOrder({
        customerName: v.customerName!,
        customerPhone: v.customerPhone!,
        customerEmail: v.customerEmail ?? '',
        city: v.city!,
        address: v.address!,
        paymentMethod: v.paymentMethod as 'cod' | 'bank_transfer',
        notes: v.notes ?? undefined,
        deliveryCharge: this.deliveryCharge(),
      });
      this.router.navigate(['/store/order-confirm', order.id]);
    } catch (err: unknown) {
      this.snackbar.error(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      this.submitting.set(false);
    }
  }
}
