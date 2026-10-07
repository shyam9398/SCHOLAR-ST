import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.scholar_schemes import router as schemes_router
from app.api.caste_verification import router as caste_router
from app.api.scholar_applications import router as applications_router
from app.api.scholar_applicant import router as applicant_router
from app.api.scholar_documents import router as documents_router
from app.api.admin import router as admin_router


# =========================================================
# SCHOLAR-ST APPLICATION
# AI-Powered Scholarship Eligibility, Verification & Decision System
# =========================================================

app = FastAPI(
    title="SCHOLAR-ST API Platform",
    description="AI-Powered Scholarship Eligibility, Verification & Decision System for Scheduled Tribe Applicants",
    version="2.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# API ROUTERS
# =========================================================

app.include_router(auth_router)
app.include_router(schemes_router)
app.include_router(caste_router)
app.include_router(applications_router)
app.include_router(applicant_router)
app.include_router(documents_router)
app.include_router(admin_router)


# =========================================================
# UPLOAD AND STATIC STORAGE
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads"
)


# =========================================================
# ROOT & HEALTH CHECK
# =========================================================

@app.get("/")
def root():
    return {
        "platform": "SCHOLAR-ST",
        "system": "AI-Powered Scholarship Eligibility, Verification & Decision System",
        "version": "2.0.0",
        "status": "operational",
        "target_community": "Scheduled Tribes (ST)"
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "platform": "SCHOLAR-ST",
        "ocr_engine": "PaddleOCR",
        "preprocessor": "PyMuPDF + OpenCV",
        "ai_engine": "Gemini 2.5/3.5 Flash",
        "rule_engine": "Dynamic Supabase Rule Engine",
        "document_verifier": "SCHOLAR-ST Verification Module v2"
    }