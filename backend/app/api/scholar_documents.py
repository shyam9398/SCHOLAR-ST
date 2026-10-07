import os
import shutil
import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, File, Form, HTTPException, Header, UploadFile

from app.services.auth_service import extract_token, get_authenticated_user
from app.services.scholar_document_verifier import (
    scholar_document_verifier,
    DOCUMENT_METADATA_SPEC,
    UPLOAD_DOCS_DIR
)
from app.services.scholar_service import scholar_service

router = APIRouter(
    prefix="/api/documents",
    tags=["Scholarship Document Verification"],
)


def _resolve_applicant_user_id(authorization: Optional[str], x_user_id: Optional[str]) -> Optional[str]:
    """Helper to extract user ID from token or header."""
    if x_user_id:
        return x_user_id
    if authorization:
        try:
            token = extract_token(authorization)
            user = get_authenticated_user(token)
            return str(user.id)
        except Exception:
            pass
    return None


@router.get("/types")
def get_supported_document_types():
    """
    Returns statutory metadata specifications for all supported scholarship document types.
    """
    return {
        "success": True,
        "count": len(DOCUMENT_METADATA_SPEC),
        "document_types": DOCUMENT_METADATA_SPEC
    }


@router.get("/schemes/{scheme_code}/requirements")
def get_scheme_document_requirements(
    scheme_code: str,
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Dynamically fetch required statutory documents for a selected scholarship/fellowship scheme.
    If authenticated, returns the applicant's existing verification status (VALID, INVALID, INCOMPLETE, etc.).
    """
    applicant_user_id = _resolve_applicant_user_id(authorization, x_user_id)
    try:
        report = scholar_document_verifier.get_scheme_requirements(
            scheme_code=scheme_code,
            applicant_user_id=applicant_user_id
        )
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load scheme requirements: {str(e)}")


@router.post("/verify")
async def verify_scheme_document(
    file: UploadFile = File(...),
    scheme_code: str = Form(...),
    document_type: str = Form(...),
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Executes the 8-stage verification pipeline for a scholarship document:
    Upload -> File Validation -> OpenCV Preprocessing -> OCR -> Extraction
    -> Profile Comparison -> Completeness Check -> Store Evidence -> Verification Result

    Returns one of: VALID | INVALID | INCOMPLETE | REQUIRES REVIEW
    With deficiency reasons and remedy suggestions allowing immediate resubmission.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file was uploaded.")

    applicant_user_id = _resolve_applicant_user_id(authorization, x_user_id)
    clean_doc_type = document_type.upper().strip()
    clean_scheme_code = scheme_code.upper().strip()

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".png", ".jpg", ".jpeg", ".webp"]:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Upload PDF, PNG, or JPEG.")

    # Save uploaded file
    file_id = uuid.uuid4().hex[:10]
    saved_filename = f"{clean_scheme_code.lower()}_{clean_doc_type.lower()}_{file_id}{ext}"
    saved_path = os.path.join(UPLOAD_DOCS_DIR, saved_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        res = scholar_document_verifier.verify_document(
            file_path=saved_path,
            file_name=file.filename,
            scheme_code=clean_scheme_code,
            document_type=clean_doc_type,
            applicant_user_id=applicant_user_id
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document verification pipeline failure: {str(e)}")


@router.post("/{verification_id}/resubmit")
async def resubmit_scheme_document(
    verification_id: str,
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Resubmission Flow:
    Re-uploads a clearer or corrected document to replace an invalid or incomplete verification.
    Re-runs the full verification pipeline and updates evidence.
    """
    applicant_user_id = _resolve_applicant_user_id(authorization, x_user_id)

    # Query existing verification
    import sqlite3
    conn = sqlite3.connect(scholar_service.db_path if hasattr(scholar_service, "db_path") else "backend/scholar_st.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    row = cursor.execute("SELECT * FROM scheme_document_verifications WHERE id = ?", (verification_id,)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Original verification record not found.")

    scheme_code = row["scheme_code"]
    document_type = row["document_type"]

    ext = os.path.splitext(file.filename)[1].lower()
    file_id = uuid.uuid4().hex[:10]
    saved_filename = f"resubmit_{scheme_code.lower()}_{document_type.lower()}_{file_id}{ext}"
    saved_path = os.path.join(UPLOAD_DOCS_DIR, saved_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        res = scholar_document_verifier.verify_document(
            file_path=saved_path,
            file_name=file.filename,
            scheme_code=scheme_code,
            document_type=document_type,
            applicant_user_id=applicant_user_id or row["user_id"],
            existing_verification_id=verification_id
        )
        res["message"] = "Document resubmitted and re-verified successfully."
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resubmission pipeline error: {str(e)}")


@router.get("/verifications/{scheme_code}")
def get_applicant_verifications(
    scheme_code: str,
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Get all verified documents and statutory scorecard for an applicant under a specific scheme.
    """
    applicant_user_id = _resolve_applicant_user_id(authorization, x_user_id)
    if not applicant_user_id:
        return {
            "success": True,
            "verifications": []
        }

    verifications = scholar_document_verifier.get_applicant_scheme_verifications(
        user_id=applicant_user_id,
        scheme_code=scheme_code.upper().strip()
    )
    return {
        "success": True,
        "scheme_code": scheme_code.upper().strip(),
        "count": len(verifications),
        "verifications": verifications
    }
