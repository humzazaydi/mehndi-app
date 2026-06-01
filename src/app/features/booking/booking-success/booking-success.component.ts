import { Component, inject, OnInit, signal, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [RouterLink, DatePipe, MatButtonModule, MatIconModule, CurrencyPkPipe],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="max-w-lg w-full text-center">
        <!-- Success Icon -->
        <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <mat-icon class="text-green-600" style="font-size:48px;width:48px;height:48px">check_circle</mat-icon>
        </div>

        <h1 class="text-3xl font-bold mb-3" style="font-family:'Playfair Display',serif">Booking Submitted!</h1>
        <p class="text-gray-500 mb-8">
          Your booking has been received and is pending confirmation from our team.
          We'll notify you once it's approved.
        </p>

        @if (booking()) {
          <div class="bg-white rounded-2xl shadow-sm p-6 text-left mb-8 space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Booking Number</span>
              <span class="font-bold text-rose-700">{{ booking()!.booking_number }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Status</span>
              <span class="status-badge pending">Pending</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Date</span>
              <span class="font-medium">{{ booking()!.date | date:'fullDate' }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Time</span>
              <span class="font-medium">{{ booking()!.time_slot }}</span>
            </div>
            <div class="flex justify-between text-sm font-semibold pt-2 border-t border-gray-100">
              <span>Advance to Pay</span>
              <span class="text-rose-700">{{ booking()!.advance_amount | pkr }}</span>
            </div>
          </div>
        }

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a mat-raised-button color="primary" routerLink="/client/bookings">
            <mat-icon class="mr-2">event_note</mat-icon> View My Bookings
          </a>
          <a mat-stroked-button routerLink="/">Back to Home</a>
        </div>
      </div>
    </div>
  `,
})
export class BookingSuccessComponent implements OnInit {
  @Input() id!: string;
  private bookingService = inject(BookingService);
  booking = signal<Booking | null>(null);

  async ngOnInit(): Promise<void> {
    const data = await this.bookingService.getById(this.id);
    this.booking.set(data);
  }
}
