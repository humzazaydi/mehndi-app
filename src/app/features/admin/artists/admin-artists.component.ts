import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ArtistService } from '../../../core/services/artist.service';
import { Artist } from '../../../core/models';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ArtistFormDialogComponent } from './artist-form-dialog.component';

@Component({
  selector: 'app-admin-artists',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCardModule, MatSlideToggleModule, LoadingSpinnerComponent],
  template: `
    <div class="admin-page">
      <div class="flex items-center justify-between mb-6">
        <h1 class="page-title mb-0">Artists</h1>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon class="mr-2">add</mat-icon> Add Artist
        </button>
      </div>

      @if (artistService.loading()) {
        <app-loading-spinner />
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (artist of artistService.artists(); track artist.id) {
            <mat-card class="overflow-hidden">
              <div class="h-48 bg-gradient-to-br from-rose-100 to-rose-200 relative">
                @if (artist.photo_url) {
                  <img [src]="artist.photo_url" [alt]="artist.name" class="w-full h-full object-cover">
                } @else {
                  <div class="absolute inset-0 flex items-center justify-center">
                    <mat-icon style="font-size:64px;width:64px;height:64px;color:#b5263a;opacity:0.3">brush</mat-icon>
                  </div>
                }
              </div>
              <mat-card-content class="p-4">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold text-lg">{{ artist.name }}</h3>
                  <mat-slide-toggle
                    [checked]="artist.is_active"
                    color="primary"
                    (change)="toggleActive(artist, $event.checked)"
                  />
                </div>
                <p class="text-gray-500 text-sm line-clamp-2">{{ artist.bio ?? 'No bio yet' }}</p>
              </mat-card-content>
              <mat-card-actions class="px-4 pb-4">
                <button mat-stroked-button (click)="openForm(artist)" class="mr-2">
                  <mat-icon>edit</mat-icon> Edit
                </button>
                <button mat-stroked-button color="warn" (click)="delete(artist)">
                  <mat-icon>delete</mat-icon>
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
})
export class AdminArtistsComponent implements OnInit {
  artistService = inject(ArtistService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  async ngOnInit(): Promise<void> {
    await this.artistService.loadArtists(false);
  }

  openForm(artist?: Artist): void {
    this.dialog.open(ArtistFormDialogComponent, {
      width: '500px',
      data: { artist },
    }).afterClosed().subscribe(async saved => {
      if (saved) await this.artistService.loadArtists(false);
    });
  }

  async toggleActive(artist: Artist, isActive: boolean): Promise<void> {
    await this.artistService.update(artist.id, { is_active: isActive });
    this.snackbar.success(`Artist ${isActive ? 'activated' : 'deactivated'}`);
  }

  delete(artist: Artist): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Artist', message: `Delete "${artist.name}"? This cannot be undone.`, confirmColor: 'warn', confirmText: 'Delete' },
    }).afterClosed().subscribe(async confirmed => {
      if (!confirmed) return;
      await this.artistService.delete(artist.id);
      this.snackbar.success('Artist deleted');
    });
  }
}
