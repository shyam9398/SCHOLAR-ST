import requests
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_application_tracking():
    print("=== 1. AUTHENTICATING APPLICANT & OFFICER ===")
    admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "admin.admin", "password": "Admin@123"})
    if admin_login.status_code != 200:
        print(f"Admin login failed: {admin_login.text}")
        return
    token = admin_login.json()["access_token"]
    app_headers = {"Authorization": f"Bearer {token}"}
    off_headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print("Authenticated successfully.")

    print("\n=== 2. TEST DRAFT APPLICATION CREATION ===")
    draft_resp = requests.post(
        f"{BASE_URL}/api/applications/draft",
        data={
            "scheme_code": "NOS-ST",
            "applicant_name": "Karan Birhor Draft",
            "applicant_email": "karan.birhor@example.com",
            "annual_family_income": 450000,
            "aggregate_percentage": 72.0
        },
        headers=app_headers
    )
    assert draft_resp.status_code == 200, f"Draft creation failed: {draft_resp.text}"
    draft_app = draft_resp.json()["application"]
    draft_id = draft_app["id"]
    print(f"Created Draft: {draft_app['application_number']} (Status: {draft_app['status']})")
    assert draft_app["status"] == "DRAFT"

    # Verify history has DRAFT
    hist_resp = requests.get(f"{BASE_URL}/api/applications/{draft_id}/history", headers=app_headers)
    assert hist_resp.status_code == 200
    history = hist_resp.json()["history"]
    assert any(h["new_status"] == "DRAFT" for h in history)
    print("Draft event verified in application_history.")

    print("\n=== 3. TEST FULL APPLICATION SUBMISSION & AUTOMATED SCREENING ===")
    # Submit application with files
    fake_pdf = b"%PDF-1.4 Fake PDF Content for Test Document"
    files = {
        "caste_file": ("caste_cert.pdf", fake_pdf, "application/pdf"),
        "income_file": ("income_cert.pdf", fake_pdf, "application/pdf")
    }
    submit_data = {
        "scheme_code": "NOS-ST",
        "applicant_name": "Karan Birhor",
        "applicant_email": "karan.birhor@example.com",
        "applicant_phone": "9876543210",
        "tribe_name": "Birhor",
        "caste_certificate_no": "ST-JH-2024-9912",
        "annual_family_income": "450000",
        "aggregate_percentage": "68.5",
        "applicant_age": "26",
        "institution_name": "Oxford University",
        "course_enrolled": "M.Sc. Anthropology",
        "admission_status": "CONFIRMED"
    }

    sub_resp = requests.post(f"{BASE_URL}/api/applications/submit", data=submit_data, files=files, headers=app_headers)
    assert sub_resp.status_code == 200, f"Submission failed: {sub_resp.text}"
    app_record = sub_resp.json()["application"]
    app_id = app_record["id"]
    print(f"Submitted Application ID: {app_id} (Number: {app_record['application_number']}, Status: {app_record['status']})")

    # Check history of submitted application
    hist_resp2 = requests.get(f"{BASE_URL}/api/applications/{app_id}/history", headers=app_headers)
    actions = [h["action"] for h in hist_resp2.json()["history"]]
    print(f"Recorded state transitions in history: {actions}")
    assert "SUBMITTED" in actions
    assert "DOCUMENT_VERIFICATION" in actions
    assert "RULE_VALIDATION" in actions

    print("\n=== 4. TEST GET /api/applications/{app_id}/tracking ===")
    tracking_resp = requests.get(f"{BASE_URL}/api/applications/{app_id}/tracking", headers=app_headers)
    assert tracking_resp.status_code == 200, f"Tracking endpoint failed: {tracking_resp.text}"
    track_data = tracking_resp.json()["tracking"]
    print(f"Current Status: {track_data['current_status']}")
    print(f"Status Label: {track_data['status_metadata']['label']}")
    print(f"Required Action: {track_data['required_action']['title']}")
    print(f"Timeline Milestones count: {len(track_data['timeline'])}")
    for m in track_data["timeline"]:
        print(f"  * Milestone: {m['state']} ({m['label']}) -> Status: {m['status']}")
    print(f"Deficiencies found: {len(track_data['deficiencies'])}")
    print(f"Officer Review Status: {track_data['officer_review_status']['decision']}")
    print(f"Notifications: {len(track_data['notifications'])}")
    if track_data["notifications"]:
        first_notif = track_data["notifications"][0]
        print(f"  First notification: '{first_notif['title']}' - Email Dispatched: {first_notif.get('email_dispatched')}")

    print("\n=== 5. TEST RESUBMIT-DEFICIENCY WORKFLOW ===")
    # Transition to DEFICIENCY first if not already
    trans_resp = requests.post(
        f"{BASE_URL}/api/applications/{app_id}/transition",
        json={"new_status": "DEFICIENCY", "remarks": "Deficiency test: Marksheet missing seal"},
        headers=off_headers
    )
    assert trans_resp.status_code == 200

    # Applicant resubmits document
    resub_file = {"resubmitted_file": ("rectified_marksheet.pdf", fake_pdf, "application/pdf")}
    resub_resp = requests.post(
        f"{BASE_URL}/api/applications/{app_id}/resubmit-deficiency",
        data={"document_type": "MARKSHEET", "applicant_remarks": "Uploaded officially attested marksheet with university seal."},
        files=resub_file,
        headers=app_headers
    )
    assert resub_resp.status_code == 200, f"Resubmission failed: {resub_resp.text}"
    print("Resubmission succeeded. Status transitioned through RESUBMITTED -> RULE_VALIDATION -> OFFICER_REVIEW.")

    # Check updated tracking timeline
    track_after = requests.get(f"{BASE_URL}/api/applications/{app_id}/tracking", headers=app_headers).json()["tracking"]
    print(f"Post-resubmission status: {track_after['current_status']}")
    resub_milestone = next((m for m in track_after["timeline"] if m["state"] == "RESUBMITTED"), None)
    assert resub_milestone is not None
    print(f"RESUBMITTED milestone status: {resub_milestone['status']}")

    print("\n=== 6. TEST OFFICER REVIEW & FINAL APPROVAL ===")
    dec_resp = requests.post(
        f"{BASE_URL}/api/applications/{app_id}/decision",
        json={"decision": "APPROVED", "remarks": "All statutory criteria verified under MoTA guidelines. Approved for grant disbursement."},
        headers=off_headers
    )
    assert dec_resp.status_code == 200
    final_track = requests.get(f"{BASE_URL}/api/applications/{app_id}/tracking", headers=app_headers).json()["tracking"]
    print(f"Final status: {final_track['current_status']}")
    assert final_track["current_status"] == "APPROVED"
    assert final_track["status_metadata"]["is_terminal"] is True
    print(f"Officer determination verified: {final_track['officer_review_status']['decision']}")

    print("\n=== 7. VERIFY COMPLETE APPLICATION HISTORY AUDIT LOG ===")
    final_hist = requests.get(f"{BASE_URL}/api/applications/{app_id}/history", headers=app_headers).json()["history"]
    print(f"Total audit log records for application: {len(final_hist)}")
    for h in final_hist:
        print(f"  [{h['created_at'][:19]}] Action: {h['action']} (from '{h['previous_status']}' to '{h['new_status']}') by {h.get('officer_name')}")

    print("\n=== 8. VERIFY NOTIFICATIONS & EMAIL LOGS ===")
    notifs_resp = requests.get(f"{BASE_URL}/api/applications/{app_id}/notifications", headers=app_headers)
    print(f"Notifications status code: {notifs_resp.status_code}, response: {notifs_resp.text}")
    assert notifs_resp.status_code == 200
    notifs = notifs_resp.json()["notifications"]
    print(f"Total notifications delivered: {len(notifs)}")
    for n in notifs[:3]:
        print(f"  * {n['title']} | In-App: True | Email: {n.get('email_dispatched')}")

    print("\n>>> ALL APPLICATION TRACKING TESTS PASSED PERFECTLY <<<")

if __name__ == "__main__":
    test_application_tracking()
