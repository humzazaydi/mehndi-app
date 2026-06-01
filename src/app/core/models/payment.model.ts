import { Profile } from './user.model';

export type PaymentStatus = 'pending' | 'verified' | 'rejected' | 'refunded';
export type PaymentMethod = 'meezan' | 'hbl' | 'easypaisa' | 'jazzcash' | 'cash';
export type PaymentType = 'advance' | 'balance' | 'full';

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id: string | null;
  receipt_url: string | null;
  status: PaymentStatus;
  payment_type: PaymentType;
  payment_date: string;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
  profiles?: Profile;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  meezan: 'Meezan Bank',
  hbl: 'HBL',
  easypaisa: 'EasyPaisa',
  jazzcash: 'JazzCash',
  cash: 'Cash',
};
