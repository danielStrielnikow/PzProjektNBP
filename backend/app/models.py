from datetime import date
from sqlalchemy import Column, Integer, String, Float, Date, UniqueConstraint
from app.database import Base


class CurrencyRate(Base):
    __tablename__ = "currency_rates"

    id = Column(Integer, primary_key=True, index=True)
    currency_code = Column(String(3), nullable=False, index=True)
    currency_name = Column(String(100), nullable=False)
    rate = Column(Float, nullable=False)
    effective_date = Column(Date, nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("currency_code", "effective_date", name="uq_currency_date"),
    )

    @property
    def year(self) -> int:
        return self.effective_date.year

    @property
    def quarter(self) -> int:
        return (self.effective_date.month - 1) // 3 + 1

    @property
    def month(self) -> int:
        return self.effective_date.month
