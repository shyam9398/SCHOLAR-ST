import os
import sys
import json

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "Downloads", "SIH-G", "SIH-G", "backend")))

from app.services.scholar_report_generator import (
    build_evidence_verification_report,
    generate_scholar_pdf_report
)
from app.services.scholar_service import scholar_service
from app.services.scholar_rule_engine import scholar_rule_engine

def test_evidence_verification_report():
    print("======================================================================")
    print("TESTING EVIDENCE-BASED VERIFICATION REPORT MODULE")
    print("Document -> Extracted Data -> Rule -> Result -> Evidence")
    print("======================================================================\n")

    # 1. SETUP TEST APPLICATION WITH DOCUMENTS & EVALUATION
    scheme_code = "NOS-ST"
    applicant_data = {
        "scheme_code": scheme_code,
        "applicant_name": "Devendra Singh Birhor",
        "tribe_name": "Birhor",
        "caste_certificate_no": "JH/ST/2024/77182",
        "annual_family_income": 380000.0,
        "aggregate_percentage": 74.0,
        "applicant_age": 28,
        "admission_confirmed": True,
        "admission_status": "CONFIRMED",
        "institution_name": "Oxford University",
        "course_enrolled": "M.Sc. Anthropology",
        "has_caste_certificate": True,
        "has_income_certificate": True,
        "academic_year": "2026-2027",
        "previous_fellowship_availed": False
    }

    rules = scholar_service.get_rules_for_scheme(scheme_code, active_only=True)
    rule_eval = scholar_rule_engine.evaluate_application(
        scheme_code=scheme_code,
        applicant_data=applicant_data,
        extracted_documents_data={},
        dynamic_rules=rules
    )

    doc_records = [
        {
            "document_type": "CASTE_CERTIFICATE",
            "file_name": "birhor_caste_certificate.pdf",
            "file_path": "/uploads/test/birhor_caste_certificate.pdf",
            "file_type": "pdf",
            "ocr_raw_text": "GOVERNMENT OF JHARKHAND\nSCHEDULED TRIBE CERTIFICATE\nShri Devendra Singh Birhor\nBirhor Community recognized under Article 342\nTahsildar Ranchi",
            "extracted_fields": {
                "applicant_name": "Devendra Singh Birhor",
                "tribe_community_name": "Birhor",
                "certificate_number": "JH/ST/2024/77182",
                "ai_understanding": {
                    "classification": {"classified_type": "CASTE_CERTIFICATE", "confidence": 0.98},
                    "document_explanation": "Statutory Scheduled Tribe Caste Certificate under Article 342."
                }
            }
        },
        {
            "document_type": "INCOME_CERTIFICATE",
            "file_name": "annual_income_cert.pdf",
            "file_type": "pdf",
            "ocr_raw_text": "ANNUAL FAMILY INCOME CERTIFICATE\nGross Annual Income: Rs. 3,80,000\nRevenue Officer Ranchi",
            "extracted_fields": {
                "annual_income_inr": 380000.0,
                "ai_understanding": {
                    "classification": {"classified_type": "INCOME_CERTIFICATE", "confidence": 0.95},
                    "document_explanation": "Revenue authority certified family income below 8 lakh ceiling."
                }
            }
        }
    ]

    submitted_app = scholar_service.submit_application(
        applicant_data=applicant_data,
        documents_extracted_data={},
        document_files=doc_records
    )
    app_id = submitted_app["id"]
    print(f"[1/4] Created test application: ID={app_id}, No={submitted_app['application_number']}")

    # 2. BUILD STRUCTURED EVIDENCE-BASED VERIFICATION REPORT
    print("\n[2/4] Generating structured Evidence-Based Verification Report...")
    app_record = scholar_service.get_application(app_id)
    report = build_evidence_verification_report(app_record)

    # Validate required sections
    assert "applicant_information" in report, "applicant_information missing"
    assert "selected_scheme" in report, "selected_scheme missing"
    assert "documents_checked" in report, "documents_checked missing"
    assert "extracted_information" in report, "extracted_information missing"
    assert "lineage_matrix" in report, "lineage_matrix missing"
    assert "rules_evaluated" in report, "rules_evaluated missing"
    assert "deficiencies" in report, "deficiencies missing"
    assert "overall_screening_result" in report, "overall_screening_result missing"
    assert "statutory_guardrail" in report, "statutory_guardrail missing"

    # Validate Overall Result
    valid_results = ["Eligible", "Not Eligible", "Deficiency Found", "Requires Officer Review"]
    assert report["overall_screening_result"] in valid_results, f"Invalid overall result: {report['overall_screening_result']}"
    print(f"  Overall Screening Result: {report['overall_screening_result']}")
    print(f"  Screening Rationale: {report['screening_rationale']}")
    print(f"  Eligibility Score: {report['eligibility_score']}% ({report['passed_rules']}/{report['total_rules']} Rules Passed)")

    # 3. VALIDATE TRANSPARENT LINEAGE MATRIX
    print("\n[3/4] Validating Transparent Lineage: Document -> Extracted Data -> Rule -> Result -> Evidence...")
    matrix = report["lineage_matrix"]
    assert len(matrix) > 0, "Lineage matrix must not be empty"
    for idx, item in enumerate(matrix[:3]):
        assert "document_source" in item, "document_source missing"
        assert "extracted_data" in item, "extracted_data missing"
        assert "rule_code" in item, "rule_code missing"
        assert "rule_result" in item, "rule_result missing"
        assert "supporting_evidence" in item, "supporting_evidence missing"
        print(f"  [{idx+1}] {item['document_source']} -> {item['extracted_data'][:30]}... -> {item['rule_code']} -> {item['rule_result']} -> {item['supporting_evidence'][:40]}...")

    # Validate Negative Guardrail
    guardrail = report["statutory_guardrail"]
    assert "NOT" in guardrail["title"], "Guardrail title must emphasize not a final decision"
    assert "Verification Officer" in guardrail["notice"], "Notice must confirm final decision remains with Officer"
    print("  [OK] Statutory guardrail verified: final approval/rejection remains with Verification Officer.")

    # 4. TEST PDF REPORT COMPILATION
    print("\n[4/4] Testing PDF Dossier compilation with 5-stage lineage table...")
    pdf_path = generate_scholar_pdf_report(app_record, officer_name="Shri A. K. Sharma")
    assert os.path.exists(pdf_path), f"PDF file not generated at {pdf_path}"
    pdf_size = os.path.getsize(pdf_path)
    assert pdf_size > 1000, "PDF file is too small or corrupt"
    print(f"  [OK] Generated official PDF Dossier: {pdf_path} ({pdf_size:,} bytes)")

    print("\n======================================================================")
    print("ALL TESTS PASSED! Evidence-Based Verification Report successfully verified.")
    print("======================================================================")

if __name__ == "__main__":
    test_evidence_verification_report()
