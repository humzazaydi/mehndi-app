import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PackageService } from '../../../core/services/package.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Package } from '../../../core/models';

@Component({
  selector: 'app-package-form-dialog',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>{{ data.pkg ? 'Edit Package' : 'Add Package' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="space-y-3 mt-2">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Name *</mat-label>
          <input matInput formControlName="name">
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Base Price (Rs.) *</mat-label>
          <input matInput type="number" formControlName="base_price">
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Sort Order</mat-label>
          <input matInput type="number" formControlName="sort_order">
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
        <mat-slide-toggle formControlName="is_active" color="primary">Active</mat-slide-toggle>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(false)">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
})
export class PackageFormDialogComponent {
  data = inject<{ pkg?: Package }>(MAT_DIALOG_DATA);
  ref = inject(MatDialogRef<PackageFormDialogComponent>);
  private fb = inject(FormBuilder);
  private packageService = inject(PackageService);
  private snackbar = inject(SnackbarService);

  form = this.fb.group({
    name: [this.data.pkg?.name ?? '', Validators.required],
    description: [this.data.pkg?.description ?? ''],
    base_price: [this.data.pkg?.base_price ?? 0, [Validators.required, Validators.min(0)]],
    sort_order: [this.data.pkg?.sort_order ?? 1],
    notes: [this.data.pkg?.notes ?? ''],
    is_active: [this.data.pkg?.is_active ?? true],
  });

  async save(): Promise<void> {
    if (this.form.invalid) return;
    try {
      const v = this.form.value;
      if (this.data.pkg) {
        await this.packageService.updatePackage(this.data.pkg.id, v as Partial<Package>);
      } else {
        await this.packageService.createPackage({
          name: v.name!, description: v.description ?? null,
          base_price: v.base_price!, sort_order: v.sort_order ?? 1,
          notes: v.notes ?? null, is_active: v.is_active ?? true,
        });
      }
      this.snackbar.success('Package saved');
      this.ref.close(true);
    } catch (err: unknown) {
      this.snackbar.error(err instanceof Error ? err.message : 'Failed');
    }
  }
}
