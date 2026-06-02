import { Component, inject, OnInit, computed } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { PackageService } from '../../../../core/services/package.service';
import { ArtistService } from '../../../../core/services/artist.service';
import { BookingWizardService } from '../booking-wizard.service';
import { CurrencyPkPipe } from '../../../../shared/pipes/currency-pk.pipe';

@Component({
  selector: 'app-step3-addons',
  standalone: true,
  imports: [MatCheckboxModule, MatIconModule, MatDividerModule, CurrencyPkPipe],
  template: `
    <div class="p-4 sm:p-6">
      <h2 class="text-2xl font-semibold mb-2">Add Bespoke Elements</h2>
      <p class="text-[var(--mehndi-muted)] text-sm mb-6">Customize your design with special add-ons (optional)</p>

      @if (packageService.addons().length === 0) {
        <p class="text-[var(--mehndi-muted)] text-center py-8">No add-ons available currently.</p>
      } @else {
        <div class="space-y-3 mb-8">
          @for (addon of packageService.addons(); track addon.id) {
            <div class="border-2 rounded-2xl p-4 transition-all cursor-pointer bg-[var(--mehndi-panel-soft)]"
                 [class.border-[var(--mehndi-gold)]]="isSelected(addon.id)"
                 [class.bg-[rgba(201,154,46,0.12)]]="isSelected(addon.id)"
                 [class.border-[var(--mehndi-border)]]="!isSelected(addon.id)"
                 (click)="toggleAddon(addon.id)">
              <div class="flex items-center gap-4">
                <mat-checkbox
                  [checked]="isSelected(addon.id)"
                  color="primary"
                  (click)="$event.stopPropagation()"
                  (change)="toggleAddon(addon.id)"
                />
                <div class="flex-1">
                  <p class="font-medium">{{ addon.name }}</p>
                  @if (addon.description) {
                    <p class="text-[var(--mehndi-muted)] text-sm mt-0.5">{{ addon.description }}</p>
                  }
                </div>
                <p class="text-[var(--mehndi-gold)] font-semibold">+ {{ addon.price | pkr }}</p>
              </div>
            </div>
          }
        </div>
      }

      <!-- Price Summary -->
      <mat-divider />
      <div class="pt-6 space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-[var(--mehndi-muted)]">Package Price</span>
          <span class="font-medium">{{ packageAmount() | pkr }}</span>
        </div>
        @if (addonsTotal() > 0) {
          <div class="flex justify-between text-sm">
            <span class="text-[var(--mehndi-muted)]">Add-ons</span>
            <span class="font-medium">+ {{ addonsTotal() | pkr }}</span>
          </div>
        }
        <div class="flex justify-between font-bold text-lg pt-2 border-t border-[var(--mehndi-border)]">
          <span>Total</span>
          <span class="text-[var(--mehndi-gold)]">{{ totalAmount() | pkr }}</span>
        </div>
        <div class="flex justify-between text-sm text-[var(--mehndi-muted)]">
          <span>Advance Required (50%)</span>
          <span>{{ advanceAmount() | pkr }}</span>
        </div>
      </div>
    </div>
  `,
})
export class Step3AddonsComponent implements OnInit {
  wizard = inject(BookingWizardService);
  packageService = inject(PackageService);
  private artistService = inject(ArtistService);

  packageAmount = computed(() => {
    const { artistId, packageId } = this.wizard.data();
    const artist = this.artistService.artists().find(a => a.id === artistId);
    const ap = artist?.artist_packages?.find(p => p.package_id === packageId);
    return ap?.custom_price ?? ap?.packages?.base_price ?? 0;
  });

  addonsTotal = computed(() => {
    const selectedIds = this.wizard.data().addonIds;
    return this.packageService.addons()
      .filter(a => selectedIds.includes(a.id))
      .reduce((sum, a) => sum + a.price, 0);
  });

  totalAmount = computed(() => this.packageAmount() + this.addonsTotal());
  advanceAmount = computed(() => Math.ceil(this.totalAmount() * 0.5));

  async ngOnInit(): Promise<void> {
    await this.packageService.loadAddons();
  }

  isSelected(id: string): boolean {
    return this.wizard.data().addonIds.includes(id);
  }

  toggleAddon(id: string): void {
    const current = this.wizard.data().addonIds;
    const newIds = current.includes(id)
      ? current.filter(i => i !== id)
      : [...current, id];
    this.wizard.patch({
      addonIds: newIds,
      totalAmount: this.totalAmount(),
      advanceAmount: this.advanceAmount(),
    });
  }
}
