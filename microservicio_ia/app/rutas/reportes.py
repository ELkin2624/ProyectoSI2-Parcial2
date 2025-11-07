from fastapi import APIRouter, Query
from app.servicios.reporte_generador import generar_reporte

router = APIRouter()

@router.get("/")
async def generar_reporte_endpoint(
    tipo: str = Query("excel", enum=["pdf", "excel"]),
    fecha_inicio: str = Query(None),
    fecha_fin: str = Query(None)
):
    """
    Genera reportes dinámicos de ventas según rango de fechas y formato.
    """
    archivo = generar_reporte(tipo, fecha_inicio, fecha_fin)
    return {"status": "ok", "archivo_generado": archivo}