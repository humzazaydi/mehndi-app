import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ArtistService } from '../../../core/services/artist.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Package, ArtistPackage } from '../../../core/models';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';

interface DialogData {
  artistId: string;
  artistName: string;
  packages: Package[];
  existingPackageIds: string[];
  editArtistPackage?: ArtistPackage;
}

@Component({
  selector: 'app-assign-package-dialog',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, CurrencyPkPipe],
  template: `
    <h2 mat-dialog-title>
      {{ data.editArtistPackage ? 'Edit Package Price' : 'Assign Package to ' + data.artistName }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="space-y-4 mt-2">
        @if (!data.editArtistPackage) {
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Package *</mat-label>
            <mat-select formControlName="package_id">
              @for (pkg of availablePackages(); track pkg.id) {
                <mat-option [value]="pkg.id">{{ pkg.name }} — {{ pkg.base_price | pkr }}</mat-option>
              }
              @if (availablePackages().length === 0) {
                <mat-option disabled>All packages already assigned</mat-option>
              }
            </mat-select>
          </mat-form-field>
        } @else {
          <p class="text-sm text-gray-600 mb-2">
            Package: <strong>{{ data.editArtistPackage.packages?.name }}</strong>
            (Base: {{ data.editArtistPackage.packages?.base_price | pkr }})
          </p>
        }
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Custom Price (Rs.)</mat-label>
          <input matInput type="number" formControlName="custom_price" min="0">
          <mat-hint>Leave empty to use the package's base price</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(false)">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || saving()" (click)="save()">
        {{ saving() ? 'Saving...' : (data.editArtistPackage ? 'Save' : 'Assign') }}
      </button>
    </mat-dialog-actions>
  `,
})
export class AssignPackageDialogComponent {
  data = inject<DialogData>(MAT_DIALOG_DATA);
  ref = inject(MatDialogRef<AssignPackageDialogComponent>);
  private fb = inject(FormBuilder);
  private artistService = inject(ArtistService);
  private snackbar = inject(SnackbarService);

  saving = signal(false);
  availablePackages = signal(
    this.data.packages.filter(p => !this.data.existingPackageIds.includes(p.id) && p.is_active)
  );

  form = this.fb.group({
    package_id: [
      this.data.editArtistPackage ? this.data.editArtistPackage.package_id : '',
      this.data.editArtistPackage ? [] : [Validators.required],
    ],
    custom_price: [this.data.editArtistPackage?.custom_price ?? (null as number | null)],
  });

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving.set(true);
    try {
      const v = this.form.value;
      if (this.data.editArtistPackage) {
        await this.artistService.updateArtistPackage(this.data.editArtistPackage.id, {
          custom_price: v.custom_price ?? null,
        });
        this.snackbar.success('Price updated');
      } else {
        await this.artistService.assignPackage(this.data.artistId, v.package_id!, v.custom_price ?? null);
        this.snackbar.success('Package assigned');
      }
      this.ref.close(true);
    } catch (err: unknown) {
      this.snackbar.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      this.saving.set(false);
    }
  }
}
