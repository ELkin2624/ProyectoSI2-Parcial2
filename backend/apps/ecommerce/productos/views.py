from rest_framework import generics, viewsets, permissions
from rest_framework.pagination import PageNumberPagination
from django.db.models import Prefetch
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


class ProductoPagination(PageNumberPagination):
    """Paginación personalizada para productos."""
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100


# --- Vistas Públicas (Read-Only para Clientes) ---
class CategoriaPublicListView(generics.ListAPIView):
    """
    (PÚBLICO) Lista todas las categorías.
    Optimizado para mostrar solo las categorías 'raíz' (las que no tienen padre).
    El CategoriaSerializer recursivo se encargará de anidar los hijos.
    """
    queryset = Categoria.objects.filter(padre__isnull=True).prefetch_related('hijos')
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.AllowAny]


class ProductoPublicListView(generics.ListAPIView):
    """
    (PÚBLICO) Lista todos los productos ACTIVOS para el catálogo de la tienda.
    OPTIMIZADO con prefetch_related para evitar N+1 queries.
    """
    queryset = Producto.objects.filter(activo=True)
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = ProductoPagination
    # Aquí puedes añadir filtros (por categoría, precio, etc.)
    # filterset_fields = ['categoria__slug']

    def get_queryset(self):
        """
        Optimiza las consultas SQL usando select_related y prefetch_related
        para cargar todas las relaciones en una sola consulta.
        """
        return Producto.objects.filter(activo=True).select_related(
            'categoria',
            'categoria__padre'
        ).prefetch_related(
            'atributos',
            # Prefetch optimizado para variantes y sus relaciones
            Prefetch(
                'variantes',
                queryset=ProductoVariante.objects.filter(activo=True).prefetch_related(
                    Prefetch(
                        'valores',
                        queryset=ValorAtributo.objects.select_related('atributo')
                    ),
                    'stock_records__almacen'
                )
            ),
            # Prefetch optimizado para imágenes
            Prefetch(
                'imagenes',
                queryset=ImagenProducto.objects.order_by('-es_principal')
            )
        ).order_by('-creado_en')


class ProductoPublicDetailView(generics.RetrieveAPIView):
    """
    (PÚBLICO) Muestra los detalles de un único producto ACTIVO.
    Usa el 'slug' (URL amigable) para buscar el producto.
    OPTIMIZADO con prefetch_related.
    Si el usuario es admin, devuelve todas las variantes (activas e inactivas).
    """
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug' # Busca por slug en lugar de ID
    
    def get_queryset(self):
        """Optimiza las consultas SQL para el detalle del producto."""
        # Si el usuario es admin, mostrar todos los productos y variantes
        if self.request.user.is_staff:
            productos = Producto.objects.all()
            variantes_queryset = ProductoVariante.objects.all()
        else:
            # Para usuarios normales, solo productos y variantes activos
            productos = Producto.objects.filter(activo=True)
            variantes_queryset = ProductoVariante.objects.filter(activo=True)
        
        return productos.select_related(
            'categoria',
            'categoria__padre'
        ).prefetch_related(
            'atributos',
            Prefetch(
                'variantes',
                queryset=variantes_queryset.prefetch_related(
                    Prefetch(
                        'valores',
                        queryset=ValorAtributo.objects.select_related('atributo')
                    ),
                    'stock_records__almacen'
                )
            ),
            Prefetch(
                'imagenes',
                queryset=ImagenProducto.objects.order_by('-es_principal')
            )
        )


# --- Vistas de ADMINISTRACIÓN (Full CRUD para Admin) ---
class AdminCategoriaViewSet(viewsets.ModelViewSet):
    """(ADMIN) CRUD completo para Categorías. OPTIMIZADO."""
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = ProductoPagination
    
    def get_queryset(self):
        """Optimiza la carga de categorías con sus relaciones."""
        return Categoria.objects.select_related('padre').prefetch_related('hijos')


class AdminAtributoViewSet(viewsets.ModelViewSet):
    """(ADMIN) CRUD completo para Atributos (Ej: Talla, Color)."""
    queryset = Atributo.objects.all()
    serializer_class = AtributoSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminValorAtributoViewSet(viewsets.ModelViewSet):
    """(ADMIN) CRUD completo para Valores de Atributos (Ej: M, L, Rojo). OPTIMIZADO."""
    serializer_class = ValorAtributoSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        """Optimiza la carga de valores con sus atributos."""
        return ValorAtributo.objects.select_related('atributo')


class AdminProductoViewSet(viewsets.ModelViewSet):
    """(ADMIN) CRUD completo para Productos (la plantilla). OPTIMIZADO."""
    serializer_class = ProductoSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = ProductoPagination
    
    def get_queryset(self):
        """Optimiza la carga de productos con todas sus relaciones."""
        return Producto.objects.select_related(
            'categoria',
            'categoria__padre'
        ).prefetch_related(
            'atributos',
            Prefetch(
                'variantes',
                queryset=ProductoVariante.objects.prefetch_related(
                    Prefetch(
                        'valores',
                        queryset=ValorAtributo.objects.select_related('atributo')
                    ),
                    'stock_records__almacen'
                )
            ),
            Prefetch(
                'imagenes',
                queryset=ImagenProducto.objects.order_by('-es_principal')
            )
        ).order_by('-creado_en')


class AdminProductoVarianteViewSet(viewsets.ModelViewSet):
    """(ADMIN) CRUD completo para Variantes de Producto (el SKU). OPTIMIZADO."""
    serializer_class = ProductoVarianteSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['producto'] # Filtrar variantes por producto
    
    def get_queryset(self):
        """Optimiza la carga de variantes con sus relaciones."""
        return ProductoVariante.objects.select_related(
            'producto',
            'producto__categoria'
        ).prefetch_related(
            Prefetch(
                'valores',
                queryset=ValorAtributo.objects.select_related('atributo')
            ),
            'stock_records__almacen'
        )


class AdminImagenProductoViewSet(viewsets.ModelViewSet):
    """(ADMIN) CRUD completo para Imágenes de Galería de Producto. OPTIMIZADO."""
    serializer_class = ImagenProductoSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['producto'] # Filtrar imágenes por producto
    
    def get_queryset(self):
        """Optimiza la carga de imágenes con sus productos."""
        return ImagenProducto.objects.select_related('producto').order_by('-es_principal')