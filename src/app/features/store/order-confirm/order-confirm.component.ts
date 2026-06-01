import { Component, inject, OnInit, signal, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Order } from '../../../core/models';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';

@Component({
  selector: 'app-order-confirm',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, CurrencyPkPipe],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="max-w-lg w-full text-center">
        <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <mat-icon class="text-green-600" style="font-size:48px;width:48px;height:48px">check_circle</mat-icon>
        </div>
        <h1 class="text-3xl font-bold mb-3" style="font-family:'Playfair Display',serif">Order Placed!</h1>
        <p class="text-gray-500 mb-8">Thank you for your order. We'll process it shortly.</p>

        @if (order()) {
          <div class="bg-white rounded-2xl shadow-sm p-6 text-left mb-8 space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Order Number</span>
              <span class="font-bold text-rose-700">{{ order()!.order_number }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Customer</span>
              <span class="font-medium">{{ order()!.customer_name }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">City</span>
              <span class="font-medium">{{ order()!.city }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Payment</span>
              <span class="font-medium capitalize">{{ order()!.payment_method.replace('_', ' ') }}</span>
            </div>
            <div class="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span class="text-rose-700">{{ order()!.total_amount | pkr }}</span>
            </div>
          </div>

          @if (order()!.payment_method === 'bank_transfer') {
            <div class="bg-amber-50 rounded-xl p-4 text-sm text-amber-800 mb-6 text-left">
              <p class="font-semibold mb-1">Payment Instructions</p>
              <p>
                Please transfer <strong>{{ order()!.total_amount | pkr }}</strong> and include your order number
                <strong>{{ order()!.order_number }}</strong> in the transfer notes.
              </p>
            </div>
          }
        }

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a mat-raised-button color="primary" routerLink="/store">Continue Shopping</a>
          <a mat-stroked-button routerLink="/">Back to Home</a>
        </div>
      </div>
    </div>
  `,
})
export class OrderConfirmComponent implements OnInit {
  @Input() id!: string;
  private supabase = inject(SupabaseService);
  order = signal<Order | null>(null);

  async ngOnInit(): Promise<void> {
    const { data } = await this.supabase.client
      .from('orders')
      .select('*')
      .eq('id', this.id)
      .single();
    this.order.set(data as Order);
  }
}
