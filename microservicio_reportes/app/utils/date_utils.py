# microservicio_reportes/app/utils/date_utils.py
from datetime import date, timedelta, datetime
import calendar
import re

def obtener_rango_fechas(descripcion: str) -> dict:
    """
    Calcula start_date y end_date a partir de una descripción textual del rango temporal.
    Ej: "este mes", "mes pasado", "últimos 7 días", "ayer", "este trimestre", etc.
    """
    hoy = date.today()
    
    descripcion = descripcion.lower().strip()
    start_date, end_date = hoy, hoy  # Por defecto, hoy

    # --- Día actual / ayer ---
    if "hoy" in descripcion or "día actual" in descripcion:
        start_date = end_date = hoy
    elif "ayer" in descripcion:
        start_date = end_date = hoy - timedelta(days=1)

    # --- Semana actual ---
    elif "esta semana" in descripcion:
        start_date = hoy - timedelta(days=hoy.weekday())  # Lunes
        end_date = start_date + timedelta(days=6)

    # --- Últimos X días ---
    elif "últimos" in descripcion:
        match = re.search(r"últimos (\d+)", descripcion)
        if match:
            dias = int(match.group(1))
            start_date = hoy - timedelta(days=dias)
            end_date = hoy

    # --- Mes actual ---
    elif "este mes" in descripcion or "mes actual" in descripcion:
        start_date = hoy.replace(day=1)
        end_date = date(hoy.year, hoy.month, calendar.monthrange(hoy.year, hoy.month)[1])

    # --- Mes pasado ---
    elif "mes pasado" in descripcion:
        mes_pasado = hoy.month - 1 or 12
        anio = hoy.year - 1 if hoy.month == 1 else hoy.year
        start_date = date(anio, mes_pasado, 1)
        end_date = date(anio, mes_pasado, calendar.monthrange(anio, mes_pasado)[1])

    # --- Trimestre actual ---
    elif "este trimestre" in descripcion:
        trimestre = (hoy.month - 1) // 3 + 1
        start_mes = 3 * (trimestre - 1) + 1
        start_date = date(hoy.year, start_mes, 1)
        end_mes = start_mes + 2
        end_date = date(hoy.year, end_mes, calendar.monthrange(hoy.year, end_mes)[1])

    # --- Año actual ---
    elif "año actual" in descripcion or "este año" in descripcion:
        start_date = date(hoy.year, 1, 1)
        end_date = date(hoy.year, 12, 31)

    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }
