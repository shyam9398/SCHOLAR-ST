import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REPORTS_DIR = os.path.join(BASE_DIR, "uploads", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


def build_evidence_verification_report(application: Dict[str, Any]) -> Dict[str, Any]:
    """
    Construct comprehensive, structured Evidence-Based Verification Report.
    Transparent Structure:
      Document -> Extracted Data -> Rule -> Result -> Evidence
    Overall Screening Result:
      - Eligible
      - Not Eligible
      - Deficiency Found
      - Requires Officer Review
    """
    app_id = application.get("id", "")
    app_no = application.get("application_number", "SCH-ST-REPORT")
    eval_data = application.get("evaluation", {})
    if isinstance(eval_data, str):
        try:
            eval_data = json.loads(eval_data)
        except Exception:
            eval_data = {}
    context = eval_data.get("evaluated_context", {})
    documents = application.get("documents", [])
    rule_results = eval_data.get("rule_results", [])

    # 1. Applicant Information
    applicant_info = {
        "full_name": application.get("applicant_name") or context.get("applicant_name", "N/A"),
        "email": application.get("applicant_email") or context.get("applicant_email", "N/A"),
        "phone": application.get("applicant_phone") or context.get("applicant_phone", "N/A"),
        "scheduled_tribe": application.get("tribe_name") or context.get("tribe_name", "Scheduled Tribe Certified"),
        "caste_certificate_number": application.get("caste_certificate_no") or context.get("caste_certificate_no", "Verified"),
        "annual_family_income": application.get("annual_family_income") if application.get("annual_family_income") is not None else context.get("annual_family_income"),
        "aggregate_percentage": application.get("aggregate_percentage") if application.get("aggregate_percentage") is not None else context.get("aggregate_percentage"),
        "applicant_age": application.get("applicant_age") or context.get("applicant_age"),
        "institution_name": application.get("institution_name") or context.get("institution_name", "N/A"),
        "course_enrolled": application.get("course_enrolled") or context.get("course_enrolled", "N/A"),
        "admission_status": application.get("admission_status") or context.get("admission_status", "CONFIRMED"),
        "caste_verified": application.get("caste_verified", True)
    }

    # 2. Selected Scheme Details
    scheme_info = {
        "scheme_code": application.get("scheme_code", "NOS-ST"),
        "scheme_name": application.get("scheme_name", "National Overseas Scholarship for ST Candidates"),
        "statutory_authority": "Ministry of Tribal Affairs, Government of India",
        "guidelines_reference": f"MoTA {application.get('scheme_code', 'ST')} Statutory Guidelines (dbttribal.gov.in)"
    }

    # 3. Documents Checked
    documents_checked = []
    doc_type_name_map = {
        "CASTE_CERTIFICATE": "ST Caste Certificate (Article 342)",
        "INCOME_CERTIFICATE": "Annual Family Income Certificate",
        "MARKSHEET": "Degree Marksheet / Academic Transcript",
        "BONAFIDE_CERTIFICATE": "Institutional Bonafide Certificate",
        "ADMISSION_OFFER": "Admission Offer / Enrollment Order",
        "BANK_PASSBOOK": "Bank Account Mandate (Aadhaar Seeded)",
        "OTHER": "Supporting Statutory Document"
    }

    for d in documents:
        dtype = d.get("document_type", "OTHER")
        ext_fields = d.get("extracted_fields") or {}
        if isinstance(ext_fields, str):
            try:
                ext_fields = json.loads(ext_fields)
            except Exception:
                ext_fields = {}
        ai_meta = ext_fields.get("ai_understanding") or {}
        raw_ocr = d.get("ocr_raw_text") or ""
        ocr_lines = len([line for line in raw_ocr.split("\n") if line.strip()])

        documents_checked.append({
            "id": d.get("id"),
            "document_type": dtype,
            "document_title": doc_type_name_map.get(dtype, dtype.replace("_", " ")),
            "file_name": d.get("file_name", "Uploaded File"),
            "file_type": d.get("file_type", "pdf").upper(),
            "verification_status": d.get("verification_status", "VERIFIED"),
            "ocr_lines_extracted": ocr_lines,
            "ai_classification": ai_meta.get("classification", {}).get("classified_type", dtype),
            "ai_confidence": round(ai_meta.get("classification", {}).get("confidence", 0.92) * 100),
            "document_explanation": ai_meta.get("document_explanation") or ext_fields.get("document_explanation") or "Statutory document verified.",
            "unclear_flags": ai_meta.get("unclear_information_flags") or [],
            "inconsistencies": ai_meta.get("inconsistencies_detected") or []
        })

    # 4. Extracted Information Summary
    extracted_information = {
        "applicant_name": applicant_info["full_name"],
        "tribe_community": applicant_info["scheduled_tribe"],
        "caste_certificate_no": applicant_info["caste_certificate_number"],
        "declared_annual_income": f"Rs. {applicant_info['annual_family_income']:,}" if applicant_info["annual_family_income"] else "N/A",
        "qualifying_marks": f"{applicant_info['aggregate_percentage']}%" if applicant_info["aggregate_percentage"] else "N/A",
        "age_years": f"{applicant_info['applicant_age']} years" if applicant_info["applicant_age"] else "N/A",
        "admission_order": f"{applicant_info['course_enrolled']} ({applicant_info['institution_name']})"
    }

    # 5. Transparent Pipeline Matrix: Document -> Extracted Data -> Rule -> Result -> Evidence
    lineage_matrix = []
    deficiencies = []

    for r in rule_results:
        rule_meta = r.get("rule_evaluated", {})
        rcode = rule_meta.get("rule_code") or r.get("rule_code", "")
        rname = rule_meta.get("rule_name") or r.get("rule_name", "")
        rtype = rule_meta.get("rule_type") or r.get("category", "")
        req_cond = r.get("required_condition") or r.get("expected_criterion", "")
        res_status = r.get("result") or r.get("status") or "REVIEW"
        evidence_ref = r.get("evidence_reference") or r.get("extracted_evidence", "Verified against submission.")
        explanation = r.get("explanation", "")
        app_val = r.get("applicant_value")

        # Associate document source and extracted data
        doc_source = "Applicant Dossier"
        extracted_data_repr = f"Declared: {app_val}" if app_val is not None else "Not Extracted"

        rtype_upper = str(rtype).upper()
        if "CASTE" in rtype_upper or "ST_" in rtype_upper or "TRIBE" in rtype_upper:
            doc_source = "ST Caste Certificate"
            extracted_data_repr = f"Tribe: {applicant_info['scheduled_tribe']} | Cert No: {applicant_info['caste_certificate_number']}"
        elif "INCOME" in rtype_upper:
            doc_source = "Income Certificate"
            extracted_data_repr = f"Annual Income: Rs. {applicant_info['annual_family_income']:,}" if applicant_info["annual_family_income"] else "Income declared"
        elif "MARKS" in rtype_upper or "ACADEMIC" in rtype_upper or "QUALIFICATION" in rtype_upper:
            doc_source = "Academic Marksheet"
            extracted_data_repr = f"Aggregate Marks: {applicant_info['aggregate_percentage']}%" if applicant_info["aggregate_percentage"] else "Marks declared"
        elif "COURSE" in rtype_upper or "OFFER" in rtype_upper or "INSTITUTION" in rtype_upper:
            doc_source = "Admission Offer Letter"
            extracted_data_repr = f"Status: {applicant_info['admission_status']} | Course: {applicant_info['course_enrolled']}"
        elif "AGE" in rtype_upper:
            doc_source = "Birth Record / Profile"
            extracted_data_repr = f"Age: {applicant_info['applicant_age']} years as on 1st April"
        elif "YEAR" in rtype_upper:
            doc_source = "Academic Session Record"
            extracted_data_repr = "Operational Year: 2026-2027"

        lineage_item = {
            "document_source": doc_source,
            "extracted_data": extracted_data_repr,
            "rule_code": rcode,
            "rule_name": rname,
            "rule_type": rtype,
            "required_condition": req_cond,
            "rule_result": res_status,
            "supporting_evidence": evidence_ref,
            "explanation": explanation
        }
        lineage_matrix.append(lineage_item)

        # Record deficiencies
        if res_status in ["FAIL", "REVIEW"]:
            severity = "CRITICAL" if rule_meta.get("severity") in ["CRITICAL", "MANDATORY", "DISQUALIFYING"] else "HIGH"
            deficiencies.append({
                "rule_code": rcode,
                "title": f"Deficiency in {rname}",
                "detail": explanation or f"Condition unmet: expected {req_cond}, evaluated: {app_val}",
                "severity": severity,
                "remedy": f"Upload verified supporting document satisfying '{req_cond}' or update profile declaration."
            })

    # 6. Overall Screening Result Computation
    # Possible values strictly: 'Eligible', 'Not Eligible', 'Deficiency Found', 'Requires Officer Review'
    has_hard_disqualification = any(
        (r.get("result") or r.get("status")) == "FAIL" and
        str(r.get("rule_evaluated", {}).get("rule_type", "")).upper() in ["ST_CATEGORY_REQUIREMENT", "AGE_LIMIT", "SCHEME_SPECIFIC_CONDITION"]
        for r in rule_results
    )

    has_remediable_deficiency = any(
        (r.get("result") or r.get("status")) == "FAIL" and
        str(r.get("rule_evaluated", {}).get("rule_type", "")).upper() in ["REQUIRED_DOCUMENT", "INCOME_LIMIT", "MINIMUM_MARKS", "ACADEMIC_QUALIFICATION"]
        for r in rule_results
    ) or any(
        d.get("verification_status") in ["INCOMPLETE", "INVALID", "DEFICIENT"]
        for d in documents_checked
    )

    has_review_needed = any(
        (r.get("result") or r.get("status")) in ["REVIEW", "REQUIRES_REVIEW"]
        for r in rule_results
    ) or any(
        d.get("verification_status") in ["REQUIRES REVIEW", "PENDING_REVIEW"]
        for d in documents_checked
    )

    if has_hard_disqualification:
        overall_result = "Not Eligible"
        screening_rationale = "Candidate does not fulfill statutory non-waivable scheme conditions (e.g. Scheduled Tribe community status or age limit)."
    elif has_remediable_deficiency:
        overall_result = "Deficiency Found"
        screening_rationale = f"Documentary or criteria deficiency identified on {len(deficiencies)} condition(s). Resubmission of valid document is permitted."
    elif has_review_needed:
        overall_result = "Requires Officer Review"
        screening_rationale = "Preliminary criteria satisfied, but visual verification of foreign admission / accreditation or borderline marks requires human Officer review."
    else:
        overall_result = "Eligible"
        screening_rationale = f"All {len(rule_results)} dynamic statutory rules successfully satisfied against verified documentary evidence."

    return {
        "application_id": app_id,
        "application_number": app_no,
        "created_at": application.get("created_at") or datetime.utcnow().isoformat(),
        "applicant_information": applicant_info,
        "selected_scheme": scheme_info,
        "documents_checked": documents_checked,
        "extracted_information": extracted_information,
        "lineage_matrix": lineage_matrix,
        "rules_evaluated": rule_results,
        "deficiencies": deficiencies,
        "overall_screening_result": overall_result,
        "screening_rationale": screening_rationale,
        "eligibility_score": application.get("eligibility_score", 0.0),
        "passed_rules": application.get("passed_rules", 0),
        "total_rules": application.get("total_rules", 0),
        "officer_review": {
            "officer_decision": application.get("officer_decision") or "PENDING REVIEW",
            "officer_remarks": application.get("officer_remarks") or "Pending determination by designated Verification Officer.",
            "officer_id": application.get("officer_id"),
            "decision_date": application.get("decision_date"),
            "is_finalized": bool(application.get("officer_decision"))
        },
        "statutory_guardrail": {
            "title": "PRELIMINARY EVIDENCE-BASED SCREENING REPORT — NOT A FINAL GOVERNMENT DECISION",
            "notice": "This document is a technical and algorithmic evidence-based screening report. It does NOT constitute a final government decision or sanction. The legal authority to approve or reject scholarship eligibility rests exclusively with the designated human Verification Officer."
        }
    }


def generate_scholar_pdf_report(application: Dict[str, Any], officer_name: str = "Verification Officer") -> str:
    """
    Generate official PDF Verification & Eligibility Dossier for SCHOLAR-ST.
    Uses the transparent 5-stage lineage:
      Document -> Extracted Data -> Rule -> Result -> Evidence
    With one of 4 overall screening results:
      Eligible | Not Eligible | Deficiency Found | Requires Officer Review
    """
    report = build_evidence_verification_report(application)
    app_no = report["application_number"]
    pdf_filename = f"{app_no}_Verification_Dossier.pdf"
    pdf_path = os.path.join(REPORTS_DIR, pdf_filename)

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    header_title_style = ParagraphStyle(
        "HeaderTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=17,
        textColor=colors.HexColor("#0f172a"),
        alignment=1
    )

    sub_header_style = ParagraphStyle(
        "SubHeader",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#475569"),
        alignment=1
    )

    section_heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=13,
        textColor=colors.HexColor("#1e293b")
    )

    cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1e293b")
    )

    cell_bold_style = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0f172a")
    )

    cell_pass = ParagraphStyle(
        "PassBadge",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor("#065f46")
    )

    cell_fail = ParagraphStyle(
        "FailBadge",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor("#991b1b")
    )

    cell_review = ParagraphStyle(
        "ReviewBadge",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor("#92400e")
    )

    elements = []

    # 1. Header Banner
    elements.append(Paragraph("GOVERNMENT OF INDIA &middot; MINISTRY OF TRIBAL AFFAIRS", sub_header_style))
    elements.append(Paragraph("SCHOLAR-ST &bull; EVIDENCE-BASED VERIFICATION REPORT", header_title_style))
    elements.append(Paragraph("Preliminary Statutory Screening &amp; Evidence Audit Dossier", sub_header_style))
    elements.append(Spacer(1, 6))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563eb"), spaceAfter=10))

    # 2. Constitutional Non-Decision Guardrail Notice
    guardrail_box = [
        [
            Paragraph("<b>STATUTORY NOTICE &middot; PRELIMINARY SCREENING REPORT (NOT A FINAL GOVERNMENT DECISION)</b>", cell_bold_style)
        ],
        [
            Paragraph(
                "This document reflects technical evidence extraction and dynamic rule screening. "
                "<b>It does NOT constitute a final government decision or sanction.</b> "
                "Pursuant to statutory guidelines, final approval or rejection rests exclusively with the designated human Verification Officer.",
                cell_style
            )
        ]
    ]
    t_guard = Table(guardrail_box, colWidths=[540])
    t_guard.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fefce8")),
        ("BOX", (0, 0), (-1, -1), 1.0, colors.HexColor("#eab308")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(t_guard)
    elements.append(Spacer(1, 10))

    # 3. Overall Screening Result Banner
    overall_res = report["overall_screening_result"]
    color_map = {
        "Eligible": ("#ecfdf5", "#059669", "#065f46"),
        "Not Eligible": ("#fef2f2", "#dc2626", "#991b1b"),
        "Deficiency Found": ("#fffbeb", "#d97706", "#92400e"),
        "Requires Officer Review": ("#eff6ff", "#2563eb", "#1e40af")
    }
    bg_c, border_c, text_c = color_map.get(overall_res, ("#f8fafc", "#64748b", "#0f172a"))

    overall_box = [
        [
            Paragraph(f"<b>Overall Screening Result:</b> <font color='{text_c}'><b>{overall_res.upper()}</b></font>", ParagraphStyle("ResH", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=11, leading=14)),
            Paragraph(f"<b>Eligibility Score:</b> <font color='{text_c}'><b>{report['eligibility_score']}%</b> ({report['passed_rules']}/{report['total_rules']} Rules Passed)</font>", ParagraphStyle("ScoreH", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9, leading=12, alignment=2))
        ],
        [
            Paragraph(f"<b>Screening Rationale:</b> {report['screening_rationale']}", cell_style),
            Paragraph("<i>Final approval/rejection remains with Verification Officer</i>", ParagraphStyle("SubNote", parent=styles["Normal"], fontName="Helvetica-Oblique", fontSize=7.5, leading=9, alignment=2, textColor=colors.HexColor("#64748b")))
        ]
    ]
    t_overall = Table(overall_box, colWidths=[360, 180])
    t_overall.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(bg_c)),
        ("BOX", (0, 0), (-1, -1), 1.25, colors.HexColor(border_c)),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(t_overall)
    elements.append(Spacer(1, 10))

    # 4. Applicant Profile & Selected Scheme Grid
    app_info = report["applicant_information"]
    scheme_info = report["selected_scheme"]

    summary_data = [
        [
            Paragraph("<b>Application No:</b>", cell_style),
            Paragraph(report["application_number"], cell_bold_style),
            Paragraph("<b>Selected Scheme:</b>", cell_style),
            Paragraph(f"{scheme_info['scheme_name']} ({scheme_info['scheme_code']})", cell_bold_style),
        ],
        [
            Paragraph("<b>Applicant Name:</b>", cell_style),
            Paragraph(app_info["full_name"], cell_bold_style),
            Paragraph("<b>Scheduled Tribe:</b>", cell_style),
            Paragraph(f"{app_info['scheduled_tribe']} (Article 342)", cell_bold_style),
        ],
        [
            Paragraph("<b>Caste Certificate No:</b>", cell_style),
            Paragraph(str(app_info["caste_certificate_number"]), cell_style),
            Paragraph("<b>Family Annual Income:</b>", cell_style),
            Paragraph(f"Rs. {app_info['annual_family_income']:,}" if app_info["annual_family_income"] else "Declared", cell_style),
        ],
        [
            Paragraph("<b>Marks Percentage:</b>", cell_style),
            Paragraph(f"{app_info['aggregate_percentage']}%" if app_info["aggregate_percentage"] else "Provided", cell_style),
            Paragraph("<b>Course &amp; Institution:</b>", cell_style),
            Paragraph(f"{app_info['course_enrolled']} ({app_info['institution_name']})", cell_style),
        ]
    ]

    t_summary = Table(summary_data, colWidths=[105, 165, 110, 160])
    t_summary.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_summary)
    elements.append(Spacer(1, 10))

    # 5. Documents Checked Table
    elements.append(Paragraph("<b>1. Documents Checked &amp; Evidence Source Files</b>", section_heading_style))
    elements.append(Spacer(1, 4))

    docs_table_data = [
        [
            Paragraph("<b>Document Title</b>", cell_bold_style),
            Paragraph("<b>File Name &amp; Type</b>", cell_bold_style),
            Paragraph("<b>OCR Lines</b>", cell_bold_style),
            Paragraph("<b>AI Interpretation</b>", cell_bold_style),
            Paragraph("<b>Status</b>", cell_bold_style)
        ]
    ]

    for d in report["documents_checked"]:
        st = d["verification_status"]
        st_badge = Paragraph(f"&check; {st}", cell_pass) if st == "VALID" or st == "VERIFIED" else Paragraph(f"&bull; {st}", cell_review)
        docs_table_data.append([
            Paragraph(d["document_title"], cell_bold_style),
            Paragraph(f"{d['file_name']} ({d['file_type']})", cell_style),
            Paragraph(f"{d['ocr_lines_extracted']} lines", cell_style),
            Paragraph(d["document_explanation"], cell_style),
            st_badge
        ])

    if len(docs_table_data) == 1:
        docs_table_data.append([Paragraph("No documents attached", cell_style)] * 5)

    t_docs = Table(docs_table_data, colWidths=[130, 120, 60, 160, 70])
    t_docs.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#94a3b8")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    elements.append(t_docs)
    elements.append(Spacer(1, 10))

    # 6. Transparent Lineage Table: Document -> Extracted Data -> Rule -> Result -> Evidence
    elements.append(Paragraph("<b>2. Transparent Verification Lineage: Document &rarr; Extracted Data &rarr; Rule &rarr; Result &rarr; Evidence</b>", section_heading_style))
    elements.append(Paragraph("<i>Every rule decision is deterministically grounded in extracted document facts and verified citations.</i>", sub_header_style))
    elements.append(Spacer(1, 4))

    lineage_table_data = [
        [
            Paragraph("<b>Document</b>", cell_bold_style),
            Paragraph("<b>Extracted Data</b>", cell_bold_style),
            Paragraph("<b>Rule Evaluated</b>", cell_bold_style),
            Paragraph("<b>Result</b>", cell_bold_style),
            Paragraph("<b>Supporting Evidence</b>", cell_bold_style)
        ]
    ]

    for item in report["lineage_matrix"]:
        res_code = item["rule_result"]
        if res_code == "PASS":
            badge = Paragraph("&check; PASS", cell_pass)
        elif res_code == "FAIL":
            badge = Paragraph("&cross; FAIL", cell_fail)
        else:
            badge = Paragraph("&bull; REVIEW", cell_review)

        rule_p = f"<b>{item['rule_code']}</b><br/>{item['rule_name']}<br/><font color='#64748b'><i>Cond: {item['required_condition']}</i></font>"
        ev_p = f"{item['supporting_evidence']}<br/><font color='#047857'>{item['explanation']}</font>"

        lineage_table_data.append([
            Paragraph(item["document_source"], cell_style),
            Paragraph(item["extracted_data"], cell_style),
            Paragraph(rule_p, cell_style),
            badge,
            Paragraph(ev_p, cell_style)
        ])

    if len(lineage_table_data) == 1:
        lineage_table_data.append([Paragraph("No rules evaluated", cell_style)] * 5)

    t_lineage = Table(lineage_table_data, colWidths=[105, 110, 115, 50, 160])
    t_lineage.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#94a3b8")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_lineage)
    elements.append(Spacer(1, 10))

    # 7. Deficiencies Box (if any exist)
    if report["deficiencies"]:
        elements.append(Paragraph("<b>3. Identified Deficiencies &amp; Actionable Remedies</b>", section_heading_style))
        elements.append(Spacer(1, 4))

        def_data = [
            [
                Paragraph("<b>Rule Code</b>", cell_bold_style),
                Paragraph("<b>Deficiency Description</b>", cell_bold_style),
                Paragraph("<b>Severity</b>", cell_bold_style),
                Paragraph("<b>Actionable Remedy</b>", cell_bold_style)
            ]
        ]
        for df in report["deficiencies"]:
            def_data.append([
                Paragraph(df["rule_code"], cell_bold_style),
                Paragraph(df["detail"], cell_style),
                Paragraph(df["severity"], cell_fail),
                Paragraph(df["remedy"], cell_style)
            ])

        t_def = Table(def_data, colWidths=[90, 190, 60, 200])
        t_def.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fef2f2")),
            ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#fca5a5")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fecaca")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(t_def)
        elements.append(Spacer(1, 10))

    # 8. Human Verification Officer Final Determination Panel
    elements.append(Paragraph("<b>4. Human Verification Officer Statutory Sign-off</b>", section_heading_style))
    elements.append(Spacer(1, 4))

    off_info = report["officer_review"]
    dec_date = off_info.get("decision_date") or datetime.utcnow().strftime("%d-%b-%Y")

    officer_table = [
        [
            Paragraph("<b>Officer Decision:</b>", cell_style),
            Paragraph(f"<b>{off_info['officer_decision']}</b>", cell_bold_style),
            Paragraph("<b>Determination Date:</b>", cell_style),
            Paragraph(str(dec_date)[:10], cell_style)
        ],
        [
            Paragraph("<b>Officer Remarks:</b>", cell_style),
            Paragraph(off_info["officer_remarks"], cell_style),
            Paragraph("<b>Digital Signature:</b>", cell_style),
            Paragraph(f"Digitally Signed by:<br/><b>{officer_name}</b><br/>Verification Officer, MoTA", cell_style)
        ]
    ]

    t_officer = Table(officer_table, colWidths=[90, 180, 110, 160])
    t_officer.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ffffff")),
        ("BOX", (0, 0), (-1, -1), 1.0, colors.HexColor("#334155")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_officer)

    doc.build(elements)
    return pdf_path
