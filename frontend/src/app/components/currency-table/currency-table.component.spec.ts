import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

import { CurrencyTableComponent } from './currency-table.component';
import { CurrencyRate } from '../../models/currency-rate.model';

const mockRates: CurrencyRate[] = [
  { id: 1, currency_code: 'USD', currency_name: 'dolar amerykański', rate: 4.0123, effective_date: '2024-03-15', year: 2024, quarter: 1, month: 3 },
  { id: 2, currency_code: 'EUR', currency_name: 'euro', rate: 4.3456, effective_date: '2024-03-15', year: 2024, quarter: 1, month: 3 },
];

describe('CurrencyTableComponent', () => {
  let component: CurrencyTableComponent;
  let fixture: ComponentFixture<CurrencyTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyTableComponent, CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencyTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty message when no rates', () => {
    component.rates = [];
    component.loading = false;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty')).toBeTruthy();
    expect(el.querySelector('table')).toBeNull();
  });

  it('should show loading message when loading is true', () => {
    component.loading = true;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.loading')).toBeTruthy();
  });

  it('should render table with rates', () => {
    component.rates = mockRates;
    component.loading = false;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const rows = el.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('should display correct currency code in table', () => {
    component.rates = mockRates;
    component.loading = false;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const cells = el.querySelectorAll('tbody tr td:nth-child(2) strong');
    expect(cells[0].textContent?.trim()).toBe('USD');
    expect(cells[1].textContent?.trim()).toBe('EUR');
  });

  it('should display quarter as Q1, Q2 etc.', () => {
    component.rates = [{ ...mockRates[0], quarter: 2 }];
    component.loading = false;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const quarterCell = el.querySelector('tbody tr td:nth-child(6)');
    expect(quarterCell?.textContent?.trim()).toBe('Q2');
  });

  it('should not show table when loading', () => {
    component.rates = mockRates;
    component.loading = true;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('table')).toBeNull();
  });
});
