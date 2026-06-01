import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BankingSettings, BusinessSettings, ContentBlock } from '../models';

const DEFAULTS: BusinessSettings = {
  advancePercentage: 50,
  homeServiceCharge: 2500,
  karachiDeliveryCharge: 300,
  otherCitiesDeliveryCharge: 600,
  minRegularCones: 4,
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private supabase = inject(SupabaseService);

  readonly banking = signal<BankingSettings | null>(null);
  readonly business = signal<BusinessSettings>(DEFAULTS);
  readonly contentBlocks = signal<ContentBlock[]>([]);

  async loadAll(): Promise<void> {
    const [{ data: settings }, { data: blocks }] = await Promise.all([
      this.supabase.client.from('settings').select('*'),
      this.supabase.client.from('content_blocks').select('*').eq('is_active', true),
    ]);

    if (settings) {
      const map = Object.fromEntries((settings as { key: string; value: unknown }[]).map(s => [s.key, s.value]));
      if (map['banking']) this.banking.set(map['banking'] as BankingSettings);
      if (map['business']) this.business.set({ ...DEFAULTS, ...(map['business'] as BusinessSettings) });
    }
    this.contentBlocks.set((blocks ?? []) as ContentBlock[]);
  }

  getContentBlock(slug: string): ContentBlock | undefined {
    return this.contentBlocks().find(b => b.slug === slug);
  }

  async updateSetting(key: string, value: unknown): Promise<void> {
    const { error } = await this.supabase.client
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' });
    if (error) throw error;
    await this.loadAll();
  }

  async updateContentBlock(slug: string, updates: Partial<ContentBlock>): Promise<void> {
    const { error } = await this.supabase.client
      .from('content_blocks')
      .update(updates)
      .eq('slug', slug);
    if (error) throw error;
    await this.loadAll();
  }
}
