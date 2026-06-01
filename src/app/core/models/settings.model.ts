export interface BankingSettings {
  meezan: { accountTitle: string; accountNumber: string };
  hbl: { accountTitle: string; accountNumber: string; iban: string };
  easypaisa: string;
  jazzcash: string;
}

export interface BusinessSettings {
  advancePercentage: number;
  homeServiceCharge: number;
  karachiDeliveryCharge: number;
  otherCitiesDeliveryCharge: number;
  minRegularCones: number;
}

export interface ContentBlock {
  id: string;
  slug: string;
  title: string;
  content: string;
  is_active: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: unknown;
  updated_by: string | null;
  updated_at: string;
}
