import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Order, OrderItem, Product, CartItem, OrderStatus } from '../models';

const CART_STORAGE_KEY = 'mehndi_cart';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  readonly products = signal<Product[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly myOrders = signal<Order[]>([]);
  readonly cart = signal<CartItem[]>(this.loadCartFromStorage());
  readonly loading = signal(false);

  private loadCartFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private saveCartToStorage(cart: CartItem[]): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch { /* ignore storage errors */ }
  }

  async loadProducts(): Promise<void> {
    const { data } = await this.supabase.client
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('type');
    this.products.set((data ?? []) as Product[]);
  }

  async loadAllOrders(): Promise<void> {
    this.loading.set(true);
    const { data } = await this.supabase.client
      .from('orders')
      .select('*, order_items(*, products(*))')
      .order('created_at', { ascending: false });
    this.orders.set((data ?? []) as Order[]);
    this.loading.set(false);
  }

  addToCart(product: Product, quantity: number): void {
    const existing = this.cart().find(i => i.product.id === product.id);
    let updated: CartItem[];
    if (existing) {
      updated = this.cart().map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
    } else {
      updated = [...this.cart(), { product, quantity }];
    }
    this.cart.set(updated);
    this.saveCartToStorage(updated);
  }

  updateCartItem(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    const updated = this.cart().map(i => i.product.id === productId ? { ...i, quantity } : i);
    this.cart.set(updated);
    this.saveCartToStorage(updated);
  }

  removeFromCart(productId: string): void {
    const updated = this.cart().filter(i => i.product.id !== productId);
    this.cart.set(updated);
    this.saveCartToStorage(updated);
  }

  clearCart(): void {
    this.cart.set([]);
    this.saveCartToStorage([]);
  }

  getCartTotal(): number {
    return this.cart().reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  async placeOrder(params: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    city: string;
    address: string;
    paymentMethod: 'cod' | 'bank_transfer';
    notes?: string;
    deliveryCharge: number;
  }): Promise<Order> {
    const cartItems = this.cart();
    const subtotal = this.getCartTotal();
    const total = subtotal + params.deliveryCharge;

    const userId = this.auth.currentUser()?.id ?? null;

    const { data, error } = await this.supabase.client
      .from('orders')
      .insert({
        customer_name: params.customerName,
        customer_phone: params.customerPhone,
        customer_email: params.customerEmail,
        city: params.city,
        address: params.address,
        delivery_charge: params.deliveryCharge,
        payment_method: params.paymentMethod,
        payment_status: 'pending',
        order_status: 'pending',
        total_amount: total,
        notes: params.notes ?? null,
        user_id: userId,
      })
      .select()
      .single();
    if (error) throw error;

    const order = data as Order;

    const items = cartItems.map(i => ({
      order_id: order.id,
      product_id: i.product.id,
      quantity: i.quantity,
      unit_price: i.product.price,
    }));
    await this.supabase.client.from('order_items').insert(items);

    this.clearCart();
    return order;
  }

  async loadMyOrders(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.myOrders.set([]); return; }
    this.loading.set(true);
    const { data } = await this.supabase.client
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    this.myOrders.set((data ?? []) as Order[]);
    this.loading.set(false);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const { error } = await this.supabase.client
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId);
    if (error) throw error;
    await this.loadAllOrders();
  }
}
