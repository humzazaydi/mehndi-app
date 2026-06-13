import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { ArtistService } from '../../../core/services/artist.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';

@Component({
  selector: 'app-artist-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSlideToggleModule, MatProgressSpinnerModule, FileUploadComponent,
  ],
  template: `
    <div class="page-container py-10 max-w-2xl">
      <div class="mb-8">
        <p class="text-xs uppercase tracking-[0.25em] text-[var(--mehndi-link)] font-semibold mb-2">Account Management</p>
        <h1 class="text-3xl font-bold">My Artist Profile</h1>
        <p class="text-[var(--mehndi-muted)] mt-1">Manage your public bio, profile image, and toggle your bookings availability.</p>
      </div>

      <div class="premium-card p-6 sm:p-8">
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
          
          <!-- Profile Photo display -->
          <div class="flex items-center gap-6 pb-4 border-b">
            <div class="w-24 h-24 rounded-full overflow-hidden bg-rose-50 border-2 border-[var(--mehndi-link)] flex items-center justify-center relative">
              @if (photoUrl()) {
                <img [src]="photoUrl()" alt="Profile photo" class="w-full h-full object-cover">
              } @else {
                <mat-icon style="font-size:48px;width:48px;height:48px;color:#b5263a;opacity:0.3">brush</mat-icon>
              }
            </div>
            <div>
              <p class="font-semibold text-lg text-gray-950">{{ auth.artist()?.name }}</p>
              <p class="text-sm text-gray-500">Public profile avatar</p>
            </div>
          </div>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Display Name *</mat-label>
            <input matInput formControlName="name">
            <mat-icon matPrefix class="mr-2">person</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Phone Number</mat-label>
            <input matInput formControlName="phone">
            <mat-icon matPrefix class="mr-2">phone</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Public Bio / Description</mat-label>
            <textarea matInput formControlName="bio" rows="4" placeholder="Describe your styles, specialization, years of experience..."></textarea>
            <mat-icon matPrefix class="mr-2">description</mat-icon>
          </mat-form-field>

          <div class="flex items-center justify-between p-4 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
            <div>
              <p class="font-semibold text-sm text-gray-900">Active for Bookings</p>
              <p class="text-xs text-[var(--mehndi-muted)] mt-0.5">Toggle off to temporarily hide yourself from the booking catalog.</p>
            </div>
            <mat-slide-toggle formControlName="is_active" color="primary"></mat-slide-toggle>
          </div>

          <div>
            <app-file-upload
              label="Update Profile Photo"
              hint="JPG, PNG up to 5MB"
              accept="image/*"
              (fileSelected)="photoFile = $event"
            />
          </div>

          <button mat-raised-button color="primary" type="submit" class="w-full !py-3 !text-base" [disabled]="form.invalid || saving()">
            @if (saving()) { <mat-spinner diameter="20" class="inline-block mr-2" /> }
            Save Profile Settings
          </button>
        </form>
      </div>
    </div>
  `,
})
export class ArtistProfileComponent implements OnInit {
  auth = inject(AuthService);
  private artistService = inject(ArtistService);
  private snackbar = inject(SnackbarService);
  private fb = inject(FormBuilder);

  saving = signal(false);
  photoFile: File | undefined;
  photoUrl = signal<string | null>(null);

  form = this.fb.group({
    name: ['', Validators.required],
    phone: [''],
    bio: [''],
    is_active: [true],
  });

  ngOnInit(): void {
    const p = this.auth.profile();
    const a = this.auth.artist();

    if (p && a) {
      this.form.patchValue({
        name: a.name || p.full_name || '',
        phone: p.phone || '',
        bio: a.bio || '',
        is_active: a.is_active,
      });
      this.photoUrl.set(a.photo_url);
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving.set(true);

    try {
      const v = this.form.value;
      const artistId = this.auth.artist()?.id;
      if (!artistId) throw new Error('Artist record not found');

      // 1. Update user profile
      await this.auth.updateProfile({
        full_name: v.name!,
        phone: v.phone ?? null,
      });

      // 2. Update artist record details
      await this.artistService.update(artistId, {
        name: v.name!,
        bio: v.bio ?? null,
        is_active: v.is_active ?? true,
      });

      // 3. Upload photo if selected
      if (this.photoFile) {
        const publicUrl = await this.artistService.uploadPhoto(artistId, this.photoFile);
        await this.artistService.update(artistId, { photo_url: publicUrl });
        this.photoUrl.set(publicUrl);
        this.photoFile = undefined;
      }

      this.snackbar.success('Artist profile updated successfully');
    } catch (err: unknown) {
      this.snackbar.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      this.saving.set(false);
    }
  }
}
