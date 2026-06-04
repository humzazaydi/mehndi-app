import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BookingWizardService } from './booking-wizard.service';
import { BookingService } from '../../../core/services/booking.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Step1ArtistComponent } from './step1-artist/step1-artist.component';
import { Step2DatetimeComponent } from './step2-datetime/step2-datetime.component';
import { Step3AddonsComponent } from './step3-addons/step3-addons.component';
import { Step4DetailsComponent } from './step4-details/step4-details.component';
import { Step5ReviewComponent } from './step5-review/step5-review.component';

const STEP_LABELS = ['Artist & Package', 'Date & Time', 'Add-ons', 'Your Details', 'Review & Pay'];

@Component({
  selector: 'app-booking-wizard',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatProgressBarModule,
    Step1ArtistComponent, Step2DatetimeComponent, Step3AddonsComponent,
    Step4DetailsComponent, Step5ReviewComponent,
  ],
  template: `
    <div class="min-h-screen luxury-shell py-6 sm:py-10">
      <div class="max-w-3xl mx-auto px-4">
        <div class="text-center mb-8">
          <p class="text-xs uppercase tracking-[0.25em] text-[var(--mehndi-link)] font-semibold mb-2">Bridal booking</p>
          <h1 class="text-4xl sm:text-5xl font-bold">
            Reserve Your Mehak's Session
          </h1>
          <p class="text-[var(--mehndi-muted)] mt-3">Choose your artist, ceremony date, bespoke details, and advance payment.</p>
        </div>

        <div class="premium-card p-4 sm:p-6 mb-6">
          <div class="flex items-center justify-between mb-3">
            @for (label of stepLabels; track label; let i = $index) {
              <div class="flex flex-col items-center gap-1 flex-1" [class.opacity-40]="i > wizard.currentStep()">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors shadow-sm"
                     [class.brand-gradient]="i <= wizard.currentStep()"
                     [class.text-white]="i <= wizard.currentStep()"
                     [class.bg-[var(--mehndi-blush)]]="i > wizard.currentStep()"
                     [class.text-[var(--mehndi-muted)]]="i > wizard.currentStep()">
                  @if (i < wizard.currentStep()) {
                    <mat-icon style="font-size:16px;width:16px;height:16px">check</mat-icon>
                  } @else {
                    {{ i + 1 }}
                  }
                </div>
                <span class="text-xs hidden sm:block text-center text-[var(--mehndi-muted)]">{{ label }}</span>
              </div>
              @if (i < stepLabels.length - 1) {
                <div class="h-0.5 flex-1 mx-2 transition-colors"
                     [class.bg-[var(--mehndi-gold)]]="i < wizard.currentStep()"
                     [class.bg-[rgba(225,29,72,0.12)]]="i >= wizard.currentStep()"></div>
              }
            }
          </div>
          <mat-progress-bar mode="determinate" [value]="progress()" color="primary" />
        </div>

        <div class="premium-card overflow-hidden">
          @switch (wizard.currentStep()) {
            @case (0) { <app-step1-artist /> }
            @case (1) { <app-step2-datetime /> }
            @case (2) { <app-step3-addons /> }
            @case (3) { <app-step4-details /> }
            @case (4) { <app-step5-review (submitted)="onSubmit()" [submitting]="submitting()" /> }
          }

          <!-- Navigation (steps 0-3) -->
          @if (wizard.currentStep() < 4) {
            <div class="flex items-center justify-between p-4 sm:p-6 border-t border-[var(--mehndi-border)]">
              <button mat-button (click)="wizard.prevStep()" [disabled]="wizard.currentStep() === 0">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
              <button mat-raised-button color="primary"
                      [disabled]="!wizard.stepValid()"
                      (click)="wizard.nextStep()">
                Continue <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class BookingWizardComponent implements OnInit {
  wizard = inject(BookingWizardService);
  private bookingService = inject(BookingService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  stepLabels = STEP_LABELS;
  submitting = signal(false);

  progress() {
    return ((this.wizard.currentStep() + 1) / this.wizard.totalSteps) * 100;
  }

  ngOnInit(): void {
    this.wizard.reset();
    const artistId = this.route.snapshot.queryParamMap.get('artist');
    if (artistId) this.wizard.patch({ artistId });
  }

  async onSubmit(): Promise<void> {
    this.submitting.set(true);
    try {
      const booking = await this.bookingService.create(this.wizard.data());
      this.wizard.reset();
      this.router.navigate(['/booking/success', booking.id]);
    } catch (err: unknown) {
      this.snackbar.error(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
