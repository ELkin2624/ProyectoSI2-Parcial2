from fastapi import FastAPI, HTTPException
from starlette.responses import StreamingResponse, Response
import io
import pandas as pd
from .schemas import ReportRequest
from .llm_service import analizar_prompt_usuario
from .reporting import (
    get_report_dataframe, 
    convert_df_to_excel_bytes, 
    convert_df_to_pdf_bytes
)

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
    Recibe un prompt, lo analiza con IA, consulta la BD
    y devuelve un archivo (Excel, PDF) o los datos (JSON).
    """
    print(f"Recibido prompt: {request.prompt}")
    
    # 1. Analizamos el prompt con la IA (Cohere + utils)
    try:
        parametros = analizar_prompt_usuario(request.prompt)
        if "error" in parametros:
            raise HTTPException(status_code=400, detail=parametros["error"])
    except Exception as e:
        print(f"Error en servicio LLM: {e}")
        raise HTTPException(status_code=500, detail=f"Error al contactar la IA: {e}")
    
    formato = parametros.get('format', 'json').lower()
    
    try:
        # 2. SIEMPRE consultamos la BD
        df = get_report_dataframe(parametros)
        
        # Limpiamos el DataFrame para JSON
        df_cleaned = df.replace({pd.NA: None, pd.NaT: None, float('nan'): None})

        # 3. Decidimos cómo formatear la salida
        if formato == 'excel':
            metric_name = parametros.get('metric', 'reporte')
            excel_bytes = convert_df_to_excel_bytes(df_cleaned, metric_name)
            filename = f"reporte_{metric_name}.xlsx"
            
            return StreamingResponse(
                io.BytesIO(excel_bytes),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
            
        elif formato == 'pdf':
            metric_name = parametros.get('metric', 'reporte')
            pdf_bytes = convert_df_to_pdf_bytes(df_cleaned, metric_name)
            filename = f"reporte_{metric_name}.pdf"

            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )

        elif formato == 'json':
            # Convertimos el DataFrame a un diccionario
            data_json = df_cleaned.to_dict(orient='records')
            
            return {
                "metric": parametros.get('metric'),
                "group_by": parametros.get('group_by'),
                "date_range": parametros.get('date_range'),
                "count": len(data_json),
                "data": data_json
            }
            
        else:
            raise HTTPException(status_code=400, detail=f"Formato '{formato}' no soportado.")

    except NotImplementedError as e:
        # Error si la métrica no existe
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Error general (ej. la tabla de BD no existe)
        print(f"Error al generar el reporte: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno al generar el reporte: {e}")