from fastapi import FastAPI, HTTPException
from starlette.responses import StreamingResponse
import io

from .schemas import ReportRequest
from .llm_service import analizar_prompt_usuario
from .reporting import crear_reporte_desde_bd

# Creamos la instancia de la aplicación
app = FastAPI(
    title="Microservicio de Reportes de IA",
    version="0.1.0",
)

# Este es un "endpoint" o "ruta"
# El decorador @app.get("/") le dice a FastAPI
# que esta función maneja las peticiones a la raíz "/"
@app.get("/")
def leer_raiz():
    """
    Endpoint raíz para verificar que el servicio está en línea.
    """
    return {"mensaje": "¡Microservicio de Reportes está en línea!"}


# Es "POST" porque el usuario nos "envía" datos (el prompt)
@app.post("/generar-reporte-ia")
def generar_reporte(request: ReportRequest):
    """
    Recibe un prompt de lenguaje natural y lo analiza usando IA
    para extraer los parámetros del reporte.
    """
    print(f"Recibido prompt: {request.prompt}")

    # 1. Analizamos el prompt con la IA (Cohere)
    try:
        parametros = analizar_prompt_usuario(request.prompt)
    except Exception as e:
        print(f"Error en servicio LLM: {e}")
        raise HTTPException(status_code=500, detail="Error al contactar la IA.")
        
    if "error" in parametros:
        raise HTTPException(status_code=400, detail=parametros["error"])

    # 2. Vemos qué formato nos pidió el usuario
    formato = parametros.get('format', 'json')
    
    try:
        # 3. ¡Aquí ocurre la magia!
        if formato == 'excel':
            # Llamamos al trabajador para generar el archivo Excel
            excel_bytes = crear_reporte_desde_bd(parametros)
            
            # Devolvemos el archivo Excel
            return StreamingResponse(
                io.BytesIO(excel_bytes),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={
                    "Content-Disposition": "attachment; filename=reporte_generado.xlsx"
                }
            )
            
        elif formato == 'json':
            # Si solo querían JSON, devolvemos los parámetros (como antes)
            return {
                "mensaje": "Parámetros extraídos (formato JSON)",
                "parametros_extraidos": parametros
            }
            
        else:
            raise HTTPException(status_code=400, detail=f"Formato '{formato}' no soportado.")

    except NotImplementedError as e:
        # Error si la métrica no existe (ej. 'productos_mas_vendidos')
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Error general (ej. la tabla de BD no existe)
        print(f"Error al generar el reporte: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno al generar el reporte: {e}")