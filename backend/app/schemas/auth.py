from typing import Optional
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    business_name: Optional[str] = "My Small Business"
    business_type: Optional[str] = "Retail"
    city: Optional[str] = "Bengaluru"
    state: Optional[str] = "Karnataka"
    intended_role: Optional[str] = "business_owner" # business_owner, store_manager, sales_executive

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: str
    workspace_id: str
    full_name: str
    email: str
    phone: Optional[str]
    role_name: str
    is_active: bool
    onboarding_completed: bool

    class Config:
        from_attributes = True
