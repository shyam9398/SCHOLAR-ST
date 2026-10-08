# SCHOLAR-ST

### AI-Enabled Scholarship and Fellowship Management System for Scheduled Tribes


## 📌 Problem Statement

### SIH26239 — AI-Enabled Scholarship and Fellowship Management System for Scheduled Tribes

The Ministry of Tribal Affairs provides various scholarship and fellowship schemes for Scheduled Tribe (ST) students.

The existing screening and selection process involves significant manual effort in application screening, document verification, eligibility checking, and selection.

This can lead to:

- Manual verification and repetitive work
- Large document-handling burden
- Scheme-specific eligibility complexity
- Repeated verification of information
- Delays and processing errors
- Limited transparency in screening
- Fragmented workflows across schemes

SCHOLAR-ST aims to simplify and automate these activities through AI-assisted document intelligence, configurable scheme rules, evidence-based verification, and officer-assisted decision-making.

## 💡 Proposed Solution

**SCHOLAR-ST** is an AI-enabled scholarship and fellowship management platform designed to streamline the application, verification, screening, and selection workflow for Scheduled Tribe students.

The system follows:

> **AI for Verification → Rules for Eligibility → Officers for Decisions**

### How it works

1. **Unified Application** — Collect applicant details, academic information, and documents in one streamlined workflow.
2. **AI Document Intelligence** — Use OCR and AI to extract and interpret information from submitted documents.
3. **Dynamic Rule Validation** — Apply configurable, scheme-specific eligibility and document rules.
4. **Evidence-Based Verification** — Connect extracted information, rules, validation results, and supporting evidence.
5. **Smart Deficiency Detection** — Identify missing or incomplete information and support digital resubmission.
6. **Officer-Assisted Screening** — Provide explainable verification results for authorized officers.
7. **Tracking & Analytics** — Enable application tracking and administrative monitoring.

> **AI assists → Rules validate → Officers decide**

## 🚀 Key Features

### 1. Unified Application
One platform for applicant registration, profiles, applications, and document submission.

### 2. AI Document Intelligence
OCR and AI-assisted extraction of relevant information from uploaded documents.

### 3. Document Validation & Deficiency Detection
Identifies missing, incomplete, unclear, or inconsistent information and supports resubmission.

### 4. Dynamic Scheme Rule Engine
Allows scheme-specific eligibility and document rules to be configured and applied dynamically.

### 5. Evidence-Based Verification
Links:

**Document → Extracted Data → Scheme Rule → Validation Result → Evidence → Officer Decision**

### 6. Officer-Assisted Screening
Provides explainable screening results while keeping final approval decisions with authorized officers.

### 7. Application Tracking
Applicants can track application status and updates throughout the workflow.

### 8. Admin Control & Analytics
Administrators can manage schemes, rules, users, workflows, and monitor scheme performance.

### 9. Secure Role-Based Access
Separate access and workflows for applicants, officers, and administrators.

### 10. Cross-Scheme Intelligence
A verified applicant profile can be evaluated across configured schemes to identify eligible opportunities.

## 🏗️ System Architecture

SCHOLAR-ST follows a modular architecture connecting the applicant, AI services, rule engine, database, and authorized officers.

### Architecture Flow


                                                        Applicant
                                                           ↓
                                                        Web Application
                                                           ↓
                                                        FastAPI Backend
                                                           ↓
                                                        Document Processing
                                                           ↓
                                                        OCR + AI Intelligence
                                                           ↓
                                                        Dynamic Rule Engine
                                                           ↓
                                                        Evidence & Verification Report
                                                           ↓
                                                        Officer Review
                                                           ↓
                                                        Deficiency Detected?
                                                           ├── Yes → Applicant Resubmission
                                                           │            ↓
                                                           │       Document Revalidation
                                                           │            ↓
                                                           │       Evidence & Verification Report
                                                           │            ↓
                                                           │       Officer Review
                                                           │
                                                           └── No → Final Decision
                                                                        ↓
                                                                Status & Notifications


## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + TypeScript |
| Backend | Python + FastAPI |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| Authentication | Supabase Auth + JWT + RBAC |
| PDF Processing | PyMuPDF |
| Image Processing | OpenCV + NumPy |
| OCR | PaddleOCR |
| AI | Gemini API |
| Rule Engine | Dynamic Validation Engine |
| Notifications | Email + In-App Notifications |
| Multilingual Support | IndicTrans2 |
| Deployment | Vercel + Render |
| Version Control | Git + GitHub |

## 🔄 Current Approach vs Our Approach

| Capability | Current / Existing Workflow | SCHOLAR-ST |
|---|---|---|
| Application & Tracking | Available across portals | Unified Platform |
| Document Verification | Limited / Workflow-Dependent | AI-Assisted Verification |
| Scheme-Specific Validation | Manual / Scheme-Dependent | Dynamic Rule Engine |
| Deficiency Detection | Limited / Fragmented | Automated Detection & Resubmission |
| Evidence-Based Verification | Identified Gap | Evidence-Linked Results |
| Officer Screening | Officer-Driven | AI-Assisted + Officer-Verified |
| Cross-Scheme Eligibility | Not Centralized | Cross-Scheme Intelligence |
| Rule Management | Scheme-Dependent | Configurable Rules |
| Verification Records | Fragmented | Centralized Records |

## 🔮 Future Enhancements

### 1. Scheme Gap & Rule Impact Intelligence
Analyze recurring deficiencies and identify affected applications when scheme rules change.

### 2. Cross-Scheme Eligibility Intelligence
Evaluate verified applicant profiles across multiple configured schemes and present eligible opportunities.

### 3. Reusable Verification Evidence
Reuse verified evidence across applicable applications to reduce unnecessary re-verification.

### 4. Advanced Analytics & Monitoring
Provide deeper insights into application trends, deficiencies, processing time, and scheme performance.

### 5. Multilingual & Assisted Access
Expand support for Indian languages and assisted-access workflows for applicants from low-connectivity and underserved regions.

### 6. Government System Integration
Enable authorized integration with relevant government systems and verification services.

### 7. Multi-Scheme & Multi-State Scalability
Extend the platform across multiple scholarship/fellowship schemes and states.

## 🔗 Reference Links

### 🌐 MVP Application
[Open SCHOLAR-ST MVP](https://scholar-st-gf.vercel.app/)

### 🎥 Demo Video
[Watch SCHOLAR-ST Working Demonstration](https://drive.google.com/drive/u/1/folders/1T5HgN09IwAMrMaGEwYGDxPp6m025rD4I)

### 💻 GitHub Repository
[View Source Code](https://github.com/shyam9398/SCHOLAR-ST)
