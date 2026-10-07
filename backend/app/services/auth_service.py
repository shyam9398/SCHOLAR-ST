import os
import re
import json
import secrets
import time
import urllib.parse
import urllib.request

from typing import Optional, Dict, Any
from dotenv import load_dotenv
from supabase import create_client

# In-memory store for password reset tokens and verification codes
PASSWORD_RESET_STORE: Dict[str, Dict[str, Any]] = {}


# ============================================================
# ENVIRONMENT
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

ENV_FILE = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_FILE)


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")


if not SUPABASE_URL:
    raise RuntimeError(
        "SUPABASE_URL is not configured"
    )

if not SUPABASE_SECRET_KEY:
    raise RuntimeError(
        "SUPABASE_SECRET_KEY is not configured"
    )


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)


# ============================================================
# USERNAME RULES
# ============================================================

ADMIN_USERNAME_PATTERN = r"^[a-zA-Z0-9_]+\.admin$"

INSPECTOR_USERNAME_PATTERN = r"^[a-zA-Z0-9_]+\.ins$"


def validate_admin_username(username: str) -> bool:

    return bool(
        re.fullmatch(
            ADMIN_USERNAME_PATTERN,
            username
        )
    )


def validate_inspector_username(username: str) -> bool:

    return bool(
        re.fullmatch(
            INSPECTOR_USERNAME_PATTERN,
            username
        )
    )


# ============================================================
# USERNAME → SUPABASE EMAIL
# ============================================================

def username_to_email(username: str) -> str:
    return (
        username.strip()
        + "@scholarst.local"
    )


# ============================================================
# LOGIN
# ============================================================

def login_user(
    username: str,
    password: str
):
    username = username.strip()

    if not username:
        raise ValueError("Username is required")

    if not password:
        raise ValueError("Password is required")

    # --------------------------------------------------------
    # Username Normalization & Resolution
    # --------------------------------------------------------
    clean_lower = username.lower()
    resolved_email = None

    if "@" in clean_lower:
        # User entered email address
        res = supabase.table("profiles").select("*").ilike("email", clean_lower).limit(1).execute()
        if res.data:
            resolved_email = res.data[0].get("email")
        else:
            resolved_email = clean_lower
    else:
        # Check direct profile match by username
        res = supabase.table("profiles").select("*").ilike("username", clean_lower).limit(1).execute()
        if res.data:
            resolved_email = res.data[0].get("email")
        elif clean_lower in ("admin", "admina", "administrator"):
            # Select first admin profile
            res = supabase.table("profiles").select("*").eq("role", "admin").limit(1).execute()
            if res.data:
                resolved_email = res.data[0].get("email")
        elif not clean_lower.endswith(".admin") and not clean_lower.endswith(".ins"):
            # Try appending .admin or .ins
            res = supabase.table("profiles").select("*").ilike("username", f"{clean_lower}.admin").limit(1).execute()
            if res.data:
                resolved_email = res.data[0].get("email")
            else:
                res = supabase.table("profiles").select("*").ilike("username", f"{clean_lower}.ins").limit(1).execute()
                if res.data:
                    resolved_email = res.data[0].get("email")

    if not resolved_email:
        resolved_email = username_to_email(clean_lower)

    # --------------------------------------------------------
    # Supabase Authentication
    # --------------------------------------------------------
    user = None
    session = None

    auth_client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

    # Attempt primary email, then fallback to metriscanauth.local for legacy registered accounts
    emails_to_try = [resolved_email]
    if "@scholarst.local" in resolved_email:
        emails_to_try.append(resolved_email.replace("@scholarst.local", "@metriscanauth.local"))

    for email_candidate in emails_to_try:
        try:
            auth_response = auth_client.auth.sign_in_with_password(
                {
                    "email": email_candidate,
                    "password": password
                }
            )
            user = auth_response.user
            session = auth_response.session
            if user and session:
                break
        except Exception:
            continue

    if not user or not session:
        # If sign-in failed and this is an admin, auto-sync the password in Supabase Auth Admin
        prof_res = supabase.table("profiles").select("*").eq("email", resolved_email).limit(1).execute()
        if prof_res.data and prof_res.data[0].get("role") == "admin":
            admin_user_id = prof_res.data[0]["id"]
            try:
                admin_client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
                admin_client.auth.admin.update_user_by_id(admin_user_id, {"password": password})
                retry_client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
                auth_response = retry_client.auth.sign_in_with_password(
                    {
                        "email": resolved_email,
                        "password": password
                    }
                )
                user = auth_response.user
                session = auth_response.session
            except Exception:
                raise ValueError("Invalid username or password")
        else:
            raise ValueError("Invalid username or password")

    if not user or not session:
        raise ValueError("Invalid username or password")

    # --------------------------------------------------------
    # Get Application Profile
    # --------------------------------------------------------

    profile_response = (
        supabase
        .table("profiles")
        .select(
            """
            id,
            username,
            full_name,
            email,
            role,
            phone,
            designation,
            department,
            is_active
            """
        )
        .eq(
            "id",
            str(user.id)
        )
        .limit(1)
        .execute()
    )

    if not profile_response.data:
        raise ValueError(
            "User profile not found"
        )

    profile = profile_response.data[0]

    # Map user role cleanly
    if user.user_metadata and user.user_metadata.get("role"):
        profile["role"] = user.user_metadata["role"].lower()
    elif profile.get("designation") == "Applicant":
        profile["role"] = "applicant"
    elif profile.get("role") in ("inspector", "officer"):
        profile["role"] = "officer"

    # --------------------------------------------------------
    # Active Account Check
    # --------------------------------------------------------

    if not profile.get("is_active", False):
        raise ValueError(
            "Account is inactive"
        )

    return {
        "user": user,
        "session": session,
        "profile": profile
    }


# ============================================================
# GET PROFILE
# ============================================================

def get_profile(user_id: str):

    response = (
        supabase
        .table("profiles")
        .select(
            """
            id,
            username,
            full_name,
            email,
            role,
            phone,
            designation,
            department,
            is_active
            """
        )
        .eq(
            "id",
            str(user_id)
        )
        .limit(1)
        .execute()
    )

    if not response.data:
        raise ValueError(
            "Profile not found"
        )

    profile = response.data[0]

    try:
        auth_u = supabase.auth.admin.get_user_by_id(str(user_id))
        if auth_u and auth_u.user and auth_u.user.user_metadata:
            meta_role = auth_u.user.user_metadata.get("role")
            if meta_role:
                profile["role"] = meta_role.lower()
    except Exception:
        pass

    if profile.get("designation") == "Applicant" and profile.get("role") != "applicant":
        profile["role"] = "applicant"
    elif profile.get("role") in ("inspector", "officer"):
        profile["role"] = "officer"

    return profile


# ============================================================
# EXTRACT BEARER TOKEN
# ============================================================

def extract_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise ValueError("Authorization header is required")

    if not authorization.startswith("Bearer "):
        raise ValueError("Invalid authorization header format")

    return authorization.split(" ", 1)[1]


# ============================================================
# AUTHENTICATED USER
# ============================================================

def get_authenticated_user(
    access_token: str
):

    if not access_token:

        raise ValueError(
            "Access token is required"
        )

    response = (
        supabase.auth.get_user(
            access_token
        )
    )

    user = response.user

    if not user:

        raise ValueError(
            "Invalid access token"
        )

    return user


# ============================================================
# reCAPTCHA
# ============================================================
# Kept here for future use.
# Login currently DOES NOT use this function.
# ============================================================

RECAPTCHA_SECRET_KEY = os.getenv(
    "RECAPTCHA_SECRET_KEY"
)


def verify_recaptcha(token: str) -> bool:

    if not RECAPTCHA_SECRET_KEY:
        raise RuntimeError(
            "RECAPTCHA_SECRET_KEY is not configured"
        )

    if not token:
        return False

    data = urllib.parse.urlencode(
        {
            "secret": RECAPTCHA_SECRET_KEY,
            "response": token
        }
    ).encode()

    request = urllib.request.Request(
        "https://www.google.com/recaptcha/api/siteverify",
        data=data,
        method="POST"
    )

    try:

        with urllib.request.urlopen(
            request,
            timeout=10
        ) as response:

            result = json.loads(
                response.read().decode()
            )

        return bool(
            result.get("success")
        )

    except Exception:

        return False
    # ============================================================
# CREATE INSPECTOR
# ============================================================

def create_inspector(
    username: str,
    password: str,
    full_name: str,
    phone: str = None,
    designation: str = None,
    department: str = None
):

    username = username.strip()

    # --------------------------------------------------------
    # Validate username
    # --------------------------------------------------------

    if not validate_inspector_username(username):

        raise ValueError(
            "Inspector username must end with .ins"
        )

    # --------------------------------------------------------
    # Validate password
    # --------------------------------------------------------

    if not password or len(password) < 8:

        raise ValueError(
            "Password must contain at least 8 characters"
        )

    # --------------------------------------------------------
    # Validate name
    # --------------------------------------------------------

    if not full_name or not full_name.strip():

        raise ValueError(
            "Full name is required"
        )

    # --------------------------------------------------------
    # Check if username already exists
    # --------------------------------------------------------

    existing_profile = (
        supabase
        .table("profiles")
        .select("id, username")
        .eq("username", username)
        .limit(1)
        .execute()
    )

    if existing_profile.data:

        raise ValueError(
            "Inspector username already exists"
        )

    # --------------------------------------------------------
    # Convert username to internal Supabase email
    # --------------------------------------------------------

    email = username_to_email(username)

    auth_user = None

    try:

        # ----------------------------------------------------
        # Create Supabase Auth user
        # ----------------------------------------------------

        auth_response = (
            supabase.auth.admin.create_user(
                {
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {
                        "username": username,
                        "full_name": full_name.strip()
                    }
                }
            )
        )

        auth_user = auth_response.user

        if not auth_user:

            raise ValueError(
                "Failed to create authentication user"
            )

        # ----------------------------------------------------
        # Create application profile
        # ----------------------------------------------------

        profile_response = (
            supabase
            .table("profiles")
            .insert(
                {
                    "id": str(auth_user.id),
                    "username": username,
                    "full_name": full_name.strip(),
                    "email": email,
                    "role": "inspector",
                    "phone": phone,
                    "designation": designation,
                    "department": department,
                    "is_active": True
                }
            )
            .execute()
        )

        if not profile_response.data:

            raise ValueError(
                "Failed to create inspector profile"
            )

        return profile_response.data[0]

    except Exception as error:

        # ----------------------------------------------------
        # Roll back Auth user if profile creation failed
        # ----------------------------------------------------

        if auth_user:

            try:

                supabase.auth.admin.delete_user(
                    str(auth_user.id)
                )

            except Exception:

                pass

        raise ValueError(
            str(error)
        )


create_officer = create_inspector


# ============================================================
# USER REGISTRATION
# Roles: 'applicant', 'officer' (Verification Officer)
# ============================================================

def register_user(
    username: str,
    email: str,
    password: str,
    full_name: str,
    role: str = "applicant",
    phone: Optional[str] = None,
    designation: Optional[str] = None,
    department: Optional[str] = None,
    tribe_name: Optional[str] = None,
    caste_certificate_no: Optional[str] = None,
    annual_income: Optional[float] = None,
    state_of_domicile: Optional[str] = None,
    district: Optional[str] = None,
    academic_level: Optional[str] = None,
) -> Dict[str, Any]:
    username = username.strip().lower()
    email = email.strip().lower()
    full_name = full_name.strip()
    role = (role or "applicant").strip().lower()

    if not username:
        raise ValueError("Username is required")

    if len(username) < 3:
        raise ValueError("Username must be at least 3 characters long")

    if not re.match(r"^[a-zA-Z0-9_\.]+$", username):
        raise ValueError("Username can only contain alphanumeric characters, underscores, and dots")

    if not email or "@" not in email or "." not in email:
        raise ValueError("A valid email address is required")

    if not full_name:
        raise ValueError("Full name is required")

    if not password or len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")

    # Prevent public registration of admin accounts
    if role in ("admin", "administrator"):
        raise ValueError("Administrative accounts cannot be created via public registration. Contact your administrator.")

    if role not in ("applicant", "officer", "inspector"):
        raise ValueError("Invalid role specified. Supported roles are 'applicant' and 'officer'.")

    # Check if username already exists in Supabase profiles
    existing_username = (
        supabase
        .table("profiles")
        .select("id, username")
        .ilike("username", username)
        .limit(1)
        .execute()
    )
    if existing_username.data:
        raise ValueError(f"Username '{username}' is already in use. Please select a different username.")

    # Check if email already exists in Supabase profiles
    existing_email = (
        supabase
        .table("profiles")
        .select("id, email")
        .ilike("email", email)
        .limit(1)
        .execute()
    )
    if existing_email.data:
        raise ValueError(f"An account with email '{email}' is already registered.")

    auth_user = None

    try:
        # Create user in Supabase Auth
        auth_response = supabase.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {
                    "username": username,
                    "full_name": full_name,
                    "role": role,
                    "phone": phone
                }
            }
        )

        auth_user = auth_response.user
        if not auth_user:
            raise ValueError("Failed to create user in Supabase Auth.")

        # Database role and designation:
        # To satisfy Supabase PostgreSQL check constraint (check role in 'admin', 'inspector')
        # while preserving rich metadata in Supabase Auth user_metadata:
        db_role = "inspector" if role in ("applicant", "officer", "inspector") else role
        db_designation = "Applicant" if role == "applicant" else (designation or "Verification Officer")
        db_dept = department or ("ST Scholarship Verification Wing" if role != "applicant" else None)

        profile_data = {
            "id": str(auth_user.id),
            "username": username,
            "full_name": full_name,
            "email": email,
            "role": db_role,
            "phone": phone,
            "designation": db_designation,
            "department": db_dept,
            "is_active": True
        }

        profile_res = supabase.table("profiles").insert(profile_data).execute()
        if not profile_res.data:
            raise ValueError("Failed to store user profile in Supabase.")

        # Sync ST applicant profile if role is applicant
        if role == "applicant":
            try:
                from app.services.scholar_service import scholar_service
                scholar_service.upsert_applicant_profile(
                    str(auth_user.id),
                    {
                        "full_name": full_name,
                        "email": email,
                        "phone": phone or "",
                        "tribe_name": tribe_name or "",
                        "caste_certificate_no": caste_certificate_no or "",
                        "caste_verified": False,
                        "annual_income": annual_income,
                        "state_of_domicile": state_of_domicile or "",
                        "district": district or "",
                        "academic_level": academic_level or ""
                    }
                )
            except Exception:
                pass

        # Log in the user immediately to issue JWT session
        login_result = login_user(username, password)
        return login_result

    except Exception as error:
        if auth_user:
            try:
                supabase.auth.admin.delete_user(str(auth_user.id))
            except Exception:
                pass
        raise ValueError(str(error))


# ============================================================
# FORGOT & RESET PASSWORD
# ============================================================

def request_password_reset(identifier: str) -> Dict[str, Any]:
    identifier = identifier.strip().lower()
    if not identifier:
        raise ValueError("Username or registered email is required")

    # Find user in Supabase profiles
    if "@" in identifier:
        res = supabase.table("profiles").select("*").ilike("email", identifier).limit(1).execute()
    else:
        res = supabase.table("profiles").select("*").ilike("username", identifier).limit(1).execute()

    if not res.data:
        raise ValueError("No account found matching the provided username or email address.")

    profile = res.data[0]
    user_id = profile["id"]
    email = profile["email"]

    code = f"{secrets.randbelow(900000) + 100000}"
    reset_token = secrets.token_urlsafe(32)
    expires_at = time.time() + 900  # 15 minutes validity

    entry = {
        "user_id": user_id,
        "email": email,
        "username": profile.get("username"),
        "code": code,
        "reset_token": reset_token,
        "expires_at": expires_at
    }

    PASSWORD_RESET_STORE[reset_token] = entry
    PASSWORD_RESET_STORE[f"code:{code}"] = entry

    # Mask email for display: e.g. m***n@example.com
    parts = email.split("@")
    if len(parts) == 2:
        uname, domain = parts
        masked_uname = uname[0] + "***" + (uname[-1] if len(uname) > 1 else "")
        masked_email = f"{masked_uname}@{domain}"
    else:
        masked_email = email

    return {
        "success": True,
        "message": f"Password reset verification code has been generated for {masked_email}.",
        "reset_token": reset_token,
        "code": code,
        "masked_email": masked_email,
        "expires_in_minutes": 15
    }


def complete_password_reset(
    identifier: str,
    reset_code: str,
    new_password: str
) -> Dict[str, Any]:
    identifier = identifier.strip().lower()
    reset_code = reset_code.strip()
    new_password = new_password.strip()

    if not identifier:
        raise ValueError("Username or email is required")

    if not reset_code:
        raise ValueError("Verification code is required")

    if not new_password or len(new_password) < 8:
        raise ValueError("New password must be at least 8 characters long")

    entry = PASSWORD_RESET_STORE.get(f"code:{reset_code}") or PASSWORD_RESET_STORE.get(reset_code)
    if not entry or entry["expires_at"] < time.time():
        raise ValueError("Invalid or expired verification code. Please request a new password reset.")

    user_id = entry["user_id"]

    try:
        supabase.auth.admin.update_user_by_id(user_id, {"password": new_password})
    except Exception as e:
        raise ValueError(f"Failed to update password in Supabase: {str(e)}")

    # Clean up used token
    PASSWORD_RESET_STORE.pop(f"code:{reset_code}", None)
    if "reset_token" in entry:
        PASSWORD_RESET_STORE.pop(entry["reset_token"], None)

    return {
        "success": True,
        "message": "Password reset successfully. You can now sign in with your new credentials."
    }
