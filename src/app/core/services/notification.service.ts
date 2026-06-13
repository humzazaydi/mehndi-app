import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { type Notification, NotificationType } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal(0);

  async load(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    const { data } = await this.supabase.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    const notifs = (data ?? []) as Notification[];
    this.notifications.set(notifs);
    this.unreadCount.set(notifs.filter(n => !n.is_read).length);
  }

  async markRead(id: string): Promise<void> {
    await this.supabase.client.from('notifications').update({ is_read: true }).eq('id', id);
    this.notifications.update(ns => ns.map(n => (n.id === id ? { ...n, is_read: true } : n)));
    this.unreadCount.set(this.notifications().filter(n => !n.is_read).length);
  }

  async markAllRead(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    await this.supabase.client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    this.notifications.update(ns => ns.map(n => ({ ...n, is_read: true })));
    this.unreadCount.set(0);
  }

  subscribeToRealtime(userId: string): void {
    // Remove any stale channel from a previous session before subscribing
    this.supabase.client.removeChannel(
      this.supabase.client.channel(`notifications-${userId}`)
    );

    this.supabase.client
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const notif = payload.new as Notification;
          // Client-side guard in case the server-side filter is bypassed (RLS disabled)
          if (notif.user_id !== userId) return;
          this.notifications.update(ns => [notif, ...ns]);
          this.unreadCount.update(c => c + 1);
          this.showBrowserNotification(notif.title, notif.message);
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          // Retry subscription after a short delay
          setTimeout(() => this.subscribeToRealtime(userId), 5000);
        }
        if (err) {
          console.error('[Notifications] Realtime error:', err);
        }
      });
  }

  // ── Browser Notification API ────────────────────────────────────────────────

  async requestBrowserPermission(): Promise<void> {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  showBrowserNotification(title: string, body: string): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification(title, { body, icon: '/favicon.ico' });
  }

  // ── DB Write Helpers (called by other services) ─────────────────────────────

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    data?: Record<string, unknown>
  ): Promise<void> {
    await this.supabase.client.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      data: data ?? null,
    });
  }

  /** Insert a notification for every user with the given role. */
  async notifyByRole(
    role: string,
    title: string,
    message: string,
    type: NotificationType,
    data?: Record<string, unknown>
  ): Promise<void> {
    const { data: profiles } = await this.supabase.client
      .from('profiles')
      .select('id')
      .eq('role', role);
    if (!profiles?.length) return;
    await this.supabase.client.from('notifications').insert(
      (profiles as { id: string }[]).map(p => ({
        user_id: p.id,
        title,
        message,
        type,
        is_read: false,
        data: data ?? null,
      }))
    );
  }

  async notifyAdmins(
    title: string,
    message: string,
    type: NotificationType,
    data?: Record<string, unknown>
  ): Promise<void> {
    return this.notifyByRole('admin', title, message, type, data);
  }

  /** Resolve an artist row to its profile_id and create a notification. */
  async notifyArtist(
    artistId: string,
    title: string,
    message: string,
    type: NotificationType,
    data?: Record<string, unknown>
  ): Promise<void> {
    const { data: artist } = await this.supabase.client
      .from('artists')
      .select('profile_id')
      .eq('id', artistId)
      .single();
    if (!artist) return;
    await this.createNotification(
      (artist as { profile_id: string }).profile_id,
      title,
      message,
      type,
      data
    );
  }
}
