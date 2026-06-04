import { Component, inject, OnInit, signal, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ArtistService } from '../../../core/services/artist.service';
import { Artist } from '../../../core/models';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-artist-detail',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatChipsModule, CurrencyPkPipe, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (artist()) {
      <div>
        <!-- Hero -->
        <div class="relative h-72 md:h-96 bg-gradient-to-br from-rose-200 to-rose-400 overflow-hidden">
          @if (artist()!.photo_url) {
            <img [src]="artist()!.photo_url" [alt]="artist()!.name"
                 class="w-full h-full object-cover opacity-80">
          }
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <div class="page-container pb-8 text-white">
              <h1 class="text-4xl font-bold" style="font-family:'Playfair Display',serif">{{ artist()!.name }}</h1>
              <p class="text-rose-200 mt-1">Professional Henna Artist</p>
            </div>
          </div>
        </div>

        <div class="page-container py-10">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <!-- Bio -->
            <div class="lg:col-span-2">
              <h2 class="text-xl font-semibold mb-4">About</h2>
              <p class="text-gray-600 leading-relaxed">
                {{ artist()!.bio ?? 'Experienced henna artist specializing in bridal and special occasion designs.' }}
              </p>

              <!-- Packages -->
              @if (artist()!.artist_packages && artist()!.artist_packages!.length > 0) {
                <h2 class="text-xl font-semibold mt-10 mb-4">Available Packages</h2>
                <div class="space-y-3">
                  @for (ap of artist()!.artist_packages!; track ap.id) {
                    @if (ap.is_available && ap.packages) {
                      <div class="border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-rose-300 hover:bg-rose-50 transition-colors">
                        <div>
                          <h3 class="font-semibold">{{ ap.packages.name }}</h3>
                          <p class="text-gray-500 text-sm mt-0.5">{{ ap.packages.description }}</p>
                        </div>
                        <div class="text-right">
                          <p class="text-rose-700 font-bold text-lg">
                            {{ (ap.custom_price ?? ap.packages.base_price) | pkr }}
                          </p>
                        </div>
                      </div>
                    }
                  }
                </div>
              }
            </div>

            <!-- Booking CTA -->
            <div>
              <div class="bg-rose-50 rounded-lg p-6 sticky top-24">
                <h3 class="font-semibold text-lg mb-4">Ready to Book?</h3>
                <p class="text-gray-600 text-sm mb-6">
                  Book a session with {{ artist()!.name }} and create memories that last a lifetime.
                </p>
                <a mat-raised-button color="primary" routerLink="/booking"
                   [queryParams]="{ artist: artist()!.id }" class="w-full !py-3">
                  <mat-icon class="mr-2">event</mat-icon>
                  Book This Artist
                </a>
                <div class="mt-4 text-center text-xs text-gray-400">
                  Advance payment required to confirm booking
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ArtistDetailComponent implements OnInit {
  @Input() id!: string;

  private artistService = inject(ArtistService);

  loading = signal(true);
  artist = signal<Artist | null>(null);

  async ngOnInit(): Promise<void> {
    const data = await this.artistService.getById(this.id);
    this.artist.set(data);
    this.loading.set(false);
  }
}
