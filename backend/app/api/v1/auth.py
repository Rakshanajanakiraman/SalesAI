from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User, Role
from app.models.workspace import Workspace
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register_user(data: UserRegister, db: Session = Depends(get_db)):
    # 1. Check if email already exists
    existing = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in instead."
        )

    # 2. Strict Role assignment security:
    # Do NOT allow self-assignment of system_admin
    assigned_role = data.intended_role.lower() if data.intended_role else "business_owner"
    if assigned_role == "system_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System Administrator role cannot be self-assigned during regular registration."
        )
    if assigned_role not in ["business_owner", "store_manager", "sales_executive"]:
        assigned_role = "business_owner"

    # 3. Create or find workspace
    workspace = Workspace(
        name=data.business_name or f"{data.full_name}'s Business",
        business_type=data.business_type or "Retail",
        city=data.city or "Bengaluru",
        state=data.state or "Karnataka",
        currency="INR"
    )
    db.add(workspace)
    db.flush()

    # 4. Create user
    user = User(
        workspace_id=workspace.id,
        full_name=data.full_name.strip(),
        email=data.email.lower().strip(),
        phone=data.phone,
        hashed_password=get_password_hash(data.password),
        role_name=assigned_role,
        is_active=True,
        onboarding_completed=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)


    # 5. Generate token
    token = create_access_token(
        subject=user.id,
        extra_claims={
            "role": user.role_name,
            "workspace_id": user.workspace_id,
            "email": user.email
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role_name": user.role_name,
            "workspace_id": user.workspace_id,
            "workspace_name": workspace.name,
            "onboarding_completed": user.onboarding_completed
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact support."
        )

    workspace = db.query(Workspace).filter(Workspace.id == user.workspace_id).first()

    token = create_access_token(
        subject=user.id,
        extra_claims={
            "role": user.role_name,
            "workspace_id": user.workspace_id,
            "email": user.email
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role_name": user.role_name,
            "workspace_id": user.workspace_id,
            "workspace_name": workspace.name if workspace else "MarketMind Workspace",
            "onboarding_completed": user.onboarding_completed
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    workspace = db.query(Workspace).filter(Workspace.id == current_user.workspace_id).first()
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role_name": current_user.role_name,
        "workspace_id": current_user.workspace_id,
        "workspace_name": workspace.name if workspace else "Workspace",
        "onboarding_completed": current_user.onboarding_completed
    }

@router.post("/complete-onboarding")
def complete_onboarding(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.onboarding_completed = True
    db.commit()
    return {"status": "success", "onboarding_completed": True}

@router.post("/reset-onboarding")
def reset_onboarding(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.onboarding_completed = False
    db.commit()
    return {"status": "success", "onboarding_completed": False}
