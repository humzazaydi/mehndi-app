import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule,
  ],
  template: `
    <!-- Header -->
    <mat-toolbar class="sticky top-0 z-50 !bg-white dark:!bg-gray-900 shadow-sm border-b border-gray-100">
      <div class="flex items-center gap-3 flex-1">
        <a routerLink="/" class="flex items-center gap-2 no-underline">
          <div class="w-9 h-9 brand-gradient rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-lg">M</span>
          </div>
          <span class="font-semibold text-lg hidden sm:block" style="font-family:'Playfair Display',serif;color:var(--brand-primary)">
            Mehndi Studio
          </span>
        </a>
      </div>

      <!-- Desktop nav -->
      <nav class="hidden md:flex items-center gap-1">
        <a mat-button routerLink="/artists" routerLinkActive="text-rose-600">Artists</a>
        <a mat-button routerLink="/packages" routerLinkActive="text-rose-600">Packages</a>
        <a mat-button routerLink="/store" routerLinkActive="text-rose-600">Henna Store</a>
        <a mat-button routerLink="/booking" routerLinkActive="text-rose-600" class="ml-2">Book Now</a>
      </nav>

      <!-- Auth actions -->
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
          <a mat-button routerLink="/auth/login">Login</a>
          <a mat-raised-button color="primary" routerLink="/auth/register">Sign Up</a>
        }

        <!-- Dark mode -->
        <button mat-icon-button (click)="toggleDark()">
          <mat-icon>{{ isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>

        <!-- Mobile menu -->
        <button mat-icon-button class="md:hidden" [matMenuTriggerFor]="mobileMenu">
          <mat-icon>menu</mat-icon>
        </button>
        <mat-menu #mobileMenu>
          <a mat-menu-item routerLink="/artists">Artists</a>
          <a mat-menu-item routerLink="/packages">Packages</a>
          <a mat-menu-item routerLink="/store">Henna Store</a>
          <a mat-menu-item routerLink="/booking">Book Now</a>
        </mat-menu>
      </div>
    </mat-toolbar>

    <!-- Main -->
    <main>
      <router-outlet />
    </main>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-300 py-10 mt-16">
      <div class="page-container grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 class="text-white font-semibold mb-3" style="font-family:'Playfair Display',serif">Mehndi Studio</h3>
          <p class="text-sm leading-relaxed">Professional bridal henna services in Karachi. Book your perfect look today.</p>
        </div>
        <div>
          <h4 class="text-white font-medium mb-3">Quick Links</h4>
          <nav class="flex flex-col gap-2 text-sm">
            <a routerLink="/artists" class="hover:text-white transition-colors">Our Artists</a>
            <a routerLink="/packages" class="hover:text-white transition-colors">Packages & Pricing</a>
            <a routerLink="/store" class="hover:text-white transition-colors">Henna Cone Store</a>
            <a routerLink="/booking" class="hover:text-white transition-colors">Book Now</a>
          </nav>
        </div>
        <div>
          <h4 class="text-white font-medium mb-3">Contact</h4>
          <p class="text-sm">📱 0318-2550929</p>
          <p class="text-sm mt-1">📍 Karachi, Pakistan</p>
        </div>
      </div>
      <div class="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-500">
        © {{ year }} Mehndi Studio. All rights reserved.
      </div>
    </footer>
  `,
})
export class PublicLayoutComponent {
  auth = inject(AuthService);
  notifications = inject(NotificationService);

  isDark = signal(false);
  year = new Date().getFullYear();

  toggleDark(): void {
    this.isDark.update(d => !d);
    document.body.classList.toggle('dark-theme', this.isDark());
  }
}
