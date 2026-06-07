import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyRate } from '../../models/currency-rate.model';

@Component({
  selector: 'app-currency-table',
  imports: [CommonModule],
  templateUrl: './currency-table.component.html',
  styleUrl: './currency-table.component.scss'
})
export class CurrencyTableComponent {
  @Input() rates: CurrencyRate[] = [];
  @Input() loading = false;

  get quarterLabel(): (q: number) => string {
    return (q: number) => `Q${q}`;
  }
}
