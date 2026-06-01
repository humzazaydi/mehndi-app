import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Notification } from '../models';

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
    await this.supabase.client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    await this.load();
  }

  async markAllRead(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    await this.supabase.client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    await this.load();
  }

  subscribeToRealtime(userId: string): void {
    this.supabase.client
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => this.load()
      )
      .subscribe();
  }
}
