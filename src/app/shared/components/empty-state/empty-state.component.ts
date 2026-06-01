import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="flex flex-col items-center justify-center p-12 text-center opacity-60">
      <mat-icon class="text-6xl mb-4" style="font-size:64px;width:64px;height:64px;">{{ icon }}</mat-icon>
      <h3 class="text-lg font-semibold mb-2">{{ title }}</h3>
      @if (subtitle) {
        <p class="text-sm">{{ subtitle }}</p>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Nothing here yet';
  @Input() subtitle = '';
}
