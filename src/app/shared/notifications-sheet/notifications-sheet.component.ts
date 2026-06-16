import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { NotificationService } from '../../core/services/notification.service';
import { Notification, NotificationType } from '../../core/models';

const NOTIF_ICONS: Record<NotificationType, string> = {
  booking_created: 'event_note',
  booking_confirmed: 'event_available',
  booking_rejected: 'event_busy',
  booking_completed: 'task_alt',
  booking_in_progress: 'pending_actions',
  booking_cancelled: 'event_busy',
  payment_submitted: 'receipt_long',
  payment_verified: 'payments',
  payment_rejected: 'money_off',
  order_status_update: 'local_shipping',
  new_order: 'shopping_bag',
};

const NOTIF_ROUTE: Partial<Record<NotificationType, (d: Record<string, unknown> | null) => string>> = {
  booking_confirmed: (d) => d?.['booking_id'] ? `/client/bookings/${d['booking_id']}` : '/client/bookings',
  booking_rejected:  (d) => d?.['booking_id'] ? `/client/bookings/${d['booking_id']}` : '/client/bookings',
  booking_completed: (d) => d?.['booking_id'] ? `/client/bookings/${d['booking_id']}` : '/client/bookings',
  booking_in_progress: (d) => d?.['booking_id'] ? `/client/bookings/${d['booking_id']}` : '/client/bookings',
  booking_cancelled: (d) => d?.['booking_id'] ? `/client/bookings/${d['booking_id']}` : '/client/bookings',
  payment_verified:  (d) => d?.['booking_id'] ? `/client/bookings/${d['booking_id']}` : '/client/bookings',
  payment_rejected:  (d) => d?.['booking_id'] ? `/client/bookings/${d['booking_id']}` : '/client/bookings',
  order_status_update: () => '/client/orders',
};

@Component({
  selector: 'app-notifications-sheet',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatRippleModule, DatePipe],
  template: `
    <div class="flex flex-col" style="height:100dvh;background:var(--mehndi-ivory);color:var(--mehndi-ink)">

      <!-- Header -->
      <div class="flex items-center justify-between px-4 shrink-0"
           style="height:56px;border-bottom:1px solid var(--mehndi-border);background:var(--mehndi-nav)">
        <h2 class="text-base font-semibold m-0" style="font-family:'Playfair Display',serif;color:var(--mehndi-heading)">
          Notifications
          @if (notifs.unreadCount() > 0) {
            <span class="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                  style="background:var(--mehndi-action-deep);color:#fff">
              {{ notifs.unreadCount() }}
            </span>
          }
        </h2>
        <div class="flex items-center gap-1">
          @if (notifs.unreadCount() > 0) {
            <button mat-button class="!text-xs" style="color:var(--mehndi-link)"
                    (click)="notifs.markAllRead()">
              Mark all read
            </button>
          }
          <button mat-icon-button (click)="close()" aria-label="Close notifications"
                  style="color:var(--mehndi-ink)">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto">
        @for (n of notifs.notifications(); track n.id) {
          <div matRipple
               class="flex items-start gap-3 px-4 py-3 cursor-pointer"
               style="border-bottom:1px solid var(--mehndi-border)"
               (click)="onNotifClick(n)">
            <mat-icon class="shrink-0 mt-0.5" style="font-size:20px;color:var(--mehndi-link)">
              {{ icon(n.type) }}
            </mat-icon>
            <div class="flex-1 min-w-0" [style.opacity]="n.is_read ? '0.55' : '1'">
              <p class="text-sm font-medium leading-tight m-0" style="color:var(--mehndi-heading)">
                {{ n.title }}
              </p>
              <p class="text-xs mt-0.5 leading-snug m-0" style="opacity:.6">{{ n.message }}</p>
              <p class="text-xs mt-1 m-0" style="opacity:.4">
                {{ n.created_at | date:'MMM d, h:mm a' }}
              </p>
            </div>
            @if (!n.is_read) {
              <span class="w-2 h-2 rounded-full shrink-0 mt-2"
                    style="background:var(--mehndi-action-deep)"></span>
            }
          </div>
        }

        @if (notifs.notifications().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 gap-3">
            <mat-icon style="font-size:48px;width:48px;height:48px;opacity:.25">notifications_none</mat-icon>
            <p class="text-sm m-0" style="opacity:.45">No notifications yet</p>
          </div>
        }
      </div>

      <!-- Footer -->
      <div class="shrink-0 px-4 py-3"
           style="border-top:1px solid var(--mehndi-border);background:var(--mehndi-nav)">
        <button mat-stroked-button class="w-full" style="color:var(--mehndi-link)"
                (click)="navigate('/client/dashboard')">
          <mat-icon>dashboard</mat-icon>
          Go to Dashboard
        </button>
      </div>
    </div>
  `,
})
export class NotificationsSheetComponent {
  notifs = inject(NotificationService);
  private ref = inject(MatDialogRef<NotificationsSheetComponent>);
  private router = inject(Router);

  icon(type: NotificationType): string {
    return NOTIF_ICONS[type] ?? 'notifications';
  }

  onNotifClick(n: Notification): void {
    if (!n.is_read) this.notifs.markRead(n.id);
    const fn = NOTIF_ROUTE[n.type];
    this.navigate(fn ? fn(n.data) : '/client/dashboard');
  }

  navigate(path: string): void {
    this.ref.close();
    this.router.navigateByUrl(path);
  }

  close(): void {
    this.ref.close();
  }
}
