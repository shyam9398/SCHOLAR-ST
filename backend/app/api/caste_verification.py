import os
import shutil
import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, File, Form, HTTPException, Header, UploadFile
from pydantic import BaseModel

from app.services.auth_service import extract_token, get_authenticated_user
from app.services.document_preprocessor import document_preprocessor
from app.services.gemini_service import gemini_vision_service
from app.services.ocr_service import ocr_service
from app.services.scholar_service import RECOGNIZED_ST_TRIBES, scholar_service

router = APIRouter(
    prefix="/api/caste",
    tags=["ST Caste Certificate Validation"],
)

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "uploads",
    "caste_certs"
)
os.makedirs(UPLOAD_DIR, exist_ok=True)


class CasteConfirmationRequest(BaseModel):
    file_path: str
    file_name: str
    applicant_name: str
    certificate_number: str
    category: Optional[str] = "Scheduled Tribe (ST)"
    tribe_name: Optional[str] = None
    issuing_authority: Optional[str] = None
    issue_date: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    verification_details: Optional[Dict[str, Any]] = None


@router.get("/tribes")
def list_recognized_tribes():
    """
    List recognized Scheduled Tribe communities under Article 342.
    """
    return {
        "success": True,
        "count": len(RECOGNIZED_ST_TRIBES),
        "tribes": sorted(RECOGNIZED_ST_TRIBES)
    }


@router.post("/validate")
async def validate_caste_certificate(
    file: UploadFile = File(...),
    applicant_name: Optional[str] = Form(None),
    declared_tribe: Optional[str] = Form(None),
    authorization: Optional[str] = Header(None)
):
    """
    Pipeline:
    1. Upload Caste/ST Certificate
    2. OpenCV preprocessing (PyMuPDF high-DPI rasterization + OpenCV CLAHE/deskewing/seal enhancement)
    3. PaddleOCR extraction (text lines & coordinates)
    4. Structured field extraction (Applicant name, Cert No, Category, Authority, Date, Tribe)
    5. Prototype validation: completeness checks, Article 342 statutory consistency, profile cross-match.
       (Explicitly states live government portal verification is simulated for prototype demonstration).
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".png", ".jpg", ".jpeg", ".webp"]:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Upload PDF, PNG, or JPEG.")

    file_id = uuid.uuid4().hex[:10]
    saved_filename = f"caste_{file_id}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, saved_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 1. Document Preprocessing with PyMuPDF & OpenCV
        prep_result = document_preprocessor.process_document(saved_path)
        primary_image_path = prep_result["primary_image_path"]

        # 2. PaddleOCR extraction
        ocr_results = ocr_service.extract_text(primary_image_path)
        avg_conf = (
            round(sum(r.get("confidence", 0) for r in ocr_results) / len(ocr_results), 2)
            if ocr_results else 0.0
        )
        ocr_summary = {
            "lines_extracted": len(ocr_results),
            "confidence_avg": avg_conf
        }

        # 3. Structured field extraction via Gemini / Fallback parser
        extracted_data = gemini_vision_service.extract_document_data(
            image_path=primary_image_path,
            document_hint="Scheduled Tribe Caste Certificate issued by Revenue Authority under Article 342",
            ocr_results=ocr_results
        )

        if not extracted_data.get("tribe_community_name") and declared_tribe:
            extracted_data["tribe_community_name"] = declared_tribe

        # 4. Prototype ST Validation Engine:
        # Evaluates field completeness, Article 342 consistency, and profile matching.
        # (Does NOT claim live government database connectivity).
        verification = scholar_service.verify_st_caste(
            extracted_caste_data=extracted_data,
            applicant_declared_name=applicant_name,
            applicant_declared_tribe=declared_tribe,
            ocr_summary=ocr_summary
        )

        # Image URL for visual inspection
        image_filename = os.path.basename(primary_image_path)
        processed_image_url = f"/uploads/caste_certs/{image_filename}"

        return {
            "success": True,
            "message": "Certificate processed and validated against Article 342 prototype rules.",
            "file_info": {
                "file_id": file_id,
                "file_name": file.filename,
                "file_path": saved_path,
                "is_pdf": prep_result["is_pdf"],
                "total_pages": prep_result["total_pages"],
                "processed_image_url": processed_image_url
            },
            "ocr_summary": ocr_summary,
            "extracted_fields": extracted_data,
            "st_verification": verification
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Caste validation failed: {str(e)}")


@router.post("/confirm")
async def confirm_caste_certificate(
    request: CasteConfirmationRequest,
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Applicant Confirmation Step:
    Applicant reviews and confirms extracted credentials.
    Saves verified document evidence permanently into the applicant's profile
    for zero-redundancy reuse across all scholarship schemes.
    """
    user_id = None
    if x_user_id:
        user_id = x_user_id
    elif authorization:
        try:
            token = extract_token(authorization)
            user = get_authenticated_user(token)
            user_id = str(user.id)
        except Exception as e:
            raise HTTPException(status_code=401, detail=str(e))

    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required to confirm certificate evidence.")

    file_path = request.file_path
    if not os.path.exists(file_path):
        # Fallback check inside uploads
        candidate = os.path.join(UPLOAD_DIR, os.path.basename(file_path))
        if os.path.exists(candidate):
            file_path = candidate
        else:
            raise HTTPException(status_code=404, detail="Certificate evidence file not found.")

    file_size = os.path.getsize(file_path)
    ext = os.path.splitext(file_path)[1].replace(".", "")

    # 1. Save into applicant_profile_documents as permanent evidence
    doc_record = scholar_service.add_profile_document(
        user_id=user_id,
        document_type="CASTE_CERTIFICATE",
        document_name="Scheduled Tribe Statutory Certificate",
        file_name=request.file_name,
        file_path=file_path,
        file_type=ext,
        file_size=file_size,
        ocr_raw_text="",
        extracted_fields={
            "applicant_name": request.applicant_name,
            "certificate_number": request.certificate_number,
            "category": request.category,
            "tribe_name": request.tribe_name,
            "issuing_authority": request.issuing_authority,
            "issue_date": request.issue_date,
            "state": request.state,
            "district": request.district
        },
        verification_status="VERIFIED"
    )

    # 2. Update applicant profile with verified ST credentials
    verification_payload = request.verification_details or {}
    verification_payload["confirmed_by_applicant"] = True
    verification_payload["caste_verified"] = True

    updated_profile = scholar_service.upsert_applicant_profile(
        user_id=user_id,
        profile_data={
            "full_name": request.applicant_name,
            "category": request.category or "Scheduled Tribe (ST)",
            "tribe_name": request.tribe_name,
            "caste_certificate_no": request.certificate_number,
            "caste_verified": 1,
            "caste_verification_details": verification_payload,
            "caste_issuing_authority": request.issuing_authority or "",
            "caste_issue_date": request.issue_date or "",
            "state_of_domicile": request.state or "",
            "district": request.district or ""
        }
    )

    return {
        "success": True,
        "message": "Scheduled Tribe certificate confirmed! Evidence permanently associated with your SCHOLAR-ST profile.",
        "document": doc_record,
        "profile": updated_profile
    }
