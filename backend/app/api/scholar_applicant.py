import os
import shutil
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, Form, HTTPException, Header, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.services.auth_service import extract_token, get_authenticated_user, get_profile
from app.services.document_preprocessor import document_preprocessor
from app.services.gemini_service import gemini_vision_service
from app.services.ocr_service import ocr_service
from app.services.scholar_service import scholar_service

router = APIRouter(
    prefix="/api/applicant",
    tags=["Applicant Profile & Documents"],
)

PROFILE_DOCS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "uploads",
    "profile_docs"
)
os.makedirs(PROFILE_DOCS_DIR, exist_ok=True)


class ApplicantProfileUpdateRequest(BaseModel):
    # Personal & Contact
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    state_of_domicile: Optional[str] = None
    district: Optional[str] = None

    # Tribal & Statutory Caste Identification
    category: Optional[str] = None
    tribe_name: Optional[str] = None
    caste_certificate_no: Optional[str] = None
    caste_issuing_authority: Optional[str] = None
    caste_issue_date: Optional[str] = None

    # Education & Academic Enrolment
    education_qualification: Optional[str] = None
    academic_level: Optional[str] = None
    institution_name: Optional[str] = None
    course_name: Optional[str] = None
    academic_year: Optional[str] = None
    aggregate_percentage: Optional[float] = None
    admission_status: Optional[str] = None

    # Family & Income Details
    father_or_guardian_name: Optional[str] = None
    guardian_occupation: Optional[str] = None
    annual_income: Optional[float] = None
    income_certificate_no: Optional[str] = None
    income_issuing_authority: Optional[str] = None
    income_issue_date: Optional[str] = None

    # DBT Bank Details
    bank_name: Optional[str] = None
    bank_account_no: Optional[str] = None
    bank_ifsc: Optional[str] = None


@router.get("/profile")
def get_applicant_profile(authorization: str = Header(...)):
    """
    Get persistent ST applicant profile, completion checklist, and associated documents.
    """
    token = extract_token(authorization)
    try:
        user = get_authenticated_user(token)
        user_auth_profile = get_profile(str(user.id))
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    applicant_data = scholar_service.get_applicant_profile(str(user.id))

    if not applicant_data:
        # Initialize default profile using auth registration info
        initial = {
            "full_name": user_auth_profile.get("full_name") or "",
            "email": user_auth_profile.get("email") or "",
            "phone": user_auth_profile.get("phone") or "",
            "category": "Scheduled Tribe (ST)",
            "academic_year": "2026-2027",
            "admission_status": "CONFIRMED"
        }
        applicant_data = scholar_service.upsert_applicant_profile(str(user.id), initial)

    combined = {
        "id": str(user.id),
        "username": user_auth_profile.get("username"),
        "role": user_auth_profile.get("role"),
        "full_name": applicant_data.get("full_name") or user_auth_profile.get("full_name"),
        "email": applicant_data.get("email") or user_auth_profile.get("email"),
        "phone": applicant_data.get("phone") or user_auth_profile.get("phone"),
        "dob": applicant_data.get("dob") or "",
        "gender": applicant_data.get("gender") or "",
        "address": applicant_data.get("address") or "",
        "pincode": applicant_data.get("pincode") or "",
        "state_of_domicile": applicant_data.get("state_of_domicile") or "",
        "district": applicant_data.get("district") or "",
        "category": applicant_data.get("category") or "Scheduled Tribe (ST)",
        "tribe_name": applicant_data.get("tribe_name") or "",
        "caste_certificate_no": applicant_data.get("caste_certificate_no") or "",
        "caste_verified": bool(applicant_data.get("caste_verified")),
        "caste_verification_details": applicant_data.get("caste_verification_details"),
        "caste_issuing_authority": applicant_data.get("caste_issuing_authority") or "",
        "caste_issue_date": applicant_data.get("caste_issue_date") or "",
        "education_qualification": applicant_data.get("education_qualification") or applicant_data.get("academic_level") or "",
        "academic_level": applicant_data.get("academic_level") or applicant_data.get("education_qualification") or "UNDERGRADUATE",
        "institution_name": applicant_data.get("institution_name") or "",
        "course_name": applicant_data.get("course_name") or "",
        "academic_year": applicant_data.get("academic_year") or "2026-2027",
        "aggregate_percentage": applicant_data.get("aggregate_percentage"),
        "admission_status": applicant_data.get("admission_status") or "CONFIRMED",
        "father_or_guardian_name": applicant_data.get("father_or_guardian_name") or "",
        "guardian_occupation": applicant_data.get("guardian_occupation") or "",
        "annual_income": applicant_data.get("annual_income"),
        "income_certificate_no": applicant_data.get("income_certificate_no") or "",
        "income_issuing_authority": applicant_data.get("income_issuing_authority") or "",
        "income_issue_date": applicant_data.get("income_issue_date") or "",
        "bank_name": applicant_data.get("bank_name") or "",
        "bank_account_no": applicant_data.get("bank_account_no") or "",
        "bank_ifsc": applicant_data.get("bank_ifsc") or "",
        "profile_completion_percentage": applicant_data.get("profile_completion_percentage", 0),
        "completion_stats": applicant_data.get("completion_stats"),
        "documents": applicant_data.get("documents", [])
    }

    return {
        "success": True,
        "profile": combined
    }


@router.post("/profile")
def update_applicant_profile(
    request: ApplicantProfileUpdateRequest,
    authorization: str = Header(...)
):
    """
    Update persistent ST applicant profile data and refresh completion status.
    """
    token = extract_token(authorization)
    try:
        user = get_authenticated_user(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    update_payload = request.model_dump(exclude_unset=True)
    updated = scholar_service.upsert_applicant_profile(
        user_id=str(user.id),
        profile_data=update_payload
    )

    return {
        "success": True,
        "message": "Applicant profile updated successfully and synchronized across schemes.",
        "profile": updated
    }


# =========================================================
# ASSOCIATED DOCUMENTS REPOSITORY
# =========================================================

@router.get("/documents")
def get_applicant_documents(authorization: str = Header(...)):
    """
    List all documents associated with the applicant's profile.
    """
    token = extract_token(authorization)
    try:
        user = get_authenticated_user(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    docs = scholar_service.get_profile_documents(str(user.id))
    return {
        "success": True,
        "count": len(docs),
        "documents": docs
    }


@router.post("/documents/upload")
async def upload_profile_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    document_name: Optional[str] = Form(None),
    authorization: str = Header(...)
):
    """
    Upload and associate a statutory or academic document with the applicant profile.
    Automatically runs OCR and Gemini factual field extraction, updating verification details.
    """
    token = extract_token(authorization)
    try:
        user = get_authenticated_user(token)
        user_id = str(user.id)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".png", ".jpg", ".jpeg", ".webp"]:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Upload PDF, PNG, or JPEG.")

    clean_doc_type = document_type.upper().strip()
    file_id = uuid.uuid4().hex[:10]
    saved_filename = f"profile_{clean_doc_type.lower()}_{file_id}{ext}"
    saved_path = os.path.join(PROFILE_DOCS_DIR, saved_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(saved_path)
    ocr_raw_text = ""
    extracted_fields: Dict[str, Any] = {}
    verification_status = "UPLOADED"

    # Preprocessing, OCR & AI Extraction
    try:
        prep = document_preprocessor.process_document(saved_path)
        primary_img = prep.get("primary_image_path")
        if primary_img:
            ocr_results = ocr_service.extract_text(primary_img)
            ocr_raw_text = "\n".join([r.get("text", "") for r in ocr_results])

            hint_map = {
                "CASTE_CERTIFICATE": "Scheduled Tribe Statutory Caste Certificate issued under Article 342",
                "INCOME_CERTIFICATE": "Annual Family Income Certificate issued by Revenue Authority",
                "MARKSHEET": "Degree Marksheet / Academic Transcript",
                "ADMISSION_OFFER": "Institution Admission Letter / Bonafide Certificate",
                "IDENTITY_CARD": "Government Identity Card / Aadhaar / Student ID",
                "PHOTO": "Applicant Passport Photograph"
            }
            hint = hint_map.get(clean_doc_type, "Statutory Verification Document")

            extracted_fields = gemini_vision_service.extract_document_data(
                image_path=primary_img,
                document_hint=hint,
                ocr_results=ocr_results
            )
    except Exception as e:
        print(f"[Profile Documents] Extraction warning for {clean_doc_type}: {e}")

    # Specific Verification actions per document type
    profile_updates: Dict[str, Any] = {}

    if clean_doc_type == "CASTE_CERTIFICATE":
        try:
            curr_prof = scholar_service.get_applicant_profile(user_id) or {}
            caste_ver = scholar_service.verify_st_caste(
                extracted_caste_data=extracted_fields,
                applicant_declared_name=curr_prof.get("full_name")
            )
            verification_status = "VERIFIED" if caste_ver.get("caste_verified") else "PENDING_REVIEW"
            profile_updates["caste_verified"] = caste_ver.get("caste_verified")
            profile_updates["caste_verification_details"] = caste_ver
            if caste_ver.get("tribe_name"):
                profile_updates["tribe_name"] = caste_ver.get("tribe_name")
            if caste_ver.get("certificate_number"):
                profile_updates["caste_certificate_no"] = caste_ver.get("certificate_number")
            if caste_ver.get("issuing_authority"):
                profile_updates["caste_issuing_authority"] = caste_ver.get("issuing_authority")
            if caste_ver.get("issue_date"):
                profile_updates["caste_issue_date"] = caste_ver.get("issue_date")
        except Exception as e:
            print(f"[Profile Documents] Caste validation error: {e}")

    elif clean_doc_type == "INCOME_CERTIFICATE":
        if extracted_fields.get("annual_family_income"):
            try:
                inc_val = float(str(extracted_fields.get("annual_family_income")).replace(",", ""))
                profile_updates["annual_income"] = inc_val
            except Exception:
                pass
        if extracted_fields.get("certificate_number"):
            profile_updates["income_certificate_no"] = str(extracted_fields.get("certificate_number"))
        if extracted_fields.get("issuing_authority"):
            profile_updates["income_issuing_authority"] = str(extracted_fields.get("issuing_authority"))
        verification_status = "VERIFIED"

    elif clean_doc_type in ["MARKSHEET", "ADMISSION_OFFER"]:
        verification_status = "VERIFIED"
        if extracted_fields.get("institution_name"):
            profile_updates["institution_name"] = str(extracted_fields.get("institution_name"))
        if extracted_fields.get("course_name"):
            profile_updates["course_name"] = str(extracted_fields.get("course_name"))

    # Save document record
    doc_record = scholar_service.add_profile_document(
        user_id=user_id,
        document_type=clean_doc_type,
        document_name=document_name or file.filename,
        file_name=file.filename,
        file_path=saved_path,
        file_type=ext.replace(".", ""),
        file_size=file_size,
        ocr_raw_text=ocr_raw_text,
        extracted_fields=extracted_fields,
        verification_status=verification_status
    )

    # Apply auto-extracted profile updates
    if profile_updates:
        scholar_service.upsert_applicant_profile(user_id, profile_updates)

    fresh_profile = scholar_service.get_applicant_profile(user_id)

    return {
        "success": True,
        "message": f"{clean_doc_type.replace('_', ' ').title()} successfully associated with your profile.",
        "document": doc_record,
        "profile": fresh_profile
    }


@router.delete("/documents/{doc_id}")
def delete_applicant_document(
    doc_id: str,
    authorization: str = Header(...)
):
    """
    Remove an associated document from the applicant profile.
    """
    token = extract_token(authorization)
    try:
        user = get_authenticated_user(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    deleted = scholar_service.delete_profile_document(user_id=str(user.id), doc_id=doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found.")

    fresh_profile = scholar_service.get_applicant_profile(str(user.id))
    return {
        "success": True,
        "message": "Document removed from profile.",
        "profile": fresh_profile
    }


@router.get("/documents/{doc_id}/file")
def get_applicant_document_file(
    doc_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Download or preview an associated profile document.
    """
    # For document viewing, optionally allow token in authorization
    user_id = None
    if authorization:
        try:
            token = extract_token(authorization)
            user = get_authenticated_user(token)
            user_id = str(user.id)
        except Exception:
            pass

    doc = None
    if user_id:
        doc = scholar_service.get_profile_document(user_id=user_id, doc_id=doc_id)

    if not doc:
        # Search directly by doc_id
        import sqlite3
        conn = sqlite3.connect(scholar_service.DB_PATH if hasattr(scholar_service, "DB_PATH") else os.path.join(scholar_service.BASE_DIR, "scholar_st.db"))
        conn.row_factory = sqlite3.Row
        r = conn.execute("SELECT * FROM applicant_profile_documents WHERE id = ?", (doc_id,)).fetchone()
        conn.close()
        if r:
            doc = dict(r)

    if not doc or not doc.get("file_path") or not os.path.exists(doc.get("file_path")):
        raise HTTPException(status_code=404, detail="Document file not found on server.")

    media_type = "application/pdf" if doc.get("file_type") == "pdf" else f"image/{doc.get('file_type', 'jpeg')}"
    return FileResponse(
        path=doc["file_path"],
        media_type=media_type,
        filename=doc.get("file_name", "document")
    )


# =========================================================
# NOTIFICATIONS
# =========================================================

@router.get("/notifications")
def get_notifications(authorization: str = Header(...)):
    """
    Get in-app notifications for the applicant.
    """
    token = extract_token(authorization)
    try:
        user = get_authenticated_user(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    notifs = scholar_service.get_notifications(str(user.id))
    return {
        "success": True,
        "count": len(notifs),
        "notifications": notifs
    }


@router.post("/notifications/read")
def mark_notifications_read(authorization: str = Header(...)):
    """
    Mark all notifications as read.
    """
    token = extract_token(authorization)
    try:
        user = get_authenticated_user(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    scholar_service.mark_notifications_read(str(user.id))
    return {
        "success": True,
        "message": "Notifications marked as read"
    }


# =========================================================
# CROSS-SCHEME INTELLIGENCE ENGINE
# =========================================================

@router.get("/cross-scheme-intelligence")
def get_cross_scheme_intelligence(authorization: str = Header(...)):
    """
    Cross-Scheme Intelligence:
    Compares the applicant's verified profile & documents against all active schemes.

    Evaluates:
    Applicant Profile
    ↓
    Active Scholarship/Fellowship Schemes
    ↓
    Rule Evaluation
    ↓
    Eligible Opportunities, Potentially Eligible, Missing Requirements, Required Documents

    CRITICAL GUARDRAIL:
    Does NOT automatically submit applications.
    The applicant chooses which scheme to apply for.
    """
    token = extract_token(authorization)
    try:
        user = get_authenticated_user(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        intelligence = scholar_service.get_cross_scheme_intelligence(str(user.id))
        return {
            "success": True,
            "intelligence": intelligence
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scheme-gaps/{scheme_code}")
def get_applicant_scheme_gaps(scheme_code: str, authorization: str = Header(...)):
    """
    Scheme Gap Intelligence for authenticated applicant:
    Evaluates specific missing requirements against active scheme rules in Supabase:
    Requirement → Applicant Status → Gap → Suggested Action
    """
    token = extract_token(authorization)
    try:
        user = get_authenticated_user(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        gap_intel = scholar_service.get_scheme_gap_intelligence(str(user.id), scheme_code)
        return {
            "success": True,
            "scheme_code": scheme_code.upper(),
            "gap_intelligence": gap_intel
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

