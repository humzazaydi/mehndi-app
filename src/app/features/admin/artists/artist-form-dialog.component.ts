import { Component, inject, signal, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ArtistService } from '../../../core/services/artist.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { Artist, Profile } from '../../../core/models';

@Component({
  selector: 'app-artist-form-dialog',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
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
          <mat-label>Associate User Profile</mat-label>
          <mat-select formControlName="profile_id">
            <mat-option [value]="null">None</mat-option>
            @for (p of profiles(); track p.id) {
              <mat-option [value]="p.id">{{ p.full_name }} ({{ p.role }})</mat-option>
            }
          </mat-select>
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
export class ArtistFormDialogComponent implements OnInit {
  data = inject<{ artist?: Artist }>(MAT_DIALOG_DATA);
  ref = inject(MatDialogRef<ArtistFormDialogComponent>);
  private fb = inject(FormBuilder);
  private artistService = inject(ArtistService);
  private supabase = inject(SupabaseService);
  private snackbar = inject(SnackbarService);

  loading = signal(false);
  photoFile: File | undefined;
  profiles = signal<Profile[]>([]);

  form = this.fb.group({
    name: [this.data.artist?.name ?? '', Validators.required],
    bio: [this.data.artist?.bio ?? ''],
    is_active: [this.data.artist?.is_active ?? true],
    profile_id: [this.data.artist?.profile_id ?? null as string | null],
  });

  async ngOnInit(): Promise<void> {
    try {
      const { data: profileData } = await this.supabase.client.from('profiles').select('*').order('full_name');
      const { data: artistData } = await this.supabase.client.from('artists').select('id, profile_id');
      
      if (profileData && artistData) {
        const linkedProfileIds = new Set(
          artistData
            .map((a: any) => a.profile_id)
            .filter((pid: string | null) => pid && pid !== this.data.artist?.profile_id)
        );
        this.profiles.set(
          (profileData as Profile[]).filter(p => !linkedProfileIds.has(p.id))
        );
      }
    } catch (err) {
      console.error('Failed to load profiles', err);
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    try {
      const values = this.form.value;
      let photo_url = this.data.artist?.photo_url ?? null;
      const oldProfileId = this.data.artist?.profile_id;
      const newProfileId = values.profile_id;

      let artistId = '';

      if (this.data.artist) {
        artistId = this.data.artist.id;
        await this.artistService.update(artistId, {
          name: values.name!,
          bio: values.bio ?? null,
          is_active: values.is_active ?? true,
          profile_id: newProfileId,
        });
        if (this.photoFile) {
          photo_url = await this.artistService.uploadPhoto(artistId, this.photoFile);
          await this.artistService.update(artistId, { photo_url });
        }
      } else {
        const created = await this.artistService.create({
          name: values.name!,
          bio: values.bio ?? null,
          is_active: values.is_active ?? true,
          photo_url: null,
          profile_id: newProfileId,
        });
        artistId = created.id;
        if (this.photoFile) {
          photo_url = await this.artistService.uploadPhoto(artistId, this.photoFile);
          await this.artistService.update(artistId, { photo_url });
        }
      }

      // Sync role updates
      if (oldProfileId !== newProfileId) {
        if (oldProfileId) {
          await this.supabase.client
            .from('profiles')
            .update({ role: 'client' })
            .eq('id', oldProfileId);
        }
        if (newProfileId) {
          await this.supabase.client
            .from('profiles')
            .update({ role: 'artist' })
            .eq('id', newProfileId);
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
