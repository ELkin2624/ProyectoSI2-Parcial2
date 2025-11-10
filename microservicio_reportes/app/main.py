from fastapi import FastAPI, HTTPException
from starlette.responses import StreamingResponse
import io
import pandas as pd

from .schemas import ReportRequest
from .llm_service import analizar_prompt_usuario
from .reporting import get_report_dataframe, convert_df_to_excel_bytes

app = FastAPI(
    title="Microservicio de Reportes de IA",
    version="0.1.0",
)

# El decorador @app.get("/") le dice a FastAPI que esta función maneja las peticiones a la raíz "/"
@app.get("/")
def leer_raiz():
    """
    Endpoint raíz para verificar que el servicio está en línea.
    """
    return {"mensaje": "¡Microservicio de Reportes está en línea!"}

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
        df = get_report_dataframe(parametros)

        if formato == 'excel':
            metric_name = parametros.get('metric', 'reporte')
            excel_bytes = convert_df_to_excel_bytes(df, metric_name)
            
            return StreamingResponse(
                io.BytesIO(excel_bytes),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={
                    "Content-Disposition": f"attachment; filename={metric_name}.xlsx"
                }
            )
            
        elif formato == 'json':
            # Convertimos el DataFrame a un diccionario
            df_cleaned = df.replace({pd.NA: None, pd.NaT: None, float('nan'): None})
            data_json = df_cleaned.to_dict(orient='records')

            return {
                "metric": parametros.get('metric'),
                "count": len(data_json),
                "data": data_json
            }
            
        else:
            raise HTTPException(status_code=400, detail=f"Formato '{formato}' no soportado.")

    except NotImplementedError as e:
        # Métrica reconocida pero no implementada
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Error general (ej. la tabla de BD no existe)
        print(f"Error al generar el reporte: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno al generar el reporte: {e}")