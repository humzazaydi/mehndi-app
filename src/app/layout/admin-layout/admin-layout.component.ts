import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatBadgeModule, MatMenuModule,
  ],
  template: `
    <mat-sidenav-container class="h-screen !bg-[var(--mehndi-cream)]">
      <mat-sidenav
        #sidenav
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="!isMobile()"
        class="!w-64 !bg-[var(--mehndi-panel)] border-r border-[var(--mehndi-border)]"
      >
        <div class="p-4 border-b border-[var(--mehndi-border)]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 brand-gradient rounded-2xl flex items-center justify-center shadow-lg ornate-border">
              <span class="text-white font-bold text-lg" style="font-family:'Playfair Display',serif">M</span>
            </div>
            <div>
              <p class="font-semibold text-sm leading-none" style="font-family:'Playfair Display',serif;color:var(--mehndi-heading)">Mehndi Studio</p>
              <p class="text-xs opacity-60 mt-1">Admin Atelier</p>
            </div>
          </div>
        </div>

        <mat-nav-list class="py-3 px-2">
          @for (item of navItems; track item.route) {
            <a mat-list-item [routerLink]="item.route" routerLinkActive="!bg-[rgba(201,154,46,0.16)] !text-[var(--mehndi-deep)] !font-semibold" class="!rounded-2xl !mb-1">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>

        <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--mehndi-border)]">
          <a mat-stroked-button routerLink="/" class="w-full">
            <mat-icon>home</mat-icon> View Site
          </a>
        </div>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="!bg-[var(--mehndi-nav)] backdrop-blur-xl border-b border-[var(--mehndi-border)] sticky top-0 z-30">
          <button mat-icon-button (click)="sidenav.toggle()" aria-label="Toggle menu">
            <mat-icon>menu</mat-icon>
          </button>
          <div class="ml-2 hidden sm:block">
            <p class="text-xs uppercase tracking-[0.18em] text-[var(--mehndi-muted)]">Studio operations</p>
          </div>
          <span class="flex-1"></span>

          <button mat-icon-button [matMenuTriggerFor]="notifMenu" aria-label="Notifications">
            <mat-icon [matBadge]="notificationService.unreadCount() || null" matBadgeColor="warn">
              notifications
            </mat-icon>
          </button>
          <mat-menu #notifMenu xPosition="before">
            <div class="px-4 py-2 font-medium border-b border-[var(--mehndi-border)]">Notifications</div>
            @for (n of notificationService.notifications().slice(0, 5); track n.id) {
              <button mat-menu-item [class.opacity-50]="n.is_read" (click)="notificationService.markRead(n.id)">
                <div class="text-sm">
                  <p class="font-medium">{{ n.title }}</p>
                  <p class="opacity-60 text-xs">{{ n.message }}</p>
                </div>
              </button>
            }
            @if (notificationService.notifications().length === 0) {
              <p class="px-4 py-3 text-sm opacity-50">No notifications</p>
            }
          </mat-menu>

          <button mat-icon-button [matMenuTriggerFor]="userMenu" aria-label="Account">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu xPosition="before">
            <div class="px-4 py-2 border-b border-[var(--mehndi-border)]">
              <p class="font-medium text-sm">{{ auth.profile()?.full_name }}</p>
              <p class="text-xs opacity-50">Administrator</p>
            </div>
            <button mat-menu-item (click)="auth.signOut()">
              <mat-icon>logout</mat-icon> Sign Out
            </button>
          </mat-menu>

          <button mat-icon-button (click)="theme.toggle()" aria-label="Toggle theme">
            <mat-icon>{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
        </mat-toolbar>

        <div class="min-h-[calc(100vh-64px)] luxury-shell">
          <router-outlet />
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  notificationService = inject(NotificationService);
  theme = inject(ThemeService);

  isMobile = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'Bookings', icon: 'event_note', route: '/admin/bookings' },
    { label: 'Artists', icon: 'brush', route: '/admin/artists' },
    { label: 'Packages', icon: 'inventory_2', route: '/admin/packages' },
    { label: 'Payments', icon: 'payments', route: '/admin/payments' },
    { label: 'Analytics', icon: 'bar_chart', route: '/admin/analytics' },
    { label: 'Cone Store', icon: 'shopping_bag', route: '/admin/store' },
    { label: 'Settings', icon: 'settings', route: '/admin/settings' },
  ];

  constructor() {
    inject(BreakpointObserver)
      .observe([Breakpoints.Handset])
      .subscribe(result => this.isMobile.set(result.matches));
  }

}
