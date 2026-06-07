from datetime import date
import httpx

NBP_BASE_URL = "https://api.nbp.pl/api"
NBP_MAX_DAYS = 93


class NbpNoDataError(Exception):
    """Raised when NBP API returns 404 – no rates for given date range (weekend/holiday)."""
    pass


class NbpRangeTooLargeError(Exception):
    """Raised when requested date range exceeds NBP API limit of 93 days."""
    pass


def fetch_rates_for_date_range(start_date: date, end_date: date) -> list[dict]:
    """Fetches currency rates from NBP API for given date range (table A – average rates).

    NBP API limit: single request cannot span more than 93 days.
    """
    days = (end_date - start_date).days
    if days > NBP_MAX_DAYS:
        raise NbpRangeTooLargeError(
            f"Zakres dat przekracza limit NBP API ({NBP_MAX_DAYS} dni). "
            f"Wybrany zakres: {days} dni. Podziel zapytanie na krótsze okresy."
        )

    url = f"{NBP_BASE_URL}/exchangerates/tables/A/{start_date}/{end_date}/?format=json"
    with httpx.Client(timeout=30) as client:
        response = client.get(url)
        if response.status_code == 404:
            raise NbpNoDataError(
                f"NBP nie opublikował kursów dla zakresu {start_date} – {end_date}. "
                "Sprawdź czy daty nie przypadają na weekendy lub święta."
            )
        if response.status_code == 400:
            raise NbpRangeTooLargeError(
                f"NBP API odrzucił zapytanie (400): przekroczony limit danych. "
                f"Maksymalny zakres to {NBP_MAX_DAYS} dni."
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
