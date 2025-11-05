# en backend/apps/usuarios/managers.py
from django.contrib.auth.models import BaseUserManager
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    """
    Manager personalizado para el modelo User
    donde el email es el identificador único.
    """
    def create_user(self, email, password, **extra_fields):
        """
        Crea y guarda un Usuario con el email y password dados.
        """
        if not email:
            raise ValueError(_('El Email debe ser proporcionado'))
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        """
        Crea y guarda un Superusuario con el email y password dados.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('El Superusuario debe tener is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('El Superusuario debe tener is_superuser=True.'))
        
        return self.create_user(email, password, **extra_fields)