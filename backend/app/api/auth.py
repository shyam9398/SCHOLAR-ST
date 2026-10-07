from typing import Optional

from fastapi import (
    APIRouter,
    HTTPException,
    Header
)

from pydantic import BaseModel

from app.services.auth_service import (
    login_user,
    register_user,
    request_password_reset,
    complete_password_reset,
    create_inspector,
    get_authenticated_user,
    get_profile
)
from app.services.supabase_service import SupabaseService


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# ============================================================
# REQUEST MODELS
# ============================================================

class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: Optional[str] = "applicant"
    phone: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    tribe_name: Optional[str] = None
    caste_certificate_no: Optional[str] = None
    annual_income: Optional[float] = None
    state_of_domicile: Optional[str] = None
    district: Optional[str] = None
    academic_level: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    identifier: str


class ResetPasswordRequest(BaseModel):
    identifier: str
    reset_code: str
    new_password: str
    confirm_password: Optional[str] = None


class CreateInspectorRequest(BaseModel):
    username: str
    password: str
    full_name: str
    phone: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    recaptcha_token: Optional[str] = None


# ============================================================
# GET BEARER TOKEN & ROLE GUARDS
# ============================================================

def extract_token(authorization):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is required"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header"
        )

    return authorization.split(" ", 1)[1]


def require_authenticated_user(authorization: str):
    token = extract_token(authorization)
    try:
        user = get_authenticated_user(token)
        profile = get_profile(str(user.id))
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session. Please log in again."
        )

    if not profile.get("is_active"):
        raise HTTPException(
            status_code=403,
            detail="Account is inactive"
        )

    return profile


def require_admin(authorization):
    profile = require_authenticated_user(authorization)
    if profile.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Admin access required"
        )
    return profile


def require_officer(authorization):
    profile = require_authenticated_user(authorization)
    if profile.get("role") not in ("officer", "inspector", "admin"):
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Verification Officer access required"
        )
    return profile


def require_applicant(authorization):
    profile = require_authenticated_user(authorization)
    if profile.get("role") not in ("applicant", "admin"):
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Applicant access required"
        )
    return profile


# ============================================================
# REGISTRATION
# ============================================================

@router.post("/register")
def register(request: RegisterRequest):
    try:
        result = register_user(
            username=request.username,
            email=request.email,
            password=request.password,
            full_name=request.full_name,
            role=request.role or "applicant",
            phone=request.phone,
            designation=request.designation,
            department=request.department,
            tribe_name=request.tribe_name,
            caste_certificate_no=request.caste_certificate_no,
            annual_income=request.annual_income,
            state_of_domicile=request.state_of_domicile,
            district=request.district,
            academic_level=request.academic_level,
        )

        session = result["session"]
        profile = result["profile"]

        try:
            SupabaseService.create_audit_log(
                user_id=profile.get("id"),
                action="USER_REGISTRATION",
                entity_type="profile",
                entity_id=profile.get("id"),
                description=f"New user registered: {profile.get('username')} ({profile.get('role')})",
                metadata={"role": profile.get("role"), "email": profile.get("email")}
            )
        except Exception:
            pass

        return {
            "success": True,
            "message": "Account created successfully.",
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "token_type": "bearer",
            "expires_in": session.expires_in,
            "profile": profile
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")


# ============================================================
# FORGOT & RESET PASSWORD
# ============================================================

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest):
    try:
        result = request_password_reset(request.identifier)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest):
    if request.confirm_password and request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    try:
        result = complete_password_reset(
            identifier=request.identifier,
            reset_code=request.reset_code,
            new_password=request.new_password
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# LOGIN
# ============================================================

@router.post("/login")
def login(request: LoginRequest):

    # --------------------------------------------------------
    # Login
    # --------------------------------------------------------

    try:

        result = login_user(
            request.username,
            request.password
        )

    except Exception as error:

        raise HTTPException(
            status_code=401,
            detail=str(error)
        )

    session = result["session"]
    profile = result["profile"]

    try:
        SupabaseService.create_audit_log(
            user_id=profile.get("id"),
            action="USER_LOGIN",
            entity_type="profile",
            entity_id=profile.get("id"),
            description=f"User {profile.get('username')} logged in as {profile.get('role')}",
            metadata={"role": profile.get("role"), "username": profile.get("username")}
        )
    except Exception:
        pass

    return {

        "success": True,

        "message": "Login successful",

        "access_token":
            session.access_token,

        "refresh_token":
            session.refresh_token,

        "token_type":
            "bearer",

        "expires_in":
            session.expires_in,

        "profile":
            profile
    }


# ============================================================
# CURRENT USER
# ============================================================

@router.get("/me")
def current_user(
    authorization: str = Header(None)
):

    token = extract_token(
        authorization
    )


    try:

        user = get_authenticated_user(
            token
        )

        profile = get_profile(
            str(user.id)
        )

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication"
        )


    if not profile.get("is_active"):

        raise HTTPException(
            status_code=403,
            detail="Account is inactive"
        )


    return {

        "success": True,

        "profile": profile
    }


# ============================================================
# LOGOUT
# ============================================================

@router.post("/logout")
def logout(
    authorization: str = Header(None)
):
    user_id = None
    try:
        token = extract_token(authorization)
        user = get_authenticated_user(token)
        user_id = str(user.id)
    except Exception:
        pass

    if user_id:
        try:
            SupabaseService.create_audit_log(
                user_id=user_id,
                action="USER_LOGOUT",
                entity_type="profile",
                entity_id=user_id,
                description="User logged out of the application"
            )
        except Exception:
            pass

    return {
        "success": True,
        "message": "Logged out successfully"
    }


# ============================================================
# ADMIN → CREATE INSPECTOR
# ============================================================

@router.post("/create-inspector")
def admin_create_inspector(
    request: CreateInspectorRequest,
    authorization: str = Header(None)
):

    # --------------------------------------------------------
    # Admin authentication
    # --------------------------------------------------------

    admin = require_admin(
        authorization
    )


    # --------------------------------------------------------
    # Create inspector
    # --------------------------------------------------------

    try:

        inspector = create_inspector(

            username=request.username,

            password=request.password,

            full_name=request.full_name,

            phone=request.phone,

            designation=request.designation,

            department=request.department
        )

        try:
            SupabaseService.create_audit_log(
                user_id=admin.get("id"),
                action="CREATE_INSPECTOR",
                entity_type="profile",
                entity_id=inspector.get("id"),
                description=f"Admin created inspector {request.username}",
                metadata={"username": request.username, "department": request.department}
            )
        except Exception:
            pass

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


    return {

        "success": True,

        "message":
            "Inspector created successfully",

        "inspector":
            inspector
    }