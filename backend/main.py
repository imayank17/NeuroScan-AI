from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from auth import router as auth_router
from routes.upload import router as upload_router
from routes.reports import router as reports_router
from routes.history import router as history_router
from routes.feedback import router as feedback_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NeuroScan AI — Epileptic Seizure Detection",
    description="AI-powered EEG analysis for epileptic seizure detection",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(reports_router)
app.include_router(history_router)
app.include_router(feedback_router)


@app.get("/")
def root():
    return {
        "name": "NeuroScan AI",
        "version": "1.0.0",
        "description": "Epileptic Seizure Detection from EEG Signals",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
