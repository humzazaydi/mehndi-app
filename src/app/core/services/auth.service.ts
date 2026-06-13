import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Profile, Artist } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  private _session = signal<Session | null>(null);
  private _profile = signal<Profile | null>(null);
  private _artist = signal<Artist | null>(null);
  private _loading = signal(true);

  readonly session = this._session.asReadonly();
  readonly profile = this._profile.asReadonly();
  readonly artist = this._artist.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._session());
  readonly isAdmin = computed(() => this._profile()?.role === 'admin');
  readonly isClient = computed(() => this._profile()?.role === 'client');
  readonly isArtist = computed(() => this._profile()?.role === 'artist');
  readonly isConesManager = computed(() => this._profile()?.role === 'cones_manager');
  readonly currentUser = computed(() => this._session()?.user ?? null);

  async initialize(): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    this._session.set(session);

    if (session?.user) {
      await this.loadProfile(session.user.id);
    }
    this._loading.set(false);

    this.supabase.auth.onAuthStateChange(async (event, session) => {
      this._session.set(session);
      if (session?.user) {
        await this.loadProfile(session.user.id);
      } else {
        this._profile.set(null);
        this._artist.set(null);
      }
    });
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    this._profile.set(data as Profile);

    if (data && data.role === 'artist') {
      const { data: artistData } = await this.supabase.client
        .from('artists')
        .select('*, artist_packages(*, packages(*))')
        .eq('profile_id', userId)
        .single();
      this._artist.set(artistData as Artist);
    } else {
      this._artist.set(null);
    }
  }

  async signUp(email: string, password: string, fullName: string, phone: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    if (error) throw error;
    if (data.user) {
      // Profile created via DB trigger
      await this.loadProfile(data.user.id);
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this._profile.set(null);
    this._artist.set(null);
    this.router.navigate(['/']);
  }

  async updateProfile(updates: Partial<Profile>): Promise<void> {
    const userId = this._session()?.user?.id;
    if (!userId) throw new Error('Not authenticated');
    const { error } = await this.supabase.client
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    if (error) throw error;
    await this.loadProfile(userId);
  }
}
