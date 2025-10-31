# products/models.py
from django.db import models
from django.utils.text import slugify
from cloudinary.models import CloudinaryField 
import uuid 

# --- Categorías ---

class Categoria(models.Model):
    """
    Categoría recursiva.
    Ej: Hombre (padre=None)
          -> Ropa (padre=Hombre)
               -> Camisas (padre=Ropa)
          -> Zapatos (padre=Hombre)
               -> Zapatillas (padre=Zapatos)
    """
    nombre = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True, 
                            help_text="URL amigable (se genera automáticamente)")
    padre = models.ForeignKey('self', on_delete=models.CASCADE, null=True, 
                              blank=True, related_name='hijos')
    descripcion = models.TextField(blank=True)
    imagen = CloudinaryField('categoria_imagen', blank=True, null=True)

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        # Evita que una categoría sea su propio padre
        constraints = [
            models.CheckConstraint(
                check=~models.Q(id=models.F('padre')), 
                name='no_auto_referencia_categoria'
            )
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)

    def __str__(self):
        # Muestra la ruta completa: Hombre > Ropa > Camisas
        full_path = [self.nombre]
        k = self.padre
        while k is not None:
            full_path.append(k.nombre)
            k = k.padre
        return ' > '.join(full_path[::-1])

# --- Atributos (Talla, Color, etc.) ---

class Atributo(models.Model):
    """Ej: 'Talla', 'Color', 'Material'"""
    nombre = models.CharField(max_length=100, unique=True, 
                              help_text="Ej: Talla, Color, Material")

    class Meta:
        verbose_name = "Atributo"
        verbose_name_plural = "Atributos"

    def __str__(self):
        return self.nombre

class ValorAtributo(models.Model):
    """Ej: 'M' (para Talla), 'Rojo' (para Color)"""
    atributo = models.ForeignKey(Atributo, on_delete=models.CASCADE, 
                                 related_name='valores')
    valor = models.CharField(max_length=100, help_text="Ej: M, L, XL, Rojo, Azul")

    class Meta:
        verbose_name = "Valor de Atributo"
        verbose_name_plural = "Valores de Atributos"
        unique_together = ('atributo', 'valor') # No duplicar "Talla: M"

    def __str__(self):
        return f"{self.atributo.nombre}: {self.valor}"

# --- Productos y Variantes (El núcleo) ---

class Producto(models.Model):
    """
    El producto 'plantilla'. No tiene precio ni stock por sí mismo.
    Es el contenedor de las variantes.
    Ej: 'Camisa de Lino Manga Larga'
    """
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, 
                                  related_name='productos')
    nombre = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    descripcion = models.TextField(blank=True)
    
    # Define qué atributos usa este producto (ej: Talla y Color)
    atributos = models.ManyToManyField(Atributo, blank=True,
                                        help_text="Atributos que definen las variantes (ej: Talla, Color)")
    
    activo = models.BooleanField(default=True, 
                                 help_text="Visible en la tienda")
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ('-creado_en',)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.nombre}-{uuid.uuid4().hex[:6]}")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre

class ProductoVariante(models.Model):
    """
    La unidad vendible (SKU). Esto es lo que tiene precio y stock.
    Ej: 'Camisa de Lino Manga Larga, Azul, Talla M'
    """
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, 
                                 related_name='variantes')
    sku = models.CharField(max_length=100, unique=True, blank=True, 
                           help_text="Stock Keeping Unit (se genera automáticamente)")
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    precio_oferta = models.DecimalField(max_digits=10, decimal_places=2, 
                                        blank=True, null=True)
    
    # La combinación de valores que define esta variante
    # Ej: [Valor: 'Azul', Valor: 'M']
    valores = models.ManyToManyField(ValorAtributo, related_name='variantes')
    
    activo = models.BooleanField(default=True, 
                                 help_text="Esta variante específica está a la venta")

    class Meta:
        verbose_name = "Variante de Producto"
        verbose_name_plural = "Variantes de Producto"
        # Evita variantes duplicadas para el mismo producto
        # (Esto se maneja mejor en el form/serializer, pero es una guía)

    def save(self, *args, **kwargs):
        if not self.sku:
            # Genera un SKU simple
            self.sku = f"{self.producto.slug.upper()}-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        # Genera un nombre descriptivo: "Camisa de Lino (Azul, M)"
        valores_str = ", ".join(str(v.valor) for v in self.valores.all())
        return f"{self.producto.nombre} ({valores_str})"

class ImagenProducto(models.Model):
    """
    Tabla separada para imágenes, vinculada a la VARIANTE.
    Así, la 'Camisa Azul' muestra fotos azules.
    """
    variante = models.ForeignKey(ProductoVariante, on_delete=models.CASCADE, 
                                 related_name='imagenes')
    imagen = CloudinaryField('producto_imagenes')
    alt_text = models.CharField(max_length=255, blank=True, 
                                help_text="Texto alternativo para SEO y accesibilidad")
    es_principal = models.BooleanField(default=False, 
                                       help_text="La imagen principal de esta variante")

    class Meta:
        verbose_name = "Imagen de Producto"
        verbose_name_plural = "Imágenes de Producto"
        ordering = ['-es_principal'] # La principal primero