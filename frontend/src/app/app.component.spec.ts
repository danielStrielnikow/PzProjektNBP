import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AppComponent } from './app.component';
import { CurrencyService } from './services/currency.service';
import { CurrencyRate } from './models/currency-rate.model';
import { of, throwError } from 'rxjs';

const mockRates: CurrencyRate[] = [
  { id: 1, currency_code: 'USD', currency_name: 'dolar', rate: 4.01, effective_date: '2024-01-10', year: 2024, quarter: 1, month: 1 },
];

describe('AppComponent', () => {
  let currencyServiceSpy: jasmine.SpyObj<CurrencyService>;

  beforeEach(async () => {
    currencyServiceSpy = jasmine.createSpyObj('CurrencyService', ['getRates', 'fetchFromNbp']);
    currencyServiceSpy.getRates.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CurrencyService, useValue: currencyServiceSpy },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render main heading', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Kursy Walut NBP');
  });

  it('should render fetch button', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(el.querySelectorAll('button'));
    expect(buttons.some(b => b.textContent?.includes('Pobierz kursy walut'))).toBeTrue();
  });

  it('should call fetchFromNbp on button click and show success message', () => {
    currencyServiceSpy.fetchFromNbp.and.returnValue(of({ saved: 5, message: 'Saved 5 new records.' }));
    currencyServiceSpy.getRates.and.returnValue(of(mockRates));

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.fetchFromNbp();
    fixture.detectChanges();

    expect(currencyServiceSpy.fetchFromNbp).toHaveBeenCalled();
    expect(component.successMessage).toContain('5');
  });

  it('should show error message when fetchFromNbp fails', () => {
    currencyServiceSpy.fetchFromNbp.and.returnValue(throwError(() => new Error('NBP error')));

    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    component.fetchFromNbp();
    fixture.detectChanges();

    expect(component.errorMessage).toContain('Błąd');
  });

  it('should call getRates with filters on onFiltersChanged()', () => {
    currencyServiceSpy.getRates.and.returnValue(of(mockRates));

    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    component.onFiltersChanged({ year: 2024, quarter: 1 });

    expect(currencyServiceSpy.getRates).toHaveBeenCalledWith({ year: 2024, quarter: 1 });
  });

  it('should set rates after successful loadRates()', () => {
    currencyServiceSpy.getRates.and.returnValue(of(mockRates));

    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    component.loadRates();

    expect(component.rates.length).toBe(1);
    expect(component.rates[0].currency_code).toBe('USD');
  });

  it('should show error when getRates fails', () => {
    currencyServiceSpy.getRates.and.returnValue(throwError(() => new Error('server error')));

    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    component.loadRates();

    expect(component.errorMessage).toContain('Błąd');
  });
});
