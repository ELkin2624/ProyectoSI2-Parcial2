import pandas as pd
import io
from sqlalchemy import create_engine, text
from .core.config import DATABASE_URL
from fastapi import HTTPException

# 1. Creamos el "motor" de conexión a la BD.
try:
    engine = create_engine(DATABASE_URL)
    print("Conexión a la base de datos PostgreSQL establecida exitosamente.")
except Exception as e:
    print(f"Error al conectar a la base de datos: {e}")
    engine = None


# --- Funciones de Métricas Específicas ---
# Cada función privada se encarga de una métrica
def _get_ventas_totales(params: dict, date_range: dict) -> pd.DataFrame:
    """
    Busca en la tabla `pedidos_pedido`.
    Suma el `total_pedido` de los pedidos que NO están cancelados o pendientes.
    """
    sql_query = text("""
        SELECT 
            id, 
            creado_en, 
            email_cliente, 
            total_pedido, 
            estado
        FROM 
            pedidos_pedido
        WHERE 
            creado_en BETWEEN :start AND :end
            AND estado IN ('PAGADO', 'ENVIADO', 'ENTREGADO')
        ORDER BY 
            creado_en;
    """)
    
    df = pd.read_sql(
        sql_query, 
        engine, 
        params={"start": date_range['start_date'], "end": date_range['end_date']}
    )
    return df

def _get_cantidad_pedidos(params: dict, date_range: dict) -> pd.DataFrame:
    """
    Cuenta los pedidos en la tabla `pedidos_pedido`.
    """
    # Puedes agrupar por día
    sql_query = text("""
        SELECT 
            DATE(creado_en) as fecha, 
            COUNT(id) as numero_de_pedidos,
            SUM(total_pedido) as total_ventas
        FROM 
            pedidos_pedido
        WHERE 
            creado_en BETWEEN :start AND :end
            AND estado IN ('PAGADO', 'ENVIADO', 'ENTREGADO')
        GROUP BY 
            DATE(creado_en)
        ORDER BY 
            fecha;
    """)
    
    df = pd.read_sql(
        sql_query, 
        engine, 
        params={"start": date_range['start_date'], "end": date_range['end_date']}
    )
    return df

def _get_productos_mas_vendidos(params: dict, date_range: dict) -> pd.DataFrame:
    """
    Esta es una consulta más compleja.
    1. Une Pedidos (para la fecha) con Items (para la cantidad) y Variantes (para el nombre).
    2. Agrupa por variante y suma las cantidades.
    """
    sql_query = text("""
        SELECT 
            pv.sku,
            p.nombre as producto_nombre, 
            SUM(pi.cantidad) as total_unidades_vendidas,
            SUM(pi.cantidad * pi.precio_unitario) as total_monto_vendido
        FROM 
            pedidos_itempedido AS pi
        JOIN 
            pedidos_pedido AS pe ON pi.pedido_id = pe.id
        JOIN 
            productos_productovariante AS pv ON pi.variante_id = pv.id
        JOIN
            productos_producto AS p ON pv.producto_id = p.id
        WHERE 
            pe.creado_en BETWEEN :start AND :end
            AND pe.estado IN ('PAGADO', 'ENVIADO', 'ENTREGADO')
        GROUP BY 
            pv.sku, p.nombre
        ORDER BY 
            total_unidades_vendidas DESC
        LIMIT 20;
    """)
    
    df = pd.read_sql(
        sql_query, 
        engine, 
        params={"start": date_range['start_date'], "end": date_range['end_date']}
    )
    return df

def _get_pedidos_por_estado(estado: str, date_range: dict) -> pd.DataFrame:
    """
    Una función genérica para obtener pedidos por estado.
    Usada para 'pedidos_pendientes', 'pedidos_enviados', etc.
    """
    sql_query = text("""
        SELECT 
            id, 
            creado_en, 
            email_cliente, 
            total_pedido, 
            estado
        FROM 
            pedidos_pedido
        WHERE 
            creado_en BETWEEN :start AND :end
            AND estado = :estado
        ORDER BY 
            creado_en;
    """)
    
    df = pd.read_sql(
        sql_query, 
        engine, 
        params={
            "start": date_range['start_date'], 
            "end": date_range['end_date'],
            "estado": estado.upper() # Asegura que esté en mayúsculas como en tus 'choices'
        }
    )
    return df

def _get_stock_actual(params: dict, date_range: dict) -> pd.DataFrame:
    """
    Consulta el stock actual. No usa el rango de fechas.
    Une Stock, Variantes y Productos.
    """
    group_by = params.get('group_by')
    
    # Esta consulta es un poco diferente
    sql_query_base = """
        SELECT 
            p.nombre as producto,
            pv.sku,
            a.nombre as almacen,
            s.cantidad
        FROM 
            inventario_stock AS s
        JOIN 
            productos_productovariante AS pv ON s.variante_id = pv.id
        JOIN 
            productos_producto AS p ON pv.producto_id = p.id
        JOIN
            inventario_almacen AS a ON s.almacen_id = a.id
    """
    
    # Filtro opcional para "inventario_bajo"
    if params['metric'] == 'inventario_bajo':
        sql_query_base += " WHERE s.cantidad <= 10" # Asume 10 como "bajo"
        
    sql_query_base += " ORDER BY p.nombre, s.cantidad;"
    
    df = pd.read_sql(text(sql_query_base), engine)
    return df


# --- Función Despachadora Principal ---
def crear_reporte_desde_bd(parametros: dict) -> bytes:
    """
    Se conecta a la BD, ejecuta una consulta basada en los parámetros
    y devuelve los bytes de un archivo Excel.
    """
    if engine is None:
        raise Exception("El motor de la base de datos no está inicializado.")

    # 1. Extraemos los parámetros de la IA
    metric = parametros.get('metric')
    date_range = parametros.get('date_range')
    
    if not metric:
        raise HTTPException(status_code=400, detail="La IA no pudo determinar una métrica.")
        
    if not date_range and metric not in ['stock_actual', 'inventario_bajo']:
        raise HTTPException(status_code=400, detail="La IA no pudo determinar un rango de fechas.")

    print(f"Generando reporte para métrica: {metric}")

    df = None # DataFrame de Pandas

    # 2. Despachador: Llama a la función correcta basada en la métrica
    if metric == 'ventas_totales':
        df = _get_ventas_totales(parametros, date_range)
    
    elif metric == 'cantidad_pedidos':
        df = _get_cantidad_pedidos(parametros, date_range)
        
    elif metric == 'productos_mas_vendidos':
        df = _get_productos_mas_vendidos(parametros, date_range)
    
    # ---- Métricas de Estado de Pedido ----
    elif metric == 'pedidos_pendientes':
        # Tus estados son 'PENDIENTE' y 'EN_VERIFICACION'
        df_pendiente = _get_pedidos_por_estado('PENDIENTE', date_range)
        df_verif = _get_pedidos_por_estado('EN_VERIFICACION', date_range)
        df = pd.concat([df_pendiente, df_verif]) # Une los dos resultados
        
    elif metric == 'pedidos_enviados':
        df = _get_pedidos_por_estado('ENVIADO', date_range)
        
    elif metric == 'pedidos_entregados':
        df = _get_pedidos_por_estado('ENTREGADO', date_range)
    
    # ---- Métricas de Inventario ----
    elif metric in ['stock_actual', 'inventario_bajo']:
        df = _get_stock_actual(parametros, date_range)

    # ... Aquí puedes añadir 'elif' para todas las otras métricas
    # que definiste en tu llm_service.py
    else:
        raise NotImplementedError(f"Métrica '{metric}' reconocida por la IA, pero aún no implementada en reporting.py.")

    # 3. Creamos el archivo Excel en la MEMORIA
    output = io.BytesIO()
    
    # Escribimos el DataFrame de Pandas en este "archivo en memoria"
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name=metric)
        
        # (Opcional) Si quieres añadir una hoja de resumen
        if metric == 'ventas_totales':
            total = df['total_pedido'].sum()
            resumen_df = pd.DataFrame({'Total General': [total]})
            resumen_df.to_excel(writer, index=False, sheet_name='Resumen')
    
    excel_data = output.getvalue()
    return excel_data