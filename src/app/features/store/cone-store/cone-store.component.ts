import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { OrderService } from '../../../core/services/order.service';
import { SettingsService } from '../../../core/services/settings.service';
import { Product } from '../../../core/models';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-cone-store',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatBadgeModule, CurrencyPkPipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container py-12">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold mb-4" style="font-family:'Playfair Display',serif">Henna Henna Boutique</h1>
        <p class="text-gray-500 max-w-xl mx-auto">Premium henna cones curated by Henna Studio and delivered to your door.</p>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <!-- Regular Cones -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold mb-6" style="font-family:'Playfair Display',serif">Regular Cones</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (product of regularCones(); track product.id) {
              <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div class="h-40 bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center">
                  <mat-icon style="font-size:80px;width:80px;height:80px;color:#b5263a;opacity:0.4">spa</mat-icon>
                </div>
                <div class="p-5">
                  <h3 class="font-semibold text-lg">{{ product.name }}</h3>
                  @if (product.description) {
                    <p class="text-gray-500 text-sm mt-1">{{ product.description }}</p>
                  }
                  <div class="flex items-center justify-between mt-4">
                    <div>
                      <span class="text-rose-700 font-bold text-xl">{{ product.price | pkr }}</span>
                      <span class="text-gray-400 text-sm ml-1">/ cone</span>
                    </div>
                    <p class="text-xs text-gray-400">Min. {{ product.min_quantity }} cones</p>
                  </div>

                  <!-- Qty Selector -->
                  <div class="flex items-center gap-3 mt-4">
                    <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button class="px-3 py-2 hover:bg-gray-100" (click)="decQty(product)">
                        <mat-icon style="font-size:16px">remove</mat-icon>
                      </button>
                      <span class="px-4 py-2 font-medium min-w-10 text-center">{{ getQty(product) }}</span>
                      <button class="px-3 py-2 hover:bg-gray-100" (click)="incQty(product)">
                        <mat-icon style="font-size:16px">add</mat-icon>
                      </button>
                    </div>
                    <button mat-raised-button color="primary" class="flex-1"
                            (click)="addToCart(product)"
                            [disabled]="getQty(product) < product.min_quantity">
                      Add to Cart
                    </button>
                  </div>
                  @if (getQty(product) < product.min_quantity && getQty(product) > 0) {
                    <p class="text-amber-600 text-xs mt-2">Minimum {{ product.min_quantity }} cones required</p>
                  }
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Organic Cones -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold mb-2" style="font-family:'Playfair Display',serif">Organic Cones</h2>
          <p class="text-amber-700 text-sm mb-6 bg-amber-50 rounded-lg p-3 inline-block">
            <mat-icon class="align-middle mr-1" style="font-size:16px">info</mat-icon>
            Organic cones are fixed price - no discounts applicable.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (product of organicCones(); track product.id) {
              <div class="bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden hover:shadow-md transition-shadow">
                <div class="h-40 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                  <mat-icon style="font-size:80px;width:80px;height:80px;color:#065f46;opacity:0.4">eco</mat-icon>
                </div>
                <div class="p-5">
                  <div class="flex items-center gap-2 mb-2">
                    <h3 class="font-semibold text-lg">{{ product.name }}</h3>
                    <span class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Organic</span>
                  </div>
                  <div class="flex items-center justify-between mt-3">
                    <span class="text-rose-700 font-bold text-xl">{{ product.price | pkr }}</span>
                  </div>
                  <div class="flex items-center gap-3 mt-4">
                    <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button class="px-3 py-2 hover:bg-gray-100" (click)="decQty(product)">
                        <mat-icon style="font-size:16px">remove</mat-icon>
                      </button>
                      <span class="px-4 py-2 font-medium min-w-10 text-center">{{ getQty(product) }}</span>
                      <button class="px-3 py-2 hover:bg-gray-100" (click)="incQty(product)">
                        <mat-icon style="font-size:16px">add</mat-icon>
                      </button>
                    </div>
                    <button mat-raised-button color="primary" class="flex-1" (click)="addToCart(product)" [disabled]="getQty(product) === 0">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Delivery Info -->
        <div class="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 class="font-semibold mb-3">Delivery Information</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div class="flex items-start gap-2">
              <mat-icon class="text-rose-600 shrink-0">local_shipping</mat-icon>
              <div>
                <p class="font-medium">Karachi</p>
                <p class="text-gray-500">Rs. 300 delivery - COD available</p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <mat-icon class="text-rose-600 shrink-0">local_shipping</mat-icon>
              <div>
                <p class="font-medium">Other Cities</p>
                <p class="text-gray-500">Rs. 600 delivery - bank transfer only</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Cart Floating Button -->
        @if (orderService.cart().length > 0) {
          <div class="fixed bottom-6 right-6 z-50">
            <a routerLink="/store/checkout" mat-raised-button color="primary" class="!rounded-lg !px-6 !py-3 shadow-xl">
              <mat-icon [matBadge]="cartItemCount()" matBadgeColor="warn" class="mr-2">shopping_cart</mat-icon>
              Checkout - {{ orderService.getCartTotal() | pkr }}
            </a>
          </div>
        }
      }
    </div>
  `,
})
export class ConeStoreComponent implements OnInit {
  orderService = inject(OrderService);
  private settings = inject(SettingsService);

  loading = signal(true);
  localQty = signal<Record<string, number>>({});

  regularCones = computed(() => this.orderService.products().filter(p => p.type === 'regular'));
  organicCones = computed(() => this.orderService.products().filter(p => p.type === 'organic'));
  cartItemCount = computed(() => this.orderService.cart().reduce((s, i) => s + i.quantity, 0));

  async ngOnInit(): Promise<void> {
    await this.orderService.loadProducts();
    this.loading.set(false);
  }

  getQty(product: Product): number {
    return this.localQty()[product.id] ?? (product.type === 'regular' ? product.min_quantity : 1);
  }

  incQty(product: Product): void {
    this.localQty.update(q => ({ ...q, [product.id]: (q[product.id] ?? 1) + 1 }));
  }

  decQty(product: Product): void {
    const current = this.localQty()[product.id] ?? (product.type === 'regular' ? product.min_quantity : 1);
    if (current > 1) this.localQty.update(q => ({ ...q, [product.id]: current - 1 }));
  }

  addToCart(product: Product): void {
    const qty = this.getQty(product);
    if (product.type === 'regular' && qty < product.min_quantity) return;
    this.orderService.addToCart(product, qty);
  }
}
