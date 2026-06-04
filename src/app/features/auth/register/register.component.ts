import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="min-h-screen luxury-shell flex items-center justify-center p-4 relative overflow-hidden">
      <div class="absolute inset-0 mehndi-motif opacity-20"></div>
      <div class="w-full max-w-md">
        <div class="text-center mb-8 relative">
          <div class="w-16 h-16 brand-gradient rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg ornate-border">
            <span class="text-white font-bold text-3xl" style="font-family:'Playfair Display',serif">M</span>
          </div>
          <p class="text-xs uppercase tracking-[0.25em] text-[var(--mehndi-link)] font-semibold mb-2">Begin your booking</p>
          <h1 class="text-3xl font-bold">
            Create Account
          </h1>
          <p class="text-[var(--mehndi-muted)] text-sm mt-1">Join Mehak's Studio to reserve and manage your session.</p>
        </div>

        <div class="premium-card p-6 sm:p-8">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="grid grid-cols-1 gap-2">
              <mat-form-field appearance="outline">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="fullName" placeholder="Your full name">
                <mat-icon matPrefix class="mr-2">person</mat-icon>
                @if (form.controls.fullName.invalid && form.controls.fullName.touched) {
                  <mat-error>Full name required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Phone Number</mat-label>
                <input matInput formControlName="phone" placeholder="03XX-XXXXXXX">
                <mat-icon matPrefix class="mr-2">phone</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" placeholder="you@example.com">
                <mat-icon matPrefix class="mr-2">email</mat-icon>
                @if (form.controls.email.invalid && form.controls.email.touched) {
                  <mat-error>Valid email required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput [type]="showPass() ? 'text' : 'password'" formControlName="password">
                <mat-icon matPrefix class="mr-2">lock</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="showPass.update(v => !v)">
                  <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (form.controls.password.invalid && form.controls.password.touched) {
                  <mat-error>Password must be at least 6 characters</mat-error>
                }
              </mat-form-field>
            </div>

            @if (errorMsg()) {
              <div class="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">{{ errorMsg() }}</div>
            }
            @if (successMsg()) {
              <div class="bg-green-50 text-green-700 rounded-lg p-3 text-sm mb-4">{{ successMsg() }}</div>
            }

            <button mat-raised-button color="primary" class="w-full !py-3 !text-base mt-2" type="submit" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20" class="inline-block mr-2" /> }
              Create Account
            </button>
          </form>

          <div class="text-center mt-6 text-sm text-[var(--mehndi-muted)]">
            Already have an account?
            <a routerLink="/auth/login" class="text-[var(--mehndi-link)] font-medium ml-1">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    fullName: ['', Validators.required],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');
  showPass = signal(false);

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');

    try {
      await this.auth.signUp(
        this.form.value.email!,
        this.form.value.password!,
        this.form.value.fullName!,
        this.form.value.phone ?? '',
      );
      this.router.navigate(['/client/dashboard']);
    } catch (err: unknown) {
      this.errorMsg.set(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
