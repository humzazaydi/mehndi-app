import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4"
         style="background: linear-gradient(135deg, #fff8f7 0%, #fce4ec 100%)">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span class="text-white font-bold text-3xl">M</span>
          </div>
          <h1 class="text-2xl font-bold" style="font-family:'Playfair Display',serif;color:var(--brand-primary)">
            Welcome Back
          </h1>
          <p class="text-gray-500 text-sm mt-1">Sign in to your Mehndi Studio account</p>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field class="w-full mb-2" appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="you@example.com">
              <mat-icon matPrefix class="mr-2">email</mat-icon>
              @if (form.controls.email.invalid && form.controls.email.touched) {
                <mat-error>Valid email required</mat-error>
              }
            </mat-form-field>

            <mat-form-field class="w-full mb-4" appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPass() ? 'text' : 'password'" formControlName="password">
              <mat-icon matPrefix class="mr-2">lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="showPass.update(v => !v)">
                <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.controls.password.invalid && form.controls.password.touched) {
                <mat-error>Password required</mat-error>
              }
            </mat-form-field>

            @if (errorMsg()) {
              <div class="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">{{ errorMsg() }}</div>
            }

            <button mat-raised-button color="primary" class="w-full !py-3 !text-base" type="submit" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20" class="inline-block mr-2" /> }
              Sign In
            </button>
          </form>

          <div class="text-center mt-6 text-sm text-gray-500">
            Don't have an account?
            <a routerLink="/auth/register" class="text-rose-600 font-medium ml-1">Sign up</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = signal(false);
  errorMsg = signal('');
  showPass = signal(false);

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');

    try {
      await this.auth.signIn(this.form.value.email!, this.form.value.password!);
      if (this.auth.isAdmin()) {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/client/dashboard']);
      }
    } catch (err: unknown) {
      this.errorMsg.set(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
