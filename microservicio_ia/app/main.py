from fastapi import FastAPI
from .rutas import reportes

app = FastAPI(title="Microservicio IA Boutique")

app.include_router(reportes.router, prefix="/reportes", tags=["Reports"])

@app.get("/")
def root():
    return {"message": "Microservicio IA Boutique activo y funcionando"}
