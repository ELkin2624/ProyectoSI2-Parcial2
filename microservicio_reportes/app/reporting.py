# app/reporting.py
import pandas as pd
import io
from sqlalchemy import create_engine, text
from .core.config import DATABASE_URL
from fastapi import HTTPException

from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors
import openpyxl

try:
    engine = create_engine(DATABASE_URL)
    print("Conexión a la base de datos PostgreSQL establecida exitosamente.")
except Exception as e:
    print(f"Error al conectar a la base de datos: {e}")
    engine = None

# ==============================================================================
# --- LÓGICA DE CONSULTAS SQL (BASADA EN TUS MODELOS) ---
# ==============================================================================
# Cada función _get_... sabe cómo construir y ejecutar una consulta SQL.
def _get_ventas_totales(params: dict, date_range: dict) -> pd.DataFrame:
    # CORRECCIÓN: Usamos :start_date y :end_date
    sql_query = text("""
        SELECT 
            DATE(creado_en) as fecha, 
            COUNT(id) as cantidad_pedidos,
            SUM(total_pedido) as ventas_totales
        FROM pedidos_pedido
        WHERE 
            creado_en BETWEEN :start_date AND :end_date
            AND estado IN ('PAGADO', 'ENVIADO', 'ENTREGADO')
        GROUP BY DATE(creado_en)
        ORDER BY fecha;
    """)
    return pd.read_sql(sql_query, engine, params=date_range)

def _get_ticket_promedio(params: dict, date_range: dict) -> pd.DataFrame:
    # CORRECCIÓN: Usamos :start_date y :end_date
    sql_query = text("""
        SELECT 
            DATE(creado_en) as fecha, 
            COUNT(id) as cantidad_pedidos,
            SUM(total_pedido) as ventas_totales,
            AVG(total_pedido) as ticket_promedio
        FROM pedidos_pedido
        WHERE 
            creado_en BETWEEN :start_date AND :end_date
            AND estado IN ('PAGADO', 'ENVIADO', 'ENTREGADO')
        GROUP BY DATE(creado_en)
        ORDER BY fecha;
    """)
    return pd.read_sql(sql_query, engine, params=date_range)

def _get_productos_mas_vendidos(params: dict, date_range: dict) -> pd.DataFrame:
    limit = int(params.get("limit", 10))
    # CORRECCIÓN: Usamos :start_date y :end_date
    sql_query = text("""
        SELECT 
            p.nombre as producto, 
            pv.sku,
            SUM(pi.cantidad) as total_unidades_vendidas,
            SUM(pi.cantidad * pi.precio_unitario) as total_monto_vendido
        FROM pedidos_itempedido AS pi
        JOIN pedidos_pedido AS pe ON pi.pedido_id = pe.id
        JOIN productos_productovariante AS pv ON pi.variante_id = pv.id
        JOIN productos_producto AS p ON pv.producto_id = p.id
        WHERE 
            pe.creado_en BETWEEN :start_date AND :end_date
            AND pe.estado IN ('PAGADO', 'ENVIADO', 'ENTREGADO')
        GROUP BY p.nombre, pv.sku
        ORDER BY total_unidades_vendidas DESC
        LIMIT :limit;
    """)
    return pd.read_sql(sql_query, engine, params={**date_range, "limit": limit})

def _get_ventas_por_categoria(params: dict, date_range: dict) -> pd.DataFrame:
    # CORRECCIÓN: Usamos :start_date y :end_date
    sql_query = text("""
        SELECT 
            c.nombre as categoria,
            COUNT(DISTINCT pe.id) as cantidad_pedidos,
            SUM(pi.cantidad * pi.precio_unitario) as total_monto_vendido
        FROM pedidos_itempedido AS pi
        JOIN pedidos_pedido AS pe ON pi.pedido_id = pe.id
        JOIN productos_productovariante AS pv ON pi.variante_id = pv.id
        JOIN productos_producto AS p ON pv.producto_id = p.id
        JOIN productos_categoria AS c ON p.categoria_id = c.id
        WHERE 
            pe.creado_en BETWEEN :start_date AND :end_date
            AND pe.estado IN ('PAGADO', 'ENVIADO', 'ENTREGADO')
        GROUP BY c.nombre
        ORDER BY total_monto_vendido DESC;
    """)
    return pd.read_sql(sql_query, engine, params=date_range)

def _get_pedidos_por_estado(params: dict, date_range: dict) -> pd.DataFrame:
    metric_map = {
        'pedidos_pendientes': ['PENDIENTE', 'EN_VERIFICACION'],
        'pedidos_enviados': ['ENVIADO'],
        'pedidos_entregados': ['ENTREGADO'],
        'devoluciones': ['CANCELADO']
    }
    metric = params.get('metric')
    estados = metric_map.get(metric, ['PENDIENTE'])
    
    # CORRECCIÓN: Usamos :start_date y :end_date
    sql_query = text("""
        SELECT id, creado_en, email_cliente, total_pedido, estado
        FROM pedidos_pedido
        WHERE 
            creado_en BETWEEN :start_date AND :end_date
            AND estado IN :estados
        ORDER BY creado_en;
    """)
    return pd.read_sql(sql_query, engine, params={**date_range, "estados": tuple(estados)})

def _get_stock_actual(params: dict, date_range: dict) -> pd.DataFrame:
    where_clause = ""
    if params.get('metric') == 'inventario_bajo':
        where_clause = "WHERE s.cantidad <= 10"
        
    sql_query = text(f"""
        SELECT 
            p.nombre as producto,
            pv.sku,
            a.nombre as almacen,
            s.cantidad
        FROM inventario_stock AS s
        JOIN productos_productovariante AS pv ON s.variante_id = pv.id
        JOIN productos_producto AS p ON pv.producto_id = p.id
        JOIN inventario_almacen AS a ON s.almacen_id = a.id
        {where_clause}
        ORDER BY s.cantidad ASC, p.nombre;
    """)
    return pd.read_sql(sql_query, engine)

def _get_clientes_nuevos(params: dict, date_range: dict) -> pd.DataFrame:
    # CORRECCIÓN: Usamos :start_date y :end_date
    sql_query = text("""
        WITH PrimeraCompra AS (
            SELECT 
                email_cliente, 
                MIN(creado_en) as fecha_primera_compra,
                COUNT(id) as total_pedidos
            FROM pedidos_pedido
            WHERE estado IN ('PAGADO', 'ENVIADO', 'ENTREGADO')
            GROUP BY email_cliente
        )
        SELECT 
            pc.email_cliente, 
            pc.fecha_primera_compra,
            pc.total_pedidos
        FROM PrimeraCompra pc
        WHERE pc.fecha_primera_compra BETWEEN :start_date AND :end_date
        ORDER BY pc.fecha_primera_compra DESC;
    """)
    return pd.read_sql(sql_query, engine, params=date_range)

def _get_clientes_frecuentes(params: dict, date_range: dict) -> pd.DataFrame:
    # CORRECCIÓN: Usamos :start_date y :end_date
    sql_query = text("""
        SELECT 
            email_cliente, 
            COUNT(id) as total_pedidos,
            SUM(total_pedido) as gasto_total
        FROM pedidos_pedido
        WHERE 
            creado_en BETWEEN :start_date AND :end_date
            AND estado IN ('PAGADO', 'ENVIADO', 'ENTREGADO')
        GROUP BY email_cliente
        HAVING COUNT(id) > 1
        ORDER BY total_pedidos DESC;
    """)
    return pd.read_sql(sql_query, engine, params=date_range)

def _not_implemented(params: dict, date_range: dict) -> pd.DataFrame:
    metric = params.get('metric')
    if metric in ['costos_totales', 'margen_beneficio', 'rotacion_inventario']:
        raise NotImplementedError(f"Métrica '{metric}' no implementable. Faltan datos de 'costo'.")
    if metric in ['ventas_por_vendedor', 'ventas_por_sucursal']:
        raise NotImplementedError(f"Métrica '{metric}' no implementable. Faltan modelos 'Vendedor' o 'Sucursal'.")
    if metric in ['efectividad_descuentos', 'cupones_mas_usados', 'ventas_por_campaña', 'campañas_activas']:
        raise NotImplementedError(f"Métrica '{metric}' no implementable. Faltan modelos de 'Marketing'.")
        
    raise NotImplementedError(f"Métrica '{metric}' reconocida, pero aún no implementada en reporting.py.")


# ==============================================================================
# --- DESPACHADOR PRINCIPAL ---
# ==============================================================================
METRIC_HANDLERS = {
    'ventas_totales': _get_ventas_totales,
    'cantidad_pedidos': _get_ventas_totales,
    'ticket_promedio': _get_ticket_promedio,
    'productos_mas_vendidos': _get_productos_mas_vendidos,
    'ventas_por_categoria': _get_ventas_por_categoria,
    'stock_actual': _get_stock_actual,
    'inventario_bajo': _get_stock_actual,
    'pedidos_pendientes': _get_pedidos_por_estado,
    'pedidos_enviados': _get_pedidos_por_estado,
    'pedidos_entregados': _get_pedidos_por_estado,
    'devoluciones': _get_pedidos_por_estado,
    'clientes_nuevos': _get_clientes_nuevos,
    'clientes_frecuentes': _get_clientes_frecuentes,
    
    # No implementados
    'ingresos_brutos': _not_implemented,
    'ingresos_netos': _not_implemented,
    'costos_totales': _not_implemented,
    'margen_beneficio': _not_implemented,
    'rotacion_inventario': _not_implemented,
    'ventas_por_vendedor': _not_implemented,
    'ventas_por_sucursal': _not_implemented,
    'efectividad_descuentos': _not_implemented,
    'ventas_por_campaña': _not_implemented,
    'cupones_mas_usados': _not_implemented,
}

def get_report_dataframe(parametros: dict) -> pd.DataFrame:
    if engine is None:
        raise Exception("Error crítico: El motor de la base de datos no está inicializado.")

    metric = parametros.get('metric')
    date_range = parametros.get('date_range')
    
    if not metric:
        raise HTTPException(status_code=400, detail="La IA no pudo determinar una métrica.")
        
    if not date_range and metric not in ['stock_actual', 'inventario_bajo']:
        raise HTTPException(status_code=400, detail="La IA no pudo determinar un rango de fechas.")
    
    handler_function = METRIC_HANDLERS.get(metric, _not_implemented)
    
    print(f"Generando reporte para métrica: {metric} usando {handler_function.__name__}")

    df = handler_function(parametros, date_range)
    
    if df is None or (isinstance(df, pd.DataFrame) and df.empty):
        print(f"Advertencia: La consulta para '{metric}' no devolvió datos.")
        return pd.DataFrame({"mensaje": ["La consulta no devolvió resultados para este rango de fechas."]})

    return df

# --- FUNCIONES DE CONVERSIÓN DE FORMATO ---
def convert_df_to_excel_bytes(df: pd.DataFrame, metric_name: str) -> bytes:
    """
    Toma un DataFrame y lo convierte en los bytes de un archivo Excel.
    """
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]) and df[col].dt.tz is not None:
            df[col] = df[col].dt.tz_localize(None)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name=metric_name[:30]) # Nombre de hoja con límite
    return output.getvalue()

def convert_df_to_pdf_bytes(df: pd.DataFrame, metric_name: str) -> bytes:
    """
    Toma un DataFrame y lo convierte en los bytes de un archivo PDF.
    """
    output = io.BytesIO()
    
    # Configuración del documento
    doc = SimpleDocTemplate(output, pagesize=landscape(letter))
    elements = []
    
    # Convertir DataFrame a una lista de listas + headers
    data = [df.columns.to_list()] + df.values.tolist()
    
    # Crear la tabla
    table = Table(data)
    
    # Estilo de la tabla
    style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ])
    
    table.setStyle(style)
    elements.append(table)
    doc.build(elements)
    
    return output.getvalue()
