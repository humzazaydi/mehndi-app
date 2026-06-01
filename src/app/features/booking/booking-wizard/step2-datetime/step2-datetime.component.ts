import { Component, inject, OnInit, signal } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { BookingWizardService } from '../booking-wizard.service';
import { BookingService } from '../../../../core/services/booking.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-step2-datetime',
  standalone: true,
  imports: [
    FormsModule, MatDatepickerModule, MatNativeDateModule,
    MatFormFieldModule, MatInputModule, MatIconModule, LoadingSpinnerComponent,
  ],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-6">Select Date & Time</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Calendar -->
        <div>
          <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Choose Date</h3>
          <mat-calendar
            [minDate]="minDate"
            [(selected)]="selectedDate"
            (selectedChange)="onDateChange($event)"
            class="border border-gray-200 rounded-xl overflow-hidden"
          />
        </div>

        <!-- Time Slots -->
        <div>
          <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Choose Time Slot</h3>

          @if (!wizard.data().date) {
            <div class="text-center py-8 text-gray-400">
              <mat-icon style="font-size:48px;width:48px;height:48px;opacity:0.3">event</mat-icon>
              <p class="mt-2 text-sm">Select a date first</p>
            </div>
          } @else if (loadingSlots()) {
            <app-loading-spinner message="Checking availability..." />
          } @else if (availableSlots().length === 0) {
            <div class="text-center py-8 text-gray-400">
              <mat-icon style="font-size:48px;width:48px;height:48px;opacity:0.3">event_busy</mat-icon>
              <p class="mt-2 text-sm">No slots available on this date</p>
            </div>
          } @else {
            <div class="grid grid-cols-2 gap-2">
              @for (slot of availableSlots(); track slot) {
                <button
                  class="py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all"
                  [class.border-rose-500]="wizard.data().timeSlot === slot"
                  [class.bg-rose-500]="wizard.data().timeSlot === slot"
                  [class.text-white]="wizard.data().timeSlot === slot"
                  [class.border-gray-200]="wizard.data().timeSlot !== slot"
                  [class.hover:border-rose-300]="wizard.data().timeSlot !== slot"
                  (click)="selectSlot(slot)"
                >
                  {{ slot }}
                </button>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class Step2DatetimeComponent implements OnInit {
  wizard = inject(BookingWizardService);
  private bookingService = inject(BookingService);

  minDate = new Date();
  selectedDate: Date | null = null;
  availableSlots = signal<string[]>([]);
  loadingSlots = signal(false);

  ngOnInit(): void {
    if (this.wizard.data().date) {
      this.selectedDate = new Date(this.wizard.data().date!);
    }
  }

  async onDateChange(date: Date | null): Promise<void> {
    if (!date) return;
    const dateStr = date.toISOString().split('T')[0];
    this.wizard.patch({ date: dateStr, timeSlot: null });
    this.loadingSlots.set(true);
    const artistId = this.wizard.data().artistId;
    if (artistId) {
      const slots = await this.bookingService.getAvailableTimeSlots(artistId, dateStr);
      this.availableSlots.set(slots);
    }
    this.loadingSlots.set(false);
  }

  selectSlot(slot: string): void {
    this.wizard.patch({ timeSlot: slot });
  }
}
