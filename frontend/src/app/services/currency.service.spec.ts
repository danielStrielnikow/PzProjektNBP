import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { CurrencyService } from './currency.service';
import { CurrencyRate, FetchResponse } from '../models/currency-rate.model';

const mockRates: CurrencyRate[] = [
  { id: 1, currency_code: 'USD', currency_name: 'dolar amerykański', rate: 4.0123, effective_date: '2024-03-15', year: 2024, quarter: 1, month: 3 },
  { id: 2, currency_code: 'EUR', currency_name: 'euro', rate: 4.3456, effective_date: '2024-03-15', year: 2024, quarter: 1, month: 3 },
];

describe('CurrencyService', () => {
  let service: CurrencyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CurrencyService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CurrencyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRates()', () => {
    it('should fetch rates without filters', () => {
      service.getRates().subscribe(rates => {
        expect(rates.length).toBe(2);
        expect(rates[0].currency_code).toBe('USD');
      });

      const req = httpMock.expectOne('http://localhost:8000/currencies');
      expect(req.request.method).toBe('GET');
      req.flush(mockRates);
    });

    it('should append year param when filter provided', () => {
      service.getRates({ year: 2024 }).subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/currencies') && r.params.get('year') === '2024');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should append quarter param when filter provided', () => {
      service.getRates({ quarter: 2 }).subscribe();

      const req = httpMock.expectOne(r => r.params.get('quarter') === '2');
      req.flush([]);
    });

    it('should append month param when filter provided', () => {
      service.getRates({ month: 5 }).subscribe();

      const req = httpMock.expectOne(r => r.params.get('month') === '5');
      req.flush([]);
    });

    it('should append currency_code param when filter provided', () => {
      service.getRates({ currency_code: 'USD' }).subscribe();

      const req = httpMock.expectOne(r => r.params.get('currency_code') === 'USD');
      req.flush([]);
    });

    it('should return empty array when no rates found', () => {
      service.getRates().subscribe(rates => {
        expect(rates).toEqual([]);
      });

      httpMock.expectOne('http://localhost:8000/currencies').flush([]);
    });
  });

  describe('getRatesByDate()', () => {
    it('should fetch rates for a specific date', () => {
      service.getRatesByDate('2024-03-15').subscribe(rates => {
        expect(rates.length).toBe(2);
      });

      const req = httpMock.expectOne('http://localhost:8000/currencies/2024-03-15');
      expect(req.request.method).toBe('GET');
      req.flush(mockRates);
    });
  });

  describe('fetchFromNbp()', () => {
    it('should POST fetch request and return response', () => {
      const mockResponse: FetchResponse = { saved: 30, message: 'Saved 30 new records.' };

      service.fetchFromNbp({ start_date: '2024-01-01', end_date: '2024-01-31' }).subscribe(res => {
        expect(res.saved).toBe(30);
        expect(res.message).toContain('30');
      });

      const req = httpMock.expectOne('http://localhost:8000/currencies/fetch');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ start_date: '2024-01-01', end_date: '2024-01-31' });
      req.flush(mockResponse);
    });

    it('should send correct date range in body', () => {
      service.fetchFromNbp({ start_date: '2023-06-01', end_date: '2023-06-30' }).subscribe();

      const req = httpMock.expectOne('http://localhost:8000/currencies/fetch');
      expect(req.request.body.start_date).toBe('2023-06-01');
      expect(req.request.body.end_date).toBe('2023-06-30');
      req.flush({ saved: 0, message: 'Saved 0 new records.' });
    });
  });
});
