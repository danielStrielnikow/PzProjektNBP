import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CurrencyService } from './services/currency.service';
import { CurrencyFiltersComponent } from './components/currency-filters/currency-filters.component';
import { CurrencyTableComponent } from './components/currency-table/currency-table.component';
import { CurrencyRate, CurrencyFilters, FetchRequest } from './models/currency-rate.model';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, CurrencyFiltersComponent, CurrencyTableComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  rates: CurrencyRate[] = [];
  loading = false;
  fetchLoading = false;
  errorMessage = '';
  successMessage = '';

  fetchRequest: FetchRequest = {
    start_date: '2024-01-01',
    end_date: '2024-01-31',
  };

  constructor(private currencyService: CurrencyService) {}

  loadRates(filters: CurrencyFilters = {}): void {
    this.loading = true;
    this.errorMessage = '';
    this.currencyService.getRates(filters).subscribe({
      next: (data) => { this.rates = data; this.loading = false; },
      error: () => { this.errorMessage = 'Błąd pobierania danych z serwera.'; this.loading = false; }
    });
  }

  fetchFromNbp(): void {
    this.fetchLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.currencyService.fetchFromNbp(this.fetchRequest).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.fetchLoading = false;
        this.loadRates();
      },
      error: () => {
        this.errorMessage = 'Błąd podczas pobierania danych z NBP API.';
        this.fetchLoading = false;
      }
    });
  }

  onFiltersChanged(filters: CurrencyFilters): void {
    this.loadRates(filters);
  }
}
