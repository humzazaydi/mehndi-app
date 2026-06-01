import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

interface KPI { label: string; value: string | number; icon: string; color: string; sub?: string }
interface RecentBooking { id: string; booking_number: string; full_name: string; date: string; status: string; total_amount: number; }

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, MatButtonModule, MatIconModule, CurrencyPkPipe, LoadingSpinnerComponent],
  template: `
    <div class="admin-page">
      <h1 class="page-title">Dashboard</h1>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <!-- KPI Grid -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          @for (kpi of kpis(); track kpi.label) {
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div class="flex items-center justify-between mb-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                     [style.background]="kpi.color + '20'">
                  <mat-icon [style.color]="kpi.color">{{ kpi.icon }}</mat-icon>
                </div>
              </div>
              <p class="text-2xl font-bold text-gray-900">{{ kpi.value }}</p>
              <p class="text-gray-500 text-sm mt-1">{{ kpi.label }}</p>
              @if (kpi.sub) {
                <p class="text-xs mt-1" [style.color]="kpi.color">{{ kpi.sub }}</p>
              }
            </div>
          }
        </div>

        <!-- Quick Links -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          @for (link of quickLinks; track link.route) {
            <a [routerLink]="link.route" mat-stroked-button class="!flex !flex-col !items-center !gap-2 !py-4 !h-auto">
              <mat-icon>{{ link.icon }}</mat-icon>
              <span>{{ link.label }}</span>
            </a>
          }
        </div>

        <!-- Recent Bookings -->
        <div class="bg-white rounded-2xl shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="section-title mb-0">Recent Bookings</h2>
            <a mat-button routerLink="/admin/bookings">View All</a>
          </div>
          @if (recentBookings().length === 0) {
            <p class="text-gray-400 text-center py-6">No bookings yet</p>
          } @else {
            <div class="space-y-3">
              @for (b of recentBookings(); track b.id) {
                <a [routerLink]="['/admin/bookings', b.id]"
                   class="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors no-underline">
                  <div>
                    <span class="font-semibold text-sm">{{ b.booking_number }}</span>
                    <span class="status-badge {{ b.status }} ml-2 text-xs">{{ b.status }}</span>
                    <p class="text-xs text-gray-500 mt-0.5">{{ b.full_name }} · {{ b.date | date:'mediumDate' }}</p>
                  </div>
                  <span class="font-semibold text-rose-700 text-sm">{{ b.total_amount | pkr }}</span>
                </a>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private supabase = inject(SupabaseService);

  loading = signal(true);
  kpis = signal<KPI[]>([]);
  recentBookings = signal<RecentBooking[]>([]);

  quickLinks = [
    { label: 'Bookings', icon: 'event_note', route: '/admin/bookings' },
    { label: 'Artists', icon: 'brush', route: '/admin/artists' },
    { label: 'Payments', icon: 'payments', route: '/admin/payments' },
    { label: 'Analytics', icon: 'bar_chart', route: '/admin/analytics' },
  ];

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadKPIs(), this.loadRecentBookings()]);
    this.loading.set(false);
  }

  private async loadKPIs(): Promise<void> {
    const [bookings, payments] = await Promise.all([
      this.supabase.client.from('bookings').select('status, total_amount, paid_amount, remaining_amount'),
      this.supabase.client.from('payments').select('amount, status').eq('status', 'verified'),
    ]);

    const allBookings = (bookings.data ?? []) as { status: string; total_amount: number; paid_amount: number; remaining_amount: number }[];
    const verifiedPayments = (payments.data ?? []) as { amount: number }[];

    const totalRevenue = verifiedPayments.reduce((s, p) => s + p.amount, 0);
    const outstanding = allBookings.reduce((s, b) => s + b.remaining_amount, 0);
    const pending = allBookings.filter(b => b.status === 'pending').length;
    const completed = allBookings.filter(b => b.status === 'completed').length;

    this.kpis.set([
      { label: 'Total Revenue', value: 'Rs. ' + totalRevenue.toLocaleString('en-PK'), icon: 'payments', color: '#065f46', sub: 'Verified payments' },
      { label: 'Total Bookings', value: allBookings.length, icon: 'event_note', color: '#1e40af' },
      { label: 'Pending Approval', value: pending, icon: 'hourglass_empty', color: '#92400e' },
      { label: 'Outstanding', value: 'Rs. ' + outstanding.toLocaleString('en-PK'), icon: 'account_balance_wallet', color: '#b5263a' },
    ]);
  }

  private async loadRecentBookings(): Promise<void> {
    const { data } = await this.supabase.client
      .from('bookings')
      .select('id, booking_number, full_name, date, status, total_amount')
      .order('created_at', { ascending: false })
      .limit(8);
    this.recentBookings.set((data ?? []) as RecentBooking[]);
  }
}
