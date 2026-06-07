from datetime import date
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models import CurrencyRate

# --- Test database (SQLite in-memory, no PostgreSQL needed for unit tests) ---

SQLALCHEMY_TEST_URL = "sqlite:///./test.db"

engine_test = create_engine(
    SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_rate(setup_database):
    db = TestingSessionLocal()
    rate = CurrencyRate(
        currency_code="USD",
        currency_name="dolar amerykański",
        rate=4.0123,
        effective_date=date(2024, 3, 15),
    )
    db.add(rate)
    db.commit()
    db.refresh(rate)
    db.close()
    return rate


# --- Health check ---

class TestHealthCheck:
    def test_health_returns_ok(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


# --- GET /currencies ---

class TestGetCurrencies:
    def test_returns_empty_list_when_no_data(self, client):
        response = client.get("/currencies")
        assert response.status_code == 200
        assert response.json() == []

    def test_returns_stored_rates(self, client, sample_rate):
        response = client.get("/currencies")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["currency_code"] == "USD"
        assert data[0]["rate"] == 4.0123

    def test_filter_by_year(self, client, setup_database):
        db = TestingSessionLocal()
        db.add_all([
            CurrencyRate(currency_code="USD", currency_name="dolar", rate=4.0, effective_date=date(2024, 1, 10)),
            CurrencyRate(currency_code="USD", currency_name="dolar", rate=4.1, effective_date=date(2023, 6, 20)),
        ])
        db.commit()
        db.close()

        response = client.get("/currencies?year=2024")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["year"] == 2024

    def test_filter_by_quarter(self, client, setup_database):
        db = TestingSessionLocal()
        db.add_all([
            CurrencyRate(currency_code="USD", currency_name="dolar", rate=4.0, effective_date=date(2024, 2, 1)),
            CurrencyRate(currency_code="USD", currency_name="dolar", rate=4.2, effective_date=date(2024, 7, 1)),
        ])
        db.commit()
        db.close()

        response = client.get("/currencies?year=2024&quarter=1")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["quarter"] == 1

    def test_filter_by_month(self, client, setup_database):
        db = TestingSessionLocal()
        db.add_all([
            CurrencyRate(currency_code="EUR", currency_name="euro", rate=4.3, effective_date=date(2024, 3, 5)),
            CurrencyRate(currency_code="EUR", currency_name="euro", rate=4.4, effective_date=date(2024, 5, 5)),
        ])
        db.commit()
        db.close()

        response = client.get("/currencies?month=3")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["month"] == 3

    def test_filter_by_currency_code(self, client, setup_database):
        db = TestingSessionLocal()
        db.add_all([
            CurrencyRate(currency_code="USD", currency_name="dolar", rate=4.0, effective_date=date(2024, 1, 1)),
            CurrencyRate(currency_code="EUR", currency_name="euro", rate=4.3, effective_date=date(2024, 1, 1)),
        ])
        db.commit()
        db.close()

        response = client.get("/currencies?currency_code=EUR")
        assert response.status_code == 200
        data = response.json()
        assert all(r["currency_code"] == "EUR" for r in data)


# --- GET /currencies/{date} ---

class TestGetCurrenciesByDate:
    def test_returns_rates_for_existing_date(self, client, sample_rate):
        response = client.get("/currencies/2024-03-15")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["effective_date"] == "2024-03-15"

    def test_returns_404_for_missing_date(self, client):
        response = client.get("/currencies/2000-01-01")
        assert response.status_code == 404

    def test_returns_400_for_invalid_date_format(self, client):
        response = client.get("/currencies/not-a-date")
        assert response.status_code == 422


# --- POST /currencies/fetch ---

MOCK_NBP_RESPONSE = [
    {
        "table": "A",
        "no": "052/A/NBP/2024",
        "effectiveDate": "2024-03-15",
        "rates": [
            {"currency": "dolar amerykański", "code": "USD", "mid": 4.0123},
            {"currency": "euro", "code": "EUR", "mid": 4.3456},
        ],
    }
]


class TestFetchCurrencies:
    @patch("app.routers.currencies.fetch_rates_for_date_range")
    def test_fetch_saves_new_records(self, mock_fetch, client):
        mock_fetch.return_value = [
            {"currency_code": "USD", "currency_name": "dolar", "rate": 4.01, "effective_date": date(2024, 3, 15)},
            {"currency_code": "EUR", "currency_name": "euro", "rate": 4.34, "effective_date": date(2024, 3, 15)},
        ]
        response = client.post("/currencies/fetch", json={"start_date": "2024-03-15", "end_date": "2024-03-15"})
        assert response.status_code == 200
        assert response.json()["saved"] == 2

    @patch("app.routers.currencies.fetch_rates_for_date_range")
    def test_fetch_skips_duplicates(self, mock_fetch, client, sample_rate):
        mock_fetch.return_value = [
            {"currency_code": "USD", "currency_name": "dolar", "rate": 4.01, "effective_date": date(2024, 3, 15)},
        ]
        response = client.post("/currencies/fetch", json={"start_date": "2024-03-15", "end_date": "2024-03-15"})
        assert response.status_code == 200
        assert response.json()["saved"] == 0

    def test_fetch_returns_400_for_invalid_date_range(self, client):
        response = client.post("/currencies/fetch", json={"start_date": "2024-03-20", "end_date": "2024-03-15"})
        assert response.status_code == 400

    @patch("app.routers.currencies.fetch_rates_for_date_range", side_effect=Exception("NBP timeout"))
    def test_fetch_returns_502_on_nbp_error(self, mock_fetch, client):
        response = client.post("/currencies/fetch", json={"start_date": "2024-03-15", "end_date": "2024-03-15"})
        assert response.status_code == 502
        assert "NBP API error" in response.json()["detail"]

    @patch("app.routers.currencies.fetch_rates_for_date_range")
    def test_fetch_returns_404_for_weekend_or_holiday(self, mock_fetch, client):
        from app.services.nbp_service import NbpNoDataError
        mock_fetch.side_effect = NbpNoDataError("Brak danych dla weekendu")
        response = client.post("/currencies/fetch", json={"start_date": "2026-06-06", "end_date": "2026-06-06"})
        assert response.status_code == 404
        assert "NBP" in response.json()["detail"]

    def test_fetch_returns_400_for_range_over_93_days(self, client):
        response = client.post("/currencies/fetch", json={"start_date": "2024-01-01", "end_date": "2024-05-01"})
        assert response.status_code == 400
        assert "93" in response.json()["detail"]

    @patch("app.routers.currencies.fetch_rates_for_date_range")
    def test_fetch_returns_400_when_nbp_rejects_range(self, mock_fetch, client):
        from app.services.nbp_service import NbpRangeTooLargeError
        mock_fetch.side_effect = NbpRangeTooLargeError("Przekroczony limit NBP")
        response = client.post("/currencies/fetch", json={"start_date": "2024-01-01", "end_date": "2024-02-01"})
        assert response.status_code == 400


# --- Model unit tests ---

class TestCurrencyRateModel:
    def test_quarter_calculation_q1(self):
        rate = CurrencyRate(effective_date=date(2024, 2, 15))
        assert rate.quarter == 1

    def test_quarter_calculation_q2(self):
        rate = CurrencyRate(effective_date=date(2024, 5, 1))
        assert rate.quarter == 2

    def test_quarter_calculation_q3(self):
        rate = CurrencyRate(effective_date=date(2024, 9, 30))
        assert rate.quarter == 3

    def test_quarter_calculation_q4(self):
        rate = CurrencyRate(effective_date=date(2024, 12, 31))
        assert rate.quarter == 4

    def test_year_property(self):
        rate = CurrencyRate(effective_date=date(2023, 7, 10))
        assert rate.year == 2023

    def test_month_property(self):
        rate = CurrencyRate(effective_date=date(2024, 11, 5))
        assert rate.month == 11
