# apps/ia_services/views.py
import requests
import json
from django.http import JsonResponse, HttpResponse, StreamingHttpResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

# Define tus URLs aquí o impórtalas de settings.py
URL_SERVICIO_REPORTES = "http://127.0.0.1:8001/generar-reporte-ia"
URL_SERVICIO_PREDICCION = "http://127.0.0.1:8002/predecir"

@csrf_exempt
@require_POST
def llamar_servicio_prediccion(request):
    """
    Vista "puente" que llama al microservicio de predicción.
    Recibe: {"dias_a_predecir": 7}
    Devuelve: {"predicciones": [...]}
    """
    try:
        # 1. Obtenemos los datos que envió el frontend
        data = json.loads(request.body)
        dias = data.get('dias_a_predecir')

        if not dias:
            return JsonResponse({'error': 'Faltan dias_a_predecir'}, status=400)

        # 2. Preparamos la petición para FastAPI
        payload = {'dias_a_predecir': dias}

        # 3. ¡LA LLAMADA! Usamos requests.post()
        # Le pasamos el JSON (payload) y un timeout
        response = requests.post(URL_SERVICIO_PREDICCION, json=payload, timeout=10)

        # 4. Verificamos si el microservicio dio un error
        response.raise_for_status() # Lanza un error si la respuesta es 4xx o 5xx

        # 5. Devolvemos la respuesta (que es un JSON) al frontend
        return JsonResponse(response.json())

    except requests.exceptions.ConnectionError:
        # El microservicio está apagado
        return JsonResponse({'error': 'El servicio de predicción no está disponible.'}, status=503)
    except requests.exceptions.HTTPError as e:
        # El microservicio dio un error (ej. 400, 500)
        return JsonResponse({'error': f'Error del microservicio: {e.response.text}'}, status=e.response.status_code)
    except Exception as e:
        # Otro error (ej. JSON inválido, timeout)
        return JsonResponse({'error': f'Ocurrió un error inesperado: {str(e)}'}, status=500)


@csrf_exempt
@require_POST
def llamar_servicio_reporte(request):
    """
    Vista "puente" que llama al microservicio de reportes
    y devuelve el archivo Excel O el JSON de datos.
    """
    try:
        # 1. Obtenemos el prompt del frontend
        data = json.loads(request.body)
        prompt = data.get('prompt')
        
        if not prompt:
            return JsonResponse({'error': 'Falta el prompt'}, status=400)

        # 2. Preparamos la petición para FastAPI
        payload = {'prompt': prompt}

        # 3. ¡LA LLAMADA! Usamos stream=True
        # Esto es importante para manejar archivos grandes sin
        # cargar toda la memoria de Django.
        response = requests.post(URL_SERVICIO_REPORTES, json=payload, stream=True, timeout=60)
        
        # 4. Verificamos si FastAPI dio un error (4xx o 5xx)
        response.raise_for_status()

        # --- ¡INICIO DEL ARREGLO! ---
        # 5. Revisamos QUÉ TIPO de respuesta recibimos
        
        # Si el header 'Content-Disposition' EXISTE, es un archivo Excel.
        if 'Content-Disposition' in response.headers:
            # Es un archivo, así que lo "streameamos" (transmitimos)
            return StreamingHttpResponse(
                response.iter_content(chunk_size=8192), # Lee en pedazos de 8KB
                content_type=response.headers['Content-Type'],
                headers={
                    'Content-Disposition': response.headers['Content-Disposition']
                }
            )
        else:
            # NO es un archivo, por lo tanto DEBE ser JSON.
            # Lo leemos y lo devolvemos como un JsonResponse normal.
            # .json() funciona bien con stream=True, leerá el stream y lo cerrará.
            return JsonResponse(response.json())
        # --- FIN DEL ARREGLO ---
        
    except requests.exceptions.HTTPError as e:
        # Error si FastAPI devuelve 4xx o 5xx (ej. prompt no entendido)
        try:
            # Intentamos leer el error JSON que envió FastAPI
            error_json = e.response.json()
        except:
            error_json = e.response.text
        return JsonResponse({'error': f'Error del microservicio: {error_json}'}, status=e.response.status_code)
    
    except requests.exceptions.ConnectionError:
        return JsonResponse({'error': 'El servicio de reportes no está disponible.'}, status=503)
    
    except Exception as e:
        # Cualquier otro error (ej. JSON malformado en el request inicial)
        return JsonResponse({'error': f'Ocurrió un error inesperado en Django: {str(e)}'}, status=500)