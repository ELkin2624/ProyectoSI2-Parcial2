from fastapi import FastAPI, HTTPException
from .schemas import PredictionRequest
from . import model

app = FastAPI(
    title="Microservicio de PREDICCIÓN de Ventas",
    version="0.1.0",
)

@app.on_event("startup")
def verificar_modelo():
    # Verificación al inicio para fallar rápido si algo salió mal
    if model.modelo is None:
        print("ADVERTENCIA: El modelo de ML no está cargado. El endpoint /predecir fallará.")
    if model.df_historico is None:
        print("ADVERTENCIA: Los datos históricos no están cargados. El endpoint /predecir fallará.")

@app.get("/")
def leer_raiz():
    """
    Endpoint raíz para verificar que el servicio está en línea.
    """
    return {"mensaje": "¡Microservicio de PREDICCIÓN está en línea!"}

@app.post("/predecir")
def predecir_ventas(request: PredictionRequest):
    """
    Recibe un número de días y devuelve la predicción de ventas.
    """
    # Si los archivos no se cargaron al inicio, devolvemos un error
    if model.modelo is None or model.df_historico is None:
        raise HTTPException(status_code=503, # 503: Servicio No Disponible
                            detail="El servicio no está listo. El modelo o los datos históricos no se pudieron cargar.")
    
    try:
        print(f"Recibida petición para predecir {request.dias_a_predecir} días.")
        
        # 1. Llamar a nuestra función de lógica
        predicciones = model.generar_predicciones(request.dias_a_predecir)
        
        # 2. Devolver los resultados en formato JSON
        return {
            "dias_solicitados": request.dias_a_predecir,
            "predicciones": predicciones
        }
        
    except Exception as e:
        print(f"Error durante la predicción: {e}")
        # Captura cualquier error de la función 'generar_predicciones'
        raise HTTPException(status_code=500, detail=f"Error interno al generar la predicción: {e}")
    
