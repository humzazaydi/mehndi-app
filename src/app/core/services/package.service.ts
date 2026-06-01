import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Package, Addon } from '../models';

@Injectable({ providedIn: 'root' })
export class PackageService {
  private supabase = inject(SupabaseService);

  readonly packages = signal<Package[]>([]);
  readonly addons = signal<Addon[]>([]);
  readonly loading = signal(false);

  async loadPackages(activeOnly = true): Promise<void> {
    this.loading.set(true);
    let q = this.supabase.client.from('packages').select('*').order('sort_order');
    if (activeOnly) q = q.eq('is_active', true);
    const { data } = await q;
    this.packages.set((data ?? []) as Package[]);
    this.loading.set(false);
  }

  async loadAddons(activeOnly = true): Promise<void> {
    let q = this.supabase.client.from('addons').select('*').order('name');
    if (activeOnly) q = q.eq('is_active', true);
    const { data } = await q;
    this.addons.set((data ?? []) as Addon[]);
  }

  async createPackage(pkg: Omit<Package, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { error } = await this.supabase.client.from('packages').insert(pkg);
    if (error) throw error;
    await this.loadPackages(false);
  }

  async updatePackage(id: string, updates: Partial<Package>): Promise<void> {
    const { error } = await this.supabase.client.from('packages').update(updates).eq('id', id);
    if (error) throw error;
    await this.loadPackages(false);
  }

  async deletePackage(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('packages').delete().eq('id', id);
    if (error) throw error;
    await this.loadPackages(false);
  }

  async createAddon(addon: Omit<Addon, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { error } = await this.supabase.client.from('addons').insert(addon);
    if (error) throw error;
    await this.loadAddons(false);
  }

  async updateAddon(id: string, updates: Partial<Addon>): Promise<void> {
    const { error } = await this.supabase.client.from('addons').update(updates).eq('id', id);
    if (error) throw error;
    await this.loadAddons(false);
  }

  async deleteAddon(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('addons').delete().eq('id', id);
    if (error) throw error;
    await this.loadAddons(false);
  }
}
