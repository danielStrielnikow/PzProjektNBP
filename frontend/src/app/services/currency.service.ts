import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CurrencyRate, CurrencyFilters, FetchRequest, FetchResponse } from '../models/currency-rate.model';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly apiUrl = 'http://localhost:8000/currencies';

  constructor(private http: HttpClient) {}

  getRates(filters: CurrencyFilters = {}): Observable<CurrencyRate[]> {
    let params = new HttpParams();
    if (filters.year)          params = params.set('year', filters.year);
    if (filters.quarter)       params = params.set('quarter', filters.quarter);
    if (filters.month)         params = params.set('month', filters.month);
    if (filters.day)           params = params.set('day', filters.day);
    if (filters.currency_code) params = params.set('currency_code', filters.currency_code);
    return this.http.get<CurrencyRate[]>(this.apiUrl, { params });
  }

  getRatesByDate(date: string): Observable<CurrencyRate[]> {
    return this.http.get<CurrencyRate[]>(`${this.apiUrl}/${date}`);
  }

  fetchFromNbp(request: FetchRequest): Observable<FetchResponse> {
    return this.http.post<FetchResponse>(`${this.apiUrl}/fetch`, request);
  }
}
