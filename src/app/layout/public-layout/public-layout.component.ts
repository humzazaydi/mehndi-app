import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule,
  ],
  template: `
    <mat-toolbar class="sticky top-0 z-50 !h-16 !px-3 sm:!px-6 !bg-[var(--mehndi-nav)] backdrop-blur-xl border-b border-[var(--mehndi-border)] shadow-[0_10px_30px_rgba(90,18,56,0.08)]">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <a routerLink="/" class="flex items-center gap-2 no-underline min-w-0">
          <div class="w-10 h-10 brand-gradient rounded-lg flex items-center justify-center shadow-lg shrink-0 ornate-border">
            <span class="text-white font-bold text-lg" style="font-family:'Playfair Display',serif">M</span>
          </div>
          <span class="font-semibold text-lg truncate" style="font-family:'Playfair Display',serif;color:var(--mehndi-heading)">
            Mehak's Studio
          </span>
        </a>
      </div>

      <nav class="hidden md:flex items-center gap-1 text-[var(--mehndi-heading)]">
        <a mat-button routerLink="/artists" routerLinkActive="!text-[var(--mehndi-link)]">Artists</a>
        <a mat-button routerLink="/packages" routerLinkActive="!text-[var(--mehndi-link)]">Packages</a>
        <a mat-button routerLink="/store" routerLinkActive="!text-[var(--mehndi-link)]">Henna Boutique</a>
        <a mat-raised-button color="primary" routerLink="/booking" routerLinkActive="!ring-2 !ring-[var(--mehndi-gold-soft)]" class="ml-2">
          Book Now
        </a>
      </nav>

      <div class="flex items-center gap-2 ml-2">
        @if (auth.isAuthenticated()) {
          @if (notifications.unreadCount() > 0) {
            <button mat-icon-button routerLink="/client/dashboard">
              <mat-icon [matBadge]="notifications.unreadCount()" matBadgeColor="warn">notifications</mat-icon>
            </button>
          }
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu>
            @if (auth.isAdmin()) {
              <a mat-menu-item routerLink="/admin/dashboard">
                <mat-icon>dashboard</mat-icon> Admin Panel
              </a>
            } @else {
              <a mat-menu-item routerLink="/client/dashboard">
                <mat-icon>home</mat-icon> My Dashboard
              </a>
            }
            <button mat-menu-item (click)="auth.signOut()">
              <mat-icon>logout</mat-icon> Sign Out
            </button>
          </mat-menu>
        } @else {
          <a mat-button routerLink="/auth/login" class="hidden sm:inline-flex">Login</a>
          <a mat-raised-button color="primary" routerLink="/auth/register" class="hidden sm:inline-flex">Sign Up</a>
        }

        <button mat-icon-button (click)="theme.toggle()" aria-label="Toggle theme">
          <mat-icon>{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>

        <button mat-icon-button class="md:hidden" [matMenuTriggerFor]="mobileMenu" aria-label="Open menu">
          <mat-icon>menu</mat-icon>
        </button>
        <mat-menu #mobileMenu>
          <a mat-menu-item routerLink="/artists">Artists</a>
          <a mat-menu-item routerLink="/packages">Packages</a>
          <a mat-menu-item routerLink="/store">Henna Boutique</a>
          <a mat-menu-item routerLink="/booking">Book Now</a>
          @if (!auth.isAuthenticated()) {
            <a mat-menu-item routerLink="/auth/login">Login</a>
            <a mat-menu-item routerLink="/auth/register">Sign Up</a>
          }
        </mat-menu>
      </div>
    </mat-toolbar>

    <main class="luxury-shell">
      <router-outlet />
    </main>

    <footer class="relative overflow-hidden text-[var(--mehndi-cream)] py-10 mt-0"
            style="background:linear-gradient(135deg,var(--mehndi-heading),var(--mehndi-action-deep) 55%,#006f66 110%)">
      <div class="absolute inset-0 opacity-15 mehndi-motif"></div>
      <div class="page-container relative grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 class="text-[var(--mehndi-gold-soft)] font-semibold mb-3" style="font-family:'Playfair Display',serif">Mehak's Studio</h3>
          <p class="text-sm leading-relaxed opacity-85">Vibrant bridal henna services in Karachi with refined booking, transparent packages, and artist-led care.</p>
        </div>
        <div>
          <h4 class="text-[var(--mehndi-gold-soft)] font-medium mb-3">Quick Links</h4>
          <nav class="flex flex-col gap-2 text-sm">
            <a routerLink="/artists" class="hover:text-[var(--mehndi-gold-soft)] transition-colors">Our Artists</a>
            <a routerLink="/packages" class="hover:text-[var(--mehndi-gold-soft)] transition-colors">Packages & Pricing</a>
            <a routerLink="/store" class="hover:text-[var(--mehndi-gold-soft)] transition-colors">Henna Boutique</a>
            <a routerLink="/booking" class="hover:text-[var(--mehndi-gold-soft)] transition-colors">Book Now</a>
          </nav>
        </div>
        <div>
          <h4 class="text-[var(--mehndi-gold-soft)] font-medium mb-3">Contact</h4>
          <p class="text-sm">0318-2550929</p>
          <p class="text-sm mt-1">Karachi, Pakistan</p>
        </div>
      </div>
      <div class="relative border-t border-[rgba(234,215,162,0.18)] mt-8 pt-6 text-center text-xs opacity-65">
        Copyright {{ year }} Mehak's Studio. All rights reserved.
      </div>
    </footer>
  `,
})
export class PublicLayoutComponent {
  auth = inject(AuthService);
  notifications = inject(NotificationService);
  theme = inject(ThemeService);

  year = new Date().getFullYear();
}
