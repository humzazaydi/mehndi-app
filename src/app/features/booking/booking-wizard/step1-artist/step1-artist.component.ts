import { Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { ArtistService } from '../../../../core/services/artist.service';
import { PackageService } from '../../../../core/services/package.service';
import { BookingWizardService } from '../booking-wizard.service';
import { Artist, Package } from '../../../../core/models';
import { CurrencyPkPipe } from '../../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-step1-artist',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatRadioModule, CurrencyPkPipe, LoadingSpinnerComponent],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-6">Select Artist & Package</h2>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <!-- Artist Selection -->
        <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Choose Artist</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          @for (artist of artists(); track artist.id) {
            <div class="border-2 rounded-xl p-4 cursor-pointer transition-all flex items-center gap-4"
                 [class.border-rose-500]="wizard.data().artistId === artist.id"
                 [class.bg-rose-50]="wizard.data().artistId === artist.id"
                 [class.border-gray-200]="wizard.data().artistId !== artist.id"
                 (click)="selectArtist(artist)">
              <div class="w-14 h-14 rounded-full overflow-hidden bg-rose-100 shrink-0">
                @if (artist.photo_url) {
                  <img [src]="artist.photo_url" [alt]="artist.name" class="w-full h-full object-cover">
                } @else {
                  <div class="w-full h-full flex items-center justify-center">
                    <mat-icon style="color:#b5263a">brush</mat-icon>
                  </div>
                }
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold">{{ artist.name }}</p>
                <p class="text-sm text-gray-500 truncate">{{ artist.bio ?? 'Professional henna artist' }}</p>
              </div>
              @if (wizard.data().artistId === artist.id) {
                <mat-icon class="text-rose-500 shrink-0">check_circle</mat-icon>
              }
            </div>
          }
        </div>

        <!-- Package Selection -->
        @if (wizard.data().artistId && availablePackages().length > 0) {
          <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Choose Package</h3>
          <div class="space-y-3">
            @for (pkg of availablePackages(); track pkg.id) {
              <div class="border-2 rounded-xl p-4 cursor-pointer transition-all"
                   [class.border-rose-500]="wizard.data().packageId === pkg.id"
                   [class.bg-rose-50]="wizard.data().packageId === pkg.id"
                   [class.border-gray-200]="wizard.data().packageId !== pkg.id"
                   (click)="selectPackage(pkg)">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold">{{ pkg.name }}</p>
                    <p class="text-sm text-gray-500 mt-0.5">{{ pkg.description }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-rose-700 font-bold text-lg">{{ pkg.base_price | pkr }}</p>
                    @if (wizard.data().packageId === pkg.id) {
                      <mat-icon class="text-rose-500">check_circle</mat-icon>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        } @else if (wizard.data().artistId) {
          <p class="text-gray-400 text-sm text-center py-4">No packages available for this artist yet.</p>
        }
      }
    </div>
  `,
})
export class Step1ArtistComponent implements OnInit {
  wizard = inject(BookingWizardService);
  private artistService = inject(ArtistService);
  private packageService = inject(PackageService);

  artists = this.artistService.artists;
  loading = signal(false);
  availablePackages = signal<Package[]>([]);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    await this.artistService.loadArtists();
    if (this.wizard.data().artistId) {
      this.updateAvailablePackages(this.wizard.data().artistId!);
    }
    this.loading.set(false);
  }

  selectArtist(artist: Artist): void {
    this.wizard.patch({ artistId: artist.id, packageId: null });
    this.updateAvailablePackages(artist.id);
  }

  selectPackage(pkg: Package): void {
    this.wizard.patch({
      packageId: pkg.id,
      totalAmount: pkg.base_price + this.wizard.data().addonIds.length * 0, // recalculated in step 3
    });
  }

  private updateAvailablePackages(artistId: string): void {
    const artist = this.artists().find(a => a.id === artistId);
    if (!artist?.artist_packages) { this.availablePackages.set([]); return; }
    const pkgs = artist.artist_packages
      .filter(ap => ap.is_available && ap.packages)
      .map(ap => ({
        ...ap.packages!,
        base_price: ap.custom_price ?? ap.packages!.base_price,
      }));
    this.availablePackages.set(pkgs);
  }
}
