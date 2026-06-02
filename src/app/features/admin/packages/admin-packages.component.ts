import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { PackageService } from '../../../core/services/package.service';
import { ArtistService } from '../../../core/services/artist.service';
import { Package, Addon, ArtistPackage } from '../../../core/models';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { PackageFormDialogComponent } from './package-form-dialog.component';
import { AddonFormDialogComponent } from './addon-form-dialog.component';
import { AssignPackageDialogComponent } from './assign-package-dialog.component';

@Component({
  selector: 'app-admin-packages',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatTableModule, MatTabsModule,
    MatSlideToggleModule, MatSelectModule, MatFormFieldModule, FormsModule,
    CurrencyPkPipe,
  ],
  template: `
    <div class="admin-page">
      <h1 class="page-title">Packages & Add-ons</h1>

      <mat-tab-group>

        <!-- ── Artist Packages Tab ─────────────────────────── -->
        <mat-tab label="Artist Packages">
          <div class="py-6">

            <!-- Artist selector -->
            <div class="flex items-center gap-4 mb-5">
              <mat-form-field appearance="outline" class="min-w-[200px]" subscriptSizing="dynamic">
                <mat-label>Select Artist</mat-label>
                <mat-select [(ngModel)]="selectedArtistId">
                  @for (a of artistService.artists(); track a.id) {
                    <mat-option [value]="a.id">{{ a.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              @if (selectedArtistId) {
                <button mat-raised-button color="primary" (click)="openAssignDialog()">
                  <mat-icon class="mr-1">add_link</mat-icon> Assign Package
                </button>
              }
            </div>

            <!-- Packages table for selected artist -->
            @if (selectedArtistId) {
              @if (artistPackages().length === 0) {
                <p class="text-gray-400 text-sm py-4">
                  No packages assigned yet. Click "Assign Package" to add one.
                </p>
              } @else {
                <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <table mat-table [dataSource]="artistPackages()">

                    <ng-container matColumnDef="name">
                      <th mat-header-cell *matHeaderCellDef class="!font-semibold">Package</th>
                      <td mat-cell *matCellDef="let ap" class="font-medium">{{ ap.packages?.name }}</td>
                    </ng-container>

                    <ng-container matColumnDef="base_price">
                      <th mat-header-cell *matHeaderCellDef class="!font-semibold">Base Price</th>
                      <td mat-cell *matCellDef="let ap" class="text-gray-500">
                        {{ ap.packages?.base_price | pkr }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="effective_price">
                      <th mat-header-cell *matHeaderCellDef class="!font-semibold">Price for Artist</th>
                      <td mat-cell *matCellDef="let ap" class="font-semibold text-rose-700">
                        {{ (ap.custom_price ?? ap.packages?.base_price) | pkr }}
                        @if (ap.custom_price !== null && ap.custom_price !== undefined) {
                          <span class="ml-1 text-xs text-amber-600 font-normal">(custom)</span>
                        }
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="is_available">
                      <th mat-header-cell *matHeaderCellDef class="!font-semibold">Available</th>
                      <td mat-cell *matCellDef="let ap">
                        <mat-slide-toggle
                          [checked]="ap.is_available"
                          color="primary"
                          (change)="toggleAvailable(ap, $event.checked)" />
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef="let ap">
                        <button mat-icon-button matTooltip="Edit price" (click)="openEditPriceDialog(ap)">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="warn" matTooltip="Remove" (click)="removeFromArtist(ap)">
                          <mat-icon>link_off</mat-icon>
                        </button>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="artistPkgCols"></tr>
                    <tr mat-row *matRowDef="let row; columns: artistPkgCols;"></tr>
                  </table>
                </div>
              }
            } @else {
              <p class="text-gray-400 text-sm py-4">Select an artist to manage their packages.</p>
            }
          </div>
        </mat-tab>

        <!-- ── Package Templates Tab ──────────────────────── -->
        <mat-tab label="Package Templates">
          <div class="py-6">
            <p class="text-sm text-gray-500 mb-4">
              These are the base package templates. Assign them to artists from the "Artist Packages" tab.
            </p>
            <div class="flex justify-end mb-4">
              <button mat-raised-button color="primary" (click)="openPackageForm()">
                <mat-icon class="mr-2">add</mat-icon> New Template
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
                  <th mat-header-cell *matHeaderCellDef class="!font-semibold">Base Price</th>
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
                <tr mat-header-row *matHeaderRowDef="templateCols"></tr>
                <tr mat-row *matRowDef="let row; columns: templateCols;"></tr>
              </table>
            </div>
          </div>
        </mat-tab>

        <!-- ── Add-ons Tab ────────────────────────────────── -->
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
  artistService = inject(ArtistService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  selectedArtistId: string | null = null;

  artistPackages = computed<ArtistPackage[]>(() => {
    if (!this.selectedArtistId) return [];
    const artist = this.artistService.artists().find(a => a.id === this.selectedArtistId);
    return artist?.artist_packages ?? [];
  });

  assignedPackageIds = computed(() => this.artistPackages().map(ap => ap.package_id));

  artistPkgCols = ['name', 'base_price', 'effective_price', 'is_available', 'actions'];
  templateCols = ['sort_order', 'name', 'description', 'base_price', 'is_active', 'actions'];
  addonCols = ['name', 'description', 'price', 'actions'];

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.artistService.loadArtists(false),
      this.packageService.loadPackages(false),
      this.packageService.loadAddons(false),
    ]);
    const artists = this.artistService.artists();
    if (artists.length > 0) this.selectedArtistId = artists[0].id;
  }

  openAssignDialog(): void {
    const artist = this.artistService.artists().find(a => a.id === this.selectedArtistId);
    if (!artist) return;
    this.dialog.open(AssignPackageDialogComponent, {
      width: '480px',
      data: {
        artistId: artist.id,
        artistName: artist.name,
        packages: this.packageService.packages(),
        existingPackageIds: this.assignedPackageIds(),
      },
    });
  }

  openEditPriceDialog(ap: ArtistPackage): void {
    const artist = this.artistService.artists().find(a => a.id === this.selectedArtistId);
    if (!artist) return;
    this.dialog.open(AssignPackageDialogComponent, {
      width: '400px',
      data: {
        artistId: artist.id,
        artistName: artist.name,
        packages: [],
        existingPackageIds: [],
        editArtistPackage: ap,
      },
    });
  }

  async toggleAvailable(ap: ArtistPackage, available: boolean): Promise<void> {
    await this.artistService.updateArtistPackage(ap.id, { is_available: available });
  }

  removeFromArtist(ap: ArtistPackage): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remove Package',
        message: `Remove "${ap.packages?.name}" from this artist?`,
        confirmColor: 'warn',
        confirmText: 'Remove',
      },
    }).afterClosed().subscribe(async confirmed => {
      if (!confirmed) return;
      await this.artistService.removeArtistPackage(ap.id);
      this.snackbar.success('Package removed from artist');
    });
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
    }).afterClosed().subscribe(async c => {
      if (c) { await this.packageService.deletePackage(pkg.id); this.snackbar.success('Package deleted'); }
    });
  }

  openAddonForm(addon?: Addon): void {
    this.dialog.open(AddonFormDialogComponent, { width: '400px', data: { addon } })
      .afterClosed().subscribe(saved => { if (saved) this.packageService.loadAddons(false); });
  }

  deleteAddon(addon: Addon): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Add-on', message: `Delete "${addon.name}"?`, confirmColor: 'warn' },
    }).afterClosed().subscribe(async c => {
      if (c) { await this.packageService.deleteAddon(addon.id); this.snackbar.success('Add-on deleted'); }
    });
  }
}
