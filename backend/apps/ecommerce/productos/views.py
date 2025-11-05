from rest_framework import generics, viewsets, permissions
from .models import (
    Categoria, 
    Atributo, 
    ValorAtributo, 
    Producto, 
    ProductoVariante, 
    ImagenProducto
)
from .serializers import (
    CategoriaSerializer, 
    AtributoSerializer, 
    ValorAtributoSerializer, 
    ProductoSerializer, 
    ProductoVarianteSerializer, 
    ImagenProductoSerializer
)

# --- Vistas Públicas (Read-Only para Clientes) ---
class CategoriaPublicListView(generics.ListAPIView):
    """
    (PÚBLICO) Lista todas las categorías.
    Optimizado para mostrar solo las categorías 'raíz' (las que no tienen padre).
    El CategoriaSerializer recursivo se encargará de anidar los hijos.
    """
    queryset = Categoria.objects.filter(padre__isnull=True)
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.AllowAny]

class ProductoPublicListView(generics.ListAPIView):
    """
    (PÚBLICO) Lista todos los productos ACTIVOS para el catálogo de la tienda.
    """
    queryset = Producto.objects.filter(activo=True)
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]
    # Aquí puedes añadir filtros (por categoría, precio, etc.)
    # filterset_fields = ['categoria__slug']

class ProductoPublicDetailView(generics.RetrieveAPIView):
    """
    (PÚBLICO) Muestra los detalles de un único producto ACTIVO.
    Usa el 'slug' (URL amigable) para buscar el producto.
    """
    queryset = Producto.objects.filter(activo=True)
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug' # Busca por slug en lugar de ID


# --- Vistas de ADMINISTRACIÓN (Full CRUD para Admin) ---
class AdminCategoriaViewSet(viewsets.ModelViewSet):
    """(ADMIN) CRUD completo para Categorías."""
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.IsAdminUser]

class AdminAtributoViewSet(viewsets.ModelViewSet):
    """(ADMIN) CRUD completo para Atributos (Ej: Talla, Color)."""
    queryset = Atributo.objects.all()
    serializer_class = AtributoSerializer
    permission_classes = [permissions.IsAdminUser]

class AdminValorAtributoViewSet(viewsets.ModelViewSet):
    """(ADMIN) CRUD completo para Valores de Atributos (Ej: M, L, Rojo)."""
    queryset = ValorAtributo.objects.all()
    serializer_class = ValorAtributoSerializer
    permission_classes = [permissions.IsAdminUser]

class AdminProductoViewSet(viewsets.ModelViewSet):
    """(ADMIN) CRUD completo para Productos (la plantilla)."""
    queryset = Producto.objects.all().order_by('-creado_en')
    serializer_class = ProductoSerializer
    permission_classes = [permissions.IsAdminUser]

class AdminProductoVarianteViewSet(viewsets.ModelViewSet):
    """(ADMIN) CRUD completo para Variantes de Producto (el SKU)."""
    queryset = ProductoVariante.objects.all()
    serializer_class = ProductoVarianteSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['producto'] # Filtrar variantes por producto

class AdminImagenProductoViewSet(viewsets.ModelViewSet):
    """(ADMIN) CRUD completo para Imágenes de Galería de Producto."""
    queryset = ImagenProducto.objects.all()
    serializer_class = ImagenProductoSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['producto'] # Filtrar imágenes por producto