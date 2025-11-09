from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth.models import Group
from .models import CustomUser, Profile, Address

# --- Serializadores de Modelos Base ---
class AddressSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Address.
    Permite CRUD completo para las direcciones de un usuario.
    """
    class Meta:
        model = Address
        fields = (
            'id', 
            'user',  # Se hará read_only en las vistas o se asignará automáticamente
            'address_type', 
            'street_address', 
            'apartment_address',
            'city', 
            'state', 
            'country', 
            'postal_code', 
            'is_default',
            'created_at',
            'updated_at'
        )
        # Hacemos 'user' de solo lectura, porque lo asignaremos 
        # automáticamente desde el 'request.user' en la vista.
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')


class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Profile.
    Se usará para LEER y ACTUALIZAR el perfil de un usuario.
    """
    # Incluimos la propiedad 'avatar_url' del modelo
    avatar_url = serializers.ReadOnlyField()

    class Meta:
        model = Profile
        fields = (
            'id', 
            'user', 
            'avatar', 
            'avatar_url', 
            'sexo', 
            'bio', 
            'dashboard_settings'
        )
        # El usuario de un perfil no se puede cambiar
        read_only_fields = ('user',)


class GroupSerializer(serializers.ModelSerializer):
    """
    Serializador simple para mostrar el nombre del grupo.
    """
    class Meta:
        model = Group
        fields = ('id', 'name')


# --- Serializadores Específicos de Usuario ---
class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializador SÓLO para el REGISTRO (Creación) de nuevos usuarios.
    Pide password y password2 para confirmación.
    """
    password2 = serializers.CharField(
        style={'input_type': 'password'}, 
        write_only=True,
        label="Confirmar contraseña"
    )

    class Meta:
        model = CustomUser
        fields = ('email', 'first_name', 'last_name', 'password', 'password2')
        extra_kwargs = {
            'password': {
                'write_only': True,
                'style': {'input_type': 'password'},
                'validators': [validate_password] # Aplica validadores de Django
            }
        }

    def validate(self, attrs):
        """
        Valida que las dos contraseñas coincidan.
        """
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Las contraseñas no coinciden."}
            )
        return attrs

    def create(self, validated_data):
        """
        Crea el nuevo usuario usando el CustomUserManager.
        """
        # Quitamos password2, no se guarda en el modelo
        validated_data.pop('password2')
        # Usamos create_user() para hashear la contraseña
        user = CustomUser.objects.create_user(**validated_data)
        return user


class CustomUserSerializer(serializers.ModelSerializer):
    """
    Serializador para LEER y ACTUALIZAR la información del usuario (no sensible).
    Muestra el perfil y las direcciones anidadas.
    """
    # Anidamos los serializadores de Profile y Address
    profile = ProfileSerializer(read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)
    groups = GroupSerializer(many=True, read_only=True)
    
    # Campo calculado para verificar si es admin
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            'id', 
            'email', 
            'first_name', 
            'last_name', 
            'phone_number',
            'profile',      # JSON del perfil
            'addresses',    # Lista de JSON de direcciones
            'groups',       # Lista de grupos del usuario
            'is_admin',     # Boolean: True si es admin
            'is_active',
            'date_joined',
        )
        # Campos que un usuario no puede editar de sí mismo
        read_only_fields = ('is_active', 'date_joined', 'email')

    def get_is_admin(self, obj):
        """
        Retorna True si el usuario pertenece al grupo 'admin' o es staff.
        """
        return obj.groups.filter(name='admin').exists() or obj.is_staff


class AdminUserSerializer(serializers.ModelSerializer):
    """
    Serializador para que el ADMIN gestione usuarios.
    Permite LEER y ESCRIBIR grupos.
    """
    # Muestra los perfiles y direcciones (solo lectura, se gestionan aparte)
    profile = ProfileSerializer(read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)
    
    # Para LEER, usa el serializador de Grupo
    groups = GroupSerializer(many=True, read_only=True)
    
    # Para ESCRIBIR, acepta una lista de IDs de grupo
    group_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.all(),
        source='groups',  # Escribe sobre el campo 'groups'
        write_only=True,
        required=False  # No es requerido en cada actualización
    )
    password = serializers.CharField(
        write_only=True,
        required=False,  # No es requerido en ACTUALIZAR (PATCH)
        style={'input_type': 'password'},
        validators=[validate_password] # Opcional: aplicar validadores
    )

    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'profile', 'addresses',
            'is_staff',     # El Admin sí puede ver y editar esto
            'is_active',
            'date_joined',
            'groups',       # Para leer (JSON)
            'group_ids',     # Para escribir (lista de IDs)
            'password'     
        )
        read_only_fields = ('date_joined',)
        extra_kwargs = {
            'email': {'required': True, 'allow_blank': False}
        }

    def create(self, validated_data):
        """
        Manejar la creación del usuario con contraseña hasheada.
        """
        # Extraemos la contraseña, debe estar presente al crear
        password = validated_data.pop('password', None)
        if password is None:
            raise serializers.ValidationError({"password": "La contraseña es requerida."})
        
        # Extraemos los grupos
        groups_data = validated_data.pop('groups', [])
        
        # Creamos el usuario usando create_user para hashear la contraseña
        user = CustomUser.objects.create_user(password=password, **validated_data)
        
        # Asignamos los grupos
        user.groups.set(groups_data)
        
        return user

    # 3. SOBRESCRIBIMOS EL MÉTODO UPDATE()
    def update(self, instance, validated_data):
        """
        Manejar la actualización de la contraseña si se provee.
        """
        # Extraemos la contraseña si el admin la envió
        password = validated_data.pop('password', None)
        
        # Actualizamos el resto de los campos
        instance = super().update(instance, validated_data)
        
        # Si se proveyó una nueva contraseña, la hasheamos y guardamos
        if password:
            instance.set_password(password)
            instance.save()
            
        return instance
    