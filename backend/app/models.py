from sqlalchemy.orm import declarative_base


class BaseModel(declarative_base()):
    __abstract__ = True