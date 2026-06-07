export interface CurrencyRate {
  id: number;
  currency_code: string;
  currency_name: string;
  rate: number;
  effective_date: string;
  year: number;
  quarter: number;
  month: number;
}

export interface FetchRequest {
  start_date: string;
  end_date: string;
}

export interface FetchResponse {
  saved: number;
  message: string;
}

export interface CurrencyFilters {
  year?: number;
  quarter?: number;
  month?: number;
  day?: number;
  currency_code?: string;
}
