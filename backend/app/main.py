from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.limiter import limiter
from app.routers import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db_engine = create_async_engine(
        str(settings.DB_URL), echo=settings.DEBUG, future=True
    )
    app.state.db_session = async_sessionmaker(
        bind=app.state.db_engine, expire_on_commit=False, class_=AsyncSession
    )
    yield


app = FastAPI(
    title="Team X API",
    debug=settings.DEBUG,
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


app.include_router(api_router, prefix="/api/v1")