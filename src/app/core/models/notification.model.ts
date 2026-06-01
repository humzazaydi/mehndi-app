export type NotificationType =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_rejected'
  | 'booking_completed'
  | 'payment_verified'
  | 'payment_rejected'
  | 'order_status_update';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
}
