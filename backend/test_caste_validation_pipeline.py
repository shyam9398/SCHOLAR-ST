"""
Test Suite for ST Certificate / Caste Document Extraction & Prototype Validation Pipeline
"""

import os
import io
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fastapi.testclient import TestClient
from main import app
from app.services.scholar_service import scholar_service

client = TestClient(app)

def create_mock_st_certificate(applicant_name="Birsa Munda", cert_no="JH/ST/2023/88921", tribe="Munda", clear=True):
    """Creates a synthetic certificate image with standard statutory text."""
    width, height = 900, 1200
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Decorative border
    draw.rectangle([(20, 20), (width - 20, height - 20)], outline=(30, 41, 59), width=3)
    draw.rectangle([(26, 26), (width - 26, height - 26)], outline=(203, 213, 225), width=1)

    # Header
    draw.text((220, 60), "GOVERNMENT OF JHARKHAND", fill=(0, 0, 0))
    draw.text((230, 90), "OFFICE OF THE SUB-DIVISIONAL OFFICER, RANCHI", fill=(50, 50, 50))
    draw.text((260, 130), "SCHEDULED TRIBE CERTIFICATE", fill=(0, 0, 0))
    draw.text((290, 160), "(UNDER ARTICLE 342 OF THE CONSTITUTION)", fill=(70, 70, 70))

    if clear:
        # Body
        body_lines = [
            f"Certificate No: {cert_no}",
            f"Date of Issue: 15/06/2023",
            f"",
            f"This is to certify that Shri/Kumari {applicant_name},",
            f"son/daughter of Shri Sugana Munda, residing at Village Ulihatu,",
            f"District Ranchi in the State of Jharkhand, belongs to the",
            f"{tribe} Community, which is recognized as a Scheduled Tribe",
            f"under the Constitution (Scheduled Tribes) Order, 1950 as amended.",
            f"",
            f"Category: Scheduled Tribe (ST)",
            f"Issuing Authority: Sub-Divisional Officer (SDO), Ranchi",
            f"Revenue Circle: Khunti / Ranchi Sadar",
            f"Official Seal: SEAL_VERIFIED_EMBLEM_OF_INDIA"
        ]
        y = 220
        for line in body_lines:
            draw.text((70, y), line, fill=(15, 23, 42))
            y += 35

        # Footer & Signature
        draw.text((550, 850), "Sub-Divisional Magistrate / SDO", fill=(0, 0, 0))
        draw.text((550, 880), "District Administration, Ranchi", fill=(50, 50, 50))
        draw.text((100, 850), "[Official Embossed Seal]", fill=(100, 100, 100))
    else:
        # Intentionally incomplete / blurry blank certificate
        draw.text((70, 220), "Certificate", fill=(200, 200, 200))

    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    img_bytes.seek(0)
    return img_bytes.getvalue()

def test_pipeline():
    print("=" * 60)
    print("TESTING ST CERTIFICATE EXTRACTION & VALIDATION PIPELINE")
    print("=" * 60)

    # 1. Test Clear ST Certificate Extraction & Validation
    print("\n1. Testing Clear ST Certificate Upload & OCR Pipeline...")
    clear_img = create_mock_st_certificate(
        applicant_name="Birsa Sugana Munda",
        cert_no="JH/ST/2023/88921",
        tribe="Munda",
        clear=True
    )

    response = client.post(
        "/api/caste/validate",
        files={"file": ("st_cert.png", clear_img, "image/png")},
        data={"applicant_name": "Birsa Sugana Munda", "declared_tribe": "Munda"}
    )
    assert response.status_code == 200, f"Error {response.status_code}: {response.text}"
    data = response.json()

    print("   [OK] File Info Received:", data.get("file_info", {}).get("file_name"))
    print("   [OK] OCR Summary:", data.get("ocr_summary"))
    
    st_ver = data.get("st_verification", {})
    ext = data.get("extracted_fields", {})
    print("   [OK] Extracted Certificate No:", ext.get("certificate_number") or st_ver.get("certificate_number"))
    print("   [OK] Extracted Tribe:", ext.get("tribe_community_name") or st_ver.get("tribe_name"))
    print("   [OK] Extracted Category:", ext.get("category") or st_ver.get("category"))
    print("   [OK] Extracted Issuing Authority:", ext.get("issuing_authority") or st_ver.get("issuing_authority"))
    print("   [OK] Art. 342 Recognized:", st_ver.get("tribe_recognized_under_art342"))
    print("   [OK] Prototype Disclaimer Present:", bool(st_ver.get("disclaimer")))
    assert "Prototype Document Validation Engine" in st_ver.get("disclaimer", "") or "simulated" in st_ver.get("disclaimer", "").lower()
    print("   [OK] Completeness Score:", st_ver.get("completeness", {}).get("score_pct"), "%")

    # 2. Test Incomplete/Unclear Scan with Deficiency Detection
    print("\n2. Testing Incomplete / Unclear Certificate Deficiency Detection...")
    blurry_img = create_mock_st_certificate(clear=False)
    resp_def = client.post(
        "/api/caste/validate",
        files={"file": ("blurry_cert.png", blurry_img, "image/png")},
        data={"applicant_name": "Birsa Sugana Munda", "declared_tribe": "Munda"}
    )
    assert resp_def.status_code == 200
    data_def = resp_def.json()
    ver_def = data_def.get("st_verification", {})
    deficiencies = ver_def.get("deficiencies", [])
    print(f"   [OK] Detected {len(deficiencies)} Deficiencies:")
    for d in deficiencies:
        print(f"       - [{d.get('code')}] ({d.get('severity')}): {d.get('title')} -> Remedy: {d.get('remedy')}")
    assert len(deficiencies) > 0, "Expected deficiencies for blank/unclear certificate"

    # 3. Test Applicant Confirmation & Evidence Saving
    print("\n3. Testing Applicant Confirmation & Saving Verified Document Evidence...")
    test_user_id = "test-applicant-pipeline-user"
    scholar_service.upsert_applicant_profile(test_user_id, {
        "full_name": "Birsa Sugana Munda",
        "email": "birsa.pipeline@test.gov.in",
        "mobile_number": "9876543210",
        "category": "Scheduled Tribe (ST)"
    })

    file_path = data.get("file_info", {}).get("file_path", "uploads/mock.png")
    confirm_payload = {
        "file_path": file_path,
        "file_name": "st_cert.png",
        "applicant_name": "Birsa Sugana Munda",
        "certificate_number": "JH/ST/2023/88921",
        "category": "Scheduled Tribe (ST)",
        "tribe_name": "Munda",
        "issuing_authority": "Sub-Divisional Officer (SDO), Ranchi",
        "issue_date": "15/06/2023",
        "state": "Jharkhand",
        "district": "Ranchi",
        "verification_details": st_ver
    }

    # Simulate authorization header for test applicant
    resp_confirm = client.post(
        "/api/caste/confirm",
        json=confirm_payload,
        headers={"X-User-Id": test_user_id, "X-User-Role": "APPLICANT"}
    )
    assert resp_confirm.status_code == 200, f"Confirm failed: {resp_confirm.text}"
    confirm_res = resp_confirm.json()
    print("   [OK] Confirmation Success:", confirm_res.get("success"))
    saved_doc_rec = confirm_res.get("document", {})
    print("   [OK] Saved Document ID:", saved_doc_rec.get("id"))
    print("   [OK] Associated Document Name:", saved_doc_rec.get("document_name"))

    # 4. Verify Document Is Associated with Applicant Profile
    print("\n4. Verifying Association in Applicant Profile Documents Repository...")
    docs = scholar_service.get_profile_documents(test_user_id)
    caste_docs = [d for d in docs if d.get("document_type") == "CASTE_CERTIFICATE"]
    assert len(caste_docs) > 0, "Caste document not found in profile repository"
    saved_doc = caste_docs[0]
    print(f"   [OK] Verified document found in profile:")
    print(f"        ID: {saved_doc['id']}")
    print(f"        Type: {saved_doc['document_type']}")
    print(f"        Status: {saved_doc['verification_status']}")
    print(f"        Extracted Fields Attached: {bool(saved_doc.get('extracted_fields'))}")

    # Check that profile was updated with certificate details
    profile = scholar_service.get_applicant_profile(test_user_id) or {}
    print(f"   [OK] Profile Synced ST Certificate Number: {profile.get('caste_certificate_no')}")
    print(f"   [OK] Profile Synced Tribe: {profile.get('tribe_name')}")
    print(f"   [OK] Profile Completion: {profile.get('profile_completion_percentage')}%")
    assert profile.get("caste_certificate_no") == "JH/ST/2023/88921"
    assert profile.get("tribe_name") == "Munda"

    print("\n" + "=" * 60)
    print("ALL ST PIPELINE & EVIDENCE TESTS PASSED (100%)!")
    print("=" * 60)

if __name__ == "__main__":
    test_pipeline()
