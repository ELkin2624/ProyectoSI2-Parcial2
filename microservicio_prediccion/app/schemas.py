from pydantic import BaseModel, Field

class PredictionRequest(BaseModel):
    """
    Define la entrada para una petición de predicción.
    """
    # Pedimos un número de días, debe ser mayor a 0 y menor a 91 (para evitar abusos)
    dias_a_predecir: int = Field(
        ..., 
        gt=0, 
        lt=91, 
        description="Número de días a predecir (ej: 7)"
    )