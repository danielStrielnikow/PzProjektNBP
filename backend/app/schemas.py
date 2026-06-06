from datetime import date
from pydantic import BaseModel


class CurrencyRateOut(BaseModel):
    id: int
    currency_code: str
    currency_name: str
    rate: float
    effective_date: date
    year: int
    quarter: int
    month: int

    model_config = {"from_attributes": True}


class FetchRequest(BaseModel):
    start_date: date
    end_date: date


class FetchResponse(BaseModel):
    saved: int
    message: str
