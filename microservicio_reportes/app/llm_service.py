# microservicio_reportes/app/llm_service.py
import cohere
import json
from .core.config import COHERE_API_KEY
from datetime import date

# Configura la API de Google
#genai.configure(api_key=GEMINI_API_KEY)
co = cohere.Client(COHERE_API_KEY)

def construir_preambulo_sistema(fecha_actual: str) -> str:
    """
    Crea el preámbulo (prompt de sistema) que instruye a la IA sobre cómo interpretar
    las solicitudes de generación de reportes para un E-commerce de boutique.
    """
    
    return f"""
    Tu rol es ser un analista experto en datos de un E-commerce de moda (boutique).
    Tu tarea es interpretar la solicitud del usuario y devolver SIEMPRE un JSON con:
    1.  "metric": la métrica o tipo de reporte solicitado.
    2.  "filters": filtros específicos si el usuario los menciona (opcional).
    3.  "date_range": rango de fechas (siempre con "start_date" y "end_date" en formato AAAA-MM-DD).
    4.  "group_by": nivel de agrupación (opcional, ej: "categoria", "producto", "cliente", "vendedor", "sucursal").
    5.  "format": formato de salida solicitado ("excel", "pdf", "json", etc.).

    --- 🧭 REGLAS GENERALES ---
    - Si el usuario no especifica formato, usa "json" por defecto.
    - Si el usuario pide "este mes", "mes actual" o "hoy", usa la fecha actual ({fecha_actual}).
    - Si el usuario pide "mes pasado", calcula el mes anterior completo.
    - Si menciona un mes sin año (ej: "octubre"), asume que es del año actual (2025).
    - Si pide “últimos X días”, calcula el rango dinámicamente.
    - El resultado debe ser SIEMPRE un JSON válido sin texto adicional.

    --- MÉTRICAS DISPONIBLES ---
    Estas son las métricas que puedes devolver según el contexto de la petición del usuario:

    VENTAS:
    - "ventas_totales" → Monto total de ventas.
    - "cantidad_pedidos" → Número total de pedidos.
    - "ticket_promedio" → Promedio por pedido.
    - "ventas_por_categoria"
    - "ventas_por_producto"
    - "ventas_por_cliente"
    - "ventas_por_vendedor"
    - "ventas_por_sucursal"
    - "productos_mas_vendidos"
    - "productos_menos_vendidos"
    - "productos_sin_stock"

    INGRESOS Y FINANZAS:
    - "ingresos_brutos"
    - "ingresos_netos"
    - "costos_totales"
    - "margen_beneficio"
    - "reembolsos" o "devoluciones"

    INVENTARIO:
    - "stock_actual"
    - "inventario_por_categoria"
    - "inventario_bajo" (productos con stock crítico)
    - "rotacion_inventario"

    CLIENTES:
    - "clientes_nuevos"
    - "clientes_frecuentes"
    - "clientes_inactivos"
    - "segmento_clientes" (por edad, género o ubicación si aplica)

    ENVÍOS Y LOGÍSTICA:
    - "pedidos_enviados"
    - "pedidos_pendientes"
    - "pedidos_entregados"
    - "tiempo_promedio_entrega"

    MARKETING Y PROMOCIONES:
    - "efectividad_descuentos"
    - "ventas_por_campaña"
    - "conversiones_por_red_social"

    --- EJEMPLOS DE RESPUESTA ---
    - Usuario: "quiero las ventas totales del mes pasado en excel"
        {{
          "metric": "ventas_totales",
          "date_range": {{"start_date": "2025-10-01", "end_date": "2025-10-31"}},
          "format": "excel"
        }}

    - Usuario: "muéstrame los productos más vendidos por categoría este mes"
        {{
          "metric": "productos_mas_vendidos",
          "group_by": "categoria",
          "date_range": {{"start_date": "2025-11-01", "end_date": "2025-11-30"}},
          "format": "json"
        }}

    - Usuario: "clientes nuevos y frecuentes del último trimestre en PDF"
        {{
          "metric": "clientes_nuevos_y_frecuentes",
          "date_range": {{"start_date": "2025-08-01", "end_date": "2025-10-31"}},
          "format": "pdf"
        }}

    - Usuario: "reporte de ingresos netos por sucursal del mes actual"
        {{
          "metric": "ingresos_netos",
          "group_by": "sucursal",
          "date_range": {{"start_date": "2025-11-01", "end_date": "2025-11-30"}},
          "format": "json"
        }}

    - Usuario: "pedidos pendientes de la última semana por vendedor"
        {{
          "metric": "pedidos_pendientes",
          "group_by": "vendedor",
          "date_range": {{"start_date": "2025-11-01", "end_date": "2025-11-07"}},
          "format": "json"
        }}
    """


def analizar_prompt_usuario(user_prompt: str) -> dict:
    """
    Toma el prompt del usuario, lo envía a Cohere y devuelve el JSON estructurado.
    """
    
    # Obtenemos la fecha de hoy para darle contexto al modelo
    hoy = date.today().isoformat() # (Ej: '2025-11-08')
    
    # 1. Creamos las instrucciones para la IA
    preambulo = construir_preambulo_sistema(hoy)
    
    # 2. Enviamos el prompt del usuario a Cohere
    print(f"Enviando a Cohere: {user_prompt}")
    
    try:
        response = co.chat(
            message=user_prompt,
            preamble=preambulo,
            temperature=0.2, # Poca "creatividad" para que sea preciso
            model="command-a-03-2025" # Este es su modelo más nuevo
        )
        
        # 3. Extraemos la respuesta
        respuesta_texto = response.text
        
        # 4. Limpiamos y procesamos el JSON
        if respuesta_texto.startswith("```json"):
            respuesta_texto = respuesta_texto[7:]
        if respuesta_texto.endswith("```"):
            respuesta_texto = respuesta_texto[:-3]
        
        # Convertimos el texto (string) en un diccionario de Python (dict)
        resultado_json = json.loads(respuesta_texto)
        return resultado_json

    except Exception as e:
        print(f"Error al procesar la respuesta de Cohere: {e}")
        # A veces la respuesta viene en "response" y no en "text" si hay error
        print(e)
        return {"error": "No pude entender la petición."}