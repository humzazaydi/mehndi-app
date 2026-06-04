import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ArtistService } from '../../../core/services/artist.service';
import { PackageService } from '../../../core/services/package.service';
import { SettingsService } from '../../../core/services/settings.service';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatDividerModule, CurrencyPkPipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container py-12 sm:py-16">
      <div class="text-center mb-12">
        <p class="text-xs uppercase tracking-[0.25em] text-[var(--mehndi-link)] font-semibold mb-2">Occasion-ready pricing</p>
        <h1 class="text-4xl sm:text-5xl font-bold mb-4">Packages & Pricing</h1>
        <p class="text-[var(--mehndi-muted)] max-w-2xl mx-auto">
          All packages include four-side hand henna with transparent pricing, refined add-ons, and no hidden charges.
        </p>
      </div>

      @if (artistService.loading()) {
        <app-loading-spinner />
      } @else {
        <!-- Packages per Artist -->
        @for (artist of artistsWithPackages(); track artist.id) {
          <div class="mb-14">
            <div class="flex items-center gap-4 mb-6">
              @if (artist.photo_url) {
                <img [src]="artist.photo_url" [alt]="artist.name"
                     class="w-12 h-12 rounded-full object-cover shrink-0">
              } @else {
                <div class="w-12 h-12 rounded-full bg-[var(--mehndi-blush)] flex items-center justify-center shrink-0">
                  <mat-icon style="color:var(--mehndi-deep)">brush</mat-icon>
                </div>
              }
              <div>
                <h2 class="text-2xl font-bold">{{ artist.name }}</h2>
                @if (artist.bio) {
                  <p class="text-[var(--mehndi-muted)] text-sm">{{ artist.bio }}</p>
                }
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              @for (ap of artist.artist_packages!; track ap.id; let i = $index) {
                @if (ap.is_available && ap.packages) {
                  <div class="premium-card relative p-6 text-center transition-all">
                    <div class="text-[var(--mehndi-gold)] font-bold text-2xl mb-2">
                      {{ (ap.custom_price ?? ap.packages.base_price) | pkr }}
                    </div>
                    <h3 class="font-semibold text-[var(--mehndi-deep)] mb-2">{{ ap.packages.name }}</h3>
                    <p class="text-[var(--mehndi-muted)] text-sm leading-relaxed">{{ ap.packages.description }}</p>
                  </div>
                }
              }
            </div>
          </div>
          @if (!$last) {
            <mat-divider class="mb-14" />
          }
        }

        @if (artistsWithPackages().length === 0) {
          <p class="text-center text-[var(--mehndi-muted)] py-12">No packages available yet. Check back soon!</p>
        }

        <!-- Add-ons -->
        @if (packageService.addons().length > 0) {
          <div class="mb-16">
            <h2 class="text-3xl font-bold text-center mb-8">Bespoke Elements (Add-ons)</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              @for (addon of packageService.addons(); track addon.id) {
                <div class="premium-card p-5 text-center">
                  <div class="text-[var(--mehndi-gold)] font-bold text-lg">{{ addon.price | pkr }}</div>
                  <h3 class="font-semibold mt-1 text-[var(--mehndi-deep)]">{{ addon.name }}</h3>
                  @if (addon.description) {
                    <p class="text-[var(--mehndi-muted)] text-xs mt-1">{{ addon.description }}</p>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Package Notes -->
        @if (disclaimer()) {
          <div class="premium-card p-6 mb-12 max-w-3xl mx-auto">
            <div class="flex items-start gap-3">
              <mat-icon class="text-[var(--mehndi-link)] mt-0.5 shrink-0">info_outline</mat-icon>
              <div>
                <h3 class="font-semibold text-[var(--mehndi-deep)] mb-2">{{ disclaimer()!.title }}</h3>
                <p class="text-[var(--mehndi-muted)] text-sm whitespace-pre-line">{{ disclaimer()!.content }}</p>
              </div>
            </div>
          </div>
        }

        <!-- CTA -->
        <div class="text-center">
          <a mat-raised-button color="primary" routerLink="/booking" class="!px-10 !py-4 !text-base !rounded-full">
            Book Your Session Now
          </a>
        </div>
      }
    </div>
  `,
})
export class PackagesComponent implements OnInit {
  artistService = inject(ArtistService);
  packageService = inject(PackageService);
  private settings = inject(SettingsService);

  disclaimer = () => this.settings.getContentBlock('package_disclaimer');

  artistsWithPackages = () =>
    this.artistService.artists().filter(
      a => a.is_active && a.artist_packages && a.artist_packages.some(ap => ap.is_available && ap.packages)
    );

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.artistService.loadArtists(),
      this.packageService.loadAddons(),
    ]);
  }
}
