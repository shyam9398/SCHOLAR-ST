import uuid
import os
import json
from app.services.scholar_service import scholar_service, BASE_DIR

def test_applicant_profile_module():
    print("==================================================")
    print("TESTING SCHOLAR-ST APPLICANT PROFILE MODULE")
    print("==================================================")

    test_user_id = f"test-applicant-{uuid.uuid4().hex[:8]}"

    # 1. Profile Creation with all requested fields
    profile_input = {
        "full_name": "Birsa Munda",
        "dob": "2000-11-15",
        "gender": "MALE",
        "email": "birsa.munda@example.edu",
        "phone": "+91 9876543210",
        "address": "Village Ulihatu, PS Arki",
        "pincode": "835210",
        "state_of_domicile": "Jharkhand",
        "district": "Khunti",
        "category": "Scheduled Tribe (ST)",
        "tribe_name": "Munda",
        "caste_certificate_no": "ST/JH/2025/08942",
        "caste_issuing_authority": "Sub-Divisional Magistrate, Khunti",
        "caste_issue_date": "2025-06-12",
        "education_qualification": "POSTGRADUATE",
        "academic_level": "POSTGRADUATE",
        "institution_name": "University of Oxford",
        "course_name": "D.Phil in Environmental Sciences",
        "academic_year": "2026-2027",
        "aggregate_percentage": 78.5,
        "admission_status": "CONFIRMED",
        "father_or_guardian_name": "Sugana Munda",
        "guardian_occupation": "AGRICULTURE_FARMING",
        "annual_income": 350000.0,
        "income_certificate_no": "INC/JH/2025/1109",
        "income_issuing_authority": "Circle Officer, Khunti",
        "income_issue_date": "2025-05-10",
        "bank_name": "State Bank of India",
        "bank_account_no": "30495829104",
        "bank_ifsc": "SBIN0001234",
        "caste_verified": True,
        "caste_verification_details": {
            "caste_verified": True,
            "verification_status": "VERIFIED_ST",
            "tribe_recognized_under_art342": True,
            "tribe_name": "Munda",
            "certificate_number": "ST/JH/2025/08942",
            "issuing_authority": "Sub-Divisional Magistrate, Khunti",
            "has_official_seal": True
        }
    }

    print("\n1. Testing Profile Upsert...")
    saved_profile = scholar_service.upsert_applicant_profile(test_user_id, profile_input)
    assert saved_profile is not None, "Profile should be created"
    assert saved_profile["full_name"] == "Birsa Munda"
    assert saved_profile["tribe_name"] == "Munda"
    assert saved_profile["dob"] == "2000-11-15"
    assert saved_profile["gender"] == "MALE"
    assert saved_profile["institution_name"] == "University of Oxford"
    assert saved_profile["course_name"] == "D.Phil in Environmental Sciences"
    assert saved_profile["annual_income"] == 350000.0
    assert saved_profile["bank_ifsc"] == "SBIN0001234"
    print(f"   [OK] Profile saved for user: {test_user_id}")
    print(f"   [OK] Completion Percentage: {saved_profile['profile_completion_percentage']}%")

    # 2. Document Association
    print("\n2. Testing Document Association...")
    dummy_doc_path = os.path.join(BASE_DIR, "test_compliance_report.pdf")
    doc_record = scholar_service.add_profile_document(
        user_id=test_user_id,
        document_type="CASTE_CERTIFICATE",
        document_name="Scheduled Tribe Certificate",
        file_name="st_certificate_munda.pdf",
        file_path=dummy_doc_path,
        file_type="pdf",
        file_size=17024,
        ocr_raw_text="GOVERNMENT OF JHARKHAND SCHEDULED TRIBE CERTIFICATE ARTICLE 342 MUNDA",
        extracted_fields={"tribe_name": "Munda", "certificate_number": "ST/JH/2025/08942"},
        verification_status="VERIFIED"
    )
    assert doc_record is not None
    assert doc_record["document_type"] == "CASTE_CERTIFICATE"
    print(f"   [OK] Document associated: {doc_record['file_name']} (ID: {doc_record['id']})")

    # Add Income Document as well
    scholar_service.add_profile_document(
        user_id=test_user_id,
        document_type="INCOME_CERTIFICATE",
        document_name="Income Certificate 2025",
        file_name="income_cert.pdf",
        file_path=dummy_doc_path,
        file_type="pdf",
        file_size=17024,
        ocr_raw_text="ANNUAL FAMILY INCOME 350000",
        extracted_fields={"annual_family_income": 350000.0},
        verification_status="VERIFIED"
    )

    # 3. Retrieve Updated Profile with Completion Indicator
    print("\n3. Testing Profile Retrieval with Completion Breakdown...")
    refreshed = scholar_service.get_applicant_profile(test_user_id)
    assert refreshed is not None
    assert len(refreshed["documents"]) == 2, f"Expected 2 documents, got {len(refreshed['documents'])}"
    stats = refreshed["completion_stats"]
    print(f"   [OK] Readiness Status: {stats['readiness_status']} ({stats['readiness_label']})")
    print(f"   [OK] Completion Score: {stats['completion_percentage']}%")
    print("   [OK] Checklist Sections:")
    for chk in stats["checklist"]:
        print(f"       * {chk['title']}: {chk['detail']} ({chk['score']}/{chk['max_score']} pts)")

    assert stats["completion_percentage"] >= 90, f"Expected >= 90% score, got {stats['completion_percentage']}%"
    assert "NOS-ST" in stats["reusable_schemes"]
    assert "NFST" in stats["reusable_schemes"]

    # 4. Test Scheme Reusability (submit application using profile data & associated docs without re-upload)
    print("\n4. Testing Profile Data & Document Reusability Across Applications...")
    prof_docs = scholar_service.get_profile_documents(test_user_id)
    reusable_docs = [
        {
            "document_type": d["document_type"],
            "file_name": d["file_name"],
            "file_path": d["file_path"],
            "file_type": d["file_type"],
            "ocr_raw_text": d.get("ocr_raw_text", ""),
            "extracted_fields": d.get("extracted_fields", {})
        }
        for d in prof_docs
    ]

    app_res = scholar_service.submit_application(
        applicant_data={
            "applicant_id": test_user_id,
            "scheme_code": "NOS-ST",
            "applicant_name": refreshed["full_name"],
            "applicant_email": refreshed["email"],
            "applicant_phone": refreshed["phone"],
            "tribe_name": refreshed["tribe_name"],
            "caste_certificate_no": refreshed["caste_certificate_no"],
            "annual_family_income": refreshed["annual_income"],
            "aggregate_percentage": refreshed["aggregate_percentage"],
            "applicant_age": 26,
            "institution_name": refreshed["institution_name"],
            "course_enrolled": refreshed["course_name"],
            "admission_status": refreshed["admission_status"],
            "caste_verified": refreshed["caste_verified"]
        },
        documents_extracted_data={"caste_certificate": {"is_scheduled_tribe": True}},
        document_files=reusable_docs
    )

    assert app_res is not None
    assert app_res["applicant_name"] == "Birsa Munda"
    assert app_res["eligibility_score"] >= 80.0
    print(f"   [OK] Application Submitted Successfully: {app_res['application_number']}")
    print(f"   [OK] Status: {app_res['status']} &bull; Eligibility Score: {app_res['eligibility_score']}%")

    print("\n==================================================")
    print("ALL APPLICANT PROFILE MODULE TESTS PASSED (100%)!")
    print("==================================================")

if __name__ == "__main__":
    test_applicant_profile_module()
