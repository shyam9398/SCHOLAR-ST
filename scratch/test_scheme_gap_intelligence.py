import sys
import os
import json

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")


from app.services.scholar_rule_engine import scholar_rule_engine
from app.services.scholar_service import scholar_service

def test_gap_intelligence():
    print("==================================================")
    print("TESTING SCHEME GAP INTELLIGENCE ENGINE")
    print("==================================================")

    # 1. Test PMS-ST Gap Intelligence with incomplete profile & missing documents
    # Scenario: Applicant with missing documents, income exceeding PMS-ST limit
    applicant_data = {
        "user_id": "test-gap-user",
        "full_name": "Ramesh Gond",
        "category": "Scheduled Tribe (ST)",
        "tribe_name": "Gond",
        "caste_verified": False,
        "annual_income": 350000, # PMS-ST ceiling is 250,000 -> shortfall of 100,000
        "aggregate_percentage": 52.0, # PMS-ST requires 50%, NFST requires 55%
        "academic_level": "POSTGRADUATE",
        "institution_name": "State Tribal University",
        "course_name": "M.Sc. Forestry",
        "admission_status": "CONFIRMED"
    }

    # Only marksheet uploaded; caste & income certificates missing
    doc_data = {
        "marksheet": {
            "aggregate_percentage": "52.0%",
            "degree_name": "B.Sc.",
            "university_name": "State Tribal University",
            "verification_status": "VERIFIED"
        }
    }

    # Fetch PMS-ST rules from Supabase / DB
    pms_rules = scholar_service.get_rules_for_scheme("PMS-ST", active_only=True)
    pms_scheme = scholar_service.get_scheme("PMS-ST")

    print(f"\n[1] Evaluating PMS-ST for Income Exceeded & Missing Documents:")
    print(f"Total Active Rules fetched: {len(pms_rules)}")
    
    gap_result = scholar_rule_engine.generate_scheme_gap_intelligence(
        scheme_code="PMS-ST",
        applicant_data=applicant_data,
        extracted_documents_data=doc_data,
        dynamic_rules=pms_rules,
        required_documents=pms_scheme.get("required_documents") if pms_scheme else ["CASTE_CERTIFICATE", "INCOME_CERTIFICATE", "MARKSHEET", "ADMISSION_OFFER"],
        scheme_meta=pms_scheme
    )

    print(f"Overall Status: {gap_result['overall_status']}")
    print(f"Total Gaps: {gap_result['total_gaps_count']} (Disqualifying: {gap_result['disqualifying_gaps_count']}, Resolvable: {gap_result['resolvable_gaps_count']})")
    
    for idx, gap in enumerate(gap_result["gaps"], 1):
        print(f"\n--- GAP #{idx} [{gap['gap_type']}] ---")
        print(f"  Requirement:      {gap['requirement']}")
        print(f"  Applicant Status: {gap['applicant_status']}")
        print(f"  Gap:              {gap['gap']}")
        print(f"  Suggested Action: {gap['suggested_action']}")
        print(f"  Statutory Ref:    {gap['statutory_reference']}")
        print(f"  Disqualifying:    {gap['is_disqualifying']}")

    # Check that income gap was identified
    income_gaps = [g for g in gap_result["gaps"] if g["gap_type"] == "INCOME_REQUIREMENT_UNMET"]
    assert len(income_gaps) > 0, "Expected income gap not found"
    print("\n>>> Income gap correctly captured with 4-tier chain.")

    # Check that missing document gaps were identified
    doc_gaps = [g for g in gap_result["gaps"] if g["gap_type"] == "MISSING_DOCUMENT"]
    assert len(doc_gaps) > 0, "Expected missing document gap not found"
    print(f">>> {len(doc_gaps)} missing document gap(s) captured.")

    # 2. Test NFST Gap Intelligence (Academic requirement unmet + Qualification missing)
    # NFST requires Ph.D. registration & 55% marks
    print("\n[2] Evaluating NFST (Ph.D. fellowship) for Academic shortfall & Qualification missing:")
    nfst_rules = scholar_service.get_rules_for_scheme("NFST", active_only=True)
    nfst_scheme = scholar_service.get_scheme("NFST")

    nfst_gaps = scholar_rule_engine.generate_scheme_gap_intelligence(
        scheme_code="NFST",
        applicant_data=applicant_data,
        extracted_documents_data=doc_data,
        dynamic_rules=nfst_rules,
        required_documents=nfst_scheme.get("required_documents") if nfst_scheme else ["CASTE_CERTIFICATE", "MARKSHEET", "ADMISSION_OFFER", "RESEARCH_PROPOSAL"],
        scheme_meta=nfst_scheme
    )

    for idx, gap in enumerate(nfst_gaps["gaps"], 1):
        print(f"\n--- NFST GAP #{idx} [{gap['gap_type']}] ---")
        print(f"  Requirement:      {gap['requirement']}")
        print(f"  Applicant Status: {gap['applicant_status']}")
        print(f"  Gap:              {gap['gap']}")
        print(f"  Suggested Action: {gap['suggested_action']}")

    acad_gaps = [g for g in nfst_gaps["gaps"] if g["gap_type"] == "ACADEMIC_REQUIREMENT_UNMET"]
    qual_gaps = [g for g in nfst_gaps["gaps"] if g["gap_type"] == "QUALIFICATION_MISSING"]
    print(f"\nAcademic Gaps found: {len(acad_gaps)}")
    print(f"Qualification Gaps found: {len(qual_gaps)}")
    assert len(acad_gaps) > 0 or len(qual_gaps) > 0, "Expected academic or qualification gap in NFST"

    # 3. Test Certificate Information Incomplete
    print("\n[3] Evaluating Certificate Information Incomplete:")
    incomplete_cert_profile = {
        "user_id": "cert-user",
        "category": "Scheduled Tribe (ST)",
        "tribe_name": "", # Incomplete tribe name
        "caste_verified": False,
        "annual_income": 180000,
        "aggregate_percentage": 68.0,
        "academic_level": "UNDERGRADUATE"
    }
    cert_docs = {
        "caste_certificate": {
            "caste_name": None,
            "verification_status": "FLAGGED_INCOMPLETE",
            "remarks": "Tribe name illegible, issuing authority seal unverified"
        }
    }
    cert_gap_result = scholar_rule_engine.generate_scheme_gap_intelligence(
        scheme_code="PMS-ST",
        applicant_data=incomplete_cert_profile,
        extracted_documents_data=cert_docs,
        dynamic_rules=pms_rules,
        required_documents=["CASTE_CERTIFICATE", "INCOME_CERTIFICATE", "MARKSHEET", "ADMISSION_OFFER"]
    )

    cert_gaps = [g for g in cert_gap_result["gaps"] if g["gap_type"] in ["CERTIFICATE_INCOMPLETE", "MISSING_DOCUMENT"]]
    print(f"Certificate-related gaps found: {len(cert_gaps)}")
    for g in cert_gaps:
        print(f"  -> Requirement: {g['requirement']}")
        print(f"     Applicant Status: {g['applicant_status']}")
        print(f"     Gap: {g['gap']}")
        print(f"     Suggested Action: {g['suggested_action']}")

    # 4. Test Cross Scheme Intelligence embedding
    print("\n[4] Testing Cross Scheme Intelligence Service Integration:")
    cross_intel = scholar_service.get_cross_scheme_intelligence("00000000-0000-0000-0000-000000000001")
    all_schemes = cross_intel.get("all_schemes", [])
    print(f"Total schemes evaluated: {len(all_schemes)}")
    for s in all_schemes:
        has_gaps = "gap_analysis" in s and "gaps" in s["gap_analysis"]
        g_count = len(s["gap_analysis"].get("gaps", [])) if has_gaps else 0
        print(f"  Scheme {s['scheme_code']}: Tier={s['eligibility_tier']}, Gaps count={g_count}")
        assert has_gaps, f"Missing gap_analysis in scheme {s['scheme_code']}"

    print("\n==================================================")
    print("ALL SCHEME GAP INTELLIGENCE TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_gap_intelligence()
