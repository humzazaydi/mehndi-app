import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'pkr', standalone: true })
export class CurrencyPkPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '—';
    return 'Rs. ' + value.toLocaleString('en-PK');
  }
}
