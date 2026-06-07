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
    start_date: this.lastMonday(),
    end_date: this.lastFriday(),
  };

  private lastMonday(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff - (diff === 0 ? 7 : 0));
    return d.toISOString().slice(0, 10);
  }

  private lastFriday(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? 2 : day <= 5 ? day + 2 : 1;
    d.setDate(d.getDate() - diff);
    return d.toISOString().slice(0, 10);
  }

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
      error: (err) => {
        this.errorMessage = err?.error?.detail ?? 'Błąd podczas pobierania danych z NBP API.';
        this.fetchLoading = false;
      }
    });
  }

  onFiltersChanged(filters: CurrencyFilters): void {
    this.loadRates(filters);
  }
}
