# apps/ecommerce/pagos/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# --- Router para Vistas de Administración ---
# GET /api/pagos/admin/
router_admin = DefaultRouter()
router_admin.register(r'', views.AdminPagoViewSet, basename='admin-pago')

urlpatterns = [
    # --- Vistas del Cliente ---
    
    # POST /api/pagos/crear/
    # (Inicia un pago Stripe o QR)
    path('crear/', views.PagoCreateView.as_view(), name='pago-crear'),
    
    # PATCH /api/pagos/{id}/upload-qr/
    # (Sube el comprobante de un pago QR)
    path('<uuid:pk>/upload-qr/', views.QRComprobanteUploadView.as_view(), name='pago-upload-qr'),

    # --- Vistas de Admin ---
    # /api/pagos/admin/
    path('admin/', include(router_admin.urls)),

    # --- Vistas de Webhook (Pública) ---
    # POST /api/pagos/webhook/stripe/
    # (Stripe nos notifica aquí)
    path('webhook/stripe/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
]