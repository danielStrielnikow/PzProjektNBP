import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CurrencyFilters } from '../../models/currency-rate.model';

@Component({
  selector: 'app-currency-filters',
  imports: [FormsModule, CommonModule],
  templateUrl: './currency-filters.component.html',
  styleUrl: './currency-filters.component.scss'
})
export class CurrencyFiltersComponent {
  @Output() filtersChanged = new EventEmitter<CurrencyFilters>();

  filters: CurrencyFilters = {};

  quarters = [1, 2, 3, 4];
  months = [
    { value: 1, label: 'Styczeń' }, { value: 2, label: 'Luty' },
    { value: 3, label: 'Marzec' }, { value: 4, label: 'Kwiecień' },
    { value: 5, label: 'Maj' }, { value: 6, label: 'Czerwiec' },
    { value: 7, label: 'Lipiec' }, { value: 8, label: 'Sierpień' },
    { value: 9, label: 'Wrzesień' }, { value: 10, label: 'Październik' },
    { value: 11, label: 'Listopad' }, { value: 12, label: 'Grudzień' },
  ];

  applyFilters(): void {
    const clean: CurrencyFilters = {};
    if (this.filters.year)          clean.year = +this.filters.year;
    if (this.filters.quarter)       clean.quarter = +this.filters.quarter;
    if (this.filters.month)         clean.month = +this.filters.month;
    if (this.filters.day)           clean.day = +this.filters.day;
    if (this.filters.currency_code) clean.currency_code = this.filters.currency_code.toUpperCase();
    this.filtersChanged.emit(clean);
  }

  resetFilters(): void {
    this.filters = {};
    this.filtersChanged.emit({});
  }
}
