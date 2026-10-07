import os
import re
import json
import uuid
import sqlite3
import difflib
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np

from app.services.document_preprocessor import document_preprocessor
from app.services.ocr_service import ocr_service
from app.services.gemini_service import gemini_vision_service
from app.services.scholar_service import scholar_service, RECOGNIZED_ST_TRIBES, DB_PATH

UPLOAD_DOCS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "uploads",
    "verified_docs"
)
os.makedirs(UPLOAD_DOCS_DIR, exist_ok=True)


DOCUMENT_METADATA_SPEC: Dict[str, Dict[str, Any]] = {
    "CASTE_CERTIFICATE": {
        "title": "Scheduled Tribe (ST) Caste Certificate",
        "category": "STATUTORY_IDENTITY",
        "description": "Original Caste Certificate issued under Article 342 by an authorized Revenue Authority (Tahsildar, SDM, RDO).",
        "issuing_authority_hint": "Tahsildar / Sub-Divisional Magistrate / Revenue Divisional Officer",
        "mandatory": True,
        "key_fields": [
            "applicant_name",
            "certificate_number",
            "caste_category",
            "tribe_community_name",
            "issuing_authority",
            "issue_date"
        ],
        "hints": "Scheduled Tribe Statutory Caste Certificate under Article 342"
    },
    "INCOME_CERTIFICATE": {
        "title": "Annual Family Income Certificate",
        "category": "FINANCIAL_ELIGIBILITY",
        "description": "Valid Income Certificate stating total parental / family annual income for the current financial assessment year.",
        "issuing_authority_hint": "Revenue Officer / Tahsildar / Mandal Revenue Officer",
        "mandatory": True,
        "key_fields": [
            "applicant_name",
            "annual_family_income",
            "certificate_number",
            "issuing_authority",
            "financial_year"
        ],
        "hints": "Annual Family Income Certificate issued by Revenue Authority"
    },
    "MARKSHEET": {
        "title": "Academic Marksheet / Transcript",
        "category": "ACADEMIC_RECORD",
        "description": "Marksheet of the qualifying degree or examination displaying aggregate percentage / marks and passing status.",
        "issuing_authority_hint": "Recognized University / Examination Board / School Council",
        "mandatory": True,
        "key_fields": [
            "student_name",
            "roll_number",
            "examination_name",
            "institution_name",
            "aggregate_percentage",
            "result_status"
        ],
        "hints": "Degree Marksheet / Academic Transcript / Consolidated Grades"
    },
    "BONAFIDE_CERTIFICATE": {
        "title": "Bonafide Student Certificate",
        "category": "INSTITUTION_VERIFICATION",
        "description": "Institutional certificate affirming regular and full-time enrollment for the current academic session (2026-2027).",
        "issuing_authority_hint": "Dean / Principal / Registrar of Enrolled Institution",
        "mandatory": True,
        "key_fields": [
            "student_name",
            "institution_name",
            "course_name",
            "academic_year",
            "authorized_signatory"
        ],
        "hints": "Bonafide Student Certificate on Institution Letterhead with Seal"
    },
    "ADMISSION_OFFER": {
        "title": "Admission Offer / Enrollment Confirmation",
        "category": "INSTITUTION_VERIFICATION",
        "description": "Official Admission Letter or Allotment Order confirming regular or unconditional admission.",
        "issuing_authority_hint": "Admissions Office / Foreign University / Premier Institute",
        "mandatory": True,
        "key_fields": [
            "candidate_name",
            "institution_name",
            "course_enrolled",
            "admission_status"
        ],
        "hints": "University Admission Letter / Allotment Order / Offer Letter"
    },
    "BANK_PASSBOOK": {
        "title": "Bank Account Passbook / Mandate (Aadhaar Seeded)",
        "category": "DISBURSEMENT_BANK",
        "description": "First page of Bank Passbook or Cancelled Cheque showing Account Number, IFSC code, and DBT Aadhaar-seeded linkage.",
        "issuing_authority_hint": "Scheduled Commercial Bank / Public Sector Bank",
        "mandatory": True,
        "key_fields": [
            "account_holder_name",
            "bank_name",
            "account_number",
            "ifsc_code"
        ],
        "hints": "Bank Passbook Front Page or Cancelled Cheque for DBT"
    },
    "DISABILITY_CERTIFICATE": {
        "title": "Disability Certificate (PwD / UDID)",
        "category": "SPECIAL_PROVISION",
        "description": "Unique Disability ID (UDID) or certificate issued by a Medical Board (minimum 40% disability if applying under PwD quota).",
        "issuing_authority_hint": "District Medical Board / Chief Medical Officer",
        "mandatory": False,
        "key_fields": [
            "holder_name",
            "certificate_number",
            "disability_percentage",
            "issuing_authority"
        ],
        "hints": "Medical Disability Certificate or UDID Card"
    },
    "OTHER_SCHEME_DOC": {
        "title": "Scheme-Specific Supporting Document",
        "category": "SPECIAL_PROVISION",
        "description": "Special supporting statutory document or affidavit as prescribed under specific scheme guidelines.",
        "issuing_authority_hint": "Competent Authority / Notary Public",
        "mandatory": False,
        "key_fields": [
            "document_title",
            "holder_name",
            "document_id",
            "issuing_authority"
        ],
        "hints": "Supporting Affidavit / Hosteller Certificate / Special Document"
    }
}


class ScholarDocumentVerifier:
    """
    Dedicated Statutory Document Verification Engine for SCHOLAR-ST.
    Executes the 8-stage verification pipeline:
      Upload -> File Validation -> OpenCV Preprocessing -> OCR -> Information Extraction
      -> Profile Cross-Comparison -> Completeness Evaluation -> Store Evidence -> Verification Result
    """

    def __init__(self):
        self._ensure_table_exists()

    def _ensure_table_exists(self):
        """
        Creates scheme_document_verifications table in local SQLite.
        """
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scheme_document_verifications (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                scheme_code TEXT NOT NULL,
                document_type TEXT NOT NULL,
                document_name TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_type TEXT,
                file_size INTEGER DEFAULT 0,
                ocr_raw_text TEXT,
                extracted_fields TEXT,
                profile_comparison TEXT,
                completeness_score REAL DEFAULT 0,
                completeness_details TEXT,
                verification_result TEXT NOT NULL,
                deficiency_reasons TEXT,
                remedy_suggestions TEXT,
                evidence_summary TEXT,
                processed_image_url TEXT,
                resubmission_count INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT
            )
        """)
        conn.commit()
        conn.close()

    # =========================================================================
    # 1. SCHEME DOCUMENT REQUIREMENTS (DYNAMIC DISCOVERY)
    # =========================================================================

    def get_scheme_requirements(
        self,
        scheme_code: str,
        applicant_user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dynamically returns required documents for the given scheme.
        Attaches the applicant's verification status and evidence if user_id is provided.
        """
        code = scheme_code.upper().strip()
        scheme = scholar_service.get_scheme(code)
        if not scheme:
            raise ValueError(f"Scholarship scheme '{code}' not found in registry")

        # Required document codes from scheme definition
        req_codes: List[str] = scheme.get("required_documents") or []
        if not req_codes:
            # Fallback to standard ST statutory docs if unspecified
            req_codes = ["CASTE_CERTIFICATE", "INCOME_CERTIFICATE", "MARKSHEET", "ADMISSION_OFFER", "BANK_PASSBOOK"]

        # If scheme has specific rules, ensure those documents are included
        rules = scholar_service.get_rules_for_scheme(code, active_only=True)
        for r in rules:
            if r.get("rule_type") == "REQUIRED_DOCUMENT":
                f_name = r.get("field_name", "").upper()
                if "CASTE" in f_name and "CASTE_CERTIFICATE" not in req_codes:
                    req_codes.append("CASTE_CERTIFICATE")
                elif "INCOME" in f_name and "INCOME_CERTIFICATE" not in req_codes:
                    req_codes.append("INCOME_CERTIFICATE")
                elif ("MARK" in f_name or "ACADEMIC" in f_name) and "MARKSHEET" not in req_codes:
                    req_codes.append("MARKSHEET")
                elif ("ADMISSION" in f_name or "OFFER" in f_name) and "ADMISSION_OFFER" not in req_codes:
                    req_codes.append("ADMISSION_OFFER")
                elif "BANK" in f_name and "BANK_PASSBOOK" not in req_codes:
                    req_codes.append("BANK_PASSBOOK")
                elif "BONAFIDE" in f_name and "BONAFIDE_CERTIFICATE" not in req_codes:
                    req_codes.append("BONAFIDE_CERTIFICATE")

        # Load existing verifications for this applicant and scheme
        existing_map: Dict[str, Dict[str, Any]] = {}
        if applicant_user_id:
            existing_verifs = self.get_applicant_scheme_verifications(applicant_user_id, code)
            for v in existing_verifs:
                existing_map[v["document_type"].upper()] = v

        # Build detailed requirements catalog
        catalog: List[Dict[str, Any]] = []
        valid_count = 0
        total_mandatory = 0

        for doc_type in req_codes:
            spec = DOCUMENT_METADATA_SPEC.get(doc_type, {
                "title": doc_type.replace("_", " ").title(),
                "category": "SUPPORTING_DOCUMENT",
                "description": f"Mandatory supporting document for {scheme['scheme_name']}.",
                "issuing_authority_hint": "Competent Authority",
                "mandatory": True,
                "key_fields": ["document_title", "holder_name", "certificate_number"],
                "hints": "Statutory Certificate"
            })

            is_mandatory = spec.get("mandatory", True)
            if is_mandatory:
                total_mandatory += 1

            existing = existing_map.get(doc_type.upper())
            status = existing.get("verification_result", "NOT_UPLOADED") if existing else "NOT_UPLOADED"
            if status == "VALID":
                valid_count += 1

            catalog.append({
                "document_type": doc_type,
                "title": spec.get("title"),
                "category": spec.get("category"),
                "description": spec.get("description"),
                "issuing_authority_hint": spec.get("issuing_authority_hint"),
                "mandatory": is_mandatory,
                "key_fields_checked": spec.get("key_fields", []),
                "allowed_extensions": [".pdf", ".png", ".jpg", ".jpeg"],
                "max_size_mb": 10,
                # Applicant status
                "verification_status": status,
                "existing_verification": existing
            })

        readiness_pct = round((valid_count / total_mandatory * 100), 1) if total_mandatory > 0 else 0.0

        return {
            "success": True,
            "scheme_code": code,
            "scheme_name": scheme["scheme_name"],
            "target_category": scheme.get("target_category", "Scheduled Tribe (ST)"),
            "max_family_income": scheme.get("max_family_income"),
            "min_academic_percentage": scheme.get("min_academic_percentage"),
            "total_required_documents": len(catalog),
            "mandatory_documents_count": total_mandatory,
            "verified_valid_count": valid_count,
            "readiness_percentage": readiness_pct,
            "is_scheme_ready_for_submission": readiness_pct >= 100.0,
            "required_documents": catalog
        }

    # =========================================================================
    # 2. CORE VERIFICATION PIPELINE
    # =========================================================================

    def verify_document(
        self,
        file_path: str,
        file_name: str,
        scheme_code: str,
        document_type: str,
        applicant_user_id: Optional[str] = None,
        applicant_profile: Optional[Dict[str, Any]] = None,
        existing_verification_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the 8-stage verification pipeline for a document:
        Upload -> File Validation -> OpenCV Preprocessing -> OCR -> Extraction
        -> Profile Comparison -> Completeness Check -> Evidence Storage -> Verification Result
        """
        clean_doc_type = document_type.upper().strip()
        scheme_code = scheme_code.upper().strip()
        scheme = scholar_service.get_scheme(scheme_code) or {}

        # Load profile if not supplied directly
        profile = applicant_profile or {}
        if not profile and applicant_user_id:
            profile = scholar_service.get_applicant_profile(applicant_user_id) or {}

        # ---------------------------------------------------------------------
        # STAGE 1: FILE VALIDATION
        # ---------------------------------------------------------------------
        file_val = self._validate_file(file_path, file_name)
        if not file_val["is_valid"]:
            return self._build_terminal_result(
                result="INVALID",
                deficiency_reasons=[file_val["error"]],
                remedy_suggestions=["Please upload a valid document in PDF, PNG, or JPEG format (maximum 10MB)."],
                file_name=file_name,
                file_path=file_path,
                scheme_code=scheme_code,
                document_type=clean_doc_type,
                user_id=applicant_user_id
            )

        # ---------------------------------------------------------------------
        # STAGE 2: OPENCV PREPROCESSING
        # ---------------------------------------------------------------------
        prep_result = self._preprocess_document(file_path)
        primary_img = prep_result["primary_image_path"]
        blur_score = prep_result["blur_score"]
        is_blurry = blur_score < 30.0

        # ---------------------------------------------------------------------
        # STAGE 3: OCR EXTRACTION (PADDLEOCR)
        # ---------------------------------------------------------------------
        ocr_results = ocr_service.extract_text(primary_img)
        ocr_raw_text = "\n".join([r.get("text", "") for r in ocr_results])
        ocr_lines_count = len(ocr_results)
        avg_ocr_conf = (
            round(sum(r.get("confidence", 0) for r in ocr_results) / ocr_lines_count, 2)
            if ocr_lines_count > 0 else 0.0
        )

        # If OCR detected less than 15 characters, document is illegible / blank
        if len(ocr_raw_text.strip()) < 15:
            return self._build_terminal_result(
                result="INCOMPLETE",
                deficiency_reasons=["The uploaded document scan contains insufficient legible text or appears blank."],
                remedy_suggestions=[
                    "Ensure the document is placed flat, in focus, and properly lit without shadows.",
                    "If uploading a PDF, ensure text is not password-protected or scrambled."
                ],
                file_name=file_name,
                file_path=file_path,
                scheme_code=scheme_code,
                document_type=clean_doc_type,
                user_id=applicant_user_id,
                ocr_raw_text=ocr_raw_text,
                processed_image_path=primary_img
            )

        # ---------------------------------------------------------------------
        # STAGE 4: STRUCTURED FIELD EXTRACTION
        # ---------------------------------------------------------------------
        spec = DOCUMENT_METADATA_SPEC.get(clean_doc_type, {})
        hint = spec.get("hints", "Scholarship statutory supporting document")
        extracted_fields = gemini_vision_service.extract_document_data(
            image_path=primary_img,
            document_hint=hint,
            ocr_results=ocr_results
        )

        # ---------------------------------------------------------------------
        # STAGE 5: PROFILE CROSS-COMPARISON
        # ---------------------------------------------------------------------
        profile_comp = self._compare_against_profile(
            document_type=clean_doc_type,
            extracted_fields=extracted_fields,
            applicant_profile=profile,
            scheme=scheme,
            ocr_raw_text=ocr_raw_text
        )

        # ---------------------------------------------------------------------
        # STAGE 6: CHECK COMPLETENESS
        # ---------------------------------------------------------------------
        completeness = self._check_completeness(
            document_type=clean_doc_type,
            extracted_fields=extracted_fields,
            ocr_raw_text=ocr_raw_text
        )

        # ---------------------------------------------------------------------
        # STAGE 7: DETERMINE FINAL VERIFICATION RESULT
        # ---------------------------------------------------------------------
        decision = self._evaluate_verification_result(
            document_type=clean_doc_type,
            extracted_fields=extracted_fields,
            profile_comp=profile_comp,
            completeness=completeness,
            scheme=scheme,
            is_blurry=is_blurry,
            avg_ocr_conf=avg_ocr_conf
        )

        result_status = decision["status"]  # VALID, INVALID, INCOMPLETE, REQUIRES REVIEW
        deficiency_reasons = decision["deficiency_reasons"]
        remedy_suggestions = decision["remedy_suggestions"]
        evidence_summary = decision["evidence_summary"]

        # ---------------------------------------------------------------------
        # STAGE 8: STORE EVIDENCE IN DATABASE
        # ---------------------------------------------------------------------
        processed_image_filename = os.path.basename(primary_img)
        processed_image_url = f"/uploads/verified_docs/{processed_image_filename}"

        stored_record = self._persist_verification_record(
            user_id=applicant_user_id,
            scheme_code=scheme_code,
            document_type=clean_doc_type,
            file_name=file_name,
            file_path=file_path,
            file_size=file_val["size"],
            ocr_raw_text=ocr_raw_text,
            extracted_fields=extracted_fields,
            profile_comparison=profile_comp,
            completeness_score=completeness["completeness_score"],
            completeness_details=completeness,
            verification_result=result_status,
            deficiency_reasons=deficiency_reasons,
            remedy_suggestions=remedy_suggestions,
            evidence_summary=evidence_summary,
            processed_image_url=processed_image_url,
            existing_id=existing_verification_id
        )

        # If user is authenticated, sync into reusable applicant profile!
        if applicant_user_id:
            self._sync_to_applicant_profile(
                user_id=applicant_user_id,
                document_type=clean_doc_type,
                file_name=file_name,
                file_path=file_path,
                extracted_fields=extracted_fields,
                verification_result=result_status,
                ocr_raw_text=ocr_raw_text
            )

        return {
            "success": True,
            "verification_id": stored_record["id"],
            "verification_result": result_status,
            "scheme_code": scheme_code,
            "document_type": clean_doc_type,
            "document_title": spec.get("title", clean_doc_type),
            "file_info": {
                "file_name": file_name,
                "file_size": file_val["size"],
                "is_pdf": prep_result["is_pdf"],
                "total_pages": prep_result["total_pages"],
                "processed_image_url": processed_image_url,
                "blur_score": round(blur_score, 1),
                "is_sharp": not is_blurry
            },
            "ocr_summary": {
                "lines_extracted": ocr_lines_count,
                "confidence_avg": avg_ocr_conf
            },
            "completeness": completeness,
            "profile_comparison": profile_comp,
            "extracted_fields": extracted_fields,
            "ai_understanding": extracted_fields.get("ai_understanding") or {},
            "evidence_summary": evidence_summary,
            "deficiency_reasons": deficiency_reasons,
            "remedy_suggestions": remedy_suggestions,
            "allow_resubmission": result_status in ["INVALID", "INCOMPLETE", "REQUIRES REVIEW"],
            "resubmission_count": stored_record["resubmission_count"]
        }

    # =========================================================================
    # PIPELINE STAGE IMPLEMENTATIONS
    # =========================================================================

    def _validate_file(self, file_path: str, file_name: str) -> Dict[str, Any]:
        """Stage 1: Verify file existence, format, and size limit."""
        if not os.path.exists(file_path):
            return {"is_valid": False, "error": f"File '{file_name}' does not exist on server."}

        size = os.path.getsize(file_path)
        if size == 0:
            return {"is_valid": False, "error": "Uploaded file is 0 bytes (empty file)."}

        if size > 10 * 1024 * 1024:
            return {"is_valid": False, "error": "File size exceeds 10MB statutory limit."}

        ext = os.path.splitext(file_name)[1].lower()
        if ext not in [".pdf", ".png", ".jpg", ".jpeg", ".webp"]:
            return {"is_valid": False, "error": f"Unsupported format '{ext}'. Upload PDF, PNG, or JPEG."}

        return {"is_valid": True, "size": size, "extension": ext}

    def _preprocess_document(self, file_path: str) -> Dict[str, Any]:
        """Stage 2: OpenCV Preprocessing + PyMuPDF rasterization."""
        prep = document_preprocessor.process_document(file_path)
        primary = prep["primary_image_path"]

        # Calculate image sharpness via Laplacian variance
        blur_score = 100.0
        try:
            img = cv2.imread(primary, cv2.IMREAD_GRAYSCALE)
            if img is not None:
                blur_score = float(cv2.Laplacian(img, cv2.CV_64F).var())
        except Exception:
            pass

        prep["blur_score"] = blur_score
        return prep

    def _compare_against_profile(
        self,
        document_type: str,
        extracted_fields: Dict[str, Any],
        applicant_profile: Dict[str, Any],
        scheme: Dict[str, Any],
        ocr_raw_text: str
    ) -> Dict[str, Any]:
        """
        Stage 5: Cross-compare extracted document facts against declared applicant profile.
        Computes fuzzy name matching and domain-specific comparisons.
        """
        profile_name = str(applicant_profile.get("full_name") or applicant_profile.get("applicant_name") or "").strip()

        # Extract document candidate name
        doc_name = (
            extracted_fields.get("applicant_name") or
            extracted_fields.get("student_name") or
            extracted_fields.get("candidate_name") or
            extracted_fields.get("account_holder_name") or
            extracted_fields.get("holder_name") or
            ""
        ).strip()

        name_match_pct = 100.0
        name_match_status = "MATCH"
        name_notes = "Profile name matches document"

        if profile_name.lower() in ["st applicant", "st scholar", "scholar"]:
            name_match_status = "PROFILE_UNSET"
            name_notes = f"Profile has default placeholder name. Document name '{doc_name}' recognized."
            name_match_pct = 100.0
        elif profile_name and doc_name:
            # Fuzzy match ratio
            matcher = difflib.SequenceMatcher(None, profile_name.lower(), doc_name.lower())
            name_match_pct = round(matcher.ratio() * 100, 1)

            # Check token subset match (e.g., "Mohan Bankuru" in "Bankuru Mohan")
            tokens_prof = set(re.findall(r"\w+", profile_name.lower()))
            tokens_doc = set(re.findall(r"\w+", doc_name.lower()))
            token_overlap = tokens_prof.intersection(tokens_doc)

            if len(token_overlap) == len(tokens_prof) or name_match_pct >= 80.0:
                name_match_status = "MATCH"
                name_notes = f"High confidence name alignment ({name_match_pct}%)"
            elif name_match_pct >= 60.0 or len(token_overlap) > 0:
                name_match_status = "PARTIAL_MATCH"
                name_notes = f"Partial name match ({name_match_pct}%). Possible initials or surname inversion."
            else:
                name_match_status = "MISMATCH"
                name_notes = f"Significant name divergence. Extracted '{doc_name}' vs Profile '{profile_name}'."
        elif not profile_name:
            name_match_status = "PROFILE_UNSET"
            name_notes = "Applicant profile name not yet configured"
        else:
            name_match_status = "NAME_NOT_DETECTED"
            name_notes = "Name could not be distinctly isolated from document text"

        # Domain Specific Comparisons
        field_comparisons: Dict[str, Any] = {}

        if document_type == "CASTE_CERTIFICATE":
            category = str(extracted_fields.get("caste_category") or ("ST" if extracted_fields.get("is_scheduled_tribe") else "")).upper()
            is_st = "ST" in category or "SCHEDULED TRIBE" in category or "SCHEDULE TRIBE" in ocr_raw_text.upper()
            tribe_name = extracted_fields.get("tribe_community_name")

            # Check Article 342 recognized tribe
            recognized = False
            if tribe_name:
                recognized = any(t.lower() in str(tribe_name).lower() for t in RECOGNIZED_ST_TRIBES)

            cert_no = extracted_fields.get("certificate_number")
            prof_cert_no = applicant_profile.get("caste_certificate_no")
            cert_no_match = True
            if cert_no and prof_cert_no:
                cert_no_match = (str(cert_no).strip().lower() == str(prof_cert_no).strip().lower())

            field_comparisons = {
                "category_verified_st": is_st,
                "tribe_name": tribe_name,
                "is_recognized_st_tribe": recognized,
                "certificate_number_matches_profile": cert_no_match
            }

        elif document_type == "INCOME_CERTIFICATE":
            certified_income = None
            raw_inc = extracted_fields.get("annual_family_income") or extracted_fields.get("annual_income_inr")
            if raw_inc is not None:
                try:
                    certified_income = float(str(raw_inc).replace(",", "").replace("₹", "").strip())
                except Exception:
                    pass

            declared_income = applicant_profile.get("annual_income") or applicant_profile.get("annual_family_income")
            scheme_limit = scheme.get("max_family_income")

            is_within_limit = True
            if certified_income is not None and scheme_limit is not None:
                is_within_limit = certified_income <= float(scheme_limit)

            field_comparisons = {
                "certified_annual_income": certified_income,
                "declared_annual_income": declared_income,
                "scheme_statutory_limit": scheme_limit,
                "is_within_scheme_income_limit": is_within_limit
            }

        elif document_type == "MARKSHEET":
            certified_percentage = None
            raw_pct = extracted_fields.get("aggregate_percentage")
            if raw_pct is not None:
                try:
                    certified_percentage = float(str(raw_pct).replace("%", "").strip())
                except Exception:
                    pass

            scheme_min = scheme.get("min_academic_percentage")
            meets_min = True
            if certified_percentage is not None and scheme_min is not None:
                meets_min = certified_percentage >= float(scheme_min)

            field_comparisons = {
                "certified_percentage": certified_percentage,
                "scheme_minimum_percentage": scheme_min,
                "satisfies_academic_cutoff": meets_min
            }

        elif document_type in ["BONAFIDE_CERTIFICATE", "ADMISSION_OFFER"]:
            doc_inst = extracted_fields.get("institution_name", "")
            prof_inst = applicant_profile.get("institution_name", "")
            inst_match = True
            if doc_inst and prof_inst:
                inst_match = difflib.SequenceMatcher(None, doc_inst.lower(), prof_inst.lower()).ratio() >= 0.50

            field_comparisons = {
                "document_institution": doc_inst,
                "profile_institution": prof_inst,
                "institution_matches": inst_match,
                "admission_status": extracted_fields.get("admission_status") or extracted_fields.get("offer_status")
            }

        elif document_type == "BANK_PASSBOOK":
            doc_acc = extracted_fields.get("account_number")
            prof_acc = applicant_profile.get("bank_account_no")
            acc_match = True
            if doc_acc and prof_acc:
                acc_match = str(doc_acc).strip() == str(prof_acc).strip()

            ifsc = str(extracted_fields.get("ifsc_code") or "").strip().upper()
            valid_ifsc = bool(re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", ifsc)) if ifsc else False

            field_comparisons = {
                "document_account_number": doc_acc,
                "profile_account_number": prof_acc,
                "account_number_matches": acc_match,
                "ifsc_code": ifsc,
                "is_valid_ifsc_format": valid_ifsc
            }

        return {
            "profile_name": profile_name,
            "document_name": doc_name,
            "name_match_percentage": name_match_pct,
            "name_match_status": name_match_status,
            "name_notes": name_notes,
            "field_comparisons": field_comparisons
        }

    def _check_completeness(
        self,
        document_type: str,
        extracted_fields: Dict[str, Any],
        ocr_raw_text: str
    ) -> Dict[str, Any]:
        """
        Stage 6: Inspect presence of statutory mandatory fields.
        Returns completeness score and list of missing fields.
        """
        spec = DOCUMENT_METADATA_SPEC.get(document_type, {})
        key_fields = spec.get("key_fields", ["applicant_name", "certificate_number", "issuing_authority"])

        present_fields = []
        missing_fields = []

        for field in key_fields:
            val = extracted_fields.get(field)
            if val is not None and str(val).strip() != "":
                present_fields.append(field)
            else:
                # Secondary check in OCR raw text
                field_terms = field.replace("_", " ").split()
                if any(term in ocr_raw_text.lower() for term in field_terms if len(term) > 3):
                    present_fields.append(field)
                else:
                    missing_fields.append(field)

        score = round((len(present_fields) / len(key_fields) * 100), 1) if key_fields else 100.0

        return {
            "completeness_score": score,
            "total_mandatory_fields": len(key_fields),
            "present_fields": present_fields,
            "missing_fields": missing_fields,
            "is_fully_complete": len(missing_fields) == 0
        }

    def _evaluate_verification_result(
        self,
        document_type: str,
        extracted_fields: Dict[str, Any],
        profile_comp: Dict[str, Any],
        completeness: Dict[str, Any],
        scheme: Dict[str, Any],
        is_blurry: bool,
        avg_ocr_conf: float
    ) -> Dict[str, Any]:
        """
        Stage 7: Deterministic statutory logic to derive:
        VALID | INVALID | INCOMPLETE | REQUIRES REVIEW
        """
        deficiency_reasons: List[str] = []
        remedy_suggestions: List[str] = []
        status = "VALID"

        name_status = profile_comp["name_match_status"]
        missing_fields = completeness["missing_fields"]
        field_comp = profile_comp.get("field_comparisons", {})

        # Rule 1: High-confidence Name Mismatch -> INVALID
        if name_status == "MISMATCH":
            status = "INVALID"
            deficiency_reasons.append(
                f"Candidate identity mismatch: Document name '{profile_comp['document_name']}' diverges significantly from registered profile '{profile_comp['profile_name']}'."
            )
            remedy_suggestions.append(
                "Upload a document belonging strictly to the applicant, or correct the profile name if a typo exists."
            )

        # Rule 2: Caste Certificate specific statutory checks
        if document_type == "CASTE_CERTIFICATE":
            is_st = field_comp.get("category_verified_st", False)
            if not is_st and "caste_category" not in missing_fields:
                status = "INVALID"
                deficiency_reasons.append(
                    "Statutory Ineligibility: Document does not certify Scheduled Tribe (ST) status under Article 342."
                )
                remedy_suggestions.append(
                    "Only candidates belonging to notified Scheduled Tribes are eligible. Upload a valid ST community certificate."
                )

        # Rule 3: Income Certificate statutory limit check
        if document_type == "INCOME_CERTIFICATE":
            within_limit = field_comp.get("is_within_scheme_income_limit", True)
            if not within_limit:
                status = "INVALID"
                scheme_lim = field_comp.get("scheme_statutory_limit")
                cert_inc = field_comp.get("certified_annual_income")
                deficiency_reasons.append(
                    f"Statutory Ceiling Exceeded: Certified annual income of ₹{cert_inc:,.0f} exceeds scheme ceiling of ₹{scheme_lim:,.0f}."
                )
                remedy_suggestions.append(
                    "Select a scholarship scheme matching your income tier, or submit an updated revenue income certificate."
                )

        # Rule 4: Marksheet cutoff check
        if document_type == "MARKSHEET":
            meets_cutoff = field_comp.get("satisfies_academic_cutoff", True)
            if not meets_cutoff:
                status = "INVALID"
                cert_pct = field_comp.get("certified_percentage")
                min_pct = field_comp.get("scheme_minimum_percentage")
                deficiency_reasons.append(
                    f"Academic Cutoff Deficiency: Certified aggregate percentage ({cert_pct}%) is below minimum required ({min_pct}%)."
                )
                remedy_suggestions.append(
                    "Verify qualifying marksheet submission meets minimum percentage threshold for this scheme tier."
                )

        # Rule 5: Critical Missing Fields -> INCOMPLETE
        if status != "INVALID":
            critical_missing = [f for f in missing_fields if f in ["certificate_number", "issuing_authority", "annual_family_income", "aggregate_percentage"]]
            if critical_missing:
                status = "INCOMPLETE"
                missing_str = ", ".join([f.replace("_", " ").title() for f in critical_missing])
                deficiency_reasons.append(
                    f"Deficiency: Crucial statutory fields missing or unreadable ({missing_str})."
                )
                remedy_suggestions.append(
                    "Ensure the entire certificate is in frame with the official government seal, registration number, and authority signature clearly visible."
                )

        # Rule 6: Image blurriness or low OCR confidence -> REQUIRES REVIEW or INCOMPLETE
        if status == "VALID":
            if is_blurry or avg_ocr_conf < 0.60:
                status = "REQUIRES REVIEW"
                deficiency_reasons.append(
                    "Low scan clarity: Image has low sharpness or faint printing requiring human officer manual inspection."
                )
                remedy_suggestions.append(
                    "You may proceed, or resubmit a higher resolution 300-DPI scan for instant automated verification."
                )
            elif name_status == "PARTIAL_MATCH":
                status = "REQUIRES REVIEW"
                deficiency_reasons.append(
                    f"Name abbreviation / partial match: Document states '{profile_comp['document_name']}', profile has '{profile_comp['profile_name']}'."
                )
                remedy_suggestions.append(
                    "Officer will cross-verify initials with secondary identity documents during final approval."
                )

        # Formulate statutory evidence summary
        evidence_summary = (
            f"Verified under {scheme.get('scheme_name', 'Scholarship Scheme')} statutory rules. "
            f"Completeness: {completeness['completeness_score']}%. "
            f"Name matching: {profile_comp['name_match_percentage']}% ({profile_comp['name_match_status']}). "
            f"Final Decision: {status}."
        )

        return {
            "status": status,
            "deficiency_reasons": deficiency_reasons,
            "remedy_suggestions": remedy_suggestions,
            "evidence_summary": evidence_summary
        }

    # =========================================================================
    # 3. EVIDENCE PERSISTENCE & RESUBMISSION
    # =========================================================================

    def _persist_verification_record(
        self,
        user_id: Optional[str],
        scheme_code: str,
        document_type: str,
        file_name: str,
        file_path: str,
        file_size: int,
        ocr_raw_text: str,
        extracted_fields: Dict[str, Any],
        profile_comparison: Dict[str, Any],
        completeness_score: float,
        completeness_details: Dict[str, Any],
        verification_result: str,
        deficiency_reasons: List[str],
        remedy_suggestions: List[str],
        evidence_summary: str,
        processed_image_url: str,
        existing_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Stores document verification record in SQLite scheme_document_verifications.
        """
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat()

        resubmission_count = 0

        # Check existing record
        record_id = existing_id
        if record_id:
            row = cursor.execute("SELECT resubmission_count FROM scheme_document_verifications WHERE id = ?", (record_id,)).fetchone()
            if row:
                resubmission_count = (row["resubmission_count"] or 0) + 1
        elif user_id:
            row = cursor.execute("""
                SELECT id, resubmission_count FROM scheme_document_verifications
                WHERE user_id = ? AND scheme_code = ? AND document_type = ?
            """, (user_id, scheme_code, document_type)).fetchone()
            if row:
                record_id = row["id"]
                resubmission_count = (row["resubmission_count"] or 0) + 1

        if record_id:
            cursor.execute("""
                UPDATE scheme_document_verifications SET
                    file_name = ?, file_path = ?, file_size = ?,
                    ocr_raw_text = ?, extracted_fields = ?, profile_comparison = ?,
                    completeness_score = ?, completeness_details = ?,
                    verification_result = ?, deficiency_reasons = ?,
                    remedy_suggestions = ?, evidence_summary = ?,
                    processed_image_url = ?, resubmission_count = ?, updated_at = ?
                WHERE id = ?
            """, (
                file_name, file_path, file_size,
                ocr_raw_text, json.dumps(extracted_fields), json.dumps(profile_comparison),
                completeness_score, json.dumps(completeness_details),
                verification_result, json.dumps(deficiency_reasons),
                json.dumps(remedy_suggestions), evidence_summary,
                processed_image_url, resubmission_count, now, record_id
            ))
        else:
            record_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO scheme_document_verifications (
                    id, user_id, scheme_code, document_type, document_name,
                    file_name, file_path, file_type, file_size,
                    ocr_raw_text, extracted_fields, profile_comparison,
                    completeness_score, completeness_details, verification_result,
                    deficiency_reasons, remedy_suggestions, evidence_summary,
                    processed_image_url, resubmission_count, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record_id, user_id, scheme_code, document_type, file_name,
                file_name, file_path, os.path.splitext(file_name)[1].replace(".", ""), file_size,
                ocr_raw_text, json.dumps(extracted_fields), json.dumps(profile_comparison),
                completeness_score, json.dumps(completeness_details), verification_result,
                json.dumps(deficiency_reasons), json.dumps(remedy_suggestions), evidence_summary,
                processed_image_url, resubmission_count, now, now
            ))

        conn.commit()
        conn.close()

        return {
            "id": record_id,
            "resubmission_count": resubmission_count
        }

    def _sync_to_applicant_profile(
        self,
        user_id: str,
        document_type: str,
        file_name: str,
        file_path: str,
        extracted_fields: Dict[str, Any],
        verification_result: str,
        ocr_raw_text: str
    ):
        """
        Synchronizes verified document facts into the reusable applicant profile.
        """
        ext = os.path.splitext(file_name)[1].replace(".", "")
        profile_updates: Dict[str, Any] = {}

        if document_type == "CASTE_CERTIFICATE":
            if verification_result in ["VALID", "REQUIRES REVIEW"]:
                profile_updates["caste_verified"] = (verification_result == "VALID")
                if extracted_fields.get("certificate_number"):
                    profile_updates["caste_certificate_no"] = str(extracted_fields.get("certificate_number"))
                if extracted_fields.get("tribe_community_name"):
                    profile_updates["tribe_name"] = str(extracted_fields.get("tribe_community_name"))
                if extracted_fields.get("issuing_authority"):
                    profile_updates["caste_issuing_authority"] = str(extracted_fields.get("issuing_authority"))

        elif document_type == "INCOME_CERTIFICATE":
            raw_inc = extracted_fields.get("annual_family_income") or extracted_fields.get("annual_income_inr")
            if raw_inc:
                try:
                    profile_updates["annual_income"] = float(str(raw_inc).replace(",", "").replace("₹", ""))
                except Exception:
                    pass
            if extracted_fields.get("certificate_number"):
                profile_updates["income_certificate_no"] = str(extracted_fields.get("certificate_number"))

        elif document_type == "MARKSHEET":
            raw_pct = extracted_fields.get("aggregate_percentage")
            if raw_pct:
                try:
                    profile_updates["aggregate_percentage"] = float(str(raw_pct).replace("%", ""))
                except Exception:
                    pass

        elif document_type in ["BONAFIDE_CERTIFICATE", "ADMISSION_OFFER"]:
            if extracted_fields.get("institution_name"):
                profile_updates["institution_name"] = str(extracted_fields.get("institution_name"))
            if extracted_fields.get("course_enrolled") or extracted_fields.get("course_name"):
                profile_updates["course_name"] = str(extracted_fields.get("course_enrolled") or extracted_fields.get("course_name"))

        elif document_type == "BANK_PASSBOOK":
            if extracted_fields.get("bank_name"):
                profile_updates["bank_name"] = str(extracted_fields.get("bank_name"))
            if extracted_fields.get("account_number"):
                profile_updates["bank_account_no"] = str(extracted_fields.get("account_number"))
            if extracted_fields.get("ifsc_code"):
                profile_updates["bank_ifsc"] = str(extracted_fields.get("ifsc_code"))

        # Update profile documents table
        scholar_service.add_profile_document(
            user_id=user_id,
            document_type=document_type,
            document_name=file_name,
            file_name=file_name,
            file_path=file_path,
            file_type=ext,
            file_size=os.path.getsize(file_path) if os.path.exists(file_path) else 0,
            ocr_raw_text=ocr_raw_text,
            extracted_fields=extracted_fields,
            verification_status="VERIFIED" if verification_result == "VALID" else verification_result
        )

        if profile_updates:
            scholar_service.upsert_applicant_profile(user_id, profile_updates)

    def get_applicant_scheme_verifications(self, user_id: str, scheme_code: str) -> List[Dict[str, Any]]:
        """
        Fetch all stored document verifications for a specific applicant and scheme.
        """
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        rows = cursor.execute("""
            SELECT * FROM scheme_document_verifications
            WHERE user_id = ? AND scheme_code = ?
            ORDER BY created_at DESC
        """, (user_id, scheme_code.upper())).fetchall()

        results = []
        for r in rows:
            item = dict(r)
            if item.get("extracted_fields"):
                try: item["extracted_fields"] = json.loads(item["extracted_fields"])
                except Exception: pass
            if item.get("profile_comparison"):
                try: item["profile_comparison"] = json.loads(item["profile_comparison"])
                except Exception: pass
            if item.get("completeness_details"):
                try: item["completeness_details"] = json.loads(item["completeness_details"])
                except Exception: pass
            if item.get("deficiency_reasons"):
                try: item["deficiency_reasons"] = json.loads(item["deficiency_reasons"])
                except Exception: pass
            if item.get("remedy_suggestions"):
                try: item["remedy_suggestions"] = json.loads(item["remedy_suggestions"])
                except Exception: pass
            results.append(item)

        conn.close()
        return results

    def _build_terminal_result(
        self,
        result: str,
        deficiency_reasons: List[str],
        remedy_suggestions: List[str],
        file_name: str,
        file_path: str,
        scheme_code: str,
        document_type: str,
        user_id: Optional[str] = None,
        ocr_raw_text: str = "",
        processed_image_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """Helper to build early terminal failure/incomplete response and persist evidence."""
        processed_url = ""
        if processed_image_path:
            processed_url = f"/uploads/verified_docs/{os.path.basename(processed_image_path)}"

        record = self._persist_verification_record(
            user_id=user_id,
            scheme_code=scheme_code,
            document_type=document_type,
            file_name=file_name,
            file_path=file_path,
            file_size=os.path.getsize(file_path) if os.path.exists(file_path) else 0,
            ocr_raw_text=ocr_raw_text,
            extracted_fields={},
            profile_comparison={},
            completeness_score=0.0,
            completeness_details={"is_fully_complete": False, "missing_fields": ["ALL"]},
            verification_result=result,
            deficiency_reasons=deficiency_reasons,
            remedy_suggestions=remedy_suggestions,
            evidence_summary=f"Terminal validation failure: {', '.join(deficiency_reasons)}",
            processed_image_url=processed_url
        )

        spec = DOCUMENT_METADATA_SPEC.get(document_type, {})
        return {
            "success": False,
            "verification_id": record["id"],
            "verification_result": result,
            "scheme_code": scheme_code,
            "document_type": document_type,
            "document_title": spec.get("title", document_type),
            "file_info": {
                "file_name": file_name,
                "file_size": os.path.getsize(file_path) if os.path.exists(file_path) else 0,
                "processed_image_url": processed_url
            },
            "completeness": {"completeness_score": 0.0, "is_fully_complete": False},
            "profile_comparison": {"name_match_status": "NOT_EVALUATED"},
            "extracted_fields": {},
            "evidence_summary": f"Validation failure: {', '.join(deficiency_reasons)}",
            "deficiency_reasons": deficiency_reasons,
            "remedy_suggestions": remedy_suggestions,
            "allow_resubmission": True,
            "resubmission_count": record["resubmission_count"]
        }


scholar_document_verifier = ScholarDocumentVerifier()
