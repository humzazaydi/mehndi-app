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
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { TermsDialogComponent } from './terms-dialog.component';

@Component({
  selector: 'app-step5-review',
  standalone: true,
  imports: [
    DatePipe, MatButtonModule, MatIconModule, MatDialogModule, MatCheckboxModule,
    MatDividerModule, MatProgressSpinnerModule, CurrencyPkPipe, FileUploadComponent,
  ],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-6">Review & Confirm</h2>

      <!-- Summary -->
      <div class="bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Artist</span>
          <span class="font-medium">{{ artistName() }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Package</span>
          <span class="font-medium">{{ packageName() }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Date</span>
          <span class="font-medium">{{ wizard.data().date | date:'fullDate' }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Time</span>
          <span class="font-medium">{{ wizard.data().timeSlot }}</span>
        </div>
        @if (wizard.data().addonIds.length > 0) {
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Add-ons</span>
            <span class="font-medium">{{ wizard.data().addonIds.length }} selected</span>
          </div>
        }
        <mat-divider />
        <div class="flex justify-between font-bold">
          <span>Total Amount</span>
          <span class="text-rose-700">{{ wizard.data().totalAmount | pkr }}</span>
        </div>
        <div class="flex justify-between text-sm text-gray-600">
          <span>Advance Required</span>
          <span class="font-semibold">{{ wizard.data().advanceAmount | pkr }}</span>
        </div>
      </div>

      <!-- Banking Info -->
      @if (settings.banking()) {
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <h3 class="font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <mat-icon class="text-amber-600">account_balance</mat-icon>
            Payment Details
          </h3>
          <p class="text-amber-800 text-sm mb-4">
            Please transfer the advance amount of <strong>{{ wizard.data().advanceAmount | pkr }}</strong> to any of the following accounts:
          </p>
          <div class="space-y-3 text-sm">
            <div class="bg-white rounded-lg p-3">
              <p class="font-semibold text-gray-800">Meezan Bank</p>
              <p class="text-gray-600">{{ settings.banking()!.meezan.accountTitle }}</p>
              <p class="text-gray-500 font-mono">{{ settings.banking()!.meezan.accountNumber }}</p>
            </div>
            <div class="bg-white rounded-lg p-3">
              <p class="font-semibold text-gray-800">HBL</p>
              <p class="text-gray-600">{{ settings.banking()!.hbl.accountTitle }}</p>
              <p class="text-gray-500 font-mono">{{ settings.banking()!.hbl.accountNumber }}</p>
              <p class="text-gray-400 text-xs">IBAN: {{ settings.banking()!.hbl.iban }}</p>
            </div>
            <div class="bg-white rounded-lg p-3">
              <p class="font-semibold text-gray-800">EasyPaisa / JazzCash</p>
              <p class="text-gray-500 font-mono">{{ settings.banking()!.easypaisa }}</p>
            </div>
          </div>
        </div>
      }

      <!-- Terms -->
      <div class="mb-6">
        <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
          <mat-checkbox
            color="primary"
            [checked]="wizard.data().termsAccepted"
            (change)="onTermsChange($event.checked)"
          />
          <p class="text-sm text-gray-700">
            I have read and agree to the
            <button class="text-rose-600 underline font-medium" (click)="openTerms()">
              Terms & Conditions
            </button>
            and the Important Notice.
          </p>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex items-center justify-between pt-4 border-t border-gray-100">
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
