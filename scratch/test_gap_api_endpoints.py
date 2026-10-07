import sys
import os
import requests
import json

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_gap_endpoints():
    print("Testing Scheme Gap Intelligence Endpoints via TestClient...")


    # 1. Test POST /api/schemes/PMS-ST/evaluate-gaps
    payload = {
        "applicant_data": {
            "applicant_name": "Suresh Murmu",
            "category": "Scheduled Tribe (ST)",
            "tribe_name": "Santhal",
            "annual_income": 360000,
            "aggregate_percentage": 58.5
        },
        "extracted_documents_data": {
            "marksheet": {
                "aggregate_percentage": "58.5%",
                "verification_status": "VERIFIED"
            }
        }
    }

    res = client.post("/api/schemes/PMS-ST/evaluate-gaps", json=payload)
    print(f"\n1. POST /api/schemes/PMS-ST/evaluate-gaps -> Status: {res.status_code}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    gap_intel = data["gap_intelligence"]
    print(f"   Overall Status: {gap_intel['overall_status']}")
    print(f"   Total Gaps: {gap_intel['total_gaps_count']}")
    print(f"   Disqualifying Gaps: {gap_intel['disqualifying_gaps_count']}")
    print(f"   Resolvable Gaps: {gap_intel['resolvable_gaps_count']}")

    # Verify that each gap has the 4 required stages
    for idx, gap in enumerate(gap_intel["gaps"], 1):
        assert "requirement" in gap, "Missing requirement field"
        assert "applicant_status" in gap, "Missing applicant_status field"
        assert "gap" in gap, "Missing gap field"
        assert "suggested_action" in gap, "Missing suggested_action field"
        print(f"   Gap #{idx} [{gap['gap_type']}]:")
        print(f"     Requirement:      {gap['requirement']}")
        print(f"     Applicant Status: {gap['applicant_status']}")
        print(f"     Gap:              {gap['gap']}")
        print(f"     Suggested Action: {gap['suggested_action']}")

    # 2. Test GET /api/schemes/PMS-ST/gaps with x-user-id header
    res2 = client.get(
        "/api/schemes/PMS-ST/gaps",
        headers={"x-user-id": "00000000-0000-0000-0000-000000000001"}
    )
    print(f"\n2. GET /api/schemes/PMS-ST/gaps -> Status: {res2.status_code}")
    assert res2.status_code == 200, f"Expected 200, got {res2.status_code}: {res2.text}"
    data2 = res2.json()
    assert data2["success"] is True
    print(f"   Retrieved {len(data2['gap_intelligence']['gaps'])} gaps for user profile.")

    # 3. Test Cross-Scheme Intelligence includes gap_analysis for all schemes
    res3 = client.get(
        "/api/schemes/cross-intelligence",
        headers={"x-user-id": "00000000-0000-0000-0000-000000000001"}
    )
    print(f"\n3. GET /api/schemes/cross-intelligence -> Status: {res3.status_code}")
    assert res3.status_code == 200
    data3 = res3.json()
    for s in data3["intelligence"]["all_schemes"]:
        assert "gap_analysis" in s
        assert "gaps" in s
        print(f"   Scheme {s['scheme_code']}: {len(s['gaps'])} gap(s) embedded.")


    print("\n==================================================")
    print("ALL API ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_gap_endpoints()
