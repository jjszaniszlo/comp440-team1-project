from pydantic import BaseModel, ConfigDict, EmailStr


class UserSignup(BaseModel):
    username: str
    password: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    username: str
    email: str
    first_name: str
    last_name: str
    phone: str
