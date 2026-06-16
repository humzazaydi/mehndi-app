import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { GoogleMapsModule } from '@angular/google-maps';
import { BookingWizardService } from '../booking-wizard.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-step4-details',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, GoogleMapsModule],
  template: `
    <div class="p-4 sm:p-6">
      <h2 class="text-2xl font-semibold mb-6">Your Details</h2>

      <form [formGroup]="form" (ngChange)="onFormChange()">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <mat-form-field appearance="outline">
            <mat-label>Full Name *</mat-label>
            <input matInput formControlName="fullName" (blur)="onFormChange()">
            <mat-icon matPrefix class="mr-2">person</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Phone Number *</mat-label>
            <input matInput formControlName="phone" placeholder="03XXXXXXXXX" (blur)="onFormChange()">
            <mat-icon matPrefix class="mr-2">phone</mat-icon>
            @if (form.get('phone')?.hasError('pattern') && form.get('phone')?.touched) {
              <mat-error>Enter a valid Pakistani mobile number (e.g. 03001234567)</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Alternative Phone</mat-label>
            <input matInput formControlName="altPhone" placeholder="03XXXXXXXXX" (blur)="onFormChange()">
            <mat-icon matPrefix class="mr-2">phone</mat-icon>
            @if (form.get('altPhone')?.hasError('pattern') && form.get('altPhone')?.touched) {
              <mat-error>Enter a valid Pakistani mobile number (e.g. 03001234567)</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email *</mat-label>
            <input matInput type="email" formControlName="email" (blur)="onFormChange()">
            <mat-icon matPrefix class="mr-2">email</mat-icon>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="w-full mb-4">
          <mat-label>Service Address *</mat-label>
          <textarea matInput formControlName="address" rows="2" (blur)="onFormChange()"></textarea>
          <mat-icon matPrefix class="mr-2">home</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full mb-6">
          <mat-label>Notes (optional)</mat-label>
          <textarea matInput formControlName="notes" rows="3" placeholder="Any special requirements or design preferences..." (blur)="onFormChange()"></textarea>
          <mat-icon matPrefix class="mr-2">notes</mat-icon>
        </mat-form-field>

        <!-- Google Maps -->
        @if (mapsApiKey) {
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-[var(--mehndi-muted)] uppercase tracking-[0.16em] mb-3">
              <mat-icon class="align-middle mr-1" style="font-size:16px">pin_drop</mat-icon>
              Pin Your Location (Optional)
            </h3>
            <google-map
              height="280px"
              width="100%"
              [center]="mapCenter"
              [zoom]="12"
              (mapClick)="onMapClick($event)"
              class="rounded-lg overflow-hidden border border-[var(--mehndi-border)]"
            >
              @if (marker()) {
                <map-marker [position]="marker()!" />
              }
            </google-map>
            @if (marker()) {
              <p class="text-xs text-[var(--mehndi-muted)] mt-2">
                <mat-icon style="font-size:14px">check_circle</mat-icon>
                Location pinned
              </p>
            }
          </div>
        }
      </form>
    </div>
  `,
})
export class Step4DetailsComponent implements OnInit {
  wizard = inject(BookingWizardService);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  mapsApiKey = environment.googleMapsApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY';
  mapCenter = { lat: 24.8607, lng: 67.0011 }; // Karachi
  marker: () => google.maps.LatLngLiteral | null = () => null;

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.pattern(/^0[0-9]{9,10}$/)]],
    altPhone: ['', Validators.pattern(/^0[0-9]{9,10}$/)],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    address: ['', [Validators.required, Validators.maxLength(500)]],
    notes: ['', Validators.maxLength(1000)],
  });

  private _marker: google.maps.LatLngLiteral | null = null;

  ngOnInit(): void {
    const d = this.wizard.data();
    const profile = this.auth.profile();
    this.form.patchValue({
      fullName: d.fullName || profile?.full_name || '',
      phone: d.phone || profile?.phone || '',
      altPhone: d.altPhone || '',
      email: d.email || this.auth.currentUser()?.email || '',
      address: d.address || '',
      notes: d.notes || '',
    });
    // Wrap marker as a signal-like getter
    this.marker = () => this._marker;
    if (d.locationLat && d.locationLng) {
      this._marker = { lat: d.locationLat, lng: d.locationLng };
    }
  }

  onFormChange(): void {
    const v = this.form.value;
    this.wizard.patch({
      fullName: v.fullName ?? '',
      phone: v.phone ?? '',
      altPhone: v.altPhone ?? '',
      email: v.email ?? '',
      address: v.address ?? '',
      notes: v.notes ?? '',
    });
  }

  onMapClick(event: google.maps.MapMouseEvent): void {
    const lat = event.latLng?.lat() ?? null;
    const lng = event.latLng?.lng() ?? null;
    this._marker = lat && lng ? { lat, lng } : null;
    this.wizard.patch({ locationLat: lat, locationLng: lng });
  }
}
