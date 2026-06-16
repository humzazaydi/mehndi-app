import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { Order, OrderItem, Product, CartItem, OrderStatus } from '../models';

const CART_STORAGE_KEY = 'mehndi_cart';

const ORDER_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  processing: 'is now being processed',
  shipped: 'has been shipped and is on its way',
  delivered: 'has been delivered',
  cancelled: 'has been cancelled',
};

@Injectable({ providedIn: 'root' })
export class OrderService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private notif = inject(NotificationService);

  readonly products = signal<Product[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly myOrders = signal<Order[]>([]);
  readonly cart = signal<CartItem[]>(this.loadCartFromStorage());
  readonly loading = signal(false);

  private loadCartFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartItem[];
      // Sanitize: drop malformed entries and cap quantities to prevent localStorage tampering.
      return parsed
        .filter(item => typeof item?.product?.id === 'string' && typeof item.quantity === 'number')
        .map(item => ({ ...item, quantity: Math.min(Math.max(Math.floor(item.quantity), 1), 99) }));
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
    if (cartItems.length === 0) throw new Error('Cart is empty.');

    // Fetch authoritative prices from the server to prevent client-side price tampering.
    const productIds = cartItems.map(i => i.product.id);
    const { data: serverProducts, error: priceError } = await this.supabase.client
      .from('products')
      .select('id, price, is_active, name')
      .in('id', productIds);
    if (priceError) throw priceError;

    const priceMap = new Map(
      (serverProducts ?? []).map((p: { id: string; price: number; is_active: boolean; name: string }) => [p.id, p])
    );

    // Validate every cart item against the server catalogue.
    const verifiedItems = cartItems.map(item => {
      const srv = priceMap.get(item.product.id);
      if (!srv) throw new Error(`Product not found: ${item.product.name}.`);
      if (!srv.is_active) throw new Error(`"${srv.name}" is no longer available.`);
      return { ...item, unitPrice: srv.price };
    });

    const subtotal = verifiedItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
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

    const items = verifiedItems.map(i => ({
      order_id: order.id,
      product_id: i.product.id,
      quantity: i.quantity,
      unit_price: i.unitPrice, // server-verified price
    }));
    await this.supabase.client.from('order_items').insert(items);

    this.clearCart();

    // Notify staff and optionally the logged-in customer
    this.sendNewOrderNotifications(order, userId).catch(() => {});

    return order;
  }

  private async sendNewOrderNotifications(order: Order, userId: string | null): Promise<void> {
    const orderData = { order_id: order.id };
    const summary = `Order #${order.order_number} for Rs. ${order.total_amount.toLocaleString()} from ${order.customer_name}.`;

    await Promise.all([
      this.notif.notifyAdmins('New Store Order', summary, 'new_order', orderData),
      this.notif.notifyByRole('cones_manager', 'New Store Order', `${summary} Ready for processing.`, 'new_order', orderData),
      ...(userId
        ? [this.notif.createNotification(
            userId,
            'Order Placed Successfully',
            `Your order #${order.order_number} has been received and is being reviewed.`,
            'order_status_update',
            orderData
          )]
        : []),
    ]);
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
    const { data: orderData } = await this.supabase.client
      .from('orders')
      .select('user_id, order_number, customer_name')
      .eq('id', orderId)
      .single();

    const { error } = await this.supabase.client
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId);
    if (error) throw error;

    await this.loadAllOrders();

    // Notify logged-in customer about their order status
    if (orderData) {
      const o = orderData as { user_id: string | null; order_number: string; customer_name: string };
      const label = ORDER_STATUS_LABELS[status];
      if (o.user_id && label) {
        this.notif.createNotification(
          o.user_id,
          'Order Update',
          `Your order #${o.order_number} ${label}.`,
          'order_status_update',
          { order_id: orderId, status }
        ).catch(() => {});
      }
    }
  }

  subscribeToOrders(callback: (payload: any) => void) {
    return this.supabase.client
      .channel('order-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => callback(payload)
      )
      .subscribe();
  }
}
