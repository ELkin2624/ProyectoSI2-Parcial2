import joblib
import pandas as pd
from datetime import timedelta
import os

# --- Carga de Activos (se ejecuta UNA VEZ al iniciar el servidor) ---
print("Cargando activos de predicción...")
modelo = None
df_historico = None

try:
    # 1. Cargar el modelo
    # (Uvicorn corre desde la raíz, así que la ruta es correcta)
    MODEL_PATH = 'modelo/modelo_random_forest.pkl'
    modelo = joblib.load(MODEL_PATH)
    print(f"Modelo cargado exitosamente desde {MODEL_PATH}")
    
    # 2. Cargar los DATOS HISTÓRICOS
    # ¡Los necesitamos para calcular los 'lags' y 'rolling' del primer día!
    DATA_PATH = 'notebooks/dataset_ventas.xlsx'
    
    # (Este código es el mismo de la Celda 2 del notebook)
    df_trans = pd.read_excel(DATA_PATH)
    df_trans['InvoiceDate'] = pd.to_datetime(df_trans['InvoiceDate'])
    df_trans['TotalVenta'] = df_trans['Quantity'] * df_trans['Price']
    df_historico = df_trans.set_index('InvoiceDate')['TotalVenta'].resample('D').sum().fillna(0)
    df_historico = df_historico.to_frame(name='total_ventas')
    
    print(f"Datos históricos cargados ({len(df_historico)} días) desde {DATA_PATH}")

except FileNotFoundError as e:
    print(f"ERROR CRÍTICO AL CARGAR ACTIVOS: No se encontró el archivo {e.filename}")
    print("Asegúrate de que 'modelo/modelo_random_forest.pkl' y 'notebooks/dataset_ventas.xlsx' existan.")
except Exception as e:
    print(f"ERROR CRÍTICO AL CARGAR ACTIVOS: {e}")


# --- Función de Features (IDÉNTICA al notebook) ---
def crear_features(df):
    """Crea características de series de tiempo a partir de un índice de fecha."""
    df_copy = df.copy()
    df_copy['dia_del_mes'] = df_copy.index.day
    df_copy['dia_de_la_semana'] = df_copy.index.dayofweek
    df_copy['mes'] = df_copy.index.month
    df_copy['anio'] = df_copy.index.year
    df_copy['trimestre'] = df_copy.index.quarter
    
    # Se calculan los lags/rolling basados en los datos pasados
    df_copy['ventas_dia_anterior'] = df_copy['total_ventas'].shift(1)
    df_copy['media_ventas_7_dias'] = df_copy['total_ventas'].shift(1).rolling(window=7).mean()
    
    return df_copy


# --- Función de Predicción (El "cerebro" en vivo) ---
def generar_predicciones(dias_a_predecir: int) -> list:
    """
    Genera predicciones futuras día por día (auto-regresivo).
    """
    if modelo is None or df_historico is None:
        raise Exception("Los activos (modelo o datos históricos) no están cargados.")
    
    # Tomamos el historial más reciente (necesitamos al menos 7 días para el 'rolling')
    historial_reciente = df_historico.iloc[-7:].copy()
    
    predicciones_lista = []
    
    for i in range(1, dias_a_predecir + 1):
        # 1. Crear la nueva fecha a predecir
        # (Usamos el índice del último elemento del 'historial_reciente')
        ultima_fecha_conocida = historial_reciente.index.max()
        nueva_fecha = ultima_fecha_conocida + timedelta(days=1)
        
        # 2. Crear una fila temporal para esta fecha
        fila_nueva = pd.DataFrame(index=[nueva_fecha], data={'total_ventas': [0]})
        
        # 3. Juntar el historial reciente + la fila nueva
        datos_loop = pd.concat([historial_reciente, fila_nueva])
        
        # 4. Crear features para este conjunto de datos
        df_con_features = crear_features(datos_loop)
        
        # 5. Tomar solo la última fila (la que queremos predecir)
        features_dia_nuevo = df_con_features.iloc[-1:]
        
        # 6. Llenar NaNs (crucial)
        # Los 'lags' y 'rolling' del primer día de predicción
        # se llenan con los últimos datos reales.
        features_dia_nuevo = features_dia_nuevo.fillna(method='ffill')
        
        # 7. Preparar X (las features)
        FEATURES = [col for col in features_dia_nuevo.columns if col != 'total_ventas']
        X_pred = features_dia_nuevo[FEATURES]
        
        # 8. ¡Predecir!
        prediccion_dia = modelo.predict(X_pred)[0]
        prediccion_dia = max(0, prediccion_dia) # No predecir ventas negativas
        
        # 9. Guardar el resultado
        predicciones_lista.append({
            "fecha": nueva_fecha.strftime('%Y-%m-%d'),
            "prediccion_venta": round(prediccion_dia, 2)
        })
        
        # 10. ¡Actualizar el historial!
        # Añadimos la predicción al 'historial_reciente' para que
        # el próximo loop la use para calcular el 'lag' y 'rolling'.
        fila_predicha = pd.DataFrame(index=[nueva_fecha], data={'total_ventas': [prediccion_dia]})
        historial_reciente = pd.concat([historial_reciente, fila_predicha])
        
        # Mantenemos solo los últimos 7 días para eficiencia
        historial_reciente = historial_reciente.iloc[-7:]

    return predicciones_lista