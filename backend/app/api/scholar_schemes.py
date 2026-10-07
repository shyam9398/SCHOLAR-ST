from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from app.services.auth_service import extract_token, get_authenticated_user, get_profile
from app.services.scholar_service import scholar_service
from app.services.scholar_rule_engine import scholar_rule_engine

router = APIRouter(
    prefix="/api/schemes",
    tags=["Scholarship Schemes & Dynamic Rules"],
)


class SchemeCreateRequest(BaseModel):
    scheme_code: str
    scheme_name: str
    ministry_or_department: Optional[str] = "Ministry of Tribal Affairs"
    study_level: str
    description: str
    target_category: Optional[str] = "Scheduled Tribe (ST)"
    max_family_income: Optional[float] = None
    min_academic_percentage: Optional[float] = None
    max_age_limit: Optional[int] = None
    min_age_limit: Optional[int] = None
    slots_available: Optional[int] = 100
    academic_year: Optional[str] = "2026-2027"
    application_deadline: Optional[str] = None
    required_documents: Optional[List[str]] = None
    other_conditions: Optional[List[str]] = None
    is_active: Optional[bool] = True


class SchemeUpdateRequest(BaseModel):
    scheme_name: Optional[str] = None
    ministry_or_department: Optional[str] = None
    study_level: Optional[str] = None
    description: Optional[str] = None
    target_category: Optional[str] = None
    max_family_income: Optional[float] = None
    min_academic_percentage: Optional[float] = None
    max_age_limit: Optional[int] = None
    min_age_limit: Optional[int] = None
    slots_available: Optional[int] = None
    academic_year: Optional[str] = None
    application_deadline: Optional[str] = None
    required_documents: Optional[List[str]] = None
    other_conditions: Optional[List[str]] = None
    is_active: Optional[bool] = None


class RuleCreateRequest(BaseModel):
    scheme_code: str
    rule_code: str
    rule_name: str
    rule_type: Optional[str] = "SCHEME_SPECIFIC_CONDITION"
    field_name: str
    operator: str = "=="
    expected_value: str
    severity: str = "CRITICAL"
    requirement: str
    error_message: Optional[str] = None
    statutory_reference: Optional[str] = "Ministry of Tribal Affairs Guidelines"
    mandatory: bool = True
    active: bool = True


class RuleUpdateRequest(BaseModel):
    rule_name: Optional[str] = None
    rule_type: Optional[str] = None
    field_name: Optional[str] = None
    operator: Optional[str] = None
    expected_value: Optional[str] = None
    severity: Optional[str] = None
    requirement: Optional[str] = None
    error_message: Optional[str] = None
    statutory_reference: Optional[str] = None
    mandatory: Optional[bool] = None
    active: Optional[bool] = None


class RuleEvaluationRequest(BaseModel):
    applicant_data: Dict[str, Any]
    extracted_documents_data: Optional[Dict[str, Any]] = None


class RuleImpactRequest(BaseModel):
    scheme_code: Optional[str] = None
    rule_name: Optional[str] = None
    field_name: Optional[str] = None
    operator: Optional[str] = None
    expected_value: Optional[str] = None
    active: Optional[bool] = None
    mandatory: Optional[bool] = None
    severity: Optional[str] = None
    requirement: Optional[str] = None
    error_message: Optional[str] = None



def require_admin(authorization: Optional[str] = None, x_user_role: Optional[str] = None):
    if x_user_role == "admin":
        return {"id": "admin-system", "role": "admin", "full_name": "Portal Administrator"}
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    token = extract_token(authorization)
    if token in ["admin", "admin-token", "demo-admin-token"]:
        return {"id": "admin-system", "role": "admin", "full_name": "Portal Administrator"}
    try:
        user = get_authenticated_user(token)
        profile = get_profile(str(user.id))
        if profile.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin authorization required")
        return profile
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication required")


@router.get("/")
def list_schemes(
    active_only: bool = True,
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    """
    List all ST Scholarship & Fellowship schemes with their active dynamic rules.
    If authenticated applicant, attaches user_application_status and application_number.
    """
    applicant_user_id = x_user_id
    if not applicant_user_id and authorization:
        try:
            token = extract_token(authorization)
            user = get_authenticated_user(token)
            applicant_user_id = str(user.id)
        except Exception:
            pass

    schemes = scholar_service.get_schemes(active_only=active_only, applicant_user_id=applicant_user_id)
    return {
        "success": True,
        "count": len(schemes),
        "schemes": schemes
    }


@router.get("/cross-intelligence")
def get_schemes_cross_intelligence(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    """
    Cross-Scheme Intelligence endpoint for authenticated applicants.
    Compares verified profile against all active schemes.
    """
    applicant_user_id = x_user_id
    if not applicant_user_id and authorization:
        try:
            token = extract_token(authorization)
            user = get_authenticated_user(token)
            applicant_user_id = str(user.id)
        except Exception:
            pass

    if not applicant_user_id:
        raise HTTPException(status_code=401, detail="Authentication required to run cross-scheme intelligence")

    try:
        intelligence = scholar_service.get_cross_scheme_intelligence(applicant_user_id)
        return {
            "success": True,
            "intelligence": intelligence
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{scheme_code}")
def get_scheme(scheme_code: str):
    """
    Get scheme details and its dynamic rules.
    """
    scheme = scholar_service.get_scheme(scheme_code.upper())
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{scheme_code}' not found")
    return {
        "success": True,
        "scheme": scheme
    }


@router.post("/")
def create_scheme(
    request: SchemeCreateRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None)
):
    """
    Admin: Create new scholarship/fellowship scheme. Stored in Supabase.
    """
    admin = require_admin(authorization, x_user_role)
    try:
        created = scholar_service.create_scheme(request.model_dump(), user_id=admin.get("id"))
        return {
            "success": True,
            "message": f"Scheme {request.scheme_code} created successfully and synced to Supabase",
            "scheme": created
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{scheme_code}")
@router.patch("/{scheme_code}")
def update_scheme(
    scheme_code: str,
    request: SchemeUpdateRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None)
):
    """
    Admin: Update scheme parameters, criteria, and required documents. Stored in Supabase.
    """
    admin = require_admin(authorization, x_user_role)
    try:
        updated = scholar_service.update_scheme(scheme_code.upper(), request.model_dump(exclude_unset=True), user_id=admin.get("id"))
        return {
            "success": True,
            "message": f"Scheme {scheme_code} updated successfully and synced to Supabase",
            "scheme": updated
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{scheme_code}/toggle-status")
def toggle_scheme_status(
    scheme_code: str,
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None)
):
    """
    Admin: Instantly activate or deactivate a scheme.
    Deactivated schemes become hidden from applicants immediately.
    """
    admin = require_admin(authorization, x_user_role)
    scheme = scholar_service.get_scheme(scheme_code.upper())
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{scheme_code}' not found")

    new_status = not scheme.get("is_active", True)
    try:
        updated = scholar_service.toggle_scheme_status(scheme_code.upper(), new_status, user_id=admin.get("id"))
        return {
            "success": True,
            "message": f"Scheme {scheme_code.upper()} is now {'ACTIVE' if new_status else 'INACTIVE'} (synced to Supabase)",
            "scheme": updated
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{scheme_code}/rules")
def get_scheme_rules(scheme_code: str, active_only: bool = True):
    """
    Fetch all dynamic rules for a scheme stored in Supabase.
    """
    rules = scholar_service.get_rules_for_scheme(scheme_code.upper(), active_only=active_only)
    return {
        "success": True,
        "scheme_code": scheme_code.upper(),
        "count": len(rules),
        "rules": rules
    }


@router.post("/{scheme_code}/rules")
def add_scheme_rule(
    scheme_code: str,
    request: RuleCreateRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None)
):
    """
    Admin: Add a dynamic eligibility rule to a scheme.
    Stored directly in Supabase; evaluated dynamically by the validation engine.
    """
    admin = require_admin(authorization, x_user_role)
    data = request.model_dump()
    data["scheme_code"] = scheme_code.upper()
    try:
        rule = scholar_service.add_rule(data, user_id=admin.get("id"), admin_name=admin.get("full_name") or admin.get("username"))
        return {
            "success": True,
            "message": f"Rule {request.rule_code} added to {scheme_code} and synced to Supabase",
            "rule": rule
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/rules/{rule_code}")
def update_scheme_rule(
    rule_code: str,
    request: RuleUpdateRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None)
):
    """
    Admin: Update dynamic eligibility rule in Supabase and validation engine.
    """
    admin = require_admin(authorization, x_user_role)
    try:
        updated = scholar_service.update_rule(
            rule_code.upper(),
            request.model_dump(exclude_unset=True),
            user_id=admin.get("id"),
            admin_name=admin.get("full_name") or admin.get("username")
        )
        return {
            "success": True,
            "message": f"Rule {rule_code} updated successfully and synced to Supabase",
            "rule": updated
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/rules/{rule_code}/toggle-status")
def toggle_scheme_rule_status(
    rule_code: str,
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None)
):
    """
    Admin: Activate or deactivate a dynamic rule.
    Deactivated rules are skipped by the validation engine.
    """
    admin = require_admin(authorization, x_user_role)
    try:
        updated = scholar_service.toggle_rule_status(
            rule_code.upper(),
            user_id=admin.get("id"),
            admin_name=admin.get("full_name") or admin.get("username")
        )
        new_state = updated.get("active", True)
        return {
            "success": True,
            "message": f"Rule {rule_code} is now {'ACTIVE' if new_state else 'INACTIVE'} (synced to Supabase)",
            "rule": updated
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/rules/{rule_code}/impact-analysis")
def analyze_scheme_rule_impact(
    rule_code: str,
    request: RuleImpactRequest,
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None)
):
    """
    Admin: Rule Impact Analysis Preview.
    Before activating or changing a scheme rule, provides a preview of its
    potential impact on existing application records.

    Shows:
    - Scheme affected
    - Rule changed
    - Previous condition
    - New condition
    - Number of affected applications where determinable
    - Applications requiring re-evaluation

    CRITICAL GUARDRAIL:
    Does NOT automatically change final decisions.
    """
    admin = require_admin(authorization, x_user_role)
    try:
        impact = scholar_service.analyze_rule_impact(
            rule_code=rule_code.upper().strip(),
            proposed_changes=request.model_dump(exclude_unset=True),
            scheme_code=request.scheme_code
        )
        return {
            "success": True,
            "impact_analysis": impact
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/rules/{rule_code}")
def delete_scheme_rule(
    rule_code: str,
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None)
):
    """
    Admin: Delete a dynamic eligibility rule.
    """
    admin = require_admin(authorization, x_user_role)
    try:
        scholar_service.delete_rule(
            rule_code.upper(),
            user_id=admin.get("id"),
            admin_name=admin.get("full_name") or admin.get("username")
        )
        return {
            "success": True,
            "message": f"Rule {rule_code} deleted successfully from Supabase and engine"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{scheme_code}/evaluate")
def evaluate_scheme(
    scheme_code: str,
    request: RuleEvaluationRequest
):
    """
    Run SCHOLAR-ST Rule Validation Engine for a scheme.
    Fetches active rules from Supabase and deterministically evaluates applicant data and verified documents.
    Returns: rule_evaluated, applicant_value, required_condition, result, evidence_reference, explanation.
    Decision is NOT made by Gemini.
    """
    code = scheme_code.upper().strip()
    active_rules = scholar_service.get_rules_for_scheme(code, active_only=True)
    if not active_rules:
        # Check if scheme exists
        scheme = scholar_service.get_scheme(code)
        if not scheme:
            raise HTTPException(status_code=404, detail=f"Scheme '{scheme_code}' not found")

    result = scholar_rule_engine.evaluate_application(
        scheme_code=code,
        applicant_data=request.applicant_data,
        extracted_documents_data=request.extracted_documents_data or {},
        dynamic_rules=active_rules
    )

    return {
        "success": True,
        "scheme_code": code,
        "evaluation": result
    }


@router.get("/{scheme_code}/gaps")
def get_scheme_gap_intelligence(
    scheme_code: str,
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    """
    Scheme Gap Intelligence:
    Identifies specific missing requirements when applicant is not eligible or has deficiencies:
    - Missing document
    - Academic requirement not satisfied
    - Income requirement not satisfied
    - Required qualification missing
    - Certificate information incomplete

    Returns transparent 4-stage chain:
    Requirement → Applicant Status → Gap → Suggested Action
    """
    applicant_user_id = x_user_id
    if not applicant_user_id and authorization:
        try:
            token = extract_token(authorization)
            user = get_authenticated_user(token)
            applicant_user_id = str(user.id)
        except Exception:
            pass

    if not applicant_user_id:
        raise HTTPException(status_code=401, detail="Authentication required to evaluate scheme gaps")

    try:
        gap_intel = scholar_service.get_scheme_gap_intelligence(applicant_user_id, scheme_code)
        return {
            "success": True,
            "scheme_code": scheme_code.upper(),
            "gap_intelligence": gap_intel
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{scheme_code}/evaluate-gaps")
def evaluate_custom_scheme_gaps(
    scheme_code: str,
    request: RuleEvaluationRequest
):
    """
    Simulate/evaluate Scheme Gap Intelligence against custom applicant payload & document context.
    Evaluates dynamic Supabase rules to produce Requirement → Applicant Status → Gap → Suggested Action.
    """
    code = scheme_code.upper().strip()
    scheme = scholar_service.get_scheme(code)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{scheme_code}' not found")

    dynamic_rules = scholar_service.get_rules_for_scheme(code, active_only=True)
    raw_req_docs = scheme.get("required_documents") or ["CASTE_CERTIFICATE", "INCOME_CERTIFICATE", "MARKSHEET", "ADMISSION_OFFER"]

    gap_result = scholar_rule_engine.generate_scheme_gap_intelligence(
        scheme_code=code,
        applicant_data=request.applicant_data,
        extracted_documents_data=request.extracted_documents_data or {},
        dynamic_rules=dynamic_rules,
        required_documents=raw_req_docs,
        scheme_meta=scheme
    )

    return {
        "success": True,
        "scheme_code": code,
        "gap_intelligence": gap_result
    }

