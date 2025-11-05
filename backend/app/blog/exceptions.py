import logging
from typing import NoReturn

from fastapi import HTTPException, status
from sqlalchemy.exc import DataError, IntegrityError, NoResultFound, OperationalError

logger = logging.getLogger(__name__)


class BlogNotFoundException(HTTPException):
    def __init__(self, blog_id: int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Blog with id {blog_id} not found",
        )


class BlogCreationFailedException(HTTPException):
    def __init__(self, detail: str = "Failed to create blog"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail
        )


class BlogUpdateFailedException(HTTPException):
    def __init__(self, detail: str = "Failed to update blog"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail
        )


class TagOperationFailedException(HTTPException):
    def __init__(self, detail: str = "Failed to perform tag operation"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail
        )


class DatabaseConstraintException(HTTPException):
    def __init__(self, detail: str = "Database constraint violation"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class InvalidDataException(HTTPException):
    def __init__(self, detail: str = "Invalid data provided"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail
        )


def handle_database_error(error: Exception, operation: str) -> NoReturn:
    logger.error(f"Database error during {operation}: {str(error)}", exc_info=True)

    if isinstance(error, NoResultFound):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource not found during {operation}",
        )

    elif isinstance(error, IntegrityError):
        error_str = str(error).lower()

        if "unique constraint" in error_str or "duplicate" in error_str:
            raise DatabaseConstraintException(
                detail=f"Duplicate entry detected during {operation}"
            )
        elif "foreign key constraint" in error_str:
            raise DatabaseConstraintException(
                detail=f"Referenced resource not found during {operation}"
            )
        elif "not null constraint" in error_str:
            raise InvalidDataException(
                detail=f"Required field is missing during {operation}"
            )
        else:
            raise DatabaseConstraintException(
                detail=f"Database constraint violation during {operation}"
            )

    elif isinstance(error, DataError):
        raise InvalidDataException(detail=f"Invalid data format during {operation}")

    elif isinstance(error, OperationalError):
        logger.critical(f"Database operational error during {operation}: {str(error)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable. Please try again later.",
        )

    elif isinstance(error, HTTPException):
        raise error

    else:
        logger.exception(f"Unexpected error during {operation}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during {operation}",
        )
