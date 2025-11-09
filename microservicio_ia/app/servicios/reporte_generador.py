import pandas as pd
from datetime import datetime
from pathlib import Path

def generar_reporte(tipo: str, fecha_inicio: str, fecha_fin: str):
    """
    Genera un reporte en Excel o PDF (por ahora Excel simulado)
    con datos de ejemplo.
    """

    # Simulamos datos de ventas (luego traeremos datos reales desde Django)
    datos = [
        {"fecha": "2025-10-01", "venta": 1000},
        {"fecha": "2025-10-02", "venta": 1500},
        {"fecha": "2025-10-03", "venta": 2000},
    ]
    
    df = pd.DataFrame(datos)

    # Carpeta donde se guardan los reportes
    ruta = Path("archivos")
    ruta.mkdir(exist_ok=True)

    nombre = f"reporte_{datetime.now().strftime('%Y%m%d_%H%M')}"
    extension = "xlsx" if tipo == "excel" else "pdf"
    archivo = ruta / f"{nombre}.{extension}"

    if tipo == "excel":
        df.to_excel(archivo, index=False)
    else:
        df.to_csv(archivo, index=False)  # Por ahora, simulamos PDF

    return str(archivo)
