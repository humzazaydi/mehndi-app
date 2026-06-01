import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ArtistService } from '../../../core/services/artist.service';
import { PackageService } from '../../../core/services/package.service';
import { SettingsService } from '../../../core/services/settings.service';
import { Artist, Package } from '../../../core/models';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatCardModule, CurrencyPkPipe],
  template: `
    <!-- Hero -->
    <section class="relative overflow-hidden"
             style="background: linear-gradient(135deg, #4a0010 0%, #b5263a 50%, #e8536b 100%); min-height: 80vh; display: flex; align-items: center;">
      <div class="absolute inset-0 opacity-10"
           style="background-image: url('assets/henna-pattern.svg'); background-size: 400px;"></div>
      <div class="page-container relative z-10 text-white py-20">
        <div class="max-w-2xl">
          <p class="text-rose-200 text-sm font-medium uppercase tracking-widest mb-4">Professional Bridal Henna</p>
          <h1 class="text-5xl md:text-6xl font-bold mb-6 leading-tight"
              style="font-family:'Playfair Display',serif">
            Art That Tells<br>Your Story
          </h1>
          <p class="text-rose-100 text-lg mb-10 leading-relaxed max-w-xl">
            Exquisite henna designs crafted for your most precious moments. Book your bridal session with our master artists.
          </p>
          <div class="flex flex-wrap gap-4">
            <a mat-raised-button routerLink="/booking"
               class="!bg-white !text-rose-700 !font-semibold !px-8 !py-3 !text-base !rounded-full">
              Book Now
            </a>
            <a mat-stroked-button routerLink="/artists"
               class="!border-white !text-white !px-8 !py-3 !text-base !rounded-full">
              Meet Artists
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-16 bg-rose-50">
      <div class="page-container">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          @for (f of features; track f.icon) {
            <div class="p-6">
              <div class="w-14 h-14 brand-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <mat-icon class="text-white" style="font-size:28px;width:28px;height:28px;">{{ f.icon }}</mat-icon>
              </div>
              <h3 class="font-semibold text-gray-900 mb-2">{{ f.title }}</h3>
              <p class="text-gray-600 text-sm">{{ f.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Featured Artists -->
    @if (artists().length > 0) {
      <section class="py-16">
        <div class="page-container">
          <div class="text-center mb-10">
            <h2 class="text-3xl font-bold mb-3" style="font-family:'Playfair Display',serif">Our Master Artists</h2>
            <p class="text-gray-500">Each artist brings a unique style and years of expertise</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            @for (artist of artists().slice(0, 3); track artist.id) {
              <mat-card class="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        [routerLink]="['/artists', artist.id]">
                <div class="h-56 bg-gradient-to-br from-rose-100 to-rose-200 relative overflow-hidden">
                  @if (artist.photo_url) {
                    <img [src]="artist.photo_url" [alt]="artist.name" class="w-full h-full object-cover">
                  } @else {
                    <div class="absolute inset-0 flex items-center justify-center">
                      <mat-icon style="font-size:80px;width:80px;height:80px;color:#b5263a;opacity:0.3">brush</mat-icon>
                    </div>
                  }
                </div>
                <mat-card-content class="p-4">
                  <h3 class="font-semibold text-lg">{{ artist.name }}</h3>
                  <p class="text-gray-500 text-sm mt-1 line-clamp-2">{{ artist.bio ?? 'Professional henna artist' }}</p>
                </mat-card-content>
              </mat-card>
            }
          </div>
          <div class="text-center mt-8">
            <a mat-stroked-button color="primary" routerLink="/artists">View All Artists</a>
          </div>
        </div>
      </section>
    }

    <!-- Packages Preview -->
    <section class="py-16 bg-gray-50">
      <div class="page-container">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-bold mb-3" style="font-family:'Playfair Display',serif">Packages & Pricing</h2>
          <p class="text-gray-500">Transparent pricing for every occasion</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          @for (pkg of packages().slice(0, 5); track pkg.id) {
            <div class="bg-white rounded-xl p-5 border border-gray-100 hover:border-rose-300 hover:shadow-md transition-all text-center">
              <div class="text-rose-600 font-bold text-xl mb-1">{{ pkg.base_price | pkr }}</div>
              <h3 class="font-semibold text-gray-900 text-sm">{{ pkg.name }}</h3>
              @if (pkg.description) {
                <p class="text-gray-500 text-xs mt-2 leading-relaxed">{{ pkg.description }}</p>
              }
            </div>
          }
        </div>
        <div class="text-center mt-8 space-x-4">
          <a mat-stroked-button color="primary" routerLink="/packages">Full Pricing Details</a>
          <a mat-raised-button color="primary" routerLink="/booking">Book Now</a>
        </div>
      </div>
    </section>

    <!-- Notice -->
    @if (notice()) {
      <section class="py-8 bg-amber-50 border-y border-amber-200">
        <div class="page-container">
          <div class="flex items-start gap-3">
            <mat-icon class="text-amber-600 mt-0.5">info</mat-icon>
            <div>
              <h4 class="font-semibold text-amber-900">{{ notice()!.title }}</h4>
              <p class="text-amber-800 text-sm mt-1 whitespace-pre-line">{{ notice()!.content }}</p>
            </div>
          </div>
        </div>
      </section>
    }

    <!-- CTA -->
    <section class="py-20 brand-gradient text-white text-center">
      <div class="page-container">
        <h2 class="text-3xl font-bold mb-4" style="font-family:'Playfair Display',serif">Ready to Book?</h2>
        <p class="text-rose-100 mb-8 max-w-lg mx-auto">
          Reserve your slot today. Limited appointments available each month.
        </p>
        <a mat-raised-button routerLink="/booking"
           class="!bg-white !text-rose-700 !font-semibold !px-10 !py-4 !text-lg !rounded-full">
          Schedule My Appointment
        </a>
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  private artistService = inject(ArtistService);
  private packageService = inject(PackageService);
  private settings = inject(SettingsService);

  artists = this.artistService.artists;
  packages = this.packageService.packages;
  notice = signal<{ title: string; content: string } | null>(null);

  features = [
    { icon: 'star', title: 'Expert Artists', text: 'Trained professionals with years of bridal henna experience' },
    { icon: 'verified', title: 'Premium Quality', text: 'High-grade natural cones and exquisite designs' },
    { icon: 'schedule', title: 'Easy Booking', text: 'Book online in minutes, pay securely in advance' },
  ];

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.artistService.loadArtists(),
      this.packageService.loadPackages(),
    ]);
    const block = this.settings.getContentBlock('important_notice');
    if (block?.is_active && block.content) {
      this.notice.set({ title: block.title, content: block.content });
    }
  }
}
