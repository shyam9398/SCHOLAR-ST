import os
import json
from app.services.scholar_service import scholar_service
from app.services.scholar_rule_engine import scholar_rule_engine
from app.services.scholar_report_generator import generate_scholar_pdf_report


def test_scholar_st_e2e():
    print("==================================================")
    print("SCHOLAR-ST END-TO-END VALIDATION TEST")
    print("==================================================")

    # 1. Fetch Schemes
    schemes = scholar_service.get_schemes()
    print(f"[OK] Active Schemes loaded: {len(schemes)}")
    for s in schemes:
        print(f"    - {s['scheme_code']}: {s['scheme_name']} ({s.get('rules_count', 0)} rules)")

    assert len(schemes) >= 5, "Expected at least 5 standard ST schemes"

    # 2. Test Dynamic Rule Retrieval from Supabase
    rules = scholar_service.getRules_for_scheme("NOS-ST") if hasattr(scholar_service, "getRules_for_scheme") else scholar_service.get_rules_for_scheme("NOS-ST")
    print(f"\n[OK] Dynamic Rules for NOS-ST: {len(rules)} rules")
    for r in rules:
        print(f"    * [{r['rule_code']}] {r['rule_name']}: {r['field_name']} {r['operator']} {r['expected_value']} ({r['severity']})")

    assert len(rules) >= 4, "Expected at least 4 dynamic rules for NOS-ST"

    # 3. Test Caste Verification Engine
    caste_test_data = {
        "applicant_name": "Birsa Munda",
        "tribe_community_name": "Munda",
        "is_scheduled_tribe": True,
        "certificate_number": "ST/JH/2025/08942",
        "issuing_authority": "Sub-Divisional Magistrate, Khunti",
        "has_official_seal_or_signature": True,
        "state": "Jharkhand",
        "district": "Khunti"
    }

    caste_result = scholar_service.verify_st_caste(caste_test_data, applicant_declared_name="Birsa Munda")
    print(f"\n[OK] Caste Verification Result: {caste_result['verification_status']}")
    print(f"    - Tribe recognized under Article 342: {caste_result['tribe_recognized_under_art342']}")
    print(f"    - Certificate Number: {caste_result['certificate_number']}")
    assert caste_result["caste_verified"] is True, "Caste should be verified"

    # 4. Test Application Submission & Deterministic Dynamic Rule Evaluation
    applicant_data = {
        "scheme_code": "NOS-ST",
        "applicant_name": "Birsa Munda",
        "applicant_email": "birsa.munda@example.edu",
        "applicant_phone": "+91 9876543210",
        "tribe_name": "Munda",
        "caste_certificate_no": "ST/JH/2025/08942",
        "annual_family_income": 350000.0,
        "aggregate_percentage": 78.5,
        "applicant_age": 25,
        "institution_name": "University of Oxford",
        "course_enrolled": "D.Phil in Environmental Sciences",
        "admission_status": "UNCONDITIONAL",
        "caste_verified": True
    }

    doc_data = {
        "caste_certificate": caste_test_data,
        "income_certificate": {
            "annual_income_inr": 350000.0,
            "certificate_number": "INC/2025/3321",
            "issuing_authority": "Circle Officer"
        },
        "marksheet": {
            "examination_degree": "Master of Science",
            "aggregate_percentage": 78.5,
            "board_or_university": "Ranchi University"
        },
        "admission_offer": {
            "institution_name": "University of Oxford",
            "course_enrolled": "D.Phil in Environmental Sciences",
            "offer_status": "UNCONDITIONAL",
            "institution_country": "United Kingdom"
        }
    }

    app = scholar_service.submit_application(
        applicant_data=applicant_data,
        documents_extracted_data=doc_data,
        document_files=[
            {"document_type": "CASTE_CERTIFICATE", "file_name": "caste_cert.pdf", "file_path": "uploads/caste_cert.pdf", "file_type": "pdf"},
            {"document_type": "INCOME_CERTIFICATE", "file_name": "income_cert.pdf", "file_path": "uploads/income_cert.pdf", "file_type": "pdf"},
            {"document_type": "MARKSHEET", "file_name": "pg_marksheet.pdf", "file_path": "uploads/pg_marksheet.pdf", "file_type": "pdf"},
            {"document_type": "ADMISSION_OFFER", "file_name": "oxford_offer.pdf", "file_path": "uploads/oxford_offer.pdf", "file_type": "pdf"}
        ]
    )

    print(f"\n[OK] Application Created: {app['application_number']}")
    print(f"    - Eligibility Score: {app['eligibility_score']}%")
    print(f"    - Passed Rules: {app['passed_rules']} / {app['total_rules']}")
    print(f"    - Advisory Recommendation: {app['evaluation']['system_recommendation']}")
    assert app["eligibility_score"] == 100.0, "All criteria should pass for Birsa Munda"

    # 5. Test Officer Review & Binding Determination
    officer_app = scholar_service.record_officer_decision(
        application_id=app["id"],
        officer_id="officer-demo-uuid",
        decision="APPROVED",
        remarks="All statutory documents, Article 342 ST certificate, and Oxford unconditional offer verified."
    )
    print(f"\n[OK] Officer Determination Recorded: {officer_app['status']}")
    print(f"    - Officer Remarks: {officer_app['officer_remarks']}")
    assert officer_app["status"] == "APPROVED", "Status should be APPROVED"

    # 6. Test PDF Dossier Generation
    pdf_path = generate_scholar_pdf_report(officer_app, officer_name="Shri A. K. Sharma, Verification Officer")
    print(f"\n[OK] Official PDF Dossier Generated: {pdf_path}")
    assert os.path.exists(pdf_path), "PDF file must exist"
    print(f"    - File Size: {os.path.getsize(pdf_path)} bytes")

    print("\n==================================================")
    print("ALL SCHOLAR-ST PIPELINE TESTS PASSED 100%!")
    print("==================================================")


if __name__ == "__main__":
    test_scholar_st_e2e()
