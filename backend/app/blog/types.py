from enum import Enum


class BlogStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"

    
class BlogSortBy(str, Enum):
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    SUBJECT = "subject"
    RELEVANCE = "relevance"


class BlogSortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"