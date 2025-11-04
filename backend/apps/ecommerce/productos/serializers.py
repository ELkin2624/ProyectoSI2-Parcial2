from rest_framework import serializers
from .models import (
    Categoria, 
    Atributo, 
    ValorAtributo, 
    Producto, 
    ProductoVariante, 
    ImagenProducto
)
# Importamos el serializador de la app de inventario
from ..inventario.serializers import StockSerializer

# --- Serializadores Base ---
class CategoriaSerializer(serializers.ModelSerializer):
    """
    Serializador recursivo para Categorías.
    Mostrará los 'hijos' anidados dentro de su 'padre'.
    """
    # Definimos 'hijos' explícitamente para la recursividad
    hijos = serializers.SerializerMethodField()
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = Categoria
        fields = (
            'id', 
            'nombre', 
            'slug', 
            'padre', 
            'descripcion', 
            'imagen_url', 
            'hijos'
        )

    def get_hijos(self, obj):
        """Devuelve los hijos serializados."""
        # Filtra solo los hijos directos
        hijos = Categoria.objects.filter(padre=obj)
        # Serializa cada hijo usando el mismo serializador
        serializer = CategoriaSerializer(hijos, many=True, context=self.context)
        return serializer.data

    def get_imagen_url(self, obj):
        """Devuelve la URL de la imagen de Cloudinary."""
        if obj.imagen and hasattr(obj.imagen, 'url'):
            return obj.imagen.url
        return None

class AtributoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Atributo
        fields = ('id', 'nombre')

class ValorAtributoSerializer(serializers.ModelSerializer):
    """Muestra el valor junto con el nombre de su atributo."""
    atributo = AtributoSerializer(read_only=True)

    class Meta:
        model = ValorAtributo
        fields = ('id', 'atributo', 'valor')

class ImagenProductoSerializer(serializers.ModelSerializer):
    """Serializador para la galería de imágenes del producto."""
    imagen_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ImagenProducto
        fields = ('id', 'imagen', 'imagen_url', 'alt_text', 'es_principal')
        read_only_fields = ('id', 'imagen_url')

    def get_imagen_url(self, obj):
        if obj.imagen and hasattr(obj.imagen, 'url'):
            return obj.imagen.url
        return None

# --- Serializadores de Producto y Variante (El Núcleo) ---

class ProductoVarianteSerializer(serializers.ModelSerializer):
    """
    Serializador para la Variante (el SKU vendible).
    """
    # --- Campos de Lectura (Anidados) ---
    valores = ValorAtributoSerializer(many=True, read_only=True)
    
    # Usamos el related_name 'stock_records' y el 'StockSerializer'
    stock_records = StockSerializer(many=True, read_only=True)
    
    # Usamos la @property que creamos en el modelo
    stock_total = serializers.ReadOnlyField()
    
    imagen_variante_url = serializers.SerializerMethodField()

    # --- Campos de Escritura (Para Crear/Actualizar) ---
    valores_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=ValorAtributo.objects.all(),
        source='valores', # Escribe sobre el campo 'valores'
        write_only=True,
        label="IDs de Valores de Atributo"
    )

    class Meta:
        model = ProductoVariante
        fields = (
            'id', 
            'sku', 
            'precio', 
            'precio_oferta', 
            'activo',
            'stock_total',          # La @property (Ej: 60)
            'stock_records',        # Lista de stock por almacén
            'imagen_variante',      # Campo para subir la imagen
            'imagen_variante_url',  # URL de solo lectura
            'valores',              # Lista de objetos (Talla: M, Color: Azul)
            'valores_ids',          # Lista de IDs [1, 5] para escritura
        )
        read_only_fields = ('id', 'sku', 'stock_total', 'stock_records', 'imagen_variante_url')
        
    def get_imagen_variante_url(self, obj):
        if obj.imagen_variante and hasattr(obj.imagen_variante, 'url'):
            return obj.imagen_variante.url
        return None

class ProductoSerializer(serializers.ModelSerializer):
    """
    Serializador principal para el Producto (la plantilla).
    Anida toda la información relevante para el frontend.
    """
    # --- Campos Anidados (Solo Lectura) ---
    categoria = CategoriaSerializer(read_only=True)
    atributos = AtributoSerializer(many=True, read_only=True)
    
    # Usamos los related_names
    variantes = ProductoVarianteSerializer(many=True, read_only=True)
    imagenes_galeria = ImagenProductoSerializer(
        many=True, 
        read_only=True, 
        source='imagenes' # Usamos el source que definiste en el modelo
    )

    # --- Campos de Escritura (Para Crear/Actualizar) ---
    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        source='categoria',
        write_only=True,
        label="ID de Categoría"
    )
    atributos_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Atributo.objects.all(),
        source='atributos',
        write_only=True,
        label="IDs de Atributos"
    )

    class Meta:
        model = Producto
        fields = (
            'id', 
            'nombre', 
            'slug', 
            'descripcion', 
            'activo',
            'creado_en',
            'actualizado_en',
            'categoria',            # Objeto de categoría (lectura)
            'atributos',            # Lista de atributos (lectura)
            'imagenes_galeria',     # Lista de imágenes de galería (lectura)
            'variantes',            # Lista de variantes (lectura)
            'categoria_id',         # ID para escritura
            'atributos_ids',        # Lista de IDs para escritura
        )
        read_only_fields = ('id', 'slug', 'creado_en', 'actualizado_en')