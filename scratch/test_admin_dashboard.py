import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("--- 1. ADMIN AUTHENTICATION ---")
    login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "admin.admin", "password": "Admin@123"})
    if login_resp.status_code != 200:
        print(f"FAILED LOGIN: {login_resp.status_code} {login_resp.text}")
        return
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print(f"Logged in successfully as admin. Token prefix: {token[:15]}...")

    print("\n--- 2. TEST RULE MODIFICATION & RULE CHANGE AUDIT TRAIL ---")
    # Fetch schemes & rules
    schemes_resp = requests.get(f"{BASE_URL}/api/schemes?active_only=false", headers=headers)
    assert schemes_resp.status_code == 200
    schemes = schemes_resp.json().get("schemes", [])
    print(f"Loaded {len(schemes)} schemes.")
    scheme_code = schemes[0]["scheme_code"] if schemes else "NOS-ST"

    rules_resp = requests.get(f"{BASE_URL}/api/schemes/{scheme_code}/rules?active_only=false", headers=headers)
    assert rules_resp.status_code == 200
    rules = rules_resp.json().get("rules", [])
    print(f"Found {len(rules)} rules for scheme {scheme_code}.")

    if rules:
        target_rule = rules[0]
        rule_code = target_rule["rule_code"]
        original_status = target_rule.get("active", True)
        print(f"Testing status toggle on rule {rule_code} (currently active={original_status})...")
        
        # Toggle rule status
        toggle_resp = requests.patch(
            f"{BASE_URL}/api/schemes/rules/{rule_code}/toggle-status",
            headers=headers
        )
        print(f"Toggle response status: {toggle_resp.status_code}")
        assert toggle_resp.status_code == 200

        # Toggle back to maintain original state
        toggle_back = requests.patch(
            f"{BASE_URL}/api/schemes/rules/{rule_code}/toggle-status",
            headers=headers
        )
        assert toggle_back.status_code == 200
        print("Toggled back successfully.")

    # Check Rule Change History
    history_resp = requests.get(f"{BASE_URL}/api/admin/rule-history", headers=headers)
    print(f"Rule history status: {history_resp.status_code}")
    assert history_resp.status_code == 200
    history = history_resp.json().get("history", [])
    print(f"Retrieved {len(history)} rule change history entries.")
    if history:
        latest = history[0]
        print(f"Latest Rule Change Entry:\n"
              f"  - Who: {latest.get('changed_by_name')} (ID: {latest.get('changed_by_id')})\n"
              f"  - When: {latest.get('created_at')}\n"
              f"  - Scheme: {latest.get('scheme_code')}\n"
              f"  - Rule: {latest.get('rule_code')}\n"
              f"  - Change Type: {latest.get('change_type')}\n"
              f"  - Previous Value: {latest.get('previous_value')}\n"
              f"  - New Value: {latest.get('new_value')}")
        assert latest.get("scheme_code") is not None
        assert latest.get("changed_by_name") is not None

    print("\n--- 3. TEST REQUIRED DOCUMENT MANAGEMENT ENDPOINTS ---")
    doc_mat_resp = requests.get(f"{BASE_URL}/api/admin/document-requirements", headers=headers)
    print(f"Document matrix status: {doc_mat_resp.status_code}")
    assert doc_mat_resp.status_code == 200
    matrix = doc_mat_resp.json().get("matrix", [])
    print(f"Retrieved matrix for {len(matrix)} schemes.")
    if matrix:
        print(f"First scheme: {matrix[0]['scheme_code']} requires {matrix[0]['required_documents']}")

    print("\n--- 4. TEST USER MANAGEMENT ENDPOINTS ---")
    users_resp = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
    print(f"Admin users status: {users_resp.status_code}")
    assert users_resp.status_code == 200
    users = users_resp.json().get("users", [])
    print(f"Retrieved {len(users)} users across all roles.")
    if users:
        first_user = users[0]
        print(f"Sample user: {first_user['full_name']} ({first_user['role']}) - Active: {first_user['is_active']}")

    print("\n--- 5. TEST OFFICER MANAGEMENT ENDPOINTS ---")
    officers_resp = requests.get(f"{BASE_URL}/api/admin/officers", headers=headers)
    print(f"Officers status: {officers_resp.status_code}")
    assert officers_resp.status_code == 200
    officers = officers_resp.json().get("officers", [])
    print(f"Retrieved {len(officers)} officers.")

    print("\n--- 6. TEST APPLICATION MONITORING ENDPOINT ---")
    mon_resp = requests.get(f"{BASE_URL}/api/admin/applications/monitoring", headers=headers)
    print(f"Application monitoring status: {mon_resp.status_code}")
    assert mon_resp.status_code == 200
    mon_data = mon_resp.json()
    print(f"Monitoring counts: {mon_data.get('counts')}")
    print(f"Total monitored applications: {len(mon_data.get('applications', []))}")

    print("\n--- 7. TEST DEFICIENCY ANALYTICS ENDPOINT ---")
    def_resp = requests.get(f"{BASE_URL}/api/admin/deficiency-analytics", headers=headers)
    print(f"Deficiency analytics status: {def_resp.status_code}")
    assert def_resp.status_code == 200
    def_data = def_resp.json().get("analytics", {})
    print(f"Deficiency summary: Total={def_data.get('total_deficiencies')}, Resolution Rate={def_data.get('resolution_rate')}%")
    print(f"Top deficiency reasons: {def_data.get('top_deficiency_reasons')}")

    print("\n--- 8. TEST SCHEME PERFORMANCE SCORECARD ENDPOINT ---")
    perf_resp = requests.get(f"{BASE_URL}/api/admin/scheme-performance", headers=headers)
    print(f"Scheme performance status: {perf_resp.status_code}")
    assert perf_resp.status_code == 200
    perf_schemes = perf_resp.json().get("schemes", [])
    print(f"Retrieved performance metrics for {len(perf_schemes)} schemes.")
    for ps in perf_schemes[:2]:
        print(f"  * {ps['scheme_code']}: Apps={ps['total_applications']}, Approved={ps['approved_applications']}, Sanctioned=Rs. {ps['estimated_disbursement']:,}")

    print("\n=== ALL 9 ADMIN MODULE BACKEND CHECKS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_tests()
