import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface AnalyticsFilter {
  dateFrom: string;
  dateTo: string;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private supabase = inject(SupabaseService);

  async getRevenueSummary(filter: AnalyticsFilter) {
    const { data, error } = await this.supabase.rpc('get_revenue_summary', {
      date_from: filter.dateFrom,
      date_to: filter.dateTo,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async getMonthlyRevenue(filter: AnalyticsFilter) {
    const { data, error } = await this.supabase.rpc('get_monthly_revenue', {
      date_from: filter.dateFrom,
      date_to: filter.dateTo,
    });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getRevenueByArtist(filter: AnalyticsFilter) {
    const { data, error } = await this.supabase.rpc('get_revenue_by_artist', {
      date_from: filter.dateFrom,
      date_to: filter.dateTo,
    });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getRevenueByPackage(filter: AnalyticsFilter) {
    const { data, error } = await this.supabase.rpc('get_revenue_by_package', {
      date_from: filter.dateFrom,
      date_to: filter.dateTo,
    });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getBookingMetrics(filter: AnalyticsFilter) {
    const { data, error } = await this.supabase.rpc('get_booking_metrics', {
      date_from: filter.dateFrom,
      date_to: filter.dateTo,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async getBookingsByStatus(filter: AnalyticsFilter) {
    const { data, error } = await this.supabase.rpc('get_bookings_by_status', {
      date_from: filter.dateFrom,
      date_to: filter.dateTo,
    });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getCustomerMetrics(filter: AnalyticsFilter) {
    const { data, error } = await this.supabase.rpc('get_customer_metrics', {
      date_from: filter.dateFrom,
      date_to: filter.dateTo,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async getArtistPerformance(filter: AnalyticsFilter) {
    const { data, error } = await this.supabase.rpc('get_artist_performance', {
      date_from: filter.dateFrom,
      date_to: filter.dateTo,
    });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getPeakDays(filter: AnalyticsFilter) {
    const { data, error } = await this.supabase.rpc('get_peak_days', {
      date_from: filter.dateFrom,
      date_to: filter.dateTo,
    });
    if (error) throw new Error(error.message);
    return data ?? [];
  }
}
