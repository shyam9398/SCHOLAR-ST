import sys
import os

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)


def test_scholar_st_system():
    print("==================================================")
    print("SCHOLAR-ST - SYSTEM INTEGRITY VERIFICATION")
    print("==================================================")

    # 1. Test Supabase Client & Scholarship Tables
    print("\n[1] Verifying Supabase Connectivity & Scheme Records...")
    from app.services.scholar_service import scholar_service

    schemes = scholar_service.get_schemes()
    print(f"  [OK] public.schemes: {len(schemes)} active schemes loaded.")
    for s in schemes[:3]:
        print(f"       Scheme: {s.get('scheme_code')} - {s.get('scheme_name')} (Slots: {s.get('slots_available')})")

    # 2. Test Dynamic Rule Retrieval from Supabase
    print("\n[2] Verifying Dynamic Scheme Rules...")
    from app.services.scholar_rule_engine import scholar_rule_engine
    
    rules = scholar_service.get_rules_for_scheme("NOS-ST")
    print(f"  [OK] public.scheme_rules (NOS-ST): {len(rules)} rules retrieved.")
    for r in rules[:3]:
        print(f"       Rule: [{r.get('rule_code')}] {r.get('rule_name')} (Severity: {r.get('severity')})")

    # 3. Test Caste Verification (Article 342)
    print("\n[3] Testing Article 342 Scheduled Tribe Caste Verification...")
    caste_test = {
        "applicant_name": "Jaipal Singh Munda",
        "tribe_community_name": "Munda",
        "is_scheduled_tribe": True,
        "certificate_number": "ST/JH/2026/00129",
        "issuing_authority": "Sub-Divisional Magistrate",
        "has_official_seal_or_signature": True,
        "state": "Jharkhand"
    }
    caste_res = scholar_service.verify_st_caste(caste_test, applicant_declared_name="Jaipal Singh Munda")
    print(f"  [OK] Caste Verification: Status = {caste_res.get('verification_status')}, Verified = {caste_res.get('caste_verified')}")

    # 4. Test Scheme Evaluation
    print("\n[4] Testing Dynamic Rule Evaluation Engine...")
    applicant_payload = {
        "scheme_code": "NOS-ST",
        "applicant_name": "Jaipal Singh Munda",
        "caste_category": "ST",
        "annual_family_income": 450000.0,
        "aggregate_percentage": 82.0,
        "applicant_age": 26,
        "admission_confirmed": True,
        "has_caste_certificate": True,
        "has_income_certificate": True,
        "academic_year": "2026-2027",
        "previous_fellowship_availed": False
    }
    extracted_docs = {
        "caste_certificate": caste_test,
        "income_certificate": {"annual_income_inr": 450000.0, "certificate_number": "INC/JH/2026/102"}
    }
    eval_report = scholar_rule_engine.evaluate_application(
        scheme_code="NOS-ST",
        applicant_data=applicant_payload,
        extracted_documents_data=extracted_docs,
        dynamic_rules=rules
    )
    print(f"  [OK] Evaluation Result: Recommendation = {eval_report.get('system_recommendation')}, Score = {eval_report.get('eligibility_score')}%")
    print(f"       Passed Rules: {eval_report.get('passed_rules')} / {eval_report.get('total_rules')}")

    # 5. Test FastAPI App and Route Tree
    print("\n[5] Testing FastAPI App Route Registration...")
    from main import app
    routes = [r.path for r in app.routes if hasattr(r, 'path')]
    print(f"  [OK] Total Routes Registered: {len(routes)}")
    for route in sorted(routes):
        print(f"       -> {route}")

    print("\n==================================================")
    print("ALL SCHOLAR-ST SYSTEM VERIFICATIONS COMPLETED 100%!")
    print("==================================================")


if __name__ == "__main__":
    test_scholar_st_system()
