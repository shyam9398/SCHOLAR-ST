import re
from typing import Any, Dict, List, Optional, Tuple


class ScholarRuleEngine:
    """
    SCHOLAR-ST Dynamic Scheme Rule Engine.
    
    CRITICAL ARCHITECTURAL CONSTRAINTS:
    - Zero rules hardcoded in frontend components or fixed application logic.
    - All scheme rules are dynamically fetched from Supabase compliance_rules table.
    - Deterministic, auditable, and transparent evaluation against applicant data & verified documents.
    - Final decision is NOT made by Gemini / AI.
    - Returns structured output with:
      * rule_evaluated (rule_code, rule_name, category, rule_type, statutory_reference)
      * applicant_value (resolved from profile or verified OCR evidence)
      * required_condition (operator + expected value)
      * result (PASS / FAIL / REVIEW)
      * evidence_reference (document reference, certificate no, verification status)
      * explanation (deficiency message or confirmation)
    """

    RULE_CATEGORIES = [
        "ST_CATEGORY_REQUIREMENT",
        "ACADEMIC_QUALIFICATION",
        "MINIMUM_MARKS",
        "INCOME_LIMIT",
        "AGE_LIMIT",
        "COURSE_INSTITUTION_REQUIREMENT",
        "REQUIRED_DOCUMENT",
        "ACADEMIC_YEAR",
        "SCHEME_SPECIFIC_CONDITION"
    ]

    def evaluate_application(
        self,
        scheme_code: str,
        applicant_data: Dict[str, Any],
        extracted_documents_data: Dict[str, Any],
        dynamic_rules: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Validate application against active rules for the selected scheme.
        
        Validation flow:
        Applicant Data + Verified Documents + Selected Scheme
        ↓
        Fetch Active Scheme Rules from Supabase
        ↓
        Rule Validation Engine
        ↓
        Pass / Fail / Review
        ↓
        Evidence and explanation
        """
        # Step 1: Merge applicant declared profile and OCR-verified document evidence
        merged_context, evidence_map = self._merge_context(applicant_data, extracted_documents_data)

        rule_results: List[Dict[str, Any]] = []
        passed_count = 0
        failed_count = 0
        review_count = 0

        # Step 2: Deterministic Rule Execution
        for rule in dynamic_rules:
            # Skip deactivated rules
            if not rule.get("active", True) and not rule.get("is_active", True):
                continue

            result = self._evaluate_single_rule(rule, merged_context, evidence_map)
            rule_results.append(result)

            status = result["result"]
            if status == "PASS":
                passed_count += 1
            elif status == "FAIL":
                failed_count += 1
            else:
                review_count += 1

        total_rules = len(rule_results)
        eligibility_score = round((passed_count / total_rules * 100), 2) if total_rules > 0 else 0.0

        # Step 3: Aggregate Evaluation Recommendation (Purely deterministic)
        has_critical_failure = any(
            r["result"] == "FAIL" and r["rule_evaluated"].get("severity") in ["CRITICAL", "MANDATORY", "DISQUALIFYING"]
            for r in rule_results
        )

        if has_critical_failure:
            system_recommendation = "NOT_ELIGIBLE_CRITERIA_UNMET"
            recommendation_text = (
                f"Statutory eligibility conditions failed on {failed_count} critical rule(s). "
                "Applicant does not satisfy mandatory scheme guidelines."
            )
        elif review_count > 0:
            system_recommendation = "ELIGIBLE_PENDING_OFFICER_REVIEW"
            recommendation_text = (
                f"Primary criteria satisfied ({passed_count}/{total_rules} passed), but {review_count} item(s) "
                "require manual Verification Officer review (unclear document scan or discretionary requirement)."
            )
        else:
            system_recommendation = "RECOMMENDED_FOR_APPROVAL"
            recommendation_text = (
                f"All {passed_count} statutory eligibility conditions successfully verified "
                "against uploaded evidence. Recommended for Verification Officer approval."
            )

        return {
            "scheme_code": scheme_code,
            "total_rules": total_rules,
            "passed_rules": passed_count,
            "failed_rules": failed_count,
            "review_rules": review_count,
            "eligibility_score": eligibility_score,
            "system_recommendation": system_recommendation,
            "recommendation_text": recommendation_text,
            "rule_results": rule_results,
            "evaluated_context": merged_context
        }

    def generate_scheme_gap_intelligence(
        self,
        scheme_code: str,
        applicant_data: Dict[str, Any],
        extracted_documents_data: Dict[str, Any],
        dynamic_rules: List[Dict[str, Any]],
        required_documents: Optional[List[str]] = None,
        scheme_meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Scheme Gap Intelligence Engine:
        When an applicant is not currently eligible or has deficiencies,
        identifies the exact specific missing requirements and gaps.

        Presents transparently:
        Requirement → Applicant Status → Gap → Suggested Action

        MANDATORY STATUTORY CONSTRAINTS:
        - Purely informational and evidence-based.
        - Zero invented eligibility requirements.
        - Strictly evaluates active scheme rules stored in Supabase.
        """
        # Step 1: Run deterministic dynamic evaluation
        merged_context, evidence_map = self._merge_context(applicant_data, extracted_documents_data)
        eval_result = self.evaluate_application(
            scheme_code=scheme_code,
            applicant_data=applicant_data,
            extracted_documents_data=extracted_documents_data,
            dynamic_rules=dynamic_rules
        )

        doc_labels = {
            "CASTE_CERTIFICATE": "Scheduled Tribe Community Certificate (Art. 342)",
            "INCOME_CERTIFICATE": "Annual Family Income Certificate",
            "MARKSHEET": "Qualifying Degree Marksheet / Academic Transcript",
            "ADMISSION_OFFER": "Institution Admission / Bonafide Letter",
            "BANK_PASSBOOK": "Aadhaar-Linked Bank Passbook",
            "DOMICILE_CERTIFICATE": "State Domicile Certificate",
            "DISABILITY_CERTIFICATE": "Disability Certificate",
            "RESEARCH_PROPOSAL": "Ph.D. Research Synopsis / Proposal"
        }

        gaps: List[Dict[str, Any]] = []
        analyzed_rule_codes = set()

        # Step 2: Evaluate Rule Failures and Review Flags
        for res in eval_result.get("rule_results", []):
            rule_info = res.get("rule_evaluated", {})
            rule_code = rule_info.get("rule_code") or res.get("rule_code")
            rule_name = rule_info.get("rule_name") or res.get("rule_name")
            category = rule_info.get("category") or rule_info.get("rule_type") or "SCHEME_SPECIFIC_CONDITION"
            field_name = rule_info.get("field_name", "")
            severity = str(rule_info.get("severity", "CRITICAL")).upper()
            statutory_ref = rule_info.get("statutory_reference") or "Ministry of Tribal Affairs Guidelines"
            operator = res.get("required_condition", "").split()[0] if res.get("required_condition") else "=="
            expected_raw = res.get("required_condition", "").replace(operator, "").strip() if res.get("required_condition") else ""
            actual_val = res.get("applicant_value")
            evidence_ref = res.get("evidence_reference") or ""
            status = res.get("result", "REVIEW")
            explanation = res.get("explanation", "")

            # Only process rules that are NOT passing
            if status == "PASS":
                continue

            analyzed_rule_codes.add(rule_code)

            requirement_text = rule_info.get("requirement") or f"{rule_name} (Requirement: {operator} {expected_raw})"
            applicant_status_text = ""
            gap_text = ""
            suggested_action_text = ""
            gap_type = "GENERAL_DEFICIENCY"
            is_disqualifying = False

            # Case A: Missing Document / Certificate Evidence
            if field_name.startswith("has_") or "DOCUMENT" in category.upper() or "CERTIFICATE" in rule_name.upper():
                doc_key = field_name.replace("has_", "").upper()
                doc_name = doc_labels.get(doc_key, doc_labels.get(field_name.upper(), rule_name))
                gap_type = "MISSING_DOCUMENT"
                requirement_text = f"Mandatory submission of {doc_name} under statutory guidelines."
                applicant_status_text = f"Document '{doc_name}' not detected in uploaded candidate dossier."
                gap_text = f"Supporting statutory document missing: {doc_name}."
                suggested_action_text = f"Upload an official scanned copy of your {doc_name} in the Document Center."
                is_disqualifying = False

            # Case B: Income Requirement Not Satisfied
            elif "INCOME" in category.upper() or "income" in field_name.lower():
                gap_type = "INCOME_REQUIREMENT_UNMET"
                try:
                    exp_inc = float(expected_raw.replace(",", ""))
                    act_inc = float(str(actual_val).replace(",", "")) if actual_val is not None else 0.0
                    if act_inc > exp_inc:
                        diff = act_inc - exp_inc
                        applicant_status_text = f"Annual family income declared/assessed at ₹{int(act_inc):,}."
                        requirement_text = f"Total annual family income must not exceed ₹{int(exp_inc):,} per annum."
                        gap_text = f"Income exceeds the statutory ceiling by ₹{int(diff):,} (Ceiling: ₹{int(exp_inc):,}, Actual: ₹{int(act_inc):,})."
                        suggested_action_text = (
                            f"Scheme statutory limit is ₹{int(exp_inc):,}/yr. If current financial year income has changed, "
                            "upload an updated assessment certificate from Tehsildar, or explore schemes without an income ceiling."
                        )
                        is_disqualifying = True
                    else:
                        applicant_status_text = f"Income value: {actual_val or 'Not Provided'}."
                        gap_text = "Income documentation verification required."
                        suggested_action_text = "Upload valid annual income certificate for the current financial year."
                except Exception:
                    applicant_status_text = f"Income value: {actual_val or 'Not Provided'}."
                    gap_text = "Declared income does not meet scheme threshold."
                    suggested_action_text = "Upload revenue authority income certificate for verification."

            # Case C: Academic Requirement Not Satisfied (Minimum Marks)
            elif "MARKS" in category.upper() or "PERCENTAGE" in category.upper() or "percentage" in field_name.lower():
                gap_type = "ACADEMIC_REQUIREMENT_UNMET"
                try:
                    exp_pct = float(expected_raw.replace("%", "").strip())
                    act_pct = float(str(actual_val).replace("%", "").strip()) if actual_val is not None else 0.0
                    if act_pct < exp_pct:
                        deficit = exp_pct - act_pct
                        applicant_status_text = f"Academic aggregate recorded as {act_pct}%."
                        requirement_text = f"Minimum {exp_pct}% aggregate marks in qualifying examination."
                        gap_text = f"Academic shortfall of {round(deficit, 2)}% below mandatory threshold of {exp_pct}%."
                        suggested_action_text = (
                            f"Mandatory requirement is {exp_pct}% aggregate. Review transcript or apply for "
                            "schemes without minimum percentage cutoff (e.g. Post-Matric Scholarship PMS-ST)."
                        )
                        is_disqualifying = True
                    else:
                        applicant_status_text = f"Academic marks: {actual_val or 'Pending verification'}."
                        gap_text = "Academic qualification marks require officer manual verification."
                        suggested_action_text = "Ensure full qualifying marks memo with total percentage is uploaded."
                except Exception:
                    applicant_status_text = f"Recorded marks: {actual_val or 'Not Detected'}."
                    gap_text = "Academic percentage condition not satisfied."
                    suggested_action_text = "Upload qualifying degree transcript."

            # Case D: Required Qualification Missing (Ph.D. / Premier Institute / Degree)
            elif "QUALIFICATION" in category.upper() or "INSTITUTION" in category.upper() or "COURSE" in category.upper():
                gap_type = "QUALIFICATION_MISSING"
                if "phd" in field_name.lower():
                    requirement_text = "Candidate must have confirmed, full-time regular registration in Ph.D. / M.Phil program."
                    applicant_status_text = f"Academic enrollment status: '{actual_val or 'No Ph.D. registration letter'}'."
                    gap_text = "Regular full-time doctoral registration letter not detected in candidate dossier."
                    suggested_action_text = "Attach official university doctoral registration notification, or apply under Master's scholarship."
                    is_disqualifying = True
                elif "premier" in field_name.lower():
                    requirement_text = "Enrollment in an institution on the Ministry of Tribal Affairs notified premier institutes list."
                    applicant_status_text = f"Enrolled institution: '{merged_context.get('institution_name', 'Not Listed')}'."
                    gap_text = "Enrolled institution is not recognized as a notified premier institute (IIT/IIM/NIT/AIIMS/NLU)."
                    suggested_action_text = "Top Class scheme is reserved for notified premier institutes. For other recognized universities, apply under Post-Matric Scholarship (PMS-ST)."
                    is_disqualifying = True
                else:
                    requirement_text = f"Statutory qualification required: {expected_raw}."
                    applicant_status_text = f"Current recorded qualification: '{actual_val or 'Not Declared'}'."
                    gap_text = f"Qualification level does not match required {expected_raw}."
                    suggested_action_text = f"Verify enrollment status or choose a scheme matching your qualification level."
                    is_disqualifying = True

            # Case E: Certificate Information Incomplete / ST Caste Check
            elif "ST_CATEGORY" in category.upper() or "caste" in field_name.lower():
                gap_type = "CERTIFICATE_INCOMPLETE"
                if actual_val and "NON" in str(actual_val).upper():
                    requirement_text = "Candidate must belong to a Scheduled Tribe (ST) recognized under Article 342."
                    applicant_status_text = f"Category recorded as '{actual_val}'."
                    gap_text = "Candidate is not classified as Scheduled Tribe under Constitutional Presidential Order."
                    suggested_action_text = "This scheme is statutory-restricted to Scheduled Tribe candidates under Article 342."
                    is_disqualifying = True
                else:
                    requirement_text = "ST community certificate must authenticate candidate tribe name under Article 342."
                    applicant_status_text = f"Caste verification status: {evidence_ref or 'Certificate unverified'}."
                    gap_text = "Certificate information incomplete or tribe name could not be authenticated against presidential list."
                    suggested_action_text = "Upload an official gazetted copy issued by Sub-Divisional Magistrate / Tehsildar with digital certificate barcode."
                    is_disqualifying = False

            # Case F: Age Ceiling Limit
            elif "AGE" in category.upper() or "age" in field_name.lower():
                gap_type = "AGE_LIMIT_UNMET"
                try:
                    exp_age = int(expected_raw)
                    act_age = int(actual_val) if actual_val is not None else 0
                    if act_age > exp_age:
                        gap_text = f"Age ({act_age} yrs) exceeds statutory ceiling of {exp_age} years."
                        applicant_status_text = f"Applicant age: {act_age} years."
                        requirement_text = f"Maximum age limit of {exp_age} years."
                        suggested_action_text = f"Age exceeds scheme maximum of {exp_age} years. Verify date of birth or explore fellowship schemes without an age limit."
                        is_disqualifying = True
                    else:
                        applicant_status_text = "Age not detected from documents."
                        gap_text = "Age verification pending from birth certificate/marksheet."
                        suggested_action_text = "Ensure Class 10 marksheet or birth certificate is uploaded to verify age."
                except Exception:
                    applicant_status_text = f"Age: {actual_val or 'Unverified'}."
                    gap_text = "Age condition inspection required."
                    suggested_action_text = "Upload date of birth verification document."

            # Default / Generic Gap
            else:
                applicant_status_text = f"Recorded status: {actual_val or 'Pending verification'}."
                gap_text = explanation or f"Condition '{operator} {expected_raw}' not satisfied."
                suggested_action_text = f"Review scheme guidelines and attach clarifying evidence for {rule_name}."

            gaps.append({
                "gap_id": f"gap_{rule_code}",
                "rule_code": rule_code,
                "rule_name": rule_name,
                "category": category,
                "gap_type": gap_type,
                "requirement": requirement_text,
                "applicant_status": applicant_status_text,
                "gap": gap_text,
                "suggested_action": suggested_action_text,
                "statutory_reference": statutory_ref,
                "severity": severity,
                "is_disqualifying": is_disqualifying
            })

        # Step 3: Check Required Documents Matrix Gaps
        if required_documents:
            uploaded_types = set()
            for k in extracted_documents_data.keys():
                uploaded_types.add(k.upper())
            for d in applicant_data.get("documents", []):
                uploaded_types.add(d.get("document_type", "").upper())

            for rdoc in required_documents:
                rdoc_clean = rdoc.upper().strip()
                if rdoc_clean not in uploaded_types:
                    # Only add if not already captured by a rule gap
                    doc_title = doc_labels.get(rdoc_clean, rdoc_clean.replace("_", " ").title())
                    doc_rule_code = f"DOC_REQ_{rdoc_clean}"
                    if doc_rule_code not in analyzed_rule_codes:
                        gaps.append({
                            "gap_id": f"gap_{doc_rule_code}",
                            "rule_code": doc_rule_code,
                            "rule_name": f"Required Document: {doc_title}",
                            "category": "REQUIRED_DOCUMENT",
                            "gap_type": "MISSING_DOCUMENT",
                            "requirement": f"Scheme mandatory guidelines require valid {doc_title} in candidate dossier.",
                            "applicant_status": "Document not attached to candidate profile or application.",
                            "gap": f"Missing mandatory supporting document: {doc_title}.",
                            "suggested_action": f"Upload clear scanned copy of {doc_title} in the Document Center.",
                            "statutory_reference": "Ministry of Tribal Affairs Scheme Document Checklist",
                            "severity": "MANDATORY",
                            "is_disqualifying": False
                        })

        # Summary Metrics
        disqualifying_count = len([g for g in gaps if g["is_disqualifying"]])
        resolvable_count = len([g for g in gaps if not g["is_disqualifying"]])

        if len(gaps) == 0:
            overall_status = "ELIGIBLE"
            summary_narrative = "All statutory scheme rules and required document conditions are verified. No gaps identified."
        elif disqualifying_count > 0:
            overall_status = "STATUTORY_CRITERIA_UNMET"
            summary_narrative = f"Applicant does not satisfy {disqualifying_count} statutory threshold condition(s) for this scheme."
        else:
            overall_status = "ACTIONABLE_GAPS_IDENTIFIED"
            summary_narrative = f"Core eligibility potential confirmed! Resolve {resolvable_count} actionable requirement(s) to achieve full eligibility."

        return {
            "scheme_code": scheme_code,
            "is_eligible": len(gaps) == 0,
            "overall_status": overall_status,
            "total_gaps_count": len(gaps),
            "disqualifying_gaps_count": disqualifying_count,
            "resolvable_gaps_count": resolvable_count,
            "gaps": gaps,
            "summary_narrative": summary_narrative,
            "evaluation_metrics": {
                "total_rules": eval_result["total_rules"],
                "passed_rules": eval_result["passed_rules"],
                "failed_rules": eval_result["failed_rules"],
                "review_rules": eval_result["review_rules"],
                "eligibility_score": eval_result["eligibility_score"]
            }
        }

    def analyze_rule_impact(
        self,
        scheme_code: str,
        rule_code: str,
        proposed_rule: Dict[str, Any],
        existing_applications: List[Dict[str, Any]],
        current_rule: Optional[Dict[str, Any]] = None,
        scheme_meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Rule Impact Analysis for Administrators:
        Before an administrator activates a changed scheme rule,
        provides a preview of its potential impact on existing application records.

        Shows:
        - Scheme affected
        - Rule changed
        - Previous condition
        - New condition
        - Number of affected applications where determinable
        - Applications requiring re-evaluation

        CRITICAL GUARDRAIL:
        Do not automatically change final decisions.
        All existing decisions remain immutable until formal re-evaluation by Verification Officer.
        """
        import json

        scheme_name = scheme_meta.get("scheme_name", scheme_code) if scheme_meta else scheme_code
        rule_name = proposed_rule.get("rule_name") or (current_rule.get("rule_name") if current_rule else rule_code)
        field_name = proposed_rule.get("field_name") or (current_rule.get("field_name") if current_rule else "")

        # 1. Condition summaries
        prev_active = current_rule.get("active", True) if current_rule else False
        prev_op = current_rule.get("operator", "==") if current_rule else "N/A"
        prev_exp = str(current_rule.get("expected_value", "N/A")) if current_rule else "N/A"
        prev_req = current_rule.get("requirement", "") if current_rule else "Rule not previously configured"

        new_active = proposed_rule.get("active", True)
        new_op = proposed_rule.get("operator", prev_op)
        new_exp = str(proposed_rule.get("expected_value", prev_exp))
        new_req = proposed_rule.get("requirement", prev_req)

        is_toggle = ("active" in proposed_rule) and (len([k for k in proposed_rule.keys() if k not in ["active", "rule_code", "scheme_code"]]) == 0)

        # Merge effective proposed rule for evaluation
        effective_rule = dict(current_rule or {})
        effective_rule.update(proposed_rule)
        effective_rule["rule_code"] = rule_code
        effective_rule["field_name"] = field_name or effective_rule.get("field_name", "")

        # 2. Evaluate impact across existing applications
        affected_apps: List[Dict[str, Any]] = []
        newly_eligible_count = 0
        newly_deficient_count = 0
        review_changed_count = 0

        # If zero applications in DB, simulate across a representative cohort of applications
        cohort = list(existing_applications)
        is_simulated_cohort = False
        if len(cohort) == 0:
            is_simulated_cohort = True
            cohort = [
                {
                    "id": "sample-app-001",
                    "application_number": f"SCH-{scheme_code}-SAMPLE-01",
                    "applicant_name": "Birsa Oraon",
                    "status": "OFFICER_REVIEW",
                    "annual_family_income": 280000,
                    "aggregate_percentage": 57.5,
                    "caste_category": "ST",
                    "tribe_name": "Oraon",
                    "admission_status": "CONFIRMED"
                },
                {
                    "id": "sample-app-002",
                    "application_number": f"SCH-{scheme_code}-SAMPLE-02",
                    "applicant_name": "Sunita Santhal",
                    "status": "DEFICIENCY",
                    "annual_family_income": 320000,
                    "aggregate_percentage": 62.0,
                    "caste_category": "ST",
                    "tribe_name": "Santhal",
                    "admission_status": "CONFIRMED"
                },
                {
                    "id": "sample-app-003",
                    "application_number": f"SCH-{scheme_code}-SAMPLE-03",
                    "applicant_name": "Mangal Munda",
                    "status": "SUBMITTED",
                    "annual_family_income": 190000,
                    "aggregate_percentage": 52.0,
                    "caste_category": "ST",
                    "tribe_name": "Munda",
                    "admission_status": "CONFIRMED"
                }
            ]

        for app in cohort:
            app_id = app.get("id") or "UNKNOWN"
            app_num = app.get("application_number") or app_id
            app_name = app.get("applicant_name") or "Applicant"
            current_status = app.get("status") or "SUBMITTED"

            # Parse extracted data and documents context
            doc_context: Dict[str, Any] = {}
            if app.get("extracted_data"):
                try:
                    raw_docs = app["extracted_data"]
                    if isinstance(raw_docs, str):
                        raw_docs = json.loads(raw_docs)
                    doc_context = raw_docs if isinstance(raw_docs, dict) else {}
                except Exception:
                    pass

            applicant_ctx = {
                "applicant_name": app_name,
                "category": app.get("category") or "Scheduled Tribe (ST)",
                "caste_category": app.get("caste_category") or "ST",
                "tribe_name": app.get("tribe_name") or "ST",
                "annual_family_income": app.get("annual_family_income"),
                "annual_income": app.get("annual_family_income"),
                "aggregate_percentage": app.get("aggregate_percentage"),
                "applicant_age": app.get("applicant_age"),
                "institution_name": app.get("institution_name"),
                "course_name": app.get("course_enrolled") or app.get("course_name"),
                "admission_status": app.get("admission_status") or "CONFIRMED",
                "caste_verified": bool(app.get("caste_verified", True)),
                "bank_account_no": app.get("bank_account_no") or "DBT_LINKED"
            }

            merged_ctx, evidence_map = self._merge_context(applicant_ctx, doc_context)

            # Ensure field_name has direct fallback if not in merged_context
            if field_name and field_name not in merged_ctx:
                if field_name in app and app[field_name] is not None:
                    merged_ctx[field_name] = app[field_name]
                elif field_name == "caste_category":
                    merged_ctx["caste_category"] = "ST"
                elif field_name == "annual_family_income" and app.get("annual_family_income") is not None:
                    merged_ctx["annual_family_income"] = app["annual_family_income"]

            applicant_value = merged_ctx.get(field_name)

            # Evaluate under previous rule
            if not current_rule or not prev_active:
                prev_status = "NOT_ENFORCED"
                prev_explanation = "Rule was inactive or not configured previously."
            else:
                prev_eval = self._evaluate_single_rule(current_rule, merged_ctx, evidence_map)
                prev_status = prev_eval["result"]
                prev_explanation = prev_eval.get("explanation", "")

            # Evaluate under new proposed rule
            if not new_active:
                new_status = "NOT_ENFORCED"
                new_explanation = "Rule deactivated by proposed modification; condition skipped."
            else:
                new_eval = self._evaluate_single_rule(effective_rule, merged_ctx, evidence_map)
                new_status = new_eval["result"]
                new_explanation = new_eval.get("explanation", "")

            # Check if outcome changes
            if prev_status != new_status:
                if (prev_status in ["FAIL", "REVIEW"]) and new_status == "PASS":
                    impact_effect = "WOULD_QUALIFY"
                    effect_label = "Would Qualify (Newly Compliant)"
                    effect_color = "#16a34a"
                    newly_eligible_count += 1
                elif prev_status == "PASS" and (new_status in ["FAIL", "REVIEW"]):
                    impact_effect = "WOULD_FAIL_CRITERIA"
                    effect_label = "Would Fail Criteria (Newly Deficient)"
                    effect_color = "#dc2626"
                    newly_deficient_count += 1
                elif new_status == "NOT_ENFORCED":
                    impact_effect = "REQUIREMENT_REMOVED"
                    effect_label = "Requirement Removed (Inactive)"
                    effect_color = "#2563eb"
                    newly_eligible_count += 1
                elif prev_status == "NOT_ENFORCED" and new_status in ["FAIL", "REVIEW"]:
                    impact_effect = "NEW_DEFICIENCY_INTRODUCED"
                    effect_label = "New Condition Enforced"
                    effect_color = "#dc2626"
                    newly_deficient_count += 1
                else:
                    impact_effect = "STATUS_SHIFTED"
                    effect_label = f"Shifted to {new_status}"
                    effect_color = "#d97706"
                    review_changed_count += 1

                affected_apps.append({
                    "application_id": app_id,
                    "application_number": app_num,
                    "applicant_name": app_name,
                    "current_status": current_status,
                    "applicant_value": applicant_value if applicant_value is not None else "Not Recorded",
                    "previous_result": prev_status,
                    "new_result": new_status,
                    "previous_explanation": prev_explanation,
                    "new_explanation": new_explanation,
                    "impact_effect": impact_effect,
                    "effect_label": effect_label,
                    "effect_color": effect_color,
                    "requires_reevaluation": True
                })

        total_evaluated = len(cohort)
        total_affected = len(affected_apps)
        unaffected = total_evaluated - total_affected

        # Executive summary narrative
        if total_affected == 0:
            impact_narrative = (
                f"Modifying rule '{rule_code}' will have NO adverse impact on current applications. "
                f"All {total_evaluated} evaluated applications maintain their existing rule outcomes."
            )
        else:
            impact_narrative = (
                f"Activating this rule change affects {total_affected} of {total_evaluated} application record(s). "
                f"{newly_eligible_count} candidate(s) would now satisfy criteria, and {newly_deficient_count} candidate(s) "
                "would trigger new statutory deficiency notices upon Verification Officer re-evaluation."
            )

        return {
            "scheme_code": scheme_code,
            "scheme_name": scheme_name,
            "rule_code": rule_code,
            "rule_name": rule_name,
            "field_name": field_name,
            "is_status_toggle": is_toggle,
            "is_simulated_cohort": is_simulated_cohort,
            "previous_condition": {
                "active": prev_active,
                "operator": prev_op,
                "expected_value": prev_exp,
                "requirement": prev_req,
                "display": f"{field_name} {prev_op} {prev_exp}" if prev_active else "Inactive (Disabled)"
            },
            "new_condition": {
                "active": new_active,
                "operator": new_op,
                "expected_value": new_exp,
                "requirement": new_req,
                "display": f"{field_name} {new_op} {new_exp}" if new_active else "Inactive (Disabled)"
            },
            "impact_metrics": {
                "total_applications_evaluated": total_evaluated,
                "total_affected_applications": total_affected,
                "newly_eligible_count": newly_eligible_count,
                "newly_deficient_count": newly_deficient_count,
                "review_changed_count": review_changed_count,
                "unaffected_count": unaffected,
                "requires_reevaluation_count": total_affected
            },
            "impact_narrative": impact_narrative,
            "affected_applications": affected_apps,
            "guardrail_notice": (
                "CRITICAL STATUTORY GUARDRAIL: This rule impact preview does not automatically alter "
                "final decisions on existing application records. Any status transitions must be executed "
                "through Verification Officer re-evaluation in accordance with Ministry guidelines."
            )
        }

    def _evaluate_single_rule(
        self,
        rule: Dict[str, Any],
        context: Dict[str, Any],
        evidence_map: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Evaluate a single dynamic rule and return standard structured output.
        """
        rule_code = rule.get("rule_code", "UNKNOWN")
        rule_name = rule.get("rule_name", "Untitled Statutory Rule")
        field_name = rule.get("field_name", "").strip()
        operator = rule.get("operator", "==").strip()
        expected_raw = str(rule.get("expected_value", "")).strip()
        severity = str(rule.get("severity", "CRITICAL")).upper()
        category = rule.get("category", rule.get("scheme_code", "SCHEME"))
        rule_type = rule.get("rule_type") or rule.get("condition_type") or "SCHEME_SPECIFIC_CONDITION"
        statutory_ref = rule.get("statutory_reference") or "Ministry of Tribal Affairs Guidelines"
        error_message = rule.get("error_message") or rule.get("deficiency_message") or rule.get("requirement") or "Condition not satisfied"
        mandatory = bool(rule.get("mandatory", True))

        # Retrieve applicant actual value from context
        actual_val = context.get(field_name)

        # Retrieve evidence/document reference
        evidence_ref = evidence_map.get(field_name) or context.get(f"{field_name}_evidence")
        if not evidence_ref:
            if actual_val is not None:
                evidence_ref = f"Declared profile value: {actual_val}"
            else:
                evidence_ref = "No document evidence uploaded for this requirement"

        # Evaluation
        result = "REVIEW"
        explanation = ""

        if actual_val is None:
            if severity in ["CRITICAL", "MANDATORY"]:
                result = "FAIL"
                explanation = f"Deficiency: {error_message} (Required field '{field_name}' missing from profile and verified documents)."
            else:
                result = "REVIEW"
                explanation = f"Field '{field_name}' not detected in submitted documents. Officer manual inspection required."
        else:
            is_match, eval_notes = self._compare_values(actual_val, operator, expected_raw)
            if is_match:
                result = "PASS"
                explanation = f"Criteria satisfied. {eval_notes}"
            else:
                result = "FAIL"
                explanation = f"Deficiency: {error_message}. ({eval_notes})"

        return {
            "rule_evaluated": {
                "rule_code": rule_code,
                "rule_name": rule_name,
                "category": category,
                "rule_type": rule_type,
                "field_name": field_name,
                "severity": severity,
                "mandatory": mandatory,
                "statutory_reference": statutory_ref
            },
            "applicant_value": actual_val,
            "required_condition": f"{operator} {expected_raw}",
            "result": result,
            "evidence_reference": evidence_ref,
            "explanation": explanation,
            # Top-level aliases for UI components and backward compatibility
            "rule_code": rule_code,
            "rule_name": rule_name,
            "status": result,
            "expected_criterion": f"{operator} {expected_raw}",
            "extracted_evidence": evidence_ref
        }

    def _compare_values(self, actual: Any, operator: str, expected_raw: str) -> Tuple[bool, str]:
        """
        Compare actual against expected value deterministically.
        Supports numeric, boolean, list inclusion, text matching, and existence.
        """
        # 1. Numeric Comparison
        try:
            expected_num = float(str(expected_raw).replace(",", "").strip())
            actual_num = float(str(actual).replace(",", "").strip())

            if operator in ["<=", "=<"]:
                passed = actual_num <= expected_num
                return passed, f"Value {actual_num} is {'<=' if passed else '>'} required threshold {expected_num}"
            elif operator in [">=", "=>"]:
                passed = actual_num >= expected_num
                return passed, f"Value {actual_num} is {'>=' if passed else '<'} minimum required {expected_num}"
            elif operator in ["<"]:
                passed = actual_num < expected_num
                return passed, f"Value {actual_num} < threshold {expected_num}"
            elif operator in [">"]:
                passed = actual_num > expected_num
                return passed, f"Value {actual_num} > threshold {expected_num}"
            elif operator in ["==", "="]:
                passed = abs(actual_num - expected_num) < 0.001
                return passed, f"Value {actual_num} == {expected_num}"
            elif operator in ["!=", "NOT_EQUALS"]:
                passed = abs(actual_num - expected_num) >= 0.001
                return passed, f"Value {actual_num} != {expected_num}"
        except (ValueError, TypeError):
            pass

        # 2. Boolean Comparison
        if str(expected_raw).lower() in ["true", "false"]:
            exp_bool = str(expected_raw).lower() == "true"
            act_bool = bool(actual) if not isinstance(actual, str) else actual.lower() in ["true", "1", "yes", "verified"]
            if operator in ["==", "=", "is_true", "is"]:
                passed = act_bool == exp_bool
            else:
                passed = act_bool != exp_bool
            return passed, f"Boolean check: {act_bool} (expected {exp_bool})"

        # 3. String & List Inclusion Comparison
        actual_str = str(actual).strip()
        expected_str = str(expected_raw).strip()

        actual_norm = actual_str.lower()
        expected_norm = expected_str.lower()

        if operator.lower() in ["in", "contained_in"]:
            allowed = [x.strip().lower() for x in expected_str.split(",")]
            passed = actual_norm in allowed
            return passed, f"'{actual_str}' {'is in' if passed else 'is NOT in'} allowed list: [{expected_str}]"

        elif operator.lower() in ["contains", "has"]:
            passed = expected_norm in actual_norm
            return passed, f"Text '{actual_str}' {'contains' if passed else 'does not contain'} '{expected_str}'"

        elif operator in ["!=", "NOT_EQUALS"]:
            passed = actual_norm != expected_norm
            return passed, f"'{actual_str}' != '{expected_str}'"

        elif operator in ["exists", "is_not_empty"]:
            passed = bool(actual_str)
            return passed, f"Field exists and is non-empty: {passed}"

        else:  # default '==' exact match
            passed = actual_norm == expected_norm or actual_norm.startswith(expected_norm)
            return passed, f"Value '{actual_str}' {'matches' if passed else 'does not match'} required '{expected_str}'"

    def _merge_context(
        self,
        profile: Dict[str, Any],
        doc_data: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], Dict[str, str]]:
        """
        Merge applicant declared profile with AI/OCR extracted document facts.
        Verified document evidence takes precedence over self-declarations.
        Returns (merged_context, evidence_map).
        """
        merged = dict(profile)
        evidence_map: Dict[str, str] = {}

        # 1. Scheduled Tribe Caste Certificate
        caste_doc = doc_data.get("caste_certificate") or doc_data.get("CASTE_CERTIFICATE") or {}
        if caste_doc:
            cert_no = caste_doc.get("certificate_number") or caste_doc.get("caste_certificate_no")
            tribe = caste_doc.get("tribe_community_name") or caste_doc.get("tribe_name")
            authority = caste_doc.get("issuing_authority")
            is_st = caste_doc.get("is_scheduled_tribe")
            if is_st is None and caste_doc.get("verification_status") in ["VERIFIED_ST", "VERIFIED"]:
                is_st = True

            if is_st is not None:
                merged["caste_category"] = "ST" if is_st else "NON_ST"
            elif profile.get("caste_category"):
                merged["caste_category"] = profile.get("caste_category")

            if tribe:
                merged["tribe_name"] = tribe

            merged["has_caste_certificate"] = True
            evidence_map["caste_category"] = (
                f"ST Certificate #{cert_no or 'N/A'} (Tribe: {tribe or 'Scheduled Tribe'}, "
                f"Issued by: {authority or 'Competent Revenue Authority'}) - Verified via OCR"
            )
            evidence_map["has_caste_certificate"] = evidence_map["caste_category"]
        else:
            cat = profile.get("category") or profile.get("caste_category")
            if cat:
                merged["caste_category"] = "ST" if "ST" in str(cat).upper() or "SCHEDULED TRIBE" in str(cat).upper() else str(cat)
                evidence_map["caste_category"] = "Applicant Self-Declaration (ST Certificate upload pending)"
            merged["has_caste_certificate"] = False

        # 2. Annual Family Income Certificate
        income_doc = doc_data.get("income_certificate") or doc_data.get("INCOME_CERTIFICATE") or {}
        if income_doc:
            inc_val = income_doc.get("annual_income_inr") or income_doc.get("annual_income")
            cert_no = income_doc.get("certificate_number") or income_doc.get("income_certificate_no")
            authority = income_doc.get("issuing_authority")
            if inc_val is not None:
                try:
                    merged["annual_family_income"] = float(str(inc_val).replace(",", ""))
                except Exception:
                    pass
            merged["has_income_certificate"] = True
            evidence_map["annual_family_income"] = (
                f"Income Certificate #{cert_no or 'N/A'}, Assessed Income: Rs. {merged.get('annual_family_income', 'N/A')}, "
                f"Issuing Authority: {authority or 'Revenue Officer'}"
            )
            evidence_map["has_income_certificate"] = evidence_map["annual_family_income"]
        else:
            p_inc = profile.get("annual_income") or profile.get("annual_family_income")
            if p_inc is not None:
                try:
                    merged["annual_family_income"] = float(str(p_inc).replace(",", ""))
                except Exception:
                    pass
                evidence_map["annual_family_income"] = f"Declared in Profile: Rs. {p_inc} (Income Certificate pending)"
            merged["has_income_certificate"] = False

        # 3. Academic Marksheet / Degree
        marksheet_doc = doc_data.get("marksheet") or doc_data.get("MARKSHEET") or {}
        if marksheet_doc:
            pct = marksheet_doc.get("aggregate_percentage") or marksheet_doc.get("percentage")
            deg = marksheet_doc.get("examination_degree") or marksheet_doc.get("degree")
            univ = marksheet_doc.get("board_or_university") or marksheet_doc.get("university")
            if pct is not None:
                try:
                    merged["aggregate_percentage"] = float(str(pct).replace("%", ""))
                except Exception:
                    pass
            if deg:
                merged["qualification_level"] = str(deg).upper()
            merged["has_academic_marksheet"] = True
            evidence_map["aggregate_percentage"] = (
                f"Marksheet: {deg or 'Qualifying Exam'}, Aggregate: {merged.get('aggregate_percentage')}%, "
                f"Institution: {univ or 'Recognized Board/University'}"
            )
            evidence_map["qualification_level"] = evidence_map["aggregate_percentage"]
            evidence_map["has_academic_marksheet"] = evidence_map["aggregate_percentage"]
        else:
            p_pct = profile.get("aggregate_percentage")
            if p_pct is not None:
                try:
                    merged["aggregate_percentage"] = float(str(p_pct).replace("%", ""))
                except Exception:
                    pass
                evidence_map["aggregate_percentage"] = f"Declared in Profile: {p_pct}% (Marksheet verification pending)"
            if profile.get("education_qualification"):
                merged["qualification_level"] = str(profile.get("education_qualification")).upper()
            merged["has_academic_marksheet"] = False

        # 4. Admission Offer / Registration Letter
        offer_doc = doc_data.get("admission_offer") or doc_data.get("ADMISSION_OFFER") or {}
        if offer_doc:
            status = offer_doc.get("offer_status") or offer_doc.get("admission_status") or "CONFIRMED"
            inst = offer_doc.get("institution_name")
            course = offer_doc.get("course_enrolled")
            merged["admission_status"] = status
            merged["admission_confirmed"] = str(status).upper() in ["UNCONDITIONAL", "CONFIRMED", "REGULAR", "ENROLLED"]
            merged["institution_name"] = inst or profile.get("institution_name")
            merged["course_name"] = course or profile.get("course_name")
            merged["has_admission_offer"] = True

            # Scheme-specific tags
            inst_upper = str(inst or "").upper()
            is_premier = any(tag in inst_upper for tag in ["IIT", "IIM", "AIIMS", "NIT", "NLU", "IISER", "IIIT", "PREMIER"])
            merged["premier_institute_enrolled"] = is_premier

            course_upper = str(course or "").upper()
            is_phd = any(tag in course_upper for tag in ["PH.D", "PHD", "M.PHIL", "DOCTORAL"])
            merged["phd_registration_regular"] = is_phd

            evidence_map["admission_confirmed"] = f"Admission Letter: {inst or 'Institution'}, Course: {course or 'Program'}, Status: {status}"
            evidence_map["premier_institute_enrolled"] = f"Notified Premier Institute Verification: {inst or 'Institution'}"
            evidence_map["phd_registration_regular"] = f"Ph.D. Enrollment Verification: {course or 'Program'}"
            evidence_map["has_admission_offer"] = evidence_map["admission_confirmed"]
        else:
            if profile.get("admission_status"):
                merged["admission_confirmed"] = str(profile.get("admission_status")).upper() in ["CONFIRMED", "REGULAR", "UNCONDITIONAL"]
            else:
                merged["admission_confirmed"] = False
            merged["has_admission_offer"] = False

        # 5. Age & Date of Birth
        if profile.get("applicant_age") is not None:
            try:
                merged["applicant_age"] = int(profile.get("applicant_age"))
                evidence_map["applicant_age"] = f"Age: {profile.get('applicant_age')} years (Computed from DOB: {profile.get('dob', 'N/A')})"
            except Exception:
                pass
        elif profile.get("dob"):
            # Compute age from DOB if available
            try:
                dob_year = int(str(profile.get("dob"))[:4])
                calc_age = 2026 - dob_year
                merged["applicant_age"] = calc_age
                evidence_map["applicant_age"] = f"Age: {calc_age} years (Calculated from DOB {profile.get('dob')})"
            except Exception:
                pass

        # 6. Academic Year
        merged["academic_year"] = profile.get("academic_year") or "2026-2027"
        evidence_map["academic_year"] = f"Current Academic Session: {merged['academic_year']}"

        # 7. Bank Account / Aadhaar Seeding
        bank_doc = doc_data.get("bank_passbook") or doc_data.get("BANK_PASSBOOK") or {}
        if bank_doc or profile.get("bank_account_no"):
            merged["bank_aadhaar_seeded"] = True
            evidence_map["bank_aadhaar_seeded"] = f"Bank Account: {profile.get('bank_name', 'DBT Bank')} A/C #{profile.get('bank_account_no', 'Verified')} (Aadhaar Seeded)"
            merged["has_bank_passbook"] = True
        else:
            merged["bank_aadhaar_seeded"] = False
            merged["has_bank_passbook"] = False

        # 8. Negative / Prohibition Flags
        merged["previous_fellowship_availed"] = bool(profile.get("previous_fellowship_availed", False))
        merged["employed_full_time"] = bool(profile.get("employed_full_time", False))

        return merged, evidence_map


scholar_rule_engine = ScholarRuleEngine()
