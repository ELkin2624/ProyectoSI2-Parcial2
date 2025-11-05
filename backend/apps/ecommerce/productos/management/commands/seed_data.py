from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.usuarios.models import Profile, Address
from apps.ecommerce.productos.models import (
    Categoria, Atributo, ValorAtributo, 
    Producto, ProductoVariante, ImagenProducto
)
from apps.ecommerce.inventario.models import Almacen, Stock
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Llena la base de datos con datos de prueba para la boutique'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('🌱 Iniciando seed de la base de datos...'))
        
        # Limpiar datos existentes (opcional)
        self.stdout.write('🗑️  Limpiando datos existentes...')
        ImagenProducto.objects.all().delete()
        Stock.objects.all().delete()
        ProductoVariante.objects.all().delete()
        Producto.objects.all().delete()
        ValorAtributo.objects.all().delete()
        Atributo.objects.all().delete()
        Categoria.objects.all().delete()
        Almacen.objects.all().delete()
        Address.objects.all().delete()
        Profile.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        
        # 1. Crear usuarios
        self.stdout.write('👤 Creando usuarios...')
        self.create_users()
        
        # 2. Crear almacenes
        self.stdout.write('🏪 Creando almacenes...')
        self.create_almacenes()
        
        # 3. Crear categorías
        self.stdout.write('📁 Creando categorías...')
        self.create_categorias()
        
        # 4. Crear atributos y valores
        self.stdout.write('🎨 Creando atributos y valores...')
        self.create_atributos()
        
        # 5. Crear productos y variantes
        self.stdout.write('👕 Creando productos y variantes...')
        self.create_productos()
        
        self.stdout.write(self.style.SUCCESS('✅ ¡Seed completado exitosamente!'))
        self.stdout.write(self.style.SUCCESS('📊 Resumen:'))
        self.stdout.write(f'   - Usuarios: {User.objects.count()}')
        self.stdout.write(f'   - Categorías: {Categoria.objects.count()}')
        self.stdout.write(f'   - Productos: {Producto.objects.count()}')
        self.stdout.write(f'   - Variantes: {ProductoVariante.objects.count()}')
        self.stdout.write(f'   - Almacenes: {Almacen.objects.count()}')
        self.stdout.write(f'   - Registros de Stock: {Stock.objects.count()}')

    def create_users(self):
        """Crea usuarios de prueba"""
        # Admin
        if not User.objects.filter(email='admin@boutique.com').exists():
            admin = User.objects.create_superuser(
                email='admin@boutique.com',
                first_name='Admin',
                last_name='Boutique',
                password='admin123'
            )
            admin.phone_number = '+1234567890'
            admin.save()
            
            # Perfil del admin
            Profile.objects.update_or_create(
                user=admin,
                defaults={
                    'sexo': 'MASCULINO',
                    'bio': 'Administrador de la boutique'
                }
            )
            
            self.stdout.write(f'   ✓ Admin creado: admin@boutique.com / admin123')
        
        # Clientes
        clientes_data = [
            {
                'email': 'juan.perez@example.com',
                'first_name': 'Juan',
                'last_name': 'Pérez',
                'phone': '+1234567891',
                'sexo': 'MASCULINO'
            },
            {
                'email': 'maria.garcia@example.com',
                'first_name': 'María',
                'last_name': 'García',
                'phone': '+1234567892',
                'sexo': 'FEMENINO'
            },
            {
                'email': 'carlos.lopez@example.com',
                'first_name': 'Carlos',
                'last_name': 'López',
                'phone': '+1234567893',
                'sexo': 'MASCULINO'
            }
        ]
        
        for cliente_data in clientes_data:
            if not User.objects.filter(email=cliente_data['email']).exists():
                user = User.objects.create_user(
                    email=cliente_data['email'],
                    first_name=cliente_data['first_name'],
                    last_name=cliente_data['last_name'],
                    password='password123'
                )
                user.phone_number = cliente_data['phone']
                user.save()
                
                Profile.objects.update_or_create(
                    user=user,
                    defaults={
                        'sexo': cliente_data['sexo'],
                        'bio': f'Cliente de la boutique'
                    }
                )
                
                # Crear direcciones
                Address.objects.create(
                    user=user,
                    address_type='SHIPPING',
                    street_address=f'Calle Principal {random.randint(100, 999)}',
                    apartment_address=f'Apt {random.randint(1, 20)}',
                    city='Ciudad Ejemplo',
                    state='Estado Ejemplo',
                    country='País Ejemplo',
                    postal_code=f'{random.randint(10000, 99999)}',
                    is_default=True
                )
                
                self.stdout.write(f'   ✓ Cliente creado: {cliente_data["email"]} / password123')

    def create_almacenes(self):
        """Crea almacenes"""
        almacenes_data = [
            {'nombre': 'Tienda Principal', 'direccion': 'Av. Central 123, Centro'},
            {'nombre': 'Bodega Online', 'direccion': 'Zona Industrial, Lote 45'},
            {'nombre': 'Sucursal Norte', 'direccion': 'Av. Norte 789, Zona Norte'}
        ]
        
        self.almacenes = []
        for data in almacenes_data:
            almacen, created = Almacen.objects.get_or_create(**data, defaults={'activo': True})
            self.almacenes.append(almacen)
            self.stdout.write(f'   ✓ Almacén: {almacen.nombre}')

    def create_categorias(self):
        """Crea categorías jerárquicas"""
        # Categorías principales
        cat_hombre = Categoria.objects.create(
            nombre='Hombre',
            descripcion='Ropa y accesorios para hombre'
        )
        cat_mujer = Categoria.objects.create(
            nombre='Mujer',
            descripcion='Ropa y accesorios para mujer'
        )
        cat_accesorios = Categoria.objects.create(
            nombre='Accesorios',
            descripcion='Accesorios de moda'
        )
        
        # Subcategorías para Hombre
        Categoria.objects.create(nombre='Camisas', padre=cat_hombre, descripcion='Camisas para hombre')
        Categoria.objects.create(nombre='Pantalones', padre=cat_hombre, descripcion='Pantalones para hombre')
        Categoria.objects.create(nombre='Zapatos Hombre', padre=cat_hombre, descripcion='Calzado masculino')
        Categoria.objects.create(nombre='Chaquetas', padre=cat_hombre, descripcion='Chaquetas y abrigos')
        
        # Subcategorías para Mujer
        Categoria.objects.create(nombre='Blusas', padre=cat_mujer, descripcion='Blusas para mujer')
        Categoria.objects.create(nombre='Vestidos', padre=cat_mujer, descripcion='Vestidos elegantes')
        Categoria.objects.create(nombre='Zapatos Mujer', padre=cat_mujer, descripcion='Calzado femenino')
        Categoria.objects.create(nombre='Faldas', padre=cat_mujer, descripcion='Faldas de diversos estilos')
        
        # Subcategorías de Accesorios
        Categoria.objects.create(nombre='Bolsos', padre=cat_accesorios, descripcion='Bolsos y carteras')
        Categoria.objects.create(nombre='Cinturones', padre=cat_accesorios, descripcion='Cinturones de cuero')
        Categoria.objects.create(nombre='Sombreros', padre=cat_accesorios, descripcion='Sombreros y gorras')
        
        self.stdout.write(f'   ✓ {Categoria.objects.count()} categorías creadas')

    def create_atributos(self):
        """Crea atributos y sus valores"""
        # Atributo: Talla
        talla = Atributo.objects.create(nombre='Talla')
        tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        self.valores_talla = []
        for t in tallas:
            valor = ValorAtributo.objects.create(atributo=talla, valor=t)
            self.valores_talla.append(valor)
        
        # Atributo: Color
        color = Atributo.objects.create(nombre='Color')
        colores = ['Blanco', 'Negro', 'Azul', 'Rojo', 'Verde', 'Gris', 'Beige', 'Rosa', 'Amarillo']
        self.valores_color = []
        for c in colores:
            valor = ValorAtributo.objects.create(atributo=color, valor=c)
            self.valores_color.append(valor)
        
        # Atributo: Material
        material = Atributo.objects.create(nombre='Material')
        materiales = ['Algodón', 'Lino', 'Poliéster', 'Seda', 'Cuero', 'Mezclilla']
        self.valores_material = []
        for m in materiales:
            valor = ValorAtributo.objects.create(atributo=material, valor=m)
            self.valores_material.append(valor)
        
        self.stdout.write(f'   ✓ {Atributo.objects.count()} atributos con {ValorAtributo.objects.count()} valores')

    def create_productos(self):
        """Crea productos con variantes y stock"""
        productos_data = [
            {
                'nombre': 'Camisa de Lino Manga Larga',
                'categoria': 'Camisas',
                'descripcion': 'Elegante camisa de lino de manga larga, perfecta para ocasiones formales y casuales. Confeccionada con lino 100% natural que permite la transpiración.',
                'precio_base': 59.99,
                'atributos': ['Talla', 'Color'],
                'variantes_config': [
                    {'talla': 'M', 'color': 'Blanco'},
                    {'talla': 'M', 'color': 'Azul'},
                    {'talla': 'L', 'color': 'Blanco'},
                    {'talla': 'L', 'color': 'Azul'},
                    {'talla': 'XL', 'color': 'Blanco'},
                ]
            },
            {
                'nombre': 'Pantalón Chino Slim Fit',
                'categoria': 'Pantalones',
                'descripcion': 'Pantalón chino de corte slim fit, ideal para un look casual elegante. Fabricado en algodón de alta calidad con un toque de elastano para mayor comodidad.',
                'precio_base': 79.99,
                'atributos': ['Talla', 'Color'],
                'variantes_config': [
                    {'talla': 'M', 'color': 'Beige'},
                    {'talla': 'M', 'color': 'Negro'},
                    {'talla': 'L', 'color': 'Beige'},
                    {'talla': 'L', 'color': 'Negro'},
                    {'talla': 'XL', 'color': 'Gris'},
                ]
            },
            {
                'nombre': 'Vestido Floral Verano',
                'categoria': 'Vestidos',
                'descripcion': 'Hermoso vestido con estampado floral, perfecto para el verano. Tela ligera y fresca que te hará lucir radiante en cualquier ocasión.',
                'precio_base': 89.99,
                'atributos': ['Talla', 'Color'],
                'variantes_config': [
                    {'talla': 'S', 'color': 'Rosa'},
                    {'talla': 'M', 'color': 'Rosa'},
                    {'talla': 'M', 'color': 'Azul'},
                    {'talla': 'L', 'color': 'Rosa'},
                ]
            },
            {
                'nombre': 'Blusa de Seda Elegante',
                'categoria': 'Blusas',
                'descripcion': 'Blusa de seda pura con cuello en V, perfecta para la oficina o eventos especiales. Suave al tacto y de caída impecable.',
                'precio_base': 69.99,
                'atributos': ['Talla', 'Color'],
                'variantes_config': [
                    {'talla': 'S', 'color': 'Blanco'},
                    {'talla': 'S', 'color': 'Negro'},
                    {'talla': 'M', 'color': 'Blanco'},
                    {'talla': 'M', 'color': 'Negro'},
                    {'talla': 'L', 'color': 'Negro'},
                ]
            },
            {
                'nombre': 'Chaqueta de Cuero Urbana',
                'categoria': 'Chaquetas',
                'descripcion': 'Chaqueta de cuero genuino con estilo urbano moderno. Resistente y con un diseño atemporal que nunca pasa de moda.',
                'precio_base': 199.99,
                'atributos': ['Talla', 'Color'],
                'variantes_config': [
                    {'talla': 'M', 'color': 'Negro'},
                    {'talla': 'L', 'color': 'Negro'},
                    {'talla': 'XL', 'color': 'Negro'},
                ]
            },
            {
                'nombre': 'Zapatos Oxford Clásicos',
                'categoria': 'Zapatos Hombre',
                'descripcion': 'Zapatos Oxford de cuero genuino, perfectos para el hombre elegante. Diseño clásico con acabados de alta calidad.',
                'precio_base': 129.99,
                'atributos': ['Talla', 'Color'],
                'variantes_config': [
                    {'talla': 'M', 'color': 'Negro'},
                    {'talla': 'L', 'color': 'Negro'},
                    {'talla': 'L', 'color': 'Beige'},
                ]
            },
            {
                'nombre': 'Bolso de Mano Elegante',
                'categoria': 'Bolsos',
                'descripcion': 'Bolso de mano de cuero sintético de alta calidad. Espacioso y elegante, ideal para el día a día o eventos especiales.',
                'precio_base': 89.99,
                'atributos': ['Color'],
                'variantes_config': [
                    {'color': 'Negro'},
                    {'color': 'Beige'},
                    {'color': 'Rojo'},
                ]
            },
            {
                'nombre': 'Cinturón de Cuero Trenzado',
                'categoria': 'Cinturones',
                'descripcion': 'Cinturón de cuero genuino con diseño trenzado. Versátil y resistente, combina con cualquier outfit casual o formal.',
                'precio_base': 39.99,
                'atributos': ['Color'],
                'variantes_config': [
                    {'color': 'Negro'},
                    {'color': 'Beige'},
                ]
            },
            {
                'nombre': 'Falda Midi Plisada',
                'categoria': 'Faldas',
                'descripcion': 'Falda midi con elegante diseño plisado. Perfecta para la oficina o salidas casuales elegantes.',
                'precio_base': 54.99,
                'atributos': ['Talla', 'Color'],
                'variantes_config': [
                    {'talla': 'S', 'color': 'Negro'},
                    {'talla': 'M', 'color': 'Negro'},
                    {'talla': 'M', 'color': 'Gris'},
                    {'talla': 'L', 'color': 'Negro'},
                ]
            },
            {
                'nombre': 'Sombrero Fedora Clásico',
                'categoria': 'Sombreros',
                'descripcion': 'Sombrero fedora de fieltro con banda decorativa. Un clásico que nunca pasa de moda.',
                'precio_base': 49.99,
                'atributos': ['Color'],
                'variantes_config': [
                    {'color': 'Negro'},
                    {'color': 'Gris'},
                    {'color': 'Beige'},
                ]
            },
        ]
        
        for prod_data in productos_data:
            # Obtener categoría
            categoria = Categoria.objects.get(nombre=prod_data['categoria'])
            
            # Crear producto
            producto = Producto.objects.create(
                nombre=prod_data['nombre'],
                categoria=categoria,
                descripcion=prod_data['descripcion'],
                activo=True
            )
            
            # Asignar atributos al producto
            for attr_nombre in prod_data['atributos']:
                atributo = Atributo.objects.get(nombre=attr_nombre)
                producto.atributos.add(atributo)
            
            # Crear variantes
            for var_config in prod_data['variantes_config']:
                # Calcular precio con variación
                precio_variacion = random.uniform(-10, 10)
                precio = Decimal(str(prod_data['precio_base'] + precio_variacion))
                precio_oferta = None
                
                # 30% de probabilidad de tener oferta
                if random.random() < 0.3:
                    descuento = random.uniform(0.10, 0.30)
                    precio_oferta = precio * Decimal(str(1 - descuento))
                
                # Crear variante
                variante = ProductoVariante.objects.create(
                    producto=producto,
                    precio=precio.quantize(Decimal('0.01')),
                    precio_oferta=precio_oferta.quantize(Decimal('0.01')) if precio_oferta else None,
                    activo=True
                )
                
                # Asignar valores de atributos
                for key, value in var_config.items():
                    if key == 'talla':
                        valor_attr = ValorAtributo.objects.get(atributo__nombre='Talla', valor=value)
                        variante.valores.add(valor_attr)
                    elif key == 'color':
                        valor_attr = ValorAtributo.objects.get(atributo__nombre='Color', valor=value)
                        variante.valores.add(valor_attr)
                
                # Crear stock en almacenes aleatorios
                num_almacenes = random.randint(1, len(self.almacenes))
                almacenes_seleccionados = random.sample(self.almacenes, num_almacenes)
                
                for almacen in almacenes_seleccionados:
                    cantidad = random.randint(5, 50)
                    Stock.objects.create(
                        variante=variante,
                        almacen=almacen,
                        cantidad=cantidad
                    )
            
            self.stdout.write(f'   ✓ Producto: {producto.nombre} ({producto.variantes.count()} variantes)')
