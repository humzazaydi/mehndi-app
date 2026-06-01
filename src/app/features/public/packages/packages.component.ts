import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { PackageService } from '../../../core/services/package.service';
import { SettingsService } from '../../../core/services/settings.service';
import { CurrencyPkPipe } from '../../../shared/pipes/currency-pk.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatDividerModule, CurrencyPkPipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container py-12">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold mb-4" style="font-family:'Playfair Display',serif">Packages & Pricing</h1>
        <p class="text-gray-500 max-w-2xl mx-auto">
          All packages include four-side hand henna. Prices are fixed and transparent with no hidden charges.
        </p>
      </div>

      @if (packageService.loading()) {
        <app-loading-spinner />
      } @else {
        <!-- Packages Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-16">
          @for (pkg of packageService.packages(); track pkg.id; let i = $index) {
            <div class="relative rounded-2xl p-6 border-2 text-center transition-all hover:shadow-lg"
                 [class.border-rose-500]="i === 2"
                 [class.bg-rose-50]="i === 2"
                 [class.border-gray-200]="i !== 2"
                 [class.bg-white]="i !== 2">
              @if (i === 2) {
                <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-xs px-3 py-1 rounded-full font-medium">Popular</span>
              }
              <div class="text-rose-600 font-bold text-2xl mb-2">{{ pkg.base_price | pkr }}</div>
              <h3 class="font-semibold text-gray-900 mb-2">{{ pkg.name }}</h3>
              <p class="text-gray-500 text-sm leading-relaxed">{{ pkg.description }}</p>
            </div>
          }
        </div>

        <!-- Add-ons -->
        @if (packageService.addons().length > 0) {
          <div class="mb-16">
            <h2 class="text-2xl font-bold text-center mb-8" style="font-family:'Playfair Display',serif">
              Bespoke Elements (Add-ons)
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              @for (addon of packageService.addons(); track addon.id) {
                <div class="bg-white rounded-xl p-5 border border-gray-200 text-center">
                  <div class="text-rose-600 font-bold text-lg">{{ addon.price | pkr }}</div>
                  <h3 class="font-semibold mt-1">{{ addon.name }}</h3>
                  @if (addon.description) {
                    <p class="text-gray-500 text-xs mt-1">{{ addon.description }}</p>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Package Notes -->
        @if (disclaimer()) {
          <div class="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-12 max-w-3xl mx-auto">
            <div class="flex items-start gap-3">
              <mat-icon class="text-amber-600 mt-0.5 shrink-0">info_outline</mat-icon>
              <div>
                <h3 class="font-semibold text-amber-900 mb-2">{{ disclaimer()!.title }}</h3>
                <p class="text-amber-800 text-sm whitespace-pre-line">{{ disclaimer()!.content }}</p>
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
  packageService = inject(PackageService);
  private settings = inject(SettingsService);

  disclaimer = () => this.settings.getContentBlock('package_disclaimer');

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.packageService.loadPackages(),
      this.packageService.loadAddons(),
    ]);
  }
}
