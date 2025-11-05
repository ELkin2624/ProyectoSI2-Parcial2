# en backend/apps/usuarios/views.py
from rest_framework import generics, viewsets, permissions, status
from rest_framework.response import Response
from .models import CustomUser, Profile, Address
from .serializers import (
    UserRegistrationSerializer,
    CustomUserSerializer,
    ProfileSerializer,
    AddressSerializer,
    AdminUserSerializer
)

# --- Vistas de Autenticación y Registro (Públicas) ---
class UserRegistrationView(generics.CreateAPIView):
    """
    Vista pública para registrar un nuevo usuario.
    URL: /api/usuarios/registro/
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny] # Cualquiera puede registrarse


# --- Vistas para el Usuario Autenticado ("Mi Cuenta") ---
class ManageUserView(generics.RetrieveUpdateAPIView):
    """
    Vista para que un usuario VEA y ACTUALICE su propia información.
    (first_name, last_name, phone_number).
    URL: /api/usuarios/me/
    """
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Sobrescribe el método para devolver siempre al usuario logueado."""
        return self.request.user

class ManageProfileView(generics.RetrieveUpdateAPIView):
    """
    Vista para que un usuario VEA y ACTUALICE su propio perfil
    (bio, sexo, avatar).
    URL: /api/usuarios/me/profile/
    """
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Devuelve el perfil del usuario logueado."""
        # El signal se asegura de que el perfil siempre exista
        return self.request.user.profile

class AddressViewSet(viewsets.ModelViewSet):
    """
    ViewSet para que un usuario gestione (CRUD) SUS PROPIAS direcciones.
    URL: /api/usuarios/me/addresses/
    """
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Este ViewSet solo debe devolver las direcciones DEL USUARIO logueado."""
        return Address.objects.filter(user=self.request.user).order_by('-is_default')

    def perform_create(self, serializer):
        """Asigna automáticamente al usuario logueado al crear una dirección."""
        serializer.save(user=self.request.user)

# --- Vistas de ADMINISTRACIÓN (Solo para Admin/Staff) ---
class AdminUserViewSet(viewsets.ModelViewSet):
    """
    (ADMIN) ViewSet para gestionar TODOS los usuarios.
    Permite CRUD completo sobre el modelo CustomUser.
    """
    queryset = CustomUser.objects.all().order_by('-date_joined')
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser] # Solo Admins

class AdminProfileViewSet(viewsets.ModelViewSet):
    """
    (ADMIN) ViewSet para gestionar TODOS los perfiles.
    URL: /api/admin/perfiles/
    """
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAdminUser] # Solo Admins

class AdminAddressViewSet(viewsets.ModelViewSet):
    """
    (ADMIN) ViewSet para gestionar TODAS las direcciones.
    URL: /api/admin/direcciones/
    """
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAdminUser] # Solo Admins