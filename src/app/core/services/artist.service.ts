import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Artist } from '../models';

@Injectable({ providedIn: 'root' })
export class ArtistService {
  private supabase = inject(SupabaseService);

  readonly artists = signal<Artist[]>([]);
  readonly loading = signal(false);

  async loadArtists(activeOnly = true): Promise<void> {
    this.loading.set(true);
    let query = this.supabase.client
      .from('artists')
      .select('*, artist_packages(*, packages(*))')
      .order('name');
    if (activeOnly) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (!error) this.artists.set((data ?? []) as Artist[]);
    this.loading.set(false);
  }

  async getById(id: string): Promise<Artist | null> {
    const { data } = await this.supabase.client
      .from('artists')
      .select('*, artist_packages(*, packages(*))')
      .eq('id', id)
      .single();
    return (data as Artist) ?? null;
  }

  async create(artist: Omit<Artist, 'id' | 'created_at' | 'updated_at'>): Promise<Artist> {
    const { data, error } = await this.supabase.client
      .from('artists')
      .insert(artist)
      .select()
      .single();
    if (error) throw error;
    await this.loadArtists(false);
    return data as Artist;
  }

  async update(id: string, updates: Partial<Artist>): Promise<void> {
    const { error } = await this.supabase.client
      .from('artists')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    await this.loadArtists(false);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('artists')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await this.loadArtists(false);
  }

  async uploadPhoto(artistId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${artistId}/profile.${ext}`;
    const { error } = await this.supabase.storage
      .from('artist-photos')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = this.supabase.storage.from('artist-photos').getPublicUrl(path);
    return data.publicUrl;
  }
}
