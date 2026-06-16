import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div
      class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
      [class.border-primary-300]="!isDragging()"
      [class.border-primary-500]="isDragging()"
      [class.bg-primary-50]="isDragging()"
      (dragover)="onDragOver($event)"
      (dragleave)="isDragging.set(false)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
    >
      <mat-icon class="text-4xl mb-2 opacity-40" style="font-size:48px;width:48px;height:48px;">cloud_upload</mat-icon>
      <p class="font-medium">{{ label }}</p>
      <p class="text-sm opacity-60 mt-1">{{ hint }}</p>

      @if (selectedFile()) {
        <div class="mt-3 p-2 bg-green-50 rounded-lg flex items-center gap-2 text-green-700 text-sm">
          <mat-icon style="font-size:16px;width:16px;height:16px;">check_circle</mat-icon>
          {{ selectedFile()!.name }}
        </div>
      }

      @if (errorMessage()) {
        <div class="mt-3 p-2 bg-red-50 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <mat-icon style="font-size:16px;width:16px;height:16px;">error</mat-icon>
          {{ errorMessage() }}
        </div>
      }
    </div>
    <input #fileInput type="file" [accept]="accept" class="hidden" (change)="onFileSelected($event)">
  `,
})
export class FileUploadComponent {
  @Input() label = 'Click or drag to upload';
  @Input() hint = 'PNG, JPG, PDF up to 5 MB';
  @Input() accept = 'image/*,.pdf';
  @Input() maxSizeMb = 5;
  @Input() allowedMimeTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  @Output() fileSelected = new EventEmitter<File>();
  @Output() uploadError = new EventEmitter<string>();

  isDragging = signal(false);
  selectedFile = signal<File | null>(null);
  errorMessage = signal<string | null>(null);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.validateAndEmit(file);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.validateAndEmit(file);
  }

  private validateAndEmit(file: File): void {
    this.errorMessage.set(null);

    const maxBytes = this.maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      const msg = `File is too large. Maximum size is ${this.maxSizeMb} MB.`;
      this.errorMessage.set(msg);
      this.uploadError.emit(msg);
      return;
    }

    if (this.allowedMimeTypes.length > 0 && !this.allowedMimeTypes.includes(file.type)) {
      const msg = `Invalid file type "${file.type}". Allowed: ${this.allowedMimeTypes.join(', ')}.`;
      this.errorMessage.set(msg);
      this.uploadError.emit(msg);
      return;
    }

    this.selectedFile.set(file);
    this.fileSelected.emit(file);
  }
}
