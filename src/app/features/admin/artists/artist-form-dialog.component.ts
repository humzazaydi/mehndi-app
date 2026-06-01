import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ArtistService } from '../../../core/services/artist.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { Artist } from '../../../core/models';

@Component({
  selector: 'app-artist-form-dialog',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSlideToggleModule, MatProgressSpinnerModule, FileUploadComponent],
  template: `
    <h2 mat-dialog-title>{{ data.artist ? 'Edit Artist' : 'Add Artist' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="space-y-3 mt-2">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Name *</mat-label>
          <input matInput formControlName="name">
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Bio</mat-label>
          <textarea matInput formControlName="bio" rows="3"></textarea>
        </mat-form-field>

        <mat-slide-toggle formControlName="is_active" color="primary">Active</mat-slide-toggle>

        <div class="mt-4">
          <app-file-upload
            label="Upload Profile Photo"
            hint="JPG, PNG up to 5MB"
            accept="image/*"
            (fileSelected)="photoFile = $event"
          />
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(false)">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || loading()" (click)="save()">
        @if (loading()) { <mat-spinner diameter="16" class="inline-block mr-2" /> }
        Save
      </button>
    </mat-dialog-actions>
  `,
})
export class ArtistFormDialogComponent {
  data = inject<{ artist?: Artist }>(MAT_DIALOG_DATA);
  ref = inject(MatDialogRef<ArtistFormDialogComponent>);
  private fb = inject(FormBuilder);
  private artistService = inject(ArtistService);
  private snackbar = inject(SnackbarService);

  loading = signal(false);
  photoFile: File | undefined;

  form = this.fb.group({
    name: [this.data.artist?.name ?? '', Validators.required],
    bio: [this.data.artist?.bio ?? ''],
    is_active: [this.data.artist?.is_active ?? true],
  });

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    try {
      const values = this.form.value;
      let photo_url = this.data.artist?.photo_url ?? null;

      if (this.data.artist) {
        await this.artistService.update(this.data.artist.id, {
          name: values.name!,
          bio: values.bio ?? null,
          is_active: values.is_active ?? true,
        });
        if (this.photoFile) {
          photo_url = await this.artistService.uploadPhoto(this.data.artist.id, this.photoFile);
          await this.artistService.update(this.data.artist.id, { photo_url });
        }
      } else {
        const created = await this.artistService.create({
          name: values.name!,
          bio: values.bio ?? null,
          is_active: values.is_active ?? true,
          photo_url: null,
        });
        if (this.photoFile) {
          photo_url = await this.artistService.uploadPhoto(created.id, this.photoFile);
          await this.artistService.update(created.id, { photo_url });
        }
      }

      this.snackbar.success('Artist saved');
      this.ref.close(true);
    } catch (err: unknown) {
      this.snackbar.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      this.loading.set(false);
    }
  }
}
