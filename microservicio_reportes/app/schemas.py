from pydantic import BaseModel

# Este es el modelo de datos que ESPERAMOS recibir
# en nuestro endpoint. FastAPI lo usará para validar.
class ReportRequest(BaseModel):
    prompt: str