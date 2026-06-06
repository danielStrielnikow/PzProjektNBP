from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import currencies

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NBP Currency Rates API",
    description="API do pobierania i przechowywania kursów walut NBP",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(currencies.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
