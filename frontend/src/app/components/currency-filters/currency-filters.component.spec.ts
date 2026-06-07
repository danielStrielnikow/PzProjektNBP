import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { CurrencyFiltersComponent } from './currency-filters.component';
import { CurrencyFilters } from '../../models/currency-rate.model';

describe('CurrencyFiltersComponent', () => {
  let component: CurrencyFiltersComponent;
  let fixture: ComponentFixture<CurrencyFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyFiltersComponent, FormsModule, CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencyFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit filters on applyFilters()', () => {
    let emitted: CurrencyFilters | undefined;
    component.filtersChanged.subscribe((f: CurrencyFilters) => emitted = f);

    component.filters = { year: 2024, currency_code: 'usd' };
    component.applyFilters();

    expect(emitted).toBeDefined();
    expect(emitted!.year).toBe(2024);
    expect(emitted!.currency_code).toBe('USD');
  });

  it('should uppercase currency_code on apply', () => {
    let emitted: CurrencyFilters | undefined;
    component.filtersChanged.subscribe((f: CurrencyFilters) => emitted = f);

    component.filters = { currency_code: 'eur' };
    component.applyFilters();

    expect(emitted!.currency_code).toBe('EUR');
  });

  it('should emit empty object on resetFilters()', () => {
    let emitted: CurrencyFilters | undefined;
    component.filtersChanged.subscribe((f: CurrencyFilters) => emitted = f);

    component.filters = { year: 2023, month: 5 };
    component.resetFilters();

    expect(emitted).toEqual({});
    expect(component.filters).toEqual({});
  });

  it('should not include undefined fields in emitted filters', () => {
    let emitted: CurrencyFilters | undefined;
    component.filtersChanged.subscribe((f: CurrencyFilters) => emitted = f);

    component.filters = { year: 2024 };
    component.applyFilters();

    expect(emitted!.quarter).toBeUndefined();
    expect(emitted!.month).toBeUndefined();
  });

  it('should have 4 quarters available', () => {
    expect(component.quarters.length).toBe(4);
    expect(component.quarters).toContain(1);
    expect(component.quarters).toContain(4);
  });

  it('should have 12 months available', () => {
    expect(component.months.length).toBe(12);
  });

  it('should render Filtruj button', () => {
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll('button');
    const labels = Array.from(buttons).map(b => b.textContent?.trim());
    expect(labels).toContain('Filtruj');
  });

  it('should render Resetuj button', () => {
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll('button');
    const labels = Array.from(buttons).map(b => b.textContent?.trim());
    expect(labels).toContain('Resetuj');
  });
});
