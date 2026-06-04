import { Component, computed, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ArtistService } from '../../../core/services/artist.service';
import { PackageService } from '../../../core/services/package.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AssignPackageDialogComponent } from '../packages/assign-package-dialog.component';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { Artist, ArtistPackage } from '../../../core/models';

@Component({
  selector: 'app-artist-packages-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, MatIconModule, MatTableModule,
    MatSlideToggleModule, MatTooltipModule, CurrencyPkPipe,
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon class="text-rose-600">style</mat-icon>
      Packages — {{ data.artist.name }}
    </h2>

    <mat-dialog-content>
      <div class="min-w-[520px] py-2">
        @if (artistPackages().length === 0) {
          <p class="text-gray-400 text-sm py-6 text-center">
            No packages assigned yet. Click "Assign Package" below to add one.
          </p>
        } @else {
          <div class="rounded-xl overflow-hidden border border-gray-100">
            <table mat-table [dataSource]="artistPackages()" class="w-full">

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Package</th>
                <td mat-cell *matCellDef="let ap" class="font-medium">{{ ap.packages?.name }}</td>
              </ng-container>

              <ng-container matColumnDef="base_price">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Base Price</th>
                <td mat-cell *matCellDef="let ap" class="text-gray-500 text-sm">
                  {{ ap.packages?.base_price | pkr }}
                </td>
              </ng-container>

              <ng-container matColumnDef="effective_price">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Artist Price</th>
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
                <td mat-cell *matCellDef="let ap" class="text-right">
                  <button mat-icon-button matTooltip="Edit price" (click)="editPrice(ap)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" matTooltip="Remove package" (click)="remove(ap)">
                    <mat-icon>link_off</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="cols"></tr>
              <tr mat-row *matRowDef="let row; columns: cols;"></tr>
            </table>
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="flex justify-between px-6 pb-4">
      <button mat-stroked-button color="primary" (click)="assign()">
        <mat-icon class="mr-1">add_link</mat-icon> Assign Package
      </button>
      <button mat-button (click)="ref.close()">Close</button>
    </mat-dialog-actions>
  `,
})
export class ArtistPackagesDialogComponent implements OnInit {
  data = inject<{ artist: Artist }>(MAT_DIALOG_DATA);
  ref = inject(MatDialogRef<ArtistPackagesDialogComponent>);
  private artistService = inject(ArtistService);
  private packageService = inject(PackageService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  cols = ['name', 'base_price', 'effective_price', 'is_available', 'actions'];

  artistPackages = computed<ArtistPackage[]>(() => {
    const artist = this.artistService.artists().find(a => a.id === this.data.artist.id);
    return artist?.artist_packages ?? [];
  });

  assignedPackageIds = computed(() => this.artistPackages().map(ap => ap.package_id));

  async ngOnInit(): Promise<void> {
    await this.packageService.loadPackages(false);
  }

  assign(): void {
    this.dialog.open(AssignPackageDialogComponent, {
      width: '480px',
      data: {
        artistId: this.data.artist.id,
        artistName: this.data.artist.name,
        packages: this.packageService.packages(),
        existingPackageIds: this.assignedPackageIds(),
      },
    });
  }

  editPrice(ap: ArtistPackage): void {
    this.dialog.open(AssignPackageDialogComponent, {
      width: '400px',
      data: {
        artistId: this.data.artist.id,
        artistName: this.data.artist.name,
        packages: [],
        existingPackageIds: [],
        editArtistPackage: ap,
      },
    });
  }

  async toggleAvailable(ap: ArtistPackage, available: boolean): Promise<void> {
    await this.artistService.updateArtistPackage(ap.id, { is_available: available });
  }

  remove(ap: ArtistPackage): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remove Package',
        message: `Remove "${ap.packages?.name}" from ${this.data.artist.name}?`,
        confirmColor: 'warn',
        confirmText: 'Remove',
      },
    }).afterClosed().subscribe(async confirmed => {
      if (!confirmed) return;
      await this.artistService.removeArtistPackage(ap.id);
      this.snackbar.success('Package removed');
    });
  }
}
