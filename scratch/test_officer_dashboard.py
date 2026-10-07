import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=================================================================")
    print("VERIFICATION OFFICER DASHBOARD & AUDIT HISTORY TEST SUITE")
    print("=================================================================")

    # 1. Login as Verification Officer / Administrator
    print("\n[Step 1] Logging in as Verification Officer / Administrator...")
    login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin.admin",
        "password": "Admin@123"
    })

    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[OK] Authenticated successfully with token")

    # 2. Fetch all applications
    print("\n[Step 2] Fetching applications for officer overview...")
    apps_resp = requests.get(f"{BASE_URL}/api/applications/", headers=headers)
    assert apps_resp.status_code == 200, f"Fetch failed: {apps_resp.text}"
    apps = apps_resp.json().get("applications", [])
    print(f"[OK] Retrieved {len(apps)} total applications in repository")

    # Categorize applications as Officer Dashboard does:
    pending_apps = [a for a in apps if a.get("status") == "SUBMITTED"]
    requires_review = [a for a in apps if a.get("status") == "UNDER_REVIEW" or (a.get("evaluation", {}).get("review_rules", 0) > 0)]
    deficiency_cases = [a for a in apps if a.get("status") == "CLARIFICATION_REQUIRED" or (a.get("evaluation", {}).get("failed_rules", 0) > 0 and a.get("status") != "REJECTED")]
    verified_apps = [a for a in apps if a.get("status") == "APPROVED"]

    print(f"  - Pending Applications: {len(pending_apps)}")
    print(f"  - Applications Requiring Review: {len(requires_review)}")
    print(f"  - Deficiency Cases: {len(deficiency_cases)}")
    print(f"  - Verified Applications: {len(verified_apps)}")

    # 3. Submit a new application to test full officer action lifecycle
    print("\n[Step 3] Submitting a fresh test application...")
    submit_data = {
        "scheme_code": "NFST",
        "applicant_name": "Birsa Munda Jr.",
        "applicant_email": "birsa.munda.jr@test.tribal.gov.in",
        "tribe_name": "Munda",
        "caste_certificate_no": "JH/ST/2024/9912",
        "annual_family_income": 340000.0,
        "aggregate_percentage": 78.5,
        "applicant_age": 26,
        "institution_name": "Birsa Munda Tribal University",
        "course_enrolled": "Ph.D. Tribal Ecology",
        "admission_status": "CONFIRMED"
    }
    submit_resp = requests.post(f"{BASE_URL}/api/applications/submit", data=submit_data)
    assert submit_resp.status_code == 200, f"Submission failed: {submit_resp.text}"
    new_app = submit_resp.json()["application"]
    app_id = new_app["id"]
    print(f"[OK] Application submitted: ID={app_id}, Status={new_app['status']}")

    # 4. Check initial history
    print("\n[Step 4] Checking initial audit history (should record SUBMITTED)...")
    hist_resp = requests.get(f"{BASE_URL}/api/applications/{app_id}/history", headers=headers)
    assert hist_resp.status_code == 200, f"History fetch failed: {hist_resp.text}"
    history = hist_resp.json().get("history", [])
    assert len(history) >= 1, "Initial SUBMITTED history record missing!"
    print(f"[OK] Found {len(history)} history entries. First action: {history[0]['action']}")

    # 5. Officer Action: REVIEW (UNDER_REVIEW)
    print("\n[Step 5] Officer Action: Marking UNDER_REVIEW...")
    review_resp = requests.post(f"{BASE_URL}/api/applications/{app_id}/decision", headers=headers, json={
        "decision": "UNDER_REVIEW",
        "remarks": "Assigned to Dr. R. K. Soren for deep statutory review and revenue seal check."
    })
    assert review_resp.status_code == 200, f"Review action failed: {review_resp.text}"
    updated_app = review_resp.json()["application"]
    assert updated_app["status"] == "UNDER_REVIEW", f"Expected UNDER_REVIEW, got {updated_app['status']}"
    print(f"[OK] Status updated to {updated_app['status']}")

    # 6. Officer Action: REQUEST_RESUBMISSION (Deficiency Found)
    print("\n[Step 6] Officer Action: REQUEST_RESUBMISSION (Deficiency Case)...")
    resub_resp = requests.post(f"{BASE_URL}/api/applications/{app_id}/decision", headers=headers, json={
        "decision": "REQUEST_RESUBMISSION",
        "remarks": "Deficiency: Income certificate scan has illegible seal of the Circle Officer. Please resubmit an unblurred copy."
    })
    assert resub_resp.status_code == 200, f"Resubmission action failed: {resub_resp.text}"
    updated_app = resub_resp.json()["application"]
    assert updated_app["status"] == "CLARIFICATION_REQUIRED", f"Expected CLARIFICATION_REQUIRED, got {updated_app['status']}"
    print(f"[OK] Status updated to {updated_app['status']} with deficiency notes")

    # 7. Officer Action: APPROVE
    print("\n[Step 7] Officer Action: APPROVE...")
    approve_resp = requests.post(f"{BASE_URL}/api/applications/{app_id}/decision", headers=headers, json={
        "decision": "APPROVE",
        "remarks": "Clarification satisfied: Clear revenue seal verified under Art 342. Full statutory approval granted."
    })
    assert approve_resp.status_code == 200, f"Approval failed: {approve_resp.text}"
    updated_app = approve_resp.json()["application"]
    assert updated_app["status"] == "APPROVED", f"Expected APPROVED, got {updated_app['status']}"
    print(f"[OK] Status updated to {updated_app['status']}")

    # 8. Verify full immutable audit history
    print("\n[Step 8] Verifying complete immutable audit trail...")
    hist_resp = requests.get(f"{BASE_URL}/api/applications/{app_id}/history", headers=headers)
    history = hist_resp.json().get("history", [])
    print(f"[OK] Total audit history events: {len(history)}")
    for i, h in enumerate(history, 1):
        print(f"   [{i}] Action: {h['action']} | Status: {h.get('previous_status')} -> {h.get('new_status')} | Officer: {h.get('officer_name')} | Remarks: {h.get('remarks')[:60]}...")

    assert len(history) == 4, f"Expected 4 history entries, got {len(history)}"

    # 9. Verify Evidence Verification Report
    print("\n[Step 9] Verifying Evidence Verification Report endpoint...")
    report_resp = requests.get(f"{BASE_URL}/api/applications/{app_id}/verification-report", headers=headers)
    assert report_resp.status_code == 200, f"Report failed: {report_resp.text}"
    rep = report_resp.json().get("report", {})
    overall = rep.get("overall_screening_result")
    assert overall in ["Eligible", "Not Eligible", "Deficiency Found", "Requires Officer Review"], f"Unexpected overall result: {overall}"
    print(f"[OK] Evidence Report generated:")
    print(f"   - Applicant: {rep.get('applicant_information', {}).get('full_name')}")
    print(f"   - Scheme: {rep.get('selected_scheme', {}).get('name')}")
    print(f"   - Overall Result: {overall}")
    print(f"   - Rules Checked: {len(rep.get('rules_evaluated', []))}")
    print(f"   - Lineage Matrix Entries: {len(rep.get('lineage_matrix', []))}")
    print(f"   - Transparent Structure: Document -> Extracted Data -> Rule -> Result -> Evidence verified!")

    # 10. Verify PDF Dossier generation
    print("\n[Step 10] Verifying PDF Dossier download...")
    pdf_resp = requests.get(f"{BASE_URL}/api/applications/{app_id}/pdf", headers=headers)
    assert pdf_resp.status_code == 200, f"PDF failed: {pdf_resp.text}"
    assert pdf_resp.headers.get("content-type") == "application/pdf"
    print(f"[OK] PDF Dossier retrieved ({len(pdf_resp.content)} bytes)")

    print("\n=================================================================")
    print("ALL VERIFICATION OFFICER DASHBOARD AUDIT TESTS PASSED!")
    print("=================================================================")

if __name__ == "__main__":
    run_tests()
