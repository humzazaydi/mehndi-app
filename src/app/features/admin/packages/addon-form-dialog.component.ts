import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { PackageService } from '../../../core/services/package.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Addon } from '../../../core/models';

@Component({
  selector: 'app-addon-form-dialog',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.addon ? 'Edit Add-on' : 'Add Add-on' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="space-y-3 mt-2">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Name *</mat-label>
          <input matInput formControlName="name">
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description">
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Price (Rs.) *</mat-label>
          <input matInput type="number" formControlName="price">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(false)">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
})
export class AddonFormDialogComponent {
  data = inject<{ addon?: Addon }>(MAT_DIALOG_DATA);
  ref = inject(MatDialogRef<AddonFormDialogComponent>);
  private fb = inject(FormBuilder);
  private packageService = inject(PackageService);
  private snackbar = inject(SnackbarService);

  form = this.fb.group({
    name: [this.data.addon?.name ?? '', Validators.required],
    description: [this.data.addon?.description ?? ''],
    price: [this.data.addon?.price ?? 0, [Validators.required, Validators.min(0)]],
    is_active: [true],
  });

  async save(): Promise<void> {
    if (this.form.invalid) return;
    try {
      const v = this.form.value;
      if (this.data.addon) {
        await this.packageService.updateAddon(this.data.addon.id, v as Partial<Addon>);
      } else {
        await this.packageService.createAddon({ name: v.name!, description: v.description ?? null, price: v.price!, is_active: true });
      }
      this.snackbar.success('Add-on saved');
      this.ref.close(true);
    } catch (err: unknown) {
      this.snackbar.error(err instanceof Error ? err.message : 'Failed');
    }
  }
}
