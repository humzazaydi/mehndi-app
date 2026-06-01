import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

type DateRange = '7d' | '30d' | '90d' | 'custom';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [
    FormsModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatInputModule,
    NgxEchartsDirective, CurrencyPkPipe, LoadingSpinnerComponent,
  ],
  providers: [provideEchartsCore({ echarts })],
  template: `
    <div class="admin-page">
      <div class="flex items-center justify-between mb-6">
        <h1 class="page-title mb-0">Analytics</h1>

        <!-- Date range -->
        <div class="flex items-center gap-3">
          @for (r of ranges; track r.value) {
            <button mat-stroked-button [color]="dateRange === r.value ? 'primary' : undefined"
                    (click)="setRange(r.value)">{{ r.label }}</button>
          }
          @if (dateRange === 'custom') {
            <mat-form-field appearance="outline" class="w-36">
              <input matInput type="date" [(ngModel)]="customFrom" (ngModelChange)="load()">
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-36">
              <input matInput type="date" [(ngModel)]="customTo" (ngModelChange)="load()">
            </mat-form-field>
          }
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <!-- Revenue KPIs -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          @for (k of revenueKPIs(); track k.label) {
            <div class="bg-white rounded-2xl p-5 shadow-sm">
              <p class="text-gray-500 text-sm mb-1">{{ k.label }}</p>
              <p class="text-2xl font-bold text-gray-900">{{ k.value }}</p>
            </div>
          }
        </div>

        <!-- Charts Row 1 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-white rounded-2xl shadow-sm p-5">
            <h3 class="section-title">Monthly Revenue</h3>
            <div echarts [options]="monthlyRevenueChart()" class="h-64"></div>
          </div>
          <div class="bg-white rounded-2xl shadow-sm p-5">
            <h3 class="section-title">Bookings by Status</h3>
            <div echarts [options]="bookingStatusChart()" class="h-64"></div>
          </div>
        </div>

        <!-- Charts Row 2 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-white rounded-2xl shadow-sm p-5">
            <h3 class="section-title">Revenue by Artist</h3>
            <div echarts [options]="artistRevenueChart()" class="h-64"></div>
          </div>
          <div class="bg-white rounded-2xl shadow-sm p-5">
            <h3 class="section-title">Revenue by Package</h3>
            <div echarts [options]="packageRevenueChart()" class="h-64"></div>
          </div>
        </div>

        <!-- Booking KPIs -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (k of bookingKPIs(); track k.label) {
            <div class="bg-white rounded-2xl p-5 shadow-sm">
              <p class="text-gray-500 text-sm mb-1">{{ k.label }}</p>
              <p class="text-2xl font-bold text-gray-900">{{ k.value }}</p>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminAnalyticsComponent implements OnInit {
  private analytics = inject(AnalyticsService);

  loading = signal(true);
  dateRange: DateRange = '30d';
  customFrom = '';
  customTo = '';

  ranges = [
    { label: 'Last 7 days', value: '7d' as DateRange },
    { label: 'Last 30 days', value: '30d' as DateRange },
    { label: 'Last 90 days', value: '90d' as DateRange },
    { label: 'Custom', value: 'custom' as DateRange },
  ];

  revenueKPIs = signal<{ label: string; value: string }[]>([]);
  bookingKPIs = signal<{ label: string; value: string | number }[]>([]);
  monthlyRevenueChart = signal<EChartsOption>({});
  bookingStatusChart = signal<EChartsOption>({});
  artistRevenueChart = signal<EChartsOption>({});
  packageRevenueChart = signal<EChartsOption>({});

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  setRange(range: DateRange): void {
    this.dateRange = range;
    if (range !== 'custom') this.load();
  }

  private getDateRange(): { dateFrom: string; dateTo: string } {
    if (this.dateRange === 'custom') {
      return { dateFrom: this.customFrom, dateTo: this.customTo };
    }
    const to = new Date();
    const from = new Date();
    const days = this.dateRange === '7d' ? 7 : this.dateRange === '30d' ? 30 : 90;
    from.setDate(from.getDate() - days);
    return { dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0] };
  }

  async load(): Promise<void> {
    this.loading.set(true);
    const filter = this.getDateRange();

    const [summary, monthly, byArtist, byPackage, bookingMetrics, byStatus] = await Promise.all([
      this.analytics.getRevenueSummary(filter),
      this.analytics.getMonthlyRevenue(filter),
      this.analytics.getRevenueByArtist(filter),
      this.analytics.getRevenueByPackage(filter),
      this.analytics.getBookingMetrics(filter),
      this.analytics.getBookingsByStatus(filter),
    ]);

    this.setRevenueKPIs(summary as unknown);
    this.setBookingKPIs(bookingMetrics as unknown);
    this.setMonthlyChart((monthly as unknown[]) as { month: string; revenue: number }[]);
    this.setStatusChart((byStatus as unknown[]) as { status: string; count: number }[]);
    this.setArtistChart((byArtist as unknown[]) as { artist_name: string; revenue: number }[]);
    this.setPackageChart((byPackage as unknown[]) as { package_name: string; revenue: number }[]);
    this.loading.set(false);
  }

  private setRevenueKPIs(data: unknown): void {
    const d = data as Record<string, number> | null;
    this.revenueKPIs.set([
      { label: 'Total Revenue', value: `Rs. ${((d?.['total_revenue'] ?? 0) as number).toLocaleString('en-PK')}` },
      { label: 'Verified Payments', value: `Rs. ${((d?.['verified_payments'] ?? 0) as number).toLocaleString('en-PK')}` },
      { label: 'Outstanding', value: `Rs. ${((d?.['outstanding'] ?? 0) as number).toLocaleString('en-PK')}` },
      { label: 'Avg Booking Value', value: `Rs. ${((d?.['avg_booking_value'] ?? 0) as number).toFixed(0)}` },
    ]);
  }

  private setBookingKPIs(data: unknown): void {
    const d = data as Record<string, number> | null;
    this.bookingKPIs.set([
      { label: 'Total Bookings', value: (d?.['total'] ?? 0) as number },
      { label: 'Confirmed', value: (d?.['confirmed'] ?? 0) as number },
      { label: 'Completed', value: (d?.['completed'] ?? 0) as number },
      { label: 'Cancelled/Rejected', value: ((d?.['cancelled'] ?? 0) as number) + ((d?.['rejected'] ?? 0) as number) },
    ]);
  }

  private setMonthlyChart(data: { month: string; revenue: number }[]): void {
    this.monthlyRevenueChart.set({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: data.map(d => d.month) },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `Rs. ${v.toLocaleString()}` } },
      series: [{ name: 'Revenue', type: 'bar', data: data.map(d => d.revenue), itemStyle: { color: '#b5263a' } }],
      grid: { containLabel: true, left: 16, right: 16, top: 16, bottom: 16 },
    });
  }

  private setStatusChart(data: { status: string; count: number }[]): void {
    const COLORS: Record<string, string> = {
      pending: '#f59e0b', confirmed: '#10b981', completed: '#8b5cf6',
      cancelled: '#ef4444', rejected: '#ec4899', in_progress: '#3b82f6',
    };
    this.bookingStatusChart.set({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        type: 'pie', radius: ['40%', '70%'],
        data: data.map(d => ({ name: d.status, value: d.count, itemStyle: { color: COLORS[d.status] } })),
      }],
    });
  }

  private setArtistChart(data: { artist_name: string; revenue: number }[]): void {
    this.artistRevenueChart.set({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: data.map(d => d.artist_name) },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: data.map(d => d.revenue), itemStyle: { color: '#e8536b' } }],
      grid: { containLabel: true, left: 16, right: 16, top: 16, bottom: 24 },
    });
  }

  private setPackageChart(data: { package_name: string; revenue: number }[]): void {
    this.packageRevenueChart.set({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie', radius: '60%',
        data: data.map(d => ({ name: d.package_name, value: d.revenue })),
      }],
    });
  }
}
