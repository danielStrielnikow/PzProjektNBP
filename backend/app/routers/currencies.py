from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from sqlalchemy.dialects.postgresql import insert

from app.database import get_db
from app.models import CurrencyRate
from app.schemas import CurrencyRateOut, FetchRequest, FetchResponse
from app.services.nbp_service import fetch_rates_for_date_range

router = APIRouter(prefix="/currencies", tags=["currencies"])


@router.get("", response_model=list[CurrencyRateOut])
def get_currencies(
    year: int | None = Query(None),
    quarter: int | None = Query(None),
    month: int | None = Query(None),
    day: int | None = Query(None),
    currency_code: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Returns stored currency rates with optional filters."""
    query = db.query(CurrencyRate)

    if year:
        query = query.filter(extract("year", CurrencyRate.effective_date) == year)
    if quarter:
        query = query.filter(
            extract("month", CurrencyRate.effective_date).in_(
                range((quarter - 1) * 3 + 1, quarter * 3 + 1)
            )
        )
    if month:
        query = query.filter(extract("month", CurrencyRate.effective_date) == month)
    if day:
        query = query.filter(extract("day", CurrencyRate.effective_date) == day)
    if currency_code:
        query = query.filter(CurrencyRate.currency_code == currency_code.upper())

    return query.order_by(CurrencyRate.effective_date.desc()).all()


@router.get("/{rate_date}", response_model=list[CurrencyRateOut])
def get_currencies_by_date(rate_date: date, db: Session = Depends(get_db)):
    """Returns all currency rates for a specific date."""
    rates = db.query(CurrencyRate).filter(CurrencyRate.effective_date == rate_date).all()
    if not rates:
        raise HTTPException(status_code=404, detail=f"No rates found for date {rate_date}")
    return rates


@router.post("/fetch", response_model=FetchResponse)
def fetch_and_store(payload: FetchRequest, db: Session = Depends(get_db)):
    """Fetches rates from NBP API and stores them in the database."""
    if payload.start_date > payload.end_date:
        raise HTTPException(status_code=400, detail="start_date must be before end_date")

    try:
        rates = fetch_rates_for_date_range(payload.start_date, payload.end_date)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NBP API error: {str(e)}")

    saved = 0
    for r in rates:
        stmt = (
            insert(CurrencyRate)
            .values(**r)
            .on_conflict_do_nothing(constraint="uq_currency_date")
        )
        result = db.execute(stmt)
        saved += result.rowcount

    db.commit()
    return FetchResponse(saved=saved, message=f"Saved {saved} new records.")
