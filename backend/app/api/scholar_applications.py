import json
import os
import shutil
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, Header, Response, UploadFile
from fastapi.responses import FileResponse

from app.services.auth_service import extract_token, get_authenticated_user, get_profile
from app.services.document_preprocessor import document_preprocessor
from app.services.gemini_service import gemini_vision_service
from app.services.ocr_service import ocr_service
from app.services.scholar_report_generator import generate_scholar_pdf_report, build_evidence_verification_report
from app.services.scholar_rule_engine import scholar_rule_engine
from app.services.scholar_service import scholar_service
from app.services.notification_service import notification_service

router = APIRouter(
    prefix="/api/applications",
    tags=["Scholarship Applications & Officer Review"],
)

APP_DOCS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads", "app_docs")
os.makedirs(APP_DOCS_DIR, exist_ok=True)


@router.post("/submit")
async def submit_application(
    scheme_code: str = Form(...),
    applicant_name: str = Form(...),
    applicant_email: Optional[str] = Form(None),
    applicant_phone: Optional[str] = Form(None),
    tribe_name: Optional[str] = Form(None),
    caste_certificate_no: Optional[str] = Form(None),
    annual_family_income: Optional[float] = Form(None),
    aggregate_percentage: Optional[float] = Form(None),
    applicant_age: Optional[int] = Form(None),
    institution_name: Optional[str] = Form(None),
    course_enrolled: Optional[str] = Form(None),
    admission_status: Optional[str] = Form("CONFIRMED"),
    caste_file: Optional[UploadFile] = File(None),
    income_file: Optional[UploadFile] = File(None),
    academic_file: Optional[UploadFile] = File(None),
    offer_file: Optional[UploadFile] = File(None),
    authorization: Optional[str] = Header(None)
):
    """
    Submit ST scholarship/fellowship application with mandatory uploaded documents.
    Pipeline:
    1. PyMuPDF + OpenCV process each document
    2. PaddleOCR extracts text lines
    3. Gemini extracts factual attributes (AI NEVER decides eligibility)
    4. Deterministic Rule Engine evaluates dynamic Supabase rules
    5. Saves full evidence dossier for Verification Officer review
    """
    applicant_id = None
    if authorization:
        try:
            token = extract_token(authorization)
            user = get_authenticated_user(token)
            applicant_id = str(user.id)
        except Exception:
            pass

    applicant_data = {
        "applicant_id": applicant_id,
        "scheme_code": scheme_code.upper().strip(),
        "applicant_name": applicant_name.strip(),
        "applicant_email": applicant_email,
        "applicant_phone": applicant_phone,
        "tribe_name": tribe_name,
        "caste_certificate_no": caste_certificate_no,
        "annual_family_income": annual_family_income,
        "aggregate_percentage": aggregate_percentage,
        "applicant_age": applicant_age,
        "institution_name": institution_name,
        "course_enrolled": course_enrolled,
        "admission_status": admission_status,
        "caste_verified": bool(caste_certificate_no)
    }

    uploaded_doc_records: List[Dict[str, Any]] = []
    extracted_docs_summary: Dict[str, Any] = {}

    file_mapping = [
        ("caste_certificate", caste_file, "Scheduled Tribe Caste Certificate"),
        ("income_certificate", income_file, "Annual Family Income Certificate"),
        ("marksheet", academic_file, "Degree Marksheet / Academic Transcript"),
        ("admission_offer", offer_file, "Admission Offer Letter / Bonafide Certificate")
    ]

    for doc_type, file_obj, hint in file_mapping:
        if file_obj and file_obj.filename:
            ext = os.path.splitext(file_obj.filename)[1].lower()
            save_name = f"{doc_type}_{uuid.uuid4().hex[:8]}{ext}"
            save_path = os.path.join(APP_DOCS_DIR, save_name)

            with open(save_path, "wb") as f:
                shutil.copyfileobj(file_obj.file, f)

            try:
                # Document preprocessing
                prep = document_preprocessor.process_document(save_path)
                ocr_res = ocr_service.extract_text(prep["primary_image_path"])
                raw_text = "\n".join([r.get("text", "") for r in ocr_res])

                # Gemini extraction assistant
                extracted = gemini_vision_service.extract_document_data(
                    image_path=prep["primary_image_path"],
                    document_hint=hint,
                    ocr_results=ocr_res
                )
                extracted_docs_summary[doc_type] = extracted

                uploaded_doc_records.append({
                    "document_type": doc_type.upper(),
                    "file_name": file_obj.filename,
                    "file_path": save_path,
                    "file_type": ext.replace(".", ""),
                    "ocr_raw_text": raw_text,
                    "extracted_fields": extracted
                })
            except Exception as e:
                print(f"[Applications] Error processing {doc_type}: {e}")
                uploaded_doc_records.append({
                    "document_type": doc_type.upper(),
                    "file_name": file_obj.filename,
                    "file_path": save_path,
                    "file_type": ext.replace(".", ""),
                    "ocr_raw_text": "",
                    "extracted_fields": {}
                })
        elif applicant_id:
            # Reusable Profile Data: Automatically attach pre-verified documents from applicant profile!
            try:
                prof_docs = scholar_service.get_profile_documents(applicant_id)
                matching = next(
                    (pd for pd in prof_docs if pd.get("document_type", "").upper() == doc_type.upper()),
                    None
                )
                if matching:
                    uploaded_doc_records.append({
                        "document_type": doc_type.upper(),
                        "file_name": matching.get("file_name"),
                        "file_path": matching.get("file_path"),
                        "file_type": matching.get("file_type", "pdf"),
                        "ocr_raw_text": matching.get("ocr_raw_text", ""),
                        "extracted_fields": matching.get("extracted_fields", {})
                    })
                    extracted_docs_summary[doc_type] = matching.get("extracted_fields", {})
            except Exception as e:
                print(f"[Applications] Error reusing profile document {doc_type}: {e}")

    # Execute submission and dynamic rule evaluation
    try:
        application = scholar_service.submit_application(
            applicant_data=applicant_data,
            documents_extracted_data=extracted_docs_summary,
            document_files=uploaded_doc_records
        )
        return {
            "success": True,
            "message": "Application submitted successfully and evaluated against dynamic scheme rules.",
            "application": application
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/evaluate-sandbox")
async def evaluate_sandbox(
    scheme_code: str = Form(...),
    caste_file: Optional[UploadFile] = File(None),
    income_file: Optional[UploadFile] = File(None),
    academic_file: Optional[UploadFile] = File(None),
    offer_file: Optional[UploadFile] = File(None),
    annual_family_income: Optional[float] = Form(None),
    aggregate_percentage: Optional[float] = Form(None),
    applicant_age: Optional[int] = Form(None)
):
    """
    Live Evaluation Sandbox: Pre-evaluates documents against Supabase scheme rules before final submission.
    """
    scheme = scholar_service.get_scheme(scheme_code.upper())
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{scheme_code}' not found")

    docs_summary: Dict[str, Any] = {}
    file_mapping = [
        ("caste_certificate", caste_file, "Scheduled Tribe Caste Certificate"),
        ("income_certificate", income_file, "Annual Family Income Certificate"),
        ("marksheet", academic_file, "Degree Marksheet / Academic Transcript"),
        ("admission_offer", offer_file, "Admission Offer Letter")
    ]

    for doc_type, file_obj, hint in file_mapping:
        if file_obj and file_obj.filename:
            ext = os.path.splitext(file_obj.filename)[1].lower()
            save_name = f"sandbox_{doc_type}_{uuid.uuid4().hex[:6]}{ext}"
            save_path = os.path.join(APP_DOCS_DIR, save_name)
            with open(save_path, "wb") as f:
                shutil.copyfileobj(file_obj.file, f)

            prep = document_preprocessor.process_document(save_path)
            ocr_res = ocr_service.extract_text(prep["primary_image_path"])
            extracted = gemini_vision_service.extract_document_data(
                image_path=prep["primary_image_path"],
                document_hint=hint,
                ocr_results=ocr_res
            )
            docs_summary[doc_type] = extracted

    rules = scholar_service.get_rules_for_scheme(scheme_code.upper(), active_only=True)
    applicant_data = {
        "scheme_code": scheme_code.upper(),
        "annual_family_income": annual_family_income,
        "aggregate_percentage": aggregate_percentage,
        "applicant_age": applicant_age
    }

    eval_result = scholar_rule_engine.evaluate_application(
        scheme_code=scheme_code.upper(),
        applicant_data=applicant_data,
        extracted_documents_data=docs_summary,
        dynamic_rules=rules
    )

    return {
        "success": True,
        "scheme": scheme,
        "evaluation": eval_result,
        "extracted_documents": docs_summary
    }


@router.get("/")
def list_applications(
    applicant_id: Optional[str] = None,
    status: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """
    List applications. Applicants see their own; Officers/Admins see all applications.
    """
    user_role = None
    auth_user_id = None
    if authorization:
        try:
            token = extract_token(authorization)
            user = get_authenticated_user(token)
            profile = get_profile(str(user.id))
            user_role = profile.get("role", "applicant")
            auth_user_id = str(user.id)
        except Exception:
            pass

    # If applicant, restrict to their own records
    effective_applicant_id = applicant_id
    if user_role == "applicant" or (user_role not in ["admin", "inspector", "officer"] and auth_user_id):
        effective_applicant_id = auth_user_id

    apps = scholar_service.get_applications(applicant_id=effective_applicant_id, status=status)
    return {
        "success": True,
        "count": len(apps),
        "applications": apps
    }


@router.get("/{app_id}")
def get_application_details(app_id: str):
    """
    Get full application record, documents, OCR extracts, and rule validation dossier.
    """
    app = scholar_service.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return {
        "success": True,
        "application": app
    }


@router.get("/{app_id}/verification-report")
def get_evidence_verification_report(app_id: str):
    """
    Get transparent Evidence-Based Verification Report for this application.
    Transparent Structure:
      Document -> Extracted Data -> Rule -> Result -> Evidence
    Overall Screening Result:
      - Eligible
      - Not Eligible
      - Deficiency Found
      - Requires Officer Review
    Includes statutory disclaimer: Not a final government decision.
    Final approval/rejection remains with the human Verification Officer.
    """
    app = scholar_service.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    report = build_evidence_verification_report(app)
    return {
        "success": True,
        "report": report
    }


@router.post("/{app_id}/decision")
def record_officer_decision(
    app_id: str,
    decision_payload: Dict[str, Any],
    authorization: str = Header(...)
):
    """
    Verification Officer determination:
    - Approve application
    - Reject application (mandatory justification)
    - Request clarification / document resubmission
    """
    token = extract_token(authorization)
    try:
        user = get_authenticated_user(token)
        profile = get_profile(str(user.id))
    except Exception:
        raise HTTPException(status_code=401, detail="Officer authentication required")

    role = profile.get("role", "").lower()
    if role not in ["inspector", "officer", "admin"]:
        raise HTTPException(status_code=403, detail="Officer authorization required to record eligibility determination.")

    decision = decision_payload.get("decision", "").upper().strip()
    valid_decisions = [
        "APPROVED", "APPROVE",
        "REJECTED", "REJECT",
        "REQUEST_RESUBMISSION", "RESUBMISSION_REQUESTED", "CLARIFICATION_REQUIRED",
        "UNDER_REVIEW", "REVIEW"
    ]
    if decision not in valid_decisions:
        raise HTTPException(
            status_code=400,
            detail="Decision must be one of: APPROVE, REJECT, REQUEST_RESUBMISSION, or REVIEW"
        )

    remarks = decision_payload.get("remarks", "").strip()
    if decision in ["REJECTED", "REJECT"] and not remarks:
        raise HTTPException(status_code=400, detail="Rejection requires official statutory justification remarks.")

    updated_app = scholar_service.record_officer_decision(
        application_id=app_id,
        officer_id=str(user.id),
        decision=decision,
        remarks=remarks or f"Action {decision} recorded by {profile.get('full_name', 'Verification Officer')}",
        officer_name=profile.get("full_name", "Verification Officer"),
        rule_overrides=decision_payload.get("rule_overrides")
    )

    return {
        "success": True,
        "message": f"Application {decision.replace('_', ' ')} recorded successfully.",
        "application": updated_app
    }


@router.get("/{app_id}/history")
def get_application_action_history(app_id: str):
    """
    Retrieve full audit history of all actions, determinations, and resubmission requests
    recorded on this scholarship application.
    """
    app = scholar_service.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    history = scholar_service.get_application_history(app_id)
    return {
        "success": True,
        "count": len(history),
        "history": history
    }


@router.get("/{app_id}/pdf")
def download_application_pdf(app_id: str, authorization: Optional[str] = Header(None)):
    """
    Download official Verification & Eligibility Dossier PDF.
    """
    app = scholar_service.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    officer_name = "Verification Officer"
    if authorization:
        try:
            token = extract_token(authorization)
            user = get_authenticated_user(token)
            prof = get_profile(str(user.id))
            if prof.get("full_name"):
                officer_name = prof.get("full_name")
        except Exception:
            pass

    pdf_path = generate_scholar_pdf_report(app, officer_name=officer_name)
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(pdf_path)
    )


# =========================================================
# APPLICATION TRACKING & 9-STATE LIFECYCLE ENDPOINTS
# =========================================================

@router.get("/{app_id}/tracking")
def get_application_tracking_details(app_id: str):
    """
    Get comprehensive application tracking dossier for applicants and officers:
    - Current status & statutory description
    - 9-state milestone timeline (DRAFT -> SUBMITTED -> DOCUMENT_VERIFICATION ->
      DEFICIENCY -> RESUBMITTED -> RULE_VALIDATION -> OFFICER_REVIEW -> APPROVED / REJECTED)
    - Deficiencies breakdown & resolution actions
    - Required applicant action banner
    - Officer review status & remarks
    - Full application history audit trail
    - In-app & email notification logs
    """
    try:
        tracking = scholar_service.get_application_tracking(app_id)
        return {
            "success": True,
            "tracking": tracking
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{app_id}/resubmit-deficiency")
async def resubmit_application_deficiency(
    app_id: str,
    document_type: str = Form(...),
    resubmitted_file: UploadFile = File(...),
    applicant_remarks: Optional[str] = Form("Rectified document uploaded by candidate"),
    authorization: Optional[str] = Header(None)
):
    """
    Applicant action: Upload corrected/renewed document to clear DEFICIENCY.
    Transitions status to RESUBMITTED -> automated re-screening (RULE_VALIDATION) -> OFFICER_REVIEW.
    Records every status change in application_history and dispatches notifications.
    """
    app = scholar_service.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    ext = os.path.splitext(resubmitted_file.filename)[1].lower()
    save_name = f"resubmit_{document_type.lower()}_{uuid.uuid4().hex[:8]}{ext}"
    save_path = os.path.join(APP_DOCS_DIR, save_name)

    with open(save_path, "wb") as f:
        shutil.copyfileobj(resubmitted_file.file, f)

    try:
        prep = document_preprocessor.process_document(save_path)
        ocr_res = ocr_service.extract_text(prep["primary_image_path"])
        raw_text = "\n".join([r.get("text", "") for r in ocr_res])
        extracted = gemini_vision_service.extract_document_data(
            image_path=prep["primary_image_path"],
            document_hint=document_type.replace("_", " "),
            ocr_results=ocr_res
        )
    except Exception as e:
        print(f"[Applications] Error in deficiency preprocessing: {e}")
        raw_text = ""
        extracted = {}

    doc_record = [{
        "document_type": document_type.upper(),
        "file_name": resubmitted_file.filename,
        "file_path": save_path,
        "file_type": ext.replace(".", ""),
        "ocr_raw_text": raw_text,
        "extracted_fields": extracted
    }]

    updated_app = scholar_service.resubmit_deficiency(
        application_id=app_id,
        document_files=doc_record,
        applicant_remarks=applicant_remarks or "Rectified document uploaded",
        applicant_id=app.get("applicant_id")
    )

    return {
        "success": True,
        "message": f"Document {document_type} successfully resubmitted. Application transitioned to RESUBMITTED.",
        "application": updated_app
    }


@router.post("/draft")
async def save_draft(
    scheme_code: str = Form(...),
    applicant_name: str = Form(...),
    applicant_email: Optional[str] = Form(None),
    applicant_phone: Optional[str] = Form(None),
    annual_family_income: Optional[float] = Form(None),
    aggregate_percentage: Optional[float] = Form(None),
    applicant_age: Optional[int] = Form(None),
    institution_name: Optional[str] = Form(None),
    course_enrolled: Optional[str] = Form(None),
    draft_id: Optional[str] = Form(None),
    authorization: Optional[str] = Header(None)
):
    """
    Save application draft without mandatory documents.
    Status set to DRAFT; records event in application_history.
    """
    applicant_id = None
    if authorization:
        try:
            token = extract_token(authorization)
            user = get_authenticated_user(token)
            applicant_id = str(user.id)
        except Exception:
            pass

    draft_data = {
        "id": draft_id,
        "scheme_code": scheme_code.upper().strip(),
        "applicant_name": applicant_name.strip(),
        "applicant_email": applicant_email,
        "applicant_phone": applicant_phone,
        "annual_family_income": annual_family_income,
        "aggregate_percentage": aggregate_percentage,
        "applicant_age": applicant_age,
        "institution_name": institution_name,
        "course_enrolled": course_enrolled,
        "applicant_id": applicant_id
    }

    saved = scholar_service.save_application_draft(draft_data)
    return {
        "success": True,
        "message": "Application draft saved successfully.",
        "application": saved
    }


@router.post("/{app_id}/transition")
def transition_status(
    app_id: str,
    payload: Dict[str, Any],
    authorization: Optional[str] = Header(None)
):
    """
    Transition application between valid canonical states:
    DRAFT, SUBMITTED, DOCUMENT_VERIFICATION, DEFICIENCY, RESUBMITTED,
    RULE_VALIDATION, OFFICER_REVIEW, APPROVED, REJECTED.
    Every status change is recorded in application_history.
    """
    new_status = payload.get("new_status")
    if not new_status:
        raise HTTPException(status_code=400, detail="new_status is required")

    actor_name = "Workflow Coordinator"
    actor_id = None
    if authorization:
        try:
            token = extract_token(authorization)
            user = get_authenticated_user(token)
            prof = get_profile(str(user.id))
            actor_name = prof.get("full_name") or prof.get("username")
            actor_id = str(user.id)
        except Exception:
            pass

    try:
        updated = scholar_service.record_status_change(
            application_id=app_id,
            new_status=new_status,
            actor_id=actor_id,
            actor_name=actor_name,
            remarks=payload.get("remarks"),
            metadata_payload=payload.get("metadata")
        )
        return {
            "success": True,
            "message": f"Status updated to {new_status}.",
            "application": updated
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{app_id}/notifications")
def get_app_notifications(app_id: str):
    """
    Retrieve all in-app notifications and email dispatch records for this application.
    """
    notifs = notification_service.get_application_notifications(app_id)
    return {
        "success": True,
        "count": len(notifs),
        "notifications": notifs
    }


@router.get("/{app_id}/gaps")
def get_application_gap_intelligence(app_id: str):
    """
    Scheme Gap Intelligence for an existing application dossier:
    When an application is not currently eligible or has deficiencies,
    identifies the exact specific missing requirements:
    - Missing document
    - Academic requirement not satisfied
    - Income requirement not satisfied
    - Required qualification missing
    - Certificate information incomplete

    Returns transparent 4-stage evidence chain:
    Requirement → Applicant Status → Gap → Suggested Action
    """
    try:
        gap_intel = scholar_service.get_application_gap_intelligence(app_id)
        return {
            "success": True,
            "application_id": app_id,
            "gap_intelligence": gap_intel
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


