import { Pipe, PipeTransform } from '@angular/core';
import { BookingStatus } from '../../core/models';

const LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

@Pipe({ name: 'bookingStatus', standalone: true })
export class BookingStatusPipe implements PipeTransform {
  transform(value: BookingStatus | string): string {
    return LABELS[value as BookingStatus] ?? value;
  }
}
