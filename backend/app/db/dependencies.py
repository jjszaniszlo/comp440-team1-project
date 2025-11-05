from collections.abc import AsyncGenerator

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing_extensions import Annotated


async def db_session(request: Request) -> AsyncGenerator[AsyncSession, None]:
    async with request.app.state.db_session() as async_session:
        yield async_session


DatabaseDependency = Annotated[AsyncSession, Depends(db_session)]
