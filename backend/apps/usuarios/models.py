# en backend/apps/usuarios/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from .managers import CustomUserManager
from cloudinary.models import CloudinaryField

class CustomUser(AbstractBaseUser, PermissionsMixin):

    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=150, blank=True)
    last_name = models.CharField(_('last name'), max_length=150, blank=True)    
    phone_number = models.CharField(_('phone number'), max_length=20, blank=True, null=True)

    # Campos de staff requeridos por Django
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager()
    USERNAME_FIELD = 'email'    
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return self.email

    def get_full_name(self):
        """
        Retorna el first_name más el last_name, con un espacio en medio.
        """
        full_name = '%s %s' % (self.first_name, self.last_name)
        return full_name.strip()

    def get_short_name(self):
        """Retorna el short name para el usuario."""
        return self.first_name
    
class Profile(models.Model):
    class Sexo(models.TextChoices):
        masculino = 'MASCULINO', _('Masculino')
        femenino = 'FEMENINO', _('Femenino')
        otro = 'OTRO', _('Otro')

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')    
    avatar = CloudinaryField(
        'avatar',
        blank=True,
        null=True,
        folder='usuarios/perfiles', 
        resource_type='image',
    )

    sexo = models.CharField(
        verbose_name=_('sexo'),
        max_length=10,
        choices=Sexo.choices,
        blank=True,
        null=True
    )
    
    bio = models.TextField(blank=True, null=True)
    dashboard_settings = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f'Perfil de {self.user.email}'

    @property
    def avatar_url(self):
        if self.avatar and hasattr(self.avatar, 'url'):
            return self.avatar.url
        if self.sexo == self.Sexo.masculino:
            return "https://res.cloudinary.com/dujtkzezc/image/upload/v1761365274/perfilhombre_j1m0uu.png"
        if self.sexo == self.Sexo.femenino:
            return "https://res.cloudinary.com/dujtkzezc/image/upload/v1761365273/perfilmujer_plgovh.jpg"
        return "https://res.cloudinary.com/dujtkzezc/image/upload/v1760824219/boutique/productos/nefao4nkvkyedyfftlpg.avif"

class Address(models.Model):
    
    class AddressType(models.TextChoices):
        SHIPPING = 'SHIPPING', _('Envío')
        BILLING = 'BILLING', _('Facturación')

    # Conexión 1-a-Muchos: Un usuario puede tener muchas direcciones.
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='addresses')
    
    address_type = models.CharField(
        max_length=10,
        choices=AddressType.choices,
        default=AddressType.SHIPPING
    )
    
    # Campos de la dirección
    street_address = models.CharField(max_length=255)
    apartment_address = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100) # O provincia/departamento
    country = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    
    is_default = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        """
        Sobrescribe el método save para asegurar que solo una dirección
        de cada tipo (envío/facturación) sea la predeterminada.
        """
        # Si esta dirección se está marcando como la predeterminada
        if self.is_default:
            # Busca otras direcciones del MISMO usuario y del MISMO tipo que ya sean predeterminadas y quítales esa marca.
            Address.objects.filter(
                user=self.user, 
                address_type=self.address_type, 
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        
        # Llama al método save() original para guardar el objeto
        super(Address, self).save(*args, **kwargs)

    def __str__(self):
        return f'{self.get_address_type_display()} de {self.user.email} - {self.street_address}'
    
    class Meta:
        verbose_name_plural = 'Addresses'