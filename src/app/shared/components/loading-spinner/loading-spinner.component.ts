import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="flex items-center justify-center p-8">
      <mat-spinner [diameter]="diameter" />
      @if (message) {
        <p class="ml-4 text-sm opacity-60">{{ message }}</p>
      }
    </div>
  `,
})
export class LoadingSpinnerComponent {
  @Input() diameter = 40;
  @Input() message = '';
}
