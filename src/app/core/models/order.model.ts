export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type OrderPaymentMethod = 'cod' | 'bank_transfer';
export type OrderPaymentStatus = 'pending' | 'paid';
export type ProductType = 'regular' | 'organic';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  price: number;
  min_quantity: number;
  is_active: boolean;
  description: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  city: string;
  address: string;
  delivery_charge: number;
  payment_method: OrderPaymentMethod;
  payment_status: OrderPaymentStatus;
  order_status: OrderStatus;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  products?: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
