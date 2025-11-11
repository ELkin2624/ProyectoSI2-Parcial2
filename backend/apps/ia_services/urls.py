# apps/ia_services/urls.py  
from django.urls import path
from . import views

urlpatterns = [
    path('prediccion/', views.llamar_servicio_prediccion, name='api-prediccion'),
    path('reporte/', views.llamar_servicio_reporte, name='api-reporte'),
]