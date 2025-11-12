# microservicio_reportes/app/llm_service.py
import cohere
import json
import re
from .core.config import COHERE_API_KEY
from datetime import date
from .utils.date_utils import obtener_rango_fechas

# Configura la API de Google
#genai.configure(api_key=GEMINI_API_KEY)
co = cohere.Client(COHERE_API_KEY)

def construir_preambulo_sistema(fecha_actual: str) -> str:
    """
    Preambulo detallado para interpretar prompts relacionados con reportes de E-commerce de boutique.
    """
    return f"""
    Eres un analista experto en datos de un E-commerce de moda (boutique).
    Tu tarea es transformar solicitudes en un JSON estructurado y **nada más**.
    Nunca agregues texto fuera del JSON.

    --- 🧾 ESTRUCTURA JSON ---
    {{
      "metric": "tipo_de_reporte",
      "filters": {{
         "campo": "valor"
      }},
      "date_range": {{
         "start_date": "AAAA-MM-DD",
         "end_date": "AAAA-MM-DD"
      }},
      "group_by": "opcional",
      "format": "json|pdf|excel"
    }}

    --- 🧭 REGLAS GENERALES ---
    - Si el usuario no especifica formato, usa "json" por defecto.
    - Si el usuario pide "este mes", "mes actual" o "hoy", usa la fecha actual ({fecha_actual}).
    - Si el usuario pide "mes pasado", calcula el mes anterior completo.
    - Si menciona un mes sin año (ej: "octubre"), asume que es del año actual (2025).
    - Si pide “últimos X días”, calcula el rango dinámicamente.
    - El resultado debe ser SIEMPRE un JSON válido sin texto adicional.
    - "hoy" o "día actual" → fecha: {fecha_actual}
    - "ayer" → fecha: (un día antes de {fecha_actual})
    - "esta semana" → lunes a domingo de la semana actual.
    - "últimos X días" → calcula dinámicamente.
    - "este mes" → del 1 al último día del mes actual.
    - "mes pasado" → mes anterior completo.
    - "este trimestre" → enero-marzo, abril-junio, etc.
    - "año actual" → del 1 enero al 31 diciembre de 2025.
    - Si no se especifica fecha, usa mes actual.

    --- 📊 MÉTRICAS DISPONIBLES ---
    🔸 **Ventas**
    - ventas_totales, cantidad_pedidos, ticket_promedio
    - ventas_por_categoria, ventas_por_producto, ventas_por_vendedor, ventas_por_sucursal
    - productos_mas_vendidos, productos_menos_vendidos, productos_sin_stock

    🔸 **Finanzas**
    - ingresos_brutos, ingresos_netos, costos_totales, margen_beneficio, devoluciones

    🔸 **Inventario**
    - stock_actual, inventario_por_categoria, inventario_bajo, rotacion_inventario

    🔸 **Clientes**
    - clientes_nuevos, clientes_frecuentes, clientes_inactivos, retencion_clientes
    - valor_vida_cliente (LTV), segmento_clientes

    🔸 **Marketing**
    - efectividad_descuentos, ventas_por_campaña, conversiones_por_red_social
    - cupones_mas_usados, campañas_activas

    🔸 **Logística**
    - pedidos_pendientes, pedidos_enviados, pedidos_entregados, tiempo_promedio_entrega

    --- ⚙️ FORMATO DE SALIDA ---
    - Si el usuario no indica formato → usa "json".
    - No devuelvas explicaciones ni texto adicional, solo el JSON.

    --- 📚 EJEMPLOS ---
    Usuario: "ventas totales del mes pasado en excel"
    {{
      "metric": "ventas_totales",
      "date_range": {{"start_date": "2025-10-01", "end_date": "2025-10-31"}},
      "format": "excel"
    }}

    Usuario: "clientes frecuentes de este mes por sucursal"
    {{
      "metric": "clientes_frecuentes",
      "group_by": "sucursal",
      "date_range": {{"start_date": "2025-11-01", "end_date": "2025-11-30"}},
      "format": "json"
    }}

    Usuario: "productos con stock bajo"
    {{
      "metric": "inventario_bajo",
      "date_range": {{"start_date": "2025-11-01", "end_date": "2025-11-30"}},
      "format": "json"
    }}
    """


def limpiar_json(texto: str) -> str:
    """Extrae el bloque JSON del texto (incluso si hay texto adicional o código markdown)."""
    match = re.search(r"\{[\s\S]*\}", texto)
    return match.group(0) if match else "{}"


def analizar_prompt_usuario(user_prompt: str) -> dict:
    """
    Envía el prompt del usuario a Cohere y devuelve un JSON estructurado.
    Incluye manejo de errores, validación y logs.
    """
    hoy = date.today().isoformat()
    preambulo = construir_preambulo_sistema(hoy)
    print(f"\n🧠 Prompt del usuario: {user_prompt}\n")

    try:
        response = co.chat(
            message=user_prompt,
            preamble=preambulo,
            temperature=0.2,
            model="command-a-03-2025"
        )

        raw_text = response.text.strip()
        print(f"🪶 Respuesta cruda del modelo:\n{raw_text}\n")

        json_text = limpiar_json(raw_text)

        try:
            parsed = json.loads(json_text)
        except json.JSONDecodeError:
            raise ValueError("El modelo no devolvió un JSON válido.")
        
        # Validación básica
        if "metric" not in parsed or "date_range" not in parsed:
            raise ValueError("El JSON devuelto no tiene las claves requeridas ('metric' o 'date_range').")

        # Procesamos el rango de fechas relativo
        if isinstance(parsed.get("date_range"), dict):
            start = parsed["date_range"].get("start_date", "")
            end = parsed["date_range"].get("end_date", "")
            if any(x in (start + end).lower() for x in ["hoy", "mes", "semana", "trimestre", "últimos", "año", "ayer"]):
                parsed["date_range"] = obtener_rango_fechas(start or end)

        print(f"✅ JSON final con fechas reales: {parsed}")
        return parsed

    except Exception as e:
        print(f"❌ Error al analizar el prompt: {e}")
        return {"error": "No pude entender la petición. Asegúrate de formular una solicitud clara de reporte."}