import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ContentBlock } from '../../../../core/models';

@Component({
  selector: 'app-terms-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Terms & Conditions</h2>
    <mat-dialog-content class="max-h-96 overflow-y-auto">
      @if (data.notice) {
        <h3 class="font-semibold text-rose-700 mb-2">{{ data.notice.title }}</h3>
        <p class="text-sm text-gray-700 mb-6 whitespace-pre-line">{{ data.notice.content }}</p>
      }
      @if (data.terms) {
        <h3 class="font-semibold text-gray-900 mb-2">{{ data.terms.title }}</h3>
        <p class="text-sm text-gray-700 whitespace-pre-line">{{ data.terms.content }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" (click)="ref.close(true)">I Understand</button>
    </mat-dialog-actions>
  `,
})
export class TermsDialogComponent {
  data = inject<{ notice: ContentBlock | undefined; terms: ContentBlock | undefined }>(MAT_DIALOG_DATA);
  ref = inject(MatDialogRef<TermsDialogComponent>);
}
