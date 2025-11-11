# 🚀 Guía Rápida de Inicio - Sistema de Reportes con IA

## ⚡ Inicio Rápido (2 minutos)

### 1️⃣ Iniciar Backend Django

```powershell
cd backend
python manage.py runserver 8000
```

✅ Debe mostrar: `Starting development server at http://127.0.0.1:8000/`

---

### 2️⃣ Iniciar Microservicio de Reportes

```powershell
cd microservicio_reportes
pip install -r requirements.txt
uvicorn app.main:app --port 8001 --reload
```

✅ Debe mostrar: `Uvicorn running on http://127.0.0.1:8001`

> 💡 **Nota:** Si `uvicorn` no es reconocido, ejecuta primero `pip install uvicorn` o usa `python -m uvicorn app.main:app --port 8001 --reload`

---

### 3️⃣ Iniciar Frontend

```powershell
cd frontend
npm run dev
```

✅ Debe mostrar: `Local: http://localhost:5173/`

---

## 🧪 Prueba Rápida del Sistema de Reportes

### Opción A: Interfaz Web (Recomendado)

1. Abrir navegador: `http://localhost:5173`
2. Login con tu usuario admin
3. Ir a: **Admin → Reportes y Análisis**
4. Verás 2 formas de generar reportes:

#### 📋 Generador Rápido (Formulario)
1. Selecciona una métrica (ej: "Ventas Totales")
2. Selecciona formato (JSON o Excel)
3. Selecciona fechas
4. Click en "Generar Reporte"
5. ✅ Si es Excel: descarga automática
6. ✅ Si es JSON: datos en pantalla

#### 🎤 Consulta con IA (Texto o Voz)
1. Escribe: `"Ventas del mes pasado en Excel"`
2. O usa el botón 🎤 para dictar
3. Click en botón ✨ (Sparkles)
4. ✅ Descarga automática de Excel o muestra JSON

### Opción B: API Directa (Avanzado)

```powershell
# Probar endpoint de reportes
curl -X POST http://localhost:8000/api/ia/reporte/ `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer TU_TOKEN_AQUI" `
  -d '{"prompt": "ventas totales del mes pasado"}'
```

---

## 🔍 Verificación de Servicios

### Comprobar que los servicios necesarios estén activos:

```powershell
# Django Backend
curl http://localhost:8000/api/

# Microservicio Reportes
curl http://localhost:8001/

# Frontend
curl http://localhost:5173/
```

> 📝 **Nota:** Solo necesitas 3 servicios para el sistema de reportes:
> - Backend Django (8000)
> - Microservicio Reportes (8001)
> - Frontend React (5173)

---

## 🐛 Solución de Problemas Comunes

### Error: "Puerto ya en uso"

```powershell
# Ver qué proceso usa el puerto 8000
netstat -ano | findstr "8000"

# Matar proceso (reemplaza PID con el número mostrado)
taskkill /PID [número] /F
```

### Error: "Microservicio no disponible" o "El servicio de reportes no está disponible"

**Causa:** El microservicio de reportes no está corriendo  
**Solución:** Verificar que estén los servicios activos:
1. Django Backend en puerto 8000
2. Microservicio Reportes en puerto 8001

```powershell
# Ver si el puerto 8001 está en uso
netstat -ano | findstr "8001"

# Si no aparece nada, iniciar el microservicio:
cd microservicio_reportes
python -m uvicorn app.main:app --port 8001 --reload
```

### Error: "Module not found" o "uvicorn no reconocido"

```powershell
# Backend Django
cd backend
pip install -r requirements.txt

# Microservicio Reportes
cd microservicio_reportes
pip install -r requirements.txt

# Si uvicorn no es reconocido
pip install uvicorn

# Frontend
cd frontend
npm install
```

**💡 Tip:** Si `uvicorn` sigue sin funcionar, úsalo con Python:
```powershell
python -m uvicorn app.main:app --port 8001 --reload
```

### Error: "CORS blocked"

**Causa:** Frontend llama directamente al microservicio  
**Solución:** Verificar que uses las URLs correctas:
- ✅ `http://localhost:8000/api/ia/reporte/`
- ❌ ~~`http://localhost:8001/generar-reporte-ia`~~

---

## 📋 Checklist de Funcionamiento - Sistema de Reportes

Marca cada elemento cuando esté funcionando:

**Servicios Base:**
- [ ] Django Backend responde en puerto 8000
- [ ] Microservicio Reportes responde en puerto 8001
- [ ] Frontend carga en puerto 5173

**Funcionalidades:**
- [ ] Puedo hacer login en el sistema
- [ ] Puedo acceder a la página de Reportes
- [ ] Puedo generar un reporte con el formulario rápido
- [ ] Puedo generar un reporte con IA usando texto
- [ ] Puedo descargar un archivo Excel
- [ ] Puedo ver datos JSON en pantalla
- [ ] (Opcional) Reconocimiento de voz funciona

**Validaciones:**
- [ ] Los reportes se generan correctamente
- [ ] Los errores se muestran con mensajes claros
- [ ] Las descargas de Excel funcionan

---

## 🎯 Ejemplos de Consultas para Probar

### Reportes en Excel
```
"Ventas totales del mes pasado en Excel"
"Productos más vendidos en formato Excel"
"Clientes nuevos del último trimestre en Excel"
```

### Reportes en JSON (pantalla)
```
"Ventas totales del mes pasado"
"Muéstrame los productos más vendidos"
"Clientes frecuentes"
```

### Predicciones
```javascript
// Desde el navegador (consola)
fetch('http://localhost:8000/api/ia/prediccion/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    },
    body: JSON.stringify({ dias_a_predecir: 7 })
})
.then(r => r.json())
.then(data => console.log(data));
```

---

## 📱 URLs Importantes

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:5173 | Interfaz de usuario |
| Backend API | http://localhost:8000/api/ | Django REST API |
| Admin Django | http://localhost:8000/admin/ | Panel de administración Django |
| Swagger Docs | http://localhost:8000/swagger/ | Documentación de API |
| ReDoc | http://localhost:8000/redoc/ | Documentación alternativa |
| Reportes IA | http://localhost:8001/docs | FastAPI docs (reportes) |
| Predicción ML | http://localhost:8002/docs | FastAPI docs (predicción) |

---

## 🆘 Ayuda Adicional

### Documentación Completa
- 📄 `CONEXION_REPORTES_ADMIN.md` - Arquitectura detallada
- 📄 `RESUMEN_INTEGRACION_REPORTES.md` - Resumen técnico
- 📄 `CHANGELOG_PULL_NOV_11_2025.md` - Cambios del repositorio

### Logs Útiles

```powershell
# Ver logs de Django
cd backend
python manage.py runserver 8000 --verbosity 2

# Ver logs detallados de FastAPI
cd microservicio_reportes
uvicorn app.main:app --port 8001 --log-level debug

# Ver logs del frontend
cd frontend
npm run dev -- --debug
```

---

## ✅ Todo Listo

Si todos los servicios están corriendo y el checklist está completo:

🎉 **¡El sistema está listo para usar!**

Accede a `http://localhost:5173` y comienza a generar reportes con IA.

---

**Última actualización:** 11 de Noviembre 2025  
**Versión:** 1.0
