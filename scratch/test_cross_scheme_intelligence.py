import requests
import json
import sys
sys.path.append("backend")

BASE_URL = "http://127.0.0.1:8000"

def test_cross_scheme_intelligence():
    print("=== 1. AUTHENTICATING APPLICANT ===")
    login_res = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": "admin.admin", "password": "Admin@123"}
    )
    if login_res.status_code != 200:
        reg_res = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "username": "karan_test_st",
                "email": "karan.test@example.com",
                "full_name": "Karan Birhor",
                "password": "Password@123",
                "role": "applicant"
            }
        )
        token = reg_res.json().get("access_token")
    else:
        token = login_res.json().get("access_token")

    assert token, "Failed to get access token"
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Authenticated applicant successfully.")

    print("\n=== 2. ENSURING VERIFIED PROFILE WITH DOCUMENTS ===")
    profile_update = {
        "full_name": "Karan Birhor",
        "category": "Scheduled Tribe (ST)",
        "tribe_name": "Birhor",
        "caste_verified": True,
        "annual_income": 180000,
        "aggregate_percentage": 78.5,
        "education_qualification": "Postgraduate Degree (M.Tech)",
        "academic_level": "POSTGRADUATE",
        "institution_name": "National Institute of Technology",
        "course_name": "Computer Science & Engineering",
        "admission_status": "CONFIRMED",
        "academic_year": "2026-2027",
        "applicant_age": 24
    }
    prof_res = requests.post(
        f"{BASE_URL}/api/applicant/profile",
        headers=headers,
        json=profile_update
    )
    print(f"Profile updated: {prof_res.status_code}")

    from app.services.scholar_service import scholar_service
    uid = prof_res.json()["profile"]["user_id"]
    for dtype in ["CASTE_CERTIFICATE", "INCOME_CERTIFICATE", "MARKSHEET", "ADMISSION_OFFER", "BANK_PASSBOOK"]:
        doc_fields = {
            "is_scheduled_tribe": True,
            "annual_income_inr": 180000,
            "annual_family_income": 180000,
            "aggregate_percentage": 78.5,
            "percentage": 78.5,
            "admission_status": "CONFIRMED",
            "offer_status": "CONFIRMED",
            "certificate_number": "JH/ST/2026/9988",
            "issuing_authority": "Sub-Divisional Magistrate",
            "tribe_community_name": "Birhor",
            "institution_name": "National Institute of Technology",
            "course_enrolled": "Computer Science & Engineering"
        }
        scholar_service.add_profile_document(
            user_id=uid,
            document_type=dtype,
            document_name=dtype,
            file_name=f"{dtype.lower()}.pdf",
            file_path=f"/docs/{dtype.lower()}.pdf",
            extracted_fields=doc_fields,
            verification_status="VERIFIED"
        )
    print("Verified profile documents attached via scholar_service.")

    print("\n=== 3. CALLING CROSS-SCHEME INTELLIGENCE ENDPOINT ===")
    intel_res = requests.get(
        f"{BASE_URL}/api/applicant/cross-scheme-intelligence",
        headers=headers
    )
    print(f"Cross-Scheme Intelligence Status: {intel_res.status_code}")
    assert intel_res.status_code == 200, f"Error: {intel_res.text}"

    data = intel_res.json().get("intelligence", {})
    profile_sum = data.get("profile_summary", {})
    counts = data.get("counts", {})
    eligible = data.get("eligible_opportunities", [])
    potential = data.get("potentially_eligible", [])
    not_elig = data.get("not_eligible", [])

    print(f"Applicant: {profile_sum.get('full_name')} (ST Tribe: {profile_sum.get('tribe_name')})")
    print(f"Total Active Schemes Evaluated: {counts.get('total_active_schemes')}")
    print(f"  * Eligible Opportunities: {counts.get('eligible')}")
    print(f"  * Potentially Eligible: {counts.get('potentially_eligible')}")
    print(f"  * Ineligible (Criteria Unmet): {counts.get('not_eligible')}")

    print("\n=== 4. VERIFYING ALL SCHEME EVALUATIONS ===")
    for item in data.get("all_schemes", []):
        print(f"\nScheme: {item['scheme_code']} - {item['scheme_name']}")
        print(f"  Tier: {item['eligibility_tier']} ({item['tier_label']}) - Match Score: {item['match_score']}%")
        print(f"  Summary: {item['summary_explanation']}")
        print(f"  Total Rules: {item['total_rules_evaluated']} | Passed: {item['passed_rules_count']} | Failed: {item['failed_rules_count']} | Review: {item['review_rules_count']}")
        print(f"  Missing Requirements ({len(item['missing_requirements'])}):")
        for req in item['missing_requirements']:
            print(f"    - [{req['type']}] ({req['severity']}) {req['title']} (Disqualifying={req['is_disqualifying']}): {req['reason']}")

    print("\n=== 5. VERIFYING GUARDRAIL: NO AUTO-SUBMIT ===")
    assert "Do not automatically submit" in data.get("guardrail_notice") or "never automatically submitted" in data.get("guardrail_notice")
    print(f"Guardrail confirmed: {data.get('guardrail_notice')}")

    print("\n>>> CROSS-SCHEME INTELLIGENCE VERIFIED PERFECTLY <<<")

if __name__ == "__main__":
    test_cross_scheme_intelligence()
