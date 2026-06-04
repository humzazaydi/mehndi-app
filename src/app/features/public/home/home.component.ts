import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ArtistService } from '../../../core/services/artist.service';
import { PackageService } from '../../../core/services/package.service';
import { SettingsService } from '../../../core/services/settings.service';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatCardModule, CurrencyPkPipe],
  template: `
    <section class="relative overflow-hidden min-h-[calc(100vh-64px)] flex items-center pb-10"
             style="background:linear-gradient(145deg,rgba(74,18,48,0.98),rgba(225,29,72,0.92) 42%,rgba(0,150,136,0.9) 82%,rgba(245,158,11,0.88))">
      <div class="absolute inset-0 mehndi-motif opacity-35"></div>
      <div class="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--mehndi-ivory)] to-transparent"></div>

      <div class="page-container relative z-10 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center text-white">
        <div class="py-12 sm:py-18">
          <p class="text-[var(--mehndi-gold-soft)] text-xs font-semibold uppercase tracking-[0.28em] mb-4">Vibrant bridal henna</p>
          <h1 class="text-[clamp(3rem,14vw,6.4rem)] font-extrabold leading-[0.92] mb-6 text-white">
            Mehak's Studio
          </h1>
          <p class="text-lg sm:text-xl text-[rgba(255,250,240,0.88)] leading-relaxed max-w-xl mb-8">
            Artist-led mehndi bookings with authentic South Asian detailing, vivid celebration color, natural henna, and a polished flow from consultation to event day.
          </p>
          <div class="flex flex-col sm:flex-row gap-3">
            <a mat-raised-button routerLink="/booking" class="!bg-[var(--mehndi-ivory)] !text-[var(--mehndi-deep)] !px-8 !py-4 !text-base">
              Reserve Bridal Slot
            </a>
            <a mat-stroked-button routerLink="/artists" class="!border-[var(--mehndi-gold-soft)] !text-white !px-8 !py-4 !text-base">
              Meet Artists
            </a>
          </div>
        </div>

        <div class="relative">
          <div class="mehndi-surface ornate-border p-3 sm:p-4 bg-[var(--mehndi-panel)]">
            <div class="aspect-[4/5] rounded-lg overflow-hidden brand-gradient relative">
              <img
                src="/images/bridal-henna-artistry.png"
                alt="Intricate bridal mehndi design with mandala and floral henna details"
                class="absolute inset-0 h-full w-full object-cover"
                loading="eager"
              >
              <div class="absolute inset-0 bg-gradient-to-t from-[rgba(8,24,18,0.88)] via-[rgba(8,24,18,0.28)] to-[rgba(8,24,18,0.06)]"></div>
              <div class="absolute inset-0 mehndi-motif opacity-10"></div>
              <div class="absolute inset-4 sm:inset-6 border border-[rgba(255,224,138,0.55)] rounded-lg"></div>
              <div class="absolute inset-0 flex flex-col justify-end p-8 text-white">
                <p class="text-xs uppercase tracking-[0.28em] text-[var(--mehndi-gold-soft)] mb-3">Bridal artistry</p>
                <h2 class="text-3xl sm:text-4xl font-bold text-white mb-3">Intricate, personal, luminous.</h2>
                <p class="text-sm opacity-85">Mandala centers, floral vines, paisley cuffs, and storytelling motifs crafted for your event.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-14 sm:py-18">
      <div class="page-container">
        <div class="mandala-divider mb-10"><span></span></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-center">
          @for (f of features; track f.icon) {
            <div class="premium-card p-6 sm:p-7">
              <div class="w-14 h-14 brand-gradient rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                <mat-icon class="text-white" style="font-size:28px;width:28px;height:28px;">{{ f.icon }}</mat-icon>
              </div>
              <h3 class="font-semibold text-xl mb-2">{{ f.title }}</h3>
              <p class="text-[var(--mehndi-muted)] text-sm leading-relaxed">{{ f.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    @if (artists().length > 0) {
      <section class="py-14">
        <div class="page-container">
          <div class="text-center mb-10">
            <p class="text-xs uppercase tracking-[0.25em] text-[var(--mehndi-link)] font-semibold mb-2">Handpicked talent</p>
            <h2 class="text-4xl font-bold mb-3">Our Master Artists</h2>
            <p class="text-[var(--mehndi-muted)]">Each artist brings a unique style, steady hand, and bridal-season expertise.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            @for (artist of artists().slice(0, 3); track artist.id) {
              <mat-card class="premium-card cursor-pointer group" [routerLink]="['/artists', artist.id]">
                <div class="h-60 bg-[var(--mehndi-blush)] relative overflow-hidden">
                  @if (artist.photo_url) {
                    <img [src]="artist.photo_url" [alt]="artist.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                  } @else {
                    <div class="absolute inset-0 mehndi-motif opacity-30"></div>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <mat-icon style="font-size:80px;width:80px;height:80px;color:var(--mehndi-deep);opacity:0.35">brush</mat-icon>
                    </div>
                  }
                </div>
                <mat-card-content class="p-5">
                  <h3 class="font-semibold text-xl">{{ artist.name }}</h3>
                  <p class="text-[var(--mehndi-muted)] text-sm mt-2 line-clamp-2">{{ artist.bio ?? 'Professional henna artist' }}</p>
                </mat-card-content>
              </mat-card>
            }
          </div>
          <div class="text-center mt-8">
            <a mat-stroked-button routerLink="/artists">View All Artists</a>
          </div>
        </div>
      </section>
    }

    <section class="py-14 bg-[rgba(225,29,72,0.06)]">
      <div class="page-container">
        <div class="text-center mb-10">
          <p class="text-xs uppercase tracking-[0.25em] text-[var(--mehndi-link)] font-semibold mb-2">Transparent packages</p>
          <h2 class="text-4xl font-bold mb-3">Mehak's Mehndi Pricing</h2>
          <p class="text-[var(--mehndi-muted)]">Clear options for intimate ceremonies, full bridal sessions, and festive events.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          @for (pkg of packages().slice(0, 5); track pkg.id; let i = $index) {
            <div class="premium-card p-5 text-center">
              <div class="text-[var(--mehndi-gold)] font-bold text-2xl mb-2">{{ pkg.base_price | pkr }}</div>
              <h3 class="font-semibold text-[var(--mehndi-deep)]">{{ pkg.name }}</h3>
              @if (pkg.description) {
                <p class="text-[var(--mehndi-muted)] text-xs mt-2 leading-relaxed">{{ pkg.description }}</p>
              }
            </div>
          }
        </div>
        <div class="text-center mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <a mat-stroked-button routerLink="/packages">Full Pricing Details</a>
          <a mat-raised-button color="primary" routerLink="/booking">Book Now</a>
        </div>
      </div>
    </section>

    @if (notice()) {
      <section class="py-8">
        <div class="page-container">
          <div class="premium-card p-5 flex items-start gap-3">
            <mat-icon class="text-[var(--mehndi-link)] mt-0.5">info</mat-icon>
            <div>
              <h4 class="font-semibold text-[var(--mehndi-deep)]">{{ notice()!.title }}</h4>
              <p class="text-[var(--mehndi-muted)] text-sm mt-1 whitespace-pre-line">{{ notice()!.content }}</p>
            </div>
          </div>
        </div>
      </section>
    }

    <section class="relative overflow-hidden py-16 text-white text-center brand-gradient">
      <div class="absolute inset-0 mehndi-motif opacity-25"></div>
      <div class="page-container relative">
        <h2 class="text-4xl font-bold mb-4 text-white">Ready for your mehndi celebration?</h2>
        <p class="text-[rgba(255,250,240,0.86)] mb-8 max-w-lg mx-auto">
          Reserve your slot early and let Mehak's Studio prepare a design plan around your celebration.
        </p>
        <a mat-raised-button routerLink="/booking" class="!bg-[var(--mehndi-ivory)] !text-[var(--mehndi-deep)] !px-10 !py-4 !text-lg">
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
    { icon: 'auto_awesome', title: 'Bridal Detailing', text: 'Mandala, floral, paisley, and personalized motifs for ceremony-ready hands.' },
    { icon: 'verified', title: 'Natural Quality', text: 'Premium henna cones, careful prep, and aftercare guidance for a deep stain.' },
    { icon: 'event_available', title: 'Calm Booking', text: 'Choose artist, package, time, add-ons, and payment in a clean mobile flow.' },
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
