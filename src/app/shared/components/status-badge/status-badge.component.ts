import { Component, Input } from '@angular/core';
import { BookingStatusPipe } from '../../pipes/booking-status.pipe';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [BookingStatusPipe],
  template: `<span class="status-badge {{ status }}">{{ status | bookingStatus }}</span>`,
})
export class StatusBadgeComponent {
  @Input() status = '';
}
