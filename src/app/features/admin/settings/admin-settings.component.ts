import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettingsService } from '../../../core/services/settings.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Profile, UserRole } from '../../../core/models';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTabsModule, MatProgressSpinnerModule,
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

        <!-- User Roles -->
        <mat-tab label="User Roles">
          <div class="py-6 max-w-4xl">
            <p class="text-gray-500 text-sm mb-4">Manage permissions and delegate staff roles for Henna Studio accounts.</p>
            
            <div class="flex items-center gap-3 mb-6 bg-white rounded-lg p-4 shadow-sm">
              <mat-form-field appearance="outline" class="flex-1 !mb-0">
                <mat-label>Search Users</mat-label>
                <input matInput placeholder="Search by name..." (input)="onSearchUsers($event)">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="w-48 !mb-0">
                <mat-label>Filter by Role</mat-label>
                <mat-select [(value)]="roleFilter" (selectionChange)="filterProfiles()">
                  <mat-option value="">All Roles</mat-option>
                  <mat-option value="admin">Admin</mat-option>
                  <mat-option value="artist">Artist</mat-option>
                  <mat-option value="cones_manager">Cones Manager</mat-option>
                  <mat-option value="client">Client</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            @if (loadingProfiles()) {
              <div class="flex justify-center p-8"><mat-spinner diameter="32" /></div>
            } @else {
              <div class="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                <div class="overflow-x-auto">
                  <table class="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr class="bg-gray-50 text-gray-700 font-semibold border-b">
                        <th class="p-4">Name</th>
                        <th class="p-4">Phone</th>
                        <th class="p-4">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (p of filteredProfiles(); track p.id) {
                        <tr class="border-b hover:bg-gray-50">
                          <td class="p-4 font-medium">{{ p.full_name }}</td>
                          <td class="p-4 text-gray-500">{{ p.phone ?? '—' }}</td>
                          <td class="p-4">
                            <mat-form-field class="!w-48 !mb-0" appearance="outline">
                              <mat-select [value]="p.role" (selectionChange)="updateUserRole(p.id, $event.value)">
                                <mat-option value="admin">Admin</mat-option>
                                <mat-option value="artist">Artist</mat-option>
                                <mat-option value="cones_manager">Cones Manager</mat-option>
                                <mat-option value="client">Client</mat-option>
                              </mat-select>
                            </mat-form-field>
                          </td>
                        </tr>
                      }
                      @if (filteredProfiles().length === 0) {
                        <tr>
                          <td colspan="3" class="p-8 text-center text-gray-400">No profiles found</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
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
  private supabase = inject(SupabaseService);
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

  // Profiles management signals
  loadingProfiles = signal(false);
  allProfiles = signal<Profile[]>([]);
  filteredProfiles = signal<Profile[]>([]);
  roleFilter = '';
  searchQuery = '';

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.settings.loadAll(),
      this.loadProfiles(),
    ]);
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

  async loadProfiles(): Promise<void> {
    this.loadingProfiles.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('*')
        .order('full_name');
      if (!error && data) {
        this.allProfiles.set(data as Profile[]);
        this.filterProfiles();
      }
    } catch (err) {
      console.error('Failed to load profiles', err);
    } finally {
      this.loadingProfiles.set(false);
    }
  }

  filterProfiles(): void {
    let list = this.allProfiles();
    if (this.roleFilter) {
      list = list.filter(p => p.role === this.roleFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => p.full_name.toLowerCase().includes(q));
    }
    this.filteredProfiles.set(list);
  }

  onSearchUsers(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.filterProfiles();
  }

  async updateUserRole(profileId: string, newRole: UserRole): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);
      if (!error) {
        this.snackbar.success('User role updated');
        
        // Remove artist profile association if role was changed away from artist
        if (newRole !== 'artist') {
          await this.supabase.client
            .from('artists')
            .update({ profile_id: null })
            .eq('profile_id', profileId);
        }
        
        await this.loadProfiles();
      } else {
        throw error;
      }
    } catch (err: unknown) {
      this.snackbar.error(err instanceof Error ? err.message : 'Failed to update user role');
    }
  }
}
