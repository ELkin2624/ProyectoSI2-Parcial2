proyecto_ecommerce_ia/
├── 1_microservicio_reportes/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # Aquí vive tu app FastAPI (endpoints)
│   │   ├── llm_service.py   # Lógica para hablar con la API de Gemini
│   │   ├── reporting.py     # Lógica para consultar la BD y crear el Excel/PDF
│   │   ├── schemas.py       # Modelos Pydantic (para validar datos de entrada/salida)
│   │   └── core/            # (Opcional) Configuración, conexión a BD, etc.
│   │       ├── __init__.py
│   │       └── config.py      # Para cargar la API KEY de Gemini desde .env
│   │
│   ├── .env                 # ¡Importante! Aquí guardas tu API_KEY (NO subir a Git)
│   ├── .gitignore
│   └── requirements.txt     # (fastapi, uvicorn, pandas, google-generativeai, python-dotenv)
│
└── 2_microservicio_prediccion/
    │
    ├── app/
    │   ├── __init__.py
    │   ├── main.py          # App FastAPI (solo el endpoint de predicción)
    │   ├── model.py         # Lógica para cargar el modelo .pkl y predecir
    │   ├── schemas.py       # Modelos Pydantic (para la fecha de entrada)
    │   └── core/
    │       ├── __init__.py
    │       └── config.py      # (Opcional) Configuración, conexión a BD
    │
    ├── modelo/
    │   └── modelo_random_forest.pkl # Tu modelo entrenado se guarda aquí
    │
    ├── notebooks/
    │   └── Entrenamiento_RandomForest.ipynb  # El notebook donde entrenas el modelo
    │
    ├── .env
    ├── .gitignore
    └── requirements.txt     # (fastapi, uvicorn, scikit-learn, joblib, pandas)