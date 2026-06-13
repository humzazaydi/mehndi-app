export type NotificationType =
  | 'booking_created'      // admin/artist: new booking submitted by client
  | 'booking_confirmed'    // client: booking confirmed
  | 'booking_rejected'     // client: booking rejected
  | 'booking_completed'    // client: service completed
  | 'booking_in_progress'  // client: service has started
  | 'booking_cancelled'    // client/artist: booking cancelled
  | 'payment_submitted'    // admin: client submitted a payment
  | 'payment_verified'     // client: payment verified by admin
  | 'payment_rejected'     // client: payment rejected by admin
  | 'order_status_update'  // client: order status changed
  | 'new_order';           // admin/cones_manager: new store order placed

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
