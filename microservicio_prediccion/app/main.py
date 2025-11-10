from fastapi import FastAPI

app = FastAPI(
    title="Microservicio de PREDICCIÓN de Ventas",
    version="0.1.0",
)

@app.get("/")
def leer_raiz():
    """
    Endpoint raíz para verificar que el servicio está en línea.
    """
    return {"mensaje": "¡Microservicio de PREDICCIÓN está en línea!"}