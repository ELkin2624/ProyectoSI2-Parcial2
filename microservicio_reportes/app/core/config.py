import os
from dotenv import load_dotenv

load_dotenv()

COHERE_API_KEY = os.getenv("COHERE_API_KEY")
if not COHERE_API_KEY:
    raise ValueError("¡No se encontró la COHERE_API_KEY! Asegúrate de que tu archivo .env esté correcto.")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("¡No se encontró la DATABASE_URL! Asegúrate de que tu archivo .env esté correcto.")