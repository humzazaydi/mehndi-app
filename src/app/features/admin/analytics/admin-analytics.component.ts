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

interface ArtistPerformance {
  artist_id: string;
  artist_name: string;
  total_bookings: number;
  completed_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
  avg_booking_value: number;
  completion_rate: number;
}

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [
    FormsModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatInputModule,
    NgxEchartsDirective, LoadingSpinnerComponent, CurrencyPkPipe,
  ],
  providers: [provideEchartsCore({ echarts })],
  template: `
    <div class="admin-page">
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 class="page-title mb-0">Analytics</h1>

        <!-- Date range -->
        <div class="flex items-center gap-2 flex-wrap">
          @for (r of ranges; track r.value) {
            <button mat-stroked-button [color]="dateRange === r.value ? 'primary' : undefined"
                    (click)="setRange(r.value)">{{ r.label }}</button>
          }
          @if (dateRange === 'custom') {
            <mat-form-field appearance="outline" class="w-36" subscriptSizing="dynamic">
              <input matInput type="date" [(ngModel)]="customFrom" (ngModelChange)="load()">
            </mat-form-field>
            <span class="text-[var(--mehndi-muted)] text-sm">to</span>
            <mat-form-field appearance="outline" class="w-36" subscriptSizing="dynamic">
              <input matInput type="date" [(ngModel)]="customTo" (ngModelChange)="load()">
            </mat-form-field>
          }
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <mat-icon class="text-red-500 mb-2" style="font-size:40px;width:40px;height:40px">error_outline</mat-icon>
          <p class="text-red-700 font-semibold mb-1">Failed to load analytics</p>
          <p class="text-red-500 text-sm mb-4">{{ error() }}</p>
          <button mat-stroked-button color="warn" (click)="load()">Retry</button>
        </div>
      } @else {

        <!-- ── Revenue KPIs ──────────────────────────────── -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          @for (k of revenueKPIs(); track k.label) {
            <div class="bg-white rounded-lg p-5 shadow-sm">
              <p class="text-gray-500 text-sm mb-1">{{ k.label }}</p>
              <p class="text-2xl font-bold text-gray-900">{{ k.value }}</p>
            </div>
          }
        </div>

        <!-- ── Charts Row 1 ──────────────────────────────── -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-white rounded-lg shadow-sm p-5">
            <h3 class="section-title">Monthly Revenue</h3>
            @if (hasMonthlyData()) {
              <div echarts [options]="monthlyRevenueChart()" class="h-64"></div>
            } @else {
              <div class="h-64 flex items-center justify-center text-[var(--mehndi-muted)] text-sm">
                No revenue data for this period
              </div>
            }
          </div>
          <div class="bg-white rounded-lg shadow-sm p-5">
            <h3 class="section-title">Bookings by Status</h3>
            @if (hasStatusData()) {
              <div echarts [options]="bookingStatusChart()" class="h-64"></div>
            } @else {
              <div class="h-64 flex items-center justify-center text-[var(--mehndi-muted)] text-sm">
                No bookings for this period
              </div>
            }
          </div>
        </div>

        <!-- ── Revenue by Package ────────────────────────── -->
        <div class="bg-white rounded-lg shadow-sm p-5 mb-6">
          <h3 class="section-title">Revenue by Package</h3>
          @if (hasPackageData()) {
            <div echarts [options]="packageRevenueChart()" class="h-56"></div>
          } @else {
            <div class="h-56 flex items-center justify-center text-[var(--mehndi-muted)] text-sm">
              No package revenue data for this period
            </div>
          }
        </div>

        <!-- ── Booking KPIs ──────────────────────────────── -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          @for (k of bookingKPIs(); track k.label) {
            <div class="bg-white rounded-lg p-5 shadow-sm">
              <p class="text-gray-500 text-sm mb-1">{{ k.label }}</p>
              <p class="text-2xl font-bold text-gray-900">{{ k.value }}</p>
            </div>
          }
        </div>

        <!-- ══ Artist Performance ════════════════════════════ -->
        <div>
          <h2 class="section-title mb-6">Artist Performance</h2>

          @if (artistPerformance().length === 0) {
            <div class="bg-white rounded-lg p-8 text-center text-[var(--mehndi-muted)]">
              No artist data for this period
            </div>
          } @else {
            <!-- Revenue comparison chart (horizontal) -->
            <div class="bg-white rounded-lg shadow-sm p-5 mb-6">
              <p class="text-sm font-semibold text-[var(--mehndi-muted)] uppercase tracking-wider mb-4">Revenue Comparison</p>
              <div echarts [options]="artistRevenueChart()" [style.height.px]="Math.max(160, artistPerformance().length * 48)"></div>
            </div>

            <!-- Per-artist detail cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              @for (a of artistPerformance(); track a.artist_id; let rank = $index) {
                <div class="bg-white rounded-lg shadow-sm p-5 flex flex-col gap-4">

                  <!-- Header -->
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                         style="background:rgba(31,122,86,0.12)">
                      <mat-icon style="color:var(--mehndi-emerald);font-size:20px;width:20px;height:20px">brush</mat-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-[var(--mehndi-deep)] truncate">{{ a.artist_name }}</p>
                      <p class="text-[var(--mehndi-gold)] font-bold text-sm">{{ a.total_revenue | pkr }}</p>
                    </div>
                    <span class="text-2xl font-black text-gray-100">#{{ rank + 1 }}</span>
                  </div>

                  <!-- Booking counts -->
                  <div class="grid grid-cols-4 gap-2 text-center">
                    <div class="rounded-xl p-2" style="background:rgba(225,29,72,0.06)">
                      <p class="text-lg font-bold text-[var(--mehndi-deep)]">{{ a.total_bookings }}</p>
                      <p class="text-xs text-[var(--mehndi-muted)]">Total</p>
                    </div>
                    <div class="rounded-xl p-2" style="background:rgba(16,185,129,0.1)">
                      <p class="text-lg font-bold text-emerald-700">{{ a.completed_bookings }}</p>
                      <p class="text-xs text-[var(--mehndi-muted)]">Done</p>
                    </div>
                    <div class="rounded-xl p-2" style="background:rgba(245,158,11,0.1)">
                      <p class="text-lg font-bold text-amber-700">{{ a.confirmed_bookings + a.pending_bookings }}</p>
                      <p class="text-xs text-[var(--mehndi-muted)]">Active</p>
                    </div>
                    <div class="rounded-xl p-2" style="background:rgba(239,68,68,0.08)">
                      <p class="text-lg font-bold text-red-600">{{ a.cancelled_bookings }}</p>
                      <p class="text-xs text-[var(--mehndi-muted)]">Cancel</p>
                    </div>
                  </div>

                  <!-- Completion rate -->
                  <div>
                    <div class="flex justify-between text-xs mb-1.5">
                      <span class="text-[var(--mehndi-muted)]">Completion Rate</span>
                      <span class="font-semibold text-[var(--mehndi-deep)]">{{ a.completion_rate }}%</span>
                    </div>
                    <div class="h-2 rounded-full overflow-hidden" style="background:rgba(225,29,72,0.08)">
                      <div class="h-full rounded-full transition-all"
                           [style.width.%]="a.completion_rate"
                           [style.background]="completionColor(a.completion_rate)">
                      </div>
                    </div>
                  </div>

                  <!-- Avg booking value -->
                  <div class="flex justify-between items-center pt-1 border-t border-[var(--mehndi-border)]">
                    <span class="text-xs text-[var(--mehndi-muted)]">Avg Booking Value</span>
                    <span class="text-sm font-semibold text-[var(--mehndi-deep)]">{{ a.avg_booking_value | pkr }}</span>
                  </div>

                </div>
              }
            </div>
          }
        </div>

      }
    </div>
  `,
})
export class AdminAnalyticsComponent implements OnInit {
  private analytics = inject(AnalyticsService);

  protected readonly Math = Math;

  loading = signal(true);
  error = signal<string | null>(null);
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
  artistPerformance = signal<ArtistPerformance[]>([]);

  monthlyRevenueChart = signal<EChartsOption>({});
  bookingStatusChart = signal<EChartsOption>({});
  artistRevenueChart = signal<EChartsOption>({});
  packageRevenueChart = signal<EChartsOption>({});

  hasMonthlyData = signal(false);
  hasStatusData = signal(false);
  hasArtistData = signal(false);
  hasPackageData = signal(false);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  setRange(range: DateRange): void {
    this.dateRange = range;
    if (range !== 'custom') this.load();
  }

  completionColor(rate: number): string {
    if (rate >= 75) return 'var(--mehndi-emerald)';
    if (rate >= 40) return 'var(--mehndi-gold)';
    return '#ef4444';
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
    if (this.dateRange === 'custom' && (!this.customFrom || !this.customTo)) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const filter = this.getDateRange();

      const [summary, monthly, byArtist, byPackage, bookingMetrics, byStatus] = await Promise.all([
        this.analytics.getRevenueSummary(filter),
        this.analytics.getMonthlyRevenue(filter),
        this.analytics.getArtistPerformance(filter),
        this.analytics.getRevenueByPackage(filter),
        this.analytics.getBookingMetrics(filter),
        this.analytics.getBookingsByStatus(filter),
      ]);

      this.setRevenueKPIs(summary as unknown);
      this.setBookingKPIs(bookingMetrics as unknown);
      this.setMonthlyChart((monthly as unknown[]) as { month: string; revenue: number }[]);
      this.setStatusChart((byStatus as unknown[]) as { status: string; count: number }[]);
      this.setArtistData((byArtist as unknown[]) as ArtistPerformance[]);
      this.setPackageChart((byPackage as unknown[]) as { package_name: string; revenue: number }[]);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      this.loading.set(false);
    }
  }

  private setRevenueKPIs(data: unknown): void {
    const d = data as Record<string, unknown> | null;
    this.revenueKPIs.set([
      { label: 'Total Revenue', value: `Rs. ${Number(d?.['total_revenue'] ?? 0).toLocaleString('en-PK')}` },
      { label: 'Verified Payments', value: `Rs. ${Number(d?.['verified_payments'] ?? 0).toLocaleString('en-PK')}` },
      { label: 'Outstanding', value: `Rs. ${Number(d?.['outstanding'] ?? 0).toLocaleString('en-PK')}` },
      { label: 'Avg Booking Value', value: `Rs. ${Number(d?.['avg_booking_value'] ?? 0).toFixed(0)}` },
    ]);
  }

  private setBookingKPIs(data: unknown): void {
    const d = data as Record<string, unknown> | null;
    this.bookingKPIs.set([
      { label: 'Total Bookings', value: Number(d?.['total'] ?? 0) },
      { label: 'Confirmed', value: Number(d?.['confirmed'] ?? 0) },
      { label: 'Completed', value: Number(d?.['completed'] ?? 0) },
      { label: 'Cancelled/Rejected', value: Number(d?.['cancelled'] ?? 0) + Number(d?.['rejected'] ?? 0) },
    ]);
  }

  private setMonthlyChart(data: { month: string; revenue: number }[]): void {
    this.hasMonthlyData.set(data.length > 0);
    this.monthlyRevenueChart.set({
      tooltip: { trigger: 'axis', valueFormatter: (v: unknown) => `Rs. ${Number(v).toLocaleString()}` },
      xAxis: { type: 'category', data: data.map(d => d.month) },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `Rs. ${v.toLocaleString()}` } },
      series: [{ name: 'Revenue', type: 'bar', data: data.map(d => Number(d.revenue)), itemStyle: { color: '#e11d48' } }],
      grid: { containLabel: true, left: 16, right: 16, top: 16, bottom: 16 },
    });
  }

  private setStatusChart(data: { status: string; count: number }[]): void {
    this.hasStatusData.set(data.length > 0);
    const COLORS: Record<string, string> = {
      pending: '#f59e0b', confirmed: '#10b981', completed: '#8b5cf6',
      cancelled: '#ef4444', rejected: '#ec4899', in_progress: '#3b82f6',
    };
    this.bookingStatusChart.set({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        type: 'pie', radius: ['40%', '70%'],
        data: data.map(d => ({
          name: d.status,
          value: Number(d.count),
          itemStyle: { color: COLORS[d.status] ?? '#999' },
        })),
      }],
    });
  }

  private setArtistData(data: ArtistPerformance[]): void {
    // Normalise numeric fields (Postgres NUMERIC may come as strings)
    const normalised = data.map(a => ({
      ...a,
      total_bookings: Number(a.total_bookings),
      completed_bookings: Number(a.completed_bookings),
      confirmed_bookings: Number(a.confirmed_bookings),
      pending_bookings: Number(a.pending_bookings),
      cancelled_bookings: Number(a.cancelled_bookings),
      total_revenue: Number(a.total_revenue),
      avg_booking_value: Number(a.avg_booking_value),
      completion_rate: Number(a.completion_rate),
    }));

    this.artistPerformance.set(normalised);
    this.hasArtistData.set(normalised.some(a => a.total_bookings > 0));

    // Horizontal bar chart — sorted ascending so top earner appears at top
    const sorted = [...normalised].sort((a, b) => a.total_revenue - b.total_revenue);
    this.artistRevenueChart.set({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (v: unknown) => `Rs. ${Number(v).toLocaleString()}`,
      },
      grid: { containLabel: true, left: 16, right: 100, top: 8, bottom: 8 },
      xAxis: {
        type: 'value',
        axisLabel: { formatter: (v: number) => `Rs. ${(v / 1000).toFixed(0)}k` },
      },
      yAxis: {
        type: 'category',
        data: sorted.map(a => a.artist_name),
        axisLabel: { fontWeight: 'bold' },
      },
      series: [{
        type: 'bar',
        data: sorted.map(a => a.total_revenue),
        itemStyle: { color: '#009688', borderRadius: [0, 6, 6, 0] },
        label: {
          show: true,
          position: 'right',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => `Rs. ${Number(p.value).toLocaleString()}`,
          color: '#e11d48',
          fontWeight: 'bold',
          fontSize: 11,
        },
      }],
    });
  }

  private setPackageChart(data: { package_name: string; revenue: number }[]): void {
    this.hasPackageData.set(data.length > 0);
    this.packageRevenueChart.set({
      tooltip: { trigger: 'item', valueFormatter: (v: unknown) => `Rs. ${Number(v).toLocaleString()}` },
      legend: { orient: 'vertical', left: 'left', top: 'center' },
      series: [{
        type: 'pie', radius: ['35%', '65%'], right: '0',
        data: data.map(d => ({ name: d.package_name, value: Number(d.revenue) })),
        label: { show: true, formatter: '{b}\n{d}%' },
      }],
    });
  }
}
