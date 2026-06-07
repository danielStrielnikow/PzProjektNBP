from datetime import date
import httpx

NBP_BASE_URL = "https://api.nbp.pl/api"


class NbpNoDataError(Exception):
    """Raised when NBP API returns 404 – no rates for given date range (weekend/holiday)."""
    pass


def fetch_rates_for_date_range(start_date: date, end_date: date) -> list[dict]:
    """Fetches currency rates from NBP API for given date range (table A – average rates)."""
    url = f"{NBP_BASE_URL}/exchangerates/tables/A/{start_date}/{end_date}/?format=json"
    with httpx.Client(timeout=30) as client:
        response = client.get(url)
        if response.status_code == 404:
            raise NbpNoDataError(
                f"NBP nie opublikował kursów dla zakresu {start_date} – {end_date}. "
                "Sprawdź czy daty nie przypadają na weekendy lub święta."
            )
        response.raise_for_status()
        tables = response.json()

    results = []
    for table in tables:
        effective_date = date.fromisoformat(table["effectiveDate"])
        for rate_entry in table["rates"]:
            results.append({
                "currency_code": rate_entry["code"],
                "currency_name": rate_entry["currency"],
                "rate": rate_entry["mid"],
                "effective_date": effective_date,
            })
    return results
