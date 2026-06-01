import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PackageService } from '../../../core/services/package.service';
import { Package, Addon } from '../../../core/models';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { PackageFormDialogComponent } from './package-form-dialog.component';
import { AddonFormDialogComponent } from './addon-form-dialog.component';

@Component({
  selector: 'app-admin-packages',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTableModule, MatTabsModule, MatSlideToggleModule, LoadingSpinnerComponent, CurrencyPkPipe],
  template: `
    <div class="admin-page">
      <h1 class="page-title">Packages & Add-ons</h1>

      <mat-tab-group>
        <!-- Packages Tab -->
        <mat-tab label="Packages">
          <div class="py-6">
            <div class="flex justify-end mb-4">
              <button mat-raised-button color="primary" (click)="openPackageForm()">
                <mat-icon class="mr-2">add</mat-icon> Add Package
              </button>
            </div>
            <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table mat-table [dataSource]="packageService.packages()">
                <ng-container matColumnDef="sort_order">
                  <th mat-header-cell *matHeaderCellDef class="!font-semibold">#</th>
                  <td mat-cell *matCellDef="let p">{{ p.sort_order }}</td>
                </ng-container>
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef class="!font-semibold">Name</th>
                  <td mat-cell *matCellDef="let p" class="font-medium">{{ p.name }}</td>
                </ng-container>
                <ng-container matColumnDef="description">
                  <th mat-header-cell *matHeaderCellDef class="!font-semibold">Description</th>
                  <td mat-cell *matCellDef="let p" class="text-sm text-gray-500">{{ p.description }}</td>
                </ng-container>
                <ng-container matColumnDef="base_price">
                  <th mat-header-cell *matHeaderCellDef class="!font-semibold">Price</th>
                  <td mat-cell *matCellDef="let p" class="font-semibold text-rose-700">{{ p.base_price | pkr }}</td>
                </ng-container>
                <ng-container matColumnDef="is_active">
                  <th mat-header-cell *matHeaderCellDef class="!font-semibold">Active</th>
                  <td mat-cell *matCellDef="let p">
                    <mat-slide-toggle [checked]="p.is_active" color="primary"
                      (change)="togglePackage(p, $event.checked)" />
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let p">
                    <button mat-icon-button (click)="openPackageForm(p)"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button color="warn" (click)="deletePackage(p)"><mat-icon>delete</mat-icon></button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="pkgCols"></tr>
                <tr mat-row *matRowDef="let row; columns: pkgCols;"></tr>
              </table>
            </div>
          </div>
        </mat-tab>

        <!-- Add-ons Tab -->
        <mat-tab label="Add-ons / Bespoke Elements">
          <div class="py-6">
            <div class="flex justify-end mb-4">
              <button mat-raised-button color="primary" (click)="openAddonForm()">
                <mat-icon class="mr-2">add</mat-icon> Add Add-on
              </button>
            </div>
            <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table mat-table [dataSource]="packageService.addons()">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef class="!font-semibold">Name</th>
                  <td mat-cell *matCellDef="let a" class="font-medium">{{ a.name }}</td>
                </ng-container>
                <ng-container matColumnDef="description">
                  <th mat-header-cell *matHeaderCellDef class="!font-semibold">Description</th>
                  <td mat-cell *matCellDef="let a" class="text-sm text-gray-500">{{ a.description }}</td>
                </ng-container>
                <ng-container matColumnDef="price">
                  <th mat-header-cell *matHeaderCellDef class="!font-semibold">Price</th>
                  <td mat-cell *matCellDef="let a" class="font-semibold text-rose-700">{{ a.price | pkr }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let a">
                    <button mat-icon-button (click)="openAddonForm(a)"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button color="warn" (click)="deleteAddon(a)"><mat-icon>delete</mat-icon></button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="addonCols"></tr>
                <tr mat-row *matRowDef="let row; columns: addonCols;"></tr>
              </table>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
})
export class AdminPackagesComponent implements OnInit {
  packageService = inject(PackageService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  pkgCols = ['sort_order', 'name', 'description', 'base_price', 'is_active', 'actions'];
  addonCols = ['name', 'description', 'price', 'actions'];

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.packageService.loadPackages(false),
      this.packageService.loadAddons(false),
    ]);
  }

  openPackageForm(pkg?: Package): void {
    this.dialog.open(PackageFormDialogComponent, { width: '480px', data: { pkg } })
      .afterClosed().subscribe(saved => { if (saved) this.packageService.loadPackages(false); });
  }

  async togglePackage(pkg: Package, active: boolean): Promise<void> {
    await this.packageService.updatePackage(pkg.id, { is_active: active });
  }

  deletePackage(pkg: Package): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Package', message: `Delete "${pkg.name}"?`, confirmColor: 'warn' },
    }).afterClosed().subscribe(async c => { if (c) { await this.packageService.deletePackage(pkg.id); this.snackbar.success('Package deleted'); } });
  }

  openAddonForm(addon?: Addon): void {
    this.dialog.open(AddonFormDialogComponent, { width: '400px', data: { addon } })
      .afterClosed().subscribe(saved => { if (saved) this.packageService.loadAddons(false); });
  }

  deleteAddon(addon: Addon): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Add-on', message: `Delete "${addon.name}"?`, confirmColor: 'warn' },
    }).afterClosed().subscribe(async c => { if (c) { await this.packageService.deleteAddon(addon.id); this.snackbar.success('Add-on deleted'); } });
  }
}
