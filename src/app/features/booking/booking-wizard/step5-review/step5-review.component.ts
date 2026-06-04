import { Component, inject, OnInit, signal, Output, EventEmitter, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BookingWizardService } from '../booking-wizard.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { ArtistService } from '../../../../core/services/artist.service';
import { PackageService } from '../../../../core/services/package.service';
import { CurrencyPkPipe } from '../../../../shared/pipes/currency-pk.pipe';
import { TermsDialogComponent } from './terms-dialog.component';

@Component({
  selector: 'app-step5-review',
  standalone: true,
  imports: [
    DatePipe, MatButtonModule, MatIconModule, MatDialogModule, MatCheckboxModule,
    MatDividerModule, MatProgressSpinnerModule, CurrencyPkPipe,
  ],
  template: `
    <div class="p-4 sm:p-6">
      <h2 class="text-2xl font-semibold mb-6">Review & Confirm</h2>

      <div class="bg-[rgba(225,29,72,0.06)] rounded-lg p-5 mb-6 space-y-3 border border-[var(--mehndi-border)]">
        <div class="flex justify-between text-sm">
          <span class="text-[var(--mehndi-muted)]">Artist</span>
          <span class="font-medium">{{ artistName() }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-[var(--mehndi-muted)]">Package</span>
          <span class="font-medium">{{ packageName() }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-[var(--mehndi-muted)]">Date</span>
          <span class="font-medium">{{ wizard.data().date | date:'fullDate' }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-[var(--mehndi-muted)]">Time</span>
          <span class="font-medium">{{ wizard.data().timeSlot }}</span>
        </div>
        @if (wizard.data().addonIds.length > 0) {
          <div class="flex justify-between text-sm">
            <span class="text-[var(--mehndi-muted)]">Add-ons</span>
            <span class="font-medium">{{ wizard.data().addonIds.length }} selected</span>
          </div>
        }
        <mat-divider />
        <div class="flex justify-between font-bold">
          <span>Total Amount</span>
          <span class="text-[var(--mehndi-gold)]">{{ wizard.data().totalAmount | pkr }}</span>
        </div>
        <div class="flex justify-between text-sm text-[var(--mehndi-muted)]">
          <span>Advance Required</span>
          <span class="font-semibold">{{ wizard.data().advanceAmount | pkr }}</span>
        </div>
      </div>

      @if (settings.banking()) {
        <div class="premium-card p-5 mb-6">
          <h3 class="font-semibold text-[var(--mehndi-deep)] mb-3 flex items-center gap-2">
            <mat-icon class="text-[var(--mehndi-link)]">account_balance</mat-icon>
            Payment Details
          </h3>
          <p class="text-[var(--mehndi-muted)] text-sm mb-4">
            Please transfer the advance amount of <strong>{{ wizard.data().advanceAmount | pkr }}</strong> to any of the following accounts:
          </p>
          <div class="space-y-3 text-sm">
            <div class="bg-[var(--mehndi-panel-soft)] rounded-lg p-3 border border-[var(--mehndi-border)]">
              <p class="font-semibold text-[var(--mehndi-deep)]">Meezan Bank</p>
              <p class="text-[var(--mehndi-muted)]">{{ settings.banking()!.meezan.accountTitle }}</p>
              <p class="text-[var(--mehndi-muted)] font-mono">{{ settings.banking()!.meezan.accountNumber }}</p>
            </div>
            <div class="bg-[var(--mehndi-panel-soft)] rounded-lg p-3 border border-[var(--mehndi-border)]">
              <p class="font-semibold text-[var(--mehndi-deep)]">HBL</p>
              <p class="text-[var(--mehndi-muted)]">{{ settings.banking()!.hbl.accountTitle }}</p>
              <p class="text-[var(--mehndi-muted)] font-mono">{{ settings.banking()!.hbl.accountNumber }}</p>
              <p class="text-[var(--mehndi-muted)] text-xs">IBAN: {{ settings.banking()!.hbl.iban }}</p>
            </div>
            <div class="bg-[var(--mehndi-panel-soft)] rounded-lg p-3 border border-[var(--mehndi-border)]">
              <p class="font-semibold text-[var(--mehndi-deep)]">EasyPaisa / JazzCash</p>
              <p class="text-[var(--mehndi-muted)] font-mono">{{ settings.banking()!.easypaisa }}</p>
            </div>
          </div>
        </div>
      }

      <div class="mb-6">
        <div class="flex items-start gap-3 p-4 bg-[rgba(225,29,72,0.06)] rounded-lg border border-[var(--mehndi-border)]">
          <mat-checkbox
            color="primary"
            [checked]="wizard.data().termsAccepted"
            (change)="onTermsChange($event.checked)"
          />
          <p class="text-sm text-[var(--mehndi-muted)]">
            I have read and agree to the
            <button class="text-[var(--mehndi-link)] underline font-medium" (click)="openTerms()">
              Terms & Conditions
            </button>
            and the Important Notice.
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between pt-4 border-t border-[var(--mehndi-border)]">
        <button mat-button (click)="wizard.prevStep()">
          <mat-icon>arrow_back</mat-icon> Back
        </button>
        <button mat-raised-button color="primary"
                [disabled]="!wizard.stepValid() || submitting"
                (click)="submitted.emit()">
          @if (submitting) { <mat-spinner diameter="20" class="inline-block mr-2" /> }
          Confirm Booking
        </button>
      </div>
    </div>
  `,
})
export class Step5ReviewComponent implements OnInit {
  @Output() submitted = new EventEmitter<void>();
  @Input() submitting = false;

  wizard = inject(BookingWizardService);
  settings = inject(SettingsService);
  private artistService = inject(ArtistService);
  private packageService = inject(PackageService);
  private dialog = inject(MatDialog);

  artistName = signal('');
  packageName = signal('');

  ngOnInit(): void {
    const d = this.wizard.data();
    const artist = this.artistService.artists().find(a => a.id === d.artistId);
    this.artistName.set(artist?.name ?? '');
    const pkg = artist?.artist_packages?.find(ap => ap.package_id === d.packageId)?.packages;
    this.packageName.set(pkg?.name ?? '');
  }

  onTermsChange(accepted: boolean): void {
    this.wizard.patch({ termsAccepted: accepted });
  }

  openTerms(): void {
    const notice = this.settings.getContentBlock('important_notice');
    const terms = this.settings.getContentBlock('terms_conditions');
    this.dialog.open(TermsDialogComponent, {
      width: '600px',
      maxHeight: '80vh',
      data: { notice, terms },
    });
  }
}
