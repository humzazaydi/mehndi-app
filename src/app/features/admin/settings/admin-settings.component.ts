import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettingsService } from '../../../core/services/settings.service';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatTabsModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="admin-page">
      <h1 class="page-title">Settings</h1>

      <mat-tab-group>
        <!-- Banking -->
        <mat-tab label="Banking Information">
          <div class="py-6 max-w-2xl">
            <p class="text-gray-500 text-sm mb-6">These details appear in the booking review step for client payment reference.</p>
            <form [formGroup]="bankingForm" (ngSubmit)="saveBanking()" class="space-y-6">
              <div class="bg-white rounded-lg p-6 shadow-sm space-y-4">
                <h3 class="section-title">Meezan Bank</h3>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Account Title</mat-label>
                  <input matInput formControlName="meezanTitle">
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Account Number</mat-label>
                  <input matInput formControlName="meezanAccount">
                </mat-form-field>
              </div>

              <div class="bg-white rounded-lg p-6 shadow-sm space-y-4">
                <h3 class="section-title">HBL</h3>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Account Title</mat-label>
                  <input matInput formControlName="hblTitle">
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Account Number</mat-label>
                  <input matInput formControlName="hblAccount">
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>IBAN</mat-label>
                  <input matInput formControlName="hblIban">
                </mat-form-field>
              </div>

              <div class="bg-white rounded-lg p-6 shadow-sm space-y-4">
                <h3 class="section-title">Mobile Money</h3>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>EasyPaisa / JazzCash Number</mat-label>
                  <input matInput formControlName="easypaisa">
                </mat-form-field>
              </div>

              <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
                @if (saving()) { <mat-spinner diameter="16" class="inline-block mr-2" /> }
                <mat-icon class="mr-2">save</mat-icon> Save Banking Info
              </button>
            </form>
          </div>
        </mat-tab>

        <!-- Business Settings -->
        <mat-tab label="Business Rules">
          <div class="py-6 max-w-xl">
            <form [formGroup]="businessForm" (ngSubmit)="saveBusiness()" class="bg-white rounded-lg p-6 shadow-sm space-y-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Advance Payment % (e.g. 50)</mat-label>
                <input matInput type="number" formControlName="advancePercentage">
              </mat-form-field>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Home Service Charge (Rs.)</mat-label>
                <input matInput type="number" formControlName="homeServiceCharge">
              </mat-form-field>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Karachi Delivery Charge (Rs.)</mat-label>
                <input matInput type="number" formControlName="karachiDeliveryCharge">
              </mat-form-field>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Other Cities Delivery Charge (Rs.)</mat-label>
                <input matInput type="number" formControlName="otherCitiesDeliveryCharge">
              </mat-form-field>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Minimum Regular Cones per Order</mat-label>
                <input matInput type="number" formControlName="minRegularCones">
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
                <mat-icon class="mr-2">save</mat-icon> Save Settings
              </button>
            </form>
          </div>
        </mat-tab>

        <!-- Content Blocks -->
        <mat-tab label="Content & Notices">
          <div class="py-6 space-y-6 max-w-3xl">
            @for (block of ['important_notice', 'terms_conditions', 'package_disclaimer']; track block) {
              <div class="bg-white rounded-lg p-6 shadow-sm">
                <h3 class="section-title capitalize">{{ block.replace('_', ' ') }}</h3>
                @if (contentForms()[block]) {
                  <form [formGroup]="contentForms()[block]" (ngSubmit)="saveContent(block)">
                    <mat-form-field appearance="outline" class="w-full mb-3">
                      <mat-label>Title</mat-label>
                      <input matInput formControlName="title">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="w-full mb-3">
                      <mat-label>Content</mat-label>
                      <textarea matInput formControlName="content" rows="6"></textarea>
                    </mat-form-field>
                    <button mat-stroked-button type="submit">
                      <mat-icon class="mr-2">save</mat-icon> Save
                    </button>
                  </form>
                }
              </div>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
})
export class AdminSettingsComponent implements OnInit {
  private settings = inject(SettingsService);
  private snackbar = inject(SnackbarService);
  private fb = inject(FormBuilder);

  saving = signal(false);

  bankingForm = this.fb.group({
    meezanTitle: [''], meezanAccount: [''],
    hblTitle: [''], hblAccount: [''], hblIban: [''],
    easypaisa: [''],
  });

  businessForm = this.fb.group({
    advancePercentage: [50], homeServiceCharge: [2500],
    karachiDeliveryCharge: [300], otherCitiesDeliveryCharge: [600], minRegularCones: [4],
  });

  contentForms = signal<Record<string, ReturnType<FormBuilder['group']>>>({});

  async ngOnInit(): Promise<void> {
    await this.settings.loadAll();
    this.populateForms();
  }

  private populateForms(): void {
    const banking = this.settings.banking();
    if (banking) {
      this.bankingForm.patchValue({
        meezanTitle: banking.meezan.accountTitle,
        meezanAccount: banking.meezan.accountNumber,
        hblTitle: banking.hbl.accountTitle,
        hblAccount: banking.hbl.accountNumber,
        hblIban: banking.hbl.iban,
        easypaisa: banking.easypaisa,
      });
    }

    const biz = this.settings.business();
    this.businessForm.patchValue(biz);

    const forms: Record<string, ReturnType<FormBuilder['group']>> = {};
    ['important_notice', 'terms_conditions', 'package_disclaimer'].forEach(slug => {
      const block = this.settings.getContentBlock(slug);
      forms[slug] = this.fb.group({ title: [block?.title ?? ''], content: [block?.content ?? ''] });
    });
    this.contentForms.set(forms);
  }

  async saveBanking(): Promise<void> {
    this.saving.set(true);
    const v = this.bankingForm.value;
    await this.settings.updateSetting('banking', {
      meezan: { accountTitle: v.meezanTitle, accountNumber: v.meezanAccount },
      hbl: { accountTitle: v.hblTitle, accountNumber: v.hblAccount, iban: v.hblIban },
      easypaisa: v.easypaisa, jazzcash: v.easypaisa,
    });
    this.snackbar.success('Banking info saved');
    this.saving.set(false);
  }

  async saveBusiness(): Promise<void> {
    this.saving.set(true);
    await this.settings.updateSetting('business', this.businessForm.value);
    this.snackbar.success('Business settings saved');
    this.saving.set(false);
  }

  async saveContent(slug: string): Promise<void> {
    const form = this.contentForms()[slug];
    if (!form) return;
    await this.settings.updateContentBlock(slug, { title: form.value.title, content: form.value.content });
    this.snackbar.success('Content saved');
  }
}
