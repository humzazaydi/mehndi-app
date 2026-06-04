import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ArtistService } from '../../../core/services/artist.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
@Component({
  selector: 'app-artists',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container py-12 sm:py-16">
      <div class="text-center mb-12">
        <p class="text-xs uppercase tracking-[0.25em] text-[var(--mehndi-link)] font-semibold mb-2">Studio artists</p>
        <h1 class="text-4xl sm:text-5xl font-bold mb-4">Our Artists</h1>
        <p class="text-[var(--mehndi-muted)] max-w-xl mx-auto">
          Meet talented henna artists with distinct bridal styles, careful technique, and a love for traditional detail.
        </p>
      </div>

      @if (service.loading()) {
        <app-loading-spinner message="Loading artists..." />
      } @else if (service.artists().length === 0) {
        <app-empty-state icon="brush" title="No artists yet" subtitle="Check back soon!" />
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (artist of service.artists(); track artist.id) {
            <mat-card class="premium-card group">
              <div class="h-64 bg-[var(--mehndi-blush)] relative overflow-hidden">
                @if (artist.photo_url) {
                  <img [src]="artist.photo_url" [alt]="artist.name"
                       class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                } @else {
                  <div class="absolute inset-0 mehndi-motif opacity-30"></div>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <mat-icon style="font-size:96px;width:96px;height:96px;color:var(--mehndi-deep);opacity:0.3">brush</mat-icon>
                  </div>
                }
              </div>
              <mat-card-content class="p-5">
                <h2 class="text-xl font-semibold mb-2">{{ artist.name }}</h2>
                <p class="text-[var(--mehndi-muted)] text-sm leading-relaxed mb-4 line-clamp-3">
                  {{ artist.bio ?? 'Professional henna artist specializing in bridal designs.' }}
                </p>

                @if (artist.artist_packages && artist.artist_packages.length > 0) {
                  <div class="flex items-center gap-2 text-sm text-[var(--mehndi-link)] mb-4">
                    <mat-icon style="font-size:16px;width:16px;height:16px">inventory_2</mat-icon>
                    <span>{{ artist.artist_packages.length }} package(s) available</span>
                  </div>
                }
              </mat-card-content>
              <mat-card-actions class="px-4 pb-4 pt-0">
                <a mat-raised-button color="primary" [routerLink]="['/artists', artist.id]" class="w-full">
                  View Profile & Book
                </a>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
})
export class ArtistsComponent implements OnInit {
  service = inject(ArtistService);

  async ngOnInit(): Promise<void> {
    await this.service.loadArtists();
  }
}
