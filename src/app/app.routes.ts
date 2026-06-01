import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Public routes (with header/footer)
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/public/home/home.component').then(m => m.HomeComponent) },
      { path: 'artists', loadComponent: () => import('./features/public/artists/artists.component').then(m => m.ArtistsComponent) },
      { path: 'artists/:id', loadComponent: () => import('./features/public/artist-detail/artist-detail.component').then(m => m.ArtistDetailComponent) },
      { path: 'packages', loadComponent: () => import('./features/public/packages/packages.component').then(m => m.PackagesComponent) },
      { path: 'store', loadComponent: () => import('./features/store/cone-store/cone-store.component').then(m => m.ConeStoreComponent) },
      { path: 'store/checkout', loadComponent: () => import('./features/store/checkout/checkout.component').then(m => m.CheckoutComponent) },
      { path: 'store/order-confirm/:id', loadComponent: () => import('./features/store/order-confirm/order-confirm.component').then(m => m.OrderConfirmComponent) },
      {
        path: 'booking',
        canActivate: [authGuard],
        loadComponent: () => import('./features/booking/booking-wizard/booking-wizard.component').then(m => m.BookingWizardComponent),
      },
      { path: 'booking/success/:id', loadComponent: () => import('./features/booking/booking-success/booking-success.component').then(m => m.BookingSuccessComponent) },
      { path: 'booking/track/:id', loadComponent: () => import('./features/booking/booking-tracker/booking-tracker.component').then(m => m.BookingTrackerComponent) },
    ],
  },

  // Auth routes
  {
    path: 'auth',
    children: [
      { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // Client portal
  {
    path: 'client',
    canActivate: [authGuard],
    component: PublicLayoutComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/client/dashboard/client-dashboard.component').then(m => m.ClientDashboardComponent) },
      { path: 'bookings', loadComponent: () => import('./features/client/my-bookings/my-bookings.component').then(m => m.MyBookingsComponent) },
      { path: 'bookings/:id', loadComponent: () => import('./features/client/booking-detail/booking-detail.component').then(m => m.BookingDetailComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Admin panel
  {
    path: 'admin',
    canActivate: [adminGuard],
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'bookings', loadComponent: () => import('./features/admin/bookings/admin-bookings.component').then(m => m.AdminBookingsComponent) },
      { path: 'bookings/:id', loadComponent: () => import('./features/admin/bookings/booking-detail/admin-booking-detail.component').then(m => m.AdminBookingDetailComponent) },
      { path: 'artists', loadComponent: () => import('./features/admin/artists/admin-artists.component').then(m => m.AdminArtistsComponent) },
      { path: 'packages', loadComponent: () => import('./features/admin/packages/admin-packages.component').then(m => m.AdminPackagesComponent) },
      { path: 'payments', loadComponent: () => import('./features/admin/payments/admin-payments.component').then(m => m.AdminPaymentsComponent) },
      { path: 'analytics', loadComponent: () => import('./features/admin/analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent) },
      { path: 'store', loadComponent: () => import('./features/admin/store/admin-store.component').then(m => m.AdminStoreComponent) },
      { path: 'settings', loadComponent: () => import('./features/admin/settings/admin-settings.component').then(m => m.AdminSettingsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  { path: '**', redirectTo: '' },
];
