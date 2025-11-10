# apps/ecommerce/productos/management/commands/seed_database.py
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
import random

from apps.ecommerce.productos.models import (
    Categoria, Atributo, ValorAtributo, Producto, ProductoVariante, ImagenProducto
)
from apps.ecommerce.inventario.models import Almacen, Stock
from apps.ecommerce.pedidos.models import Pedido, ItemPedido, DireccionPedido
from apps.ecommerce.pagos.models import Pago
from apps.usuarios.models import Address

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed de la base de datos con productos, pedidos y pagos completados'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🌱 Iniciando seed de la base de datos...'))

        with transaction.atomic():
            # 1. Crear categorías
            self.stdout.write('📂 Creando categorías...')
            categorias = self.crear_categorias()

            # 2. Crear atributos y valores
            self.stdout.write('🎨 Creando atributos y valores...')
            atributos = self.crear_atributos()

            # 3. Crear almacenes
            self.stdout.write('🏢 Creando almacenes...')
            almacenes = self.crear_almacenes()

            # 4. Crear productos con variantes
            self.stdout.write('👕 Creando productos y variantes...')
            variantes = self.crear_productos(categorias, atributos)

            # 5. Crear stock para las variantes
            self.stdout.write('📦 Creando stock...')
            self.crear_stock(variantes, almacenes)

            # 6. Crear direcciones para usuarios
            self.stdout.write('📍 Creando direcciones para usuarios...')
            direcciones = self.crear_direcciones()

            # 7. Crear pedidos completados
            self.stdout.write('🛍️ Creando pedidos completados...')
            self.crear_pedidos_completados(variantes, direcciones)

        self.stdout.write(self.style.SUCCESS('✅ ¡Seed completado exitosamente!'))

    def crear_categorias(self):
        """Crea categorías de boutique/moda"""
        categorias = {}

        # Categorías principales
        cat_hombre, _ = Categoria.objects.get_or_create(
            slug='ropa-hombre',
            defaults={
                'nombre': 'Ropa de Hombre',
                'descripcion': 'Colección completa de ropa para hombre'
            }
        )
        cat_mujer, _ = Categoria.objects.get_or_create(
            slug='ropa-mujer',
            defaults={
                'nombre': 'Ropa de Mujer',
                'descripcion': 'Colección completa de ropa para mujer'
            }
        )
        cat_accesorios, _ = Categoria.objects.get_or_create(
            slug='accesorios',
            defaults={
                'nombre': 'Accesorios',
                'descripcion': 'Accesorios y complementos de moda'
            }
        )

        # Subcategorías Hombre
        categorias['camisas_hombre'], _ = Categoria.objects.get_or_create(
            slug='camisas-hombre',
            defaults={
                'nombre': 'Camisas',
                'padre': cat_hombre,
                'descripcion': 'Camisas elegantes y casuales para hombre'
            }
        )
        categorias['pantalones_hombre'], _ = Categoria.objects.get_or_create(
            slug='pantalones-hombre',
            defaults={
                'nombre': 'Pantalones Hombre',
                'padre': cat_hombre,
                'descripcion': 'Pantalones formales y casuales'
            }
        )
        categorias['polos_hombre'], _ = Categoria.objects.get_or_create(
            slug='polos-hombre',
            defaults={
                'nombre': 'Polos',
                'padre': cat_hombre,
                'descripcion': 'Polos y camisetas para hombre'
            }
        )

        # Subcategorías Mujer
        categorias['blusas'], _ = Categoria.objects.get_or_create(
            slug='blusas',
            defaults={
                'nombre': 'Blusas',
                'padre': cat_mujer,
                'descripcion': 'Blusas elegantes y modernas'
            }
        )
        categorias['vestidos'], _ = Categoria.objects.get_or_create(
            slug='vestidos',
            defaults={
                'nombre': 'Vestidos',
                'padre': cat_mujer,
                'descripcion': 'Vestidos para toda ocasión'
            }
        )
        categorias['pantalones_mujer'], _ = Categoria.objects.get_or_create(
            slug='pantalones-mujer',
            defaults={
                'nombre': 'Pantalones Mujer',
                'padre': cat_mujer,
                'descripcion': 'Pantalones y jeans para mujer'
            }
        )
        categorias['faldas'], _ = Categoria.objects.get_or_create(
            slug='faldas',
            defaults={
                'nombre': 'Faldas',
                'padre': cat_mujer,
                'descripcion': 'Faldas modernas y elegantes'
            }
        )

        # Subcategorías Accesorios
        categorias['carteras'], _ = Categoria.objects.get_or_create(
            slug='carteras',
            defaults={
                'nombre': 'Carteras',
                'padre': cat_accesorios,
                'descripcion': 'Carteras y bolsos de diseño'
            }
        )
        categorias['cinturones'], _ = Categoria.objects.get_or_create(
            slug='cinturones',
            defaults={
                'nombre': 'Cinturones',
                'padre': cat_accesorios,
                'descripcion': 'Cinturones de cuero y tela'
            }
        )

        self.stdout.write(f'  ✓ {Categoria.objects.count()} categorías en total')
        return categorias

    def crear_atributos(self):
        """Crea atributos y sus valores"""
        atributos = {}

        # Atributo Talla
        atributo_talla, _ = Atributo.objects.get_or_create(nombre='Talla')
        tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        atributos['tallas'] = []
        for talla in tallas:
            valor, _ = ValorAtributo.objects.get_or_create(atributo=atributo_talla, valor=talla)
            atributos['tallas'].append(valor)

        # Atributo Color
        atributo_color, _ = Atributo.objects.get_or_create(nombre='Color')
        colores = ['Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 'Gris', 'Beige', 'Rosa']
        atributos['colores'] = []
        for color in colores:
            valor, _ = ValorAtributo.objects.get_or_create(atributo=atributo_color, valor=color)
            atributos['colores'].append(valor)

        # Atributo Material
        atributo_material, _ = Atributo.objects.get_or_create(nombre='Material')
        materiales = ['Algodón', 'Lino', 'Poliéster', 'Seda', 'Mezclilla', 'Cuero']
        atributos['materiales'] = []
        for material in materiales:
            valor, _ = ValorAtributo.objects.get_or_create(atributo=atributo_material, valor=material)
            atributos['materiales'].append(valor)

        self.stdout.write(f'  ✓ {Atributo.objects.count()} atributos en total')
        self.stdout.write(f'  ✓ {ValorAtributo.objects.count()} valores de atributos en total')
        return atributos

    def crear_almacenes(self):
        """Crea almacenes"""
        almacenes = []
        
        almacen_principal, _ = Almacen.objects.get_or_create(
            nombre='Almacén Principal',
            defaults={
                'direccion': 'Av. Arce 2631, La Paz, Bolivia',
                'capacidad': 5000,
                'activo': True
            }
        )
        almacenes.append(almacen_principal)

        almacen_sucursal, _ = Almacen.objects.get_or_create(
            nombre='Sucursal El Alto',
            defaults={
                'direccion': 'Zona 16 de Julio, El Alto, Bolivia',
                'capacidad': 3000,
                'activo': True
            }
        )
        almacenes.append(almacen_sucursal)

        self.stdout.write(f'  ✓ {Almacen.objects.count()} almacenes en total')
        return almacenes

    def crear_productos(self, categorias, atributos):
        """Crea productos con sus variantes"""
        variantes = []
        
        # Productos para Hombre
        productos_hombre = [
            {
                'nombre': 'Camisa Formal Slim Fit',
                'categoria': categorias['camisas_hombre'],
                'descripcion': 'Camisa formal de corte slim fit, perfecta para ocasiones elegantes. Confeccionada en algodón de alta calidad.',
                'precio_base': Decimal('150.00'),
                'colores': ['Blanco', 'Azul', 'Negro'],
                'tallas': ['S', 'M', 'L', 'XL'],
            },
            {
                'nombre': 'Camisa de Lino Manga Larga',
                'categoria': categorias['camisas_hombre'],
                'descripcion': 'Camisa casual de lino natural, ideal para climas cálidos. Diseño relajado y cómodo.',
                'precio_base': Decimal('180.00'),
                'colores': ['Beige', 'Blanco', 'Azul'],
                'tallas': ['S', 'M', 'L', 'XL', 'XXL'],
            },
            {
                'nombre': 'Pantalón Chino Clásico',
                'categoria': categorias['pantalones_hombre'],
                'descripcion': 'Pantalón chino de corte clásico, versátil para look casual o semi-formal. Tejido resistente.',
                'precio_base': Decimal('200.00'),
                'colores': ['Beige', 'Negro', 'Azul', 'Gris'],
                'tallas': ['30', '32', '34', '36', '38'],
            },
            {
                'nombre': 'Polo Premium Pique',
                'categoria': categorias['polos_hombre'],
                'descripcion': 'Polo de tejido piqué premium, con detalles bordados. Perfecto para uso diario.',
                'precio_base': Decimal('120.00'),
                'colores': ['Negro', 'Blanco', 'Azul', 'Verde', 'Rojo'],
                'tallas': ['S', 'M', 'L', 'XL'],
            },
        ]

        # Productos para Mujer
        productos_mujer = [
            {
                'nombre': 'Blusa de Seda Elegante',
                'categoria': categorias['blusas'],
                'descripcion': 'Blusa de seda natural con cuello V, perfecta para ocasiones formales. Caída impecable.',
                'precio_base': Decimal('220.00'),
                'colores': ['Blanco', 'Negro', 'Rosa', 'Azul'],
                'tallas': ['XS', 'S', 'M', 'L', 'XL'],
            },
            {
                'nombre': 'Vestido Midi Floral',
                'categoria': categorias['vestidos'],
                'descripcion': 'Vestido midi con estampado floral, diseño femenino y romántico. Ideal para primavera-verano.',
                'precio_base': Decimal('280.00'),
                'colores': ['Rosa', 'Azul', 'Verde'],
                'tallas': ['XS', 'S', 'M', 'L'],
            },
            {
                'nombre': 'Vestido Cóctel Negro',
                'categoria': categorias['vestidos'],
                'descripcion': 'Vestido negro estilo cóctel, elegante y atemporal. Perfecto para eventos formales.',
                'precio_base': Decimal('350.00'),
                'colores': ['Negro'],
                'tallas': ['XS', 'S', 'M', 'L', 'XL'],
            },
            {
                'nombre': 'Jean Skinny High Waist',
                'categoria': categorias['pantalones_mujer'],
                'descripcion': 'Jean skinny de tiro alto, diseño moderno que estiliza la figura. Mezclilla elástica.',
                'precio_base': Decimal('190.00'),
                'colores': ['Azul', 'Negro'],
                'tallas': ['26', '28', '30', '32', '34'],
            },
            {
                'nombre': 'Falda Plisada Midi',
                'categoria': categorias['faldas'],
                'descripcion': 'Falda midi plisada, elegante y versátil. Perfecta para looks de oficina o casuales.',
                'precio_base': Decimal('160.00'),
                'colores': ['Negro', 'Beige', 'Gris'],
                'tallas': ['XS', 'S', 'M', 'L'],
            },
        ]

        # Accesorios
        productos_accesorios = [
            {
                'nombre': 'Cartera de Cuero Clásica',
                'categoria': categorias['carteras'],
                'descripcion': 'Cartera de cuero genuino con diseño atemporal. Múltiples compartimentos.',
                'precio_base': Decimal('320.00'),
                'colores': ['Negro', 'Marrón', 'Beige'],
                'tallas': ['Única'],
            },
            {
                'nombre': 'Cinturón de Cuero Reversible',
                'categoria': categorias['cinturones'],
                'descripcion': 'Cinturón de cuero reversible, dos colores en uno. Hebilla elegante.',
                'precio_base': Decimal('95.00'),
                'colores': ['Negro', 'Marrón'],
                'tallas': ['85', '90', '95', '100', '105'],
            },
        ]

        # Combinar todos los productos
        todos_productos = productos_hombre + productos_mujer + productos_accesorios

        # Mapear colores y tallas a objetos ValorAtributo
        color_map = {v.valor: v for v in atributos['colores']}
        talla_map = {v.valor: v for v in atributos['tallas']}

        for prod_data in todos_productos:
            # Crear o obtener producto
            producto, created = Producto.objects.get_or_create(
                nombre=prod_data['nombre'],
                defaults={
                    'categoria': prod_data['categoria'],
                    'descripcion': prod_data['descripcion'],
                    'activo': True
                }
            )

            # Si ya existía, saltar la creación de variantes
            if not created:
                self.stdout.write(f'  ⚠ Producto ya existe: {producto.nombre}')
                continue

            # Agregar atributos al producto
            producto.atributos.add(
                Atributo.objects.get(nombre='Color'),
                Atributo.objects.get(nombre='Talla')
            )

            # Crear variantes para cada combinación color-talla
            for color_nombre in prod_data['colores']:
                for talla_valor in prod_data['tallas']:
                    # Calcular precio con variación aleatoria
                    precio_variante = prod_data['precio_base'] + Decimal(random.randint(-20, 30))
                    
                    # Decidir si tiene precio oferta (30% de probabilidad)
                    precio_oferta = None
                    if random.random() < 0.3:
                        precio_oferta = precio_variante * Decimal('0.85')

                    # Crear variante
                    variante = ProductoVariante.objects.create(
                        producto=producto,
                        precio=precio_variante,
                        precio_oferta=precio_oferta,
                        activo=True
                    )

                    # Agregar valores de atributos
                    color_obj = color_map.get(color_nombre)
                    if color_obj:
                        variante.valores.add(color_obj)
                    
                    # Para tallas especiales (números), crear o buscar el valor
                    if talla_valor.isdigit():
                        talla_atributo = Atributo.objects.get(nombre='Talla')
                        talla_obj, _ = ValorAtributo.objects.get_or_create(
                            atributo=talla_atributo,
                            valor=talla_valor
                        )
                        variante.valores.add(talla_obj)
                    else:
                        talla_obj = talla_map.get(talla_valor)
                        if talla_obj:
                            variante.valores.add(talla_obj)

                    variantes.append(variante)

            self.stdout.write(f'  ✓ Producto creado: {producto.nombre} con {producto.variantes.count()} variantes')

        self.stdout.write(f'  ✓ Total: {Producto.objects.count()} productos, {len(variantes)} variantes')
        return variantes

    def crear_stock(self, variantes, almacenes):
        """Crea stock para las variantes"""
        stocks_creados = 0
        for variante in variantes:
            for almacen in almacenes:
                # Cantidad aleatoria entre 5 y 100
                cantidad = random.randint(5, 100)
                _, created = Stock.objects.get_or_create(
                    variante=variante,
                    almacen=almacen,
                    defaults={'cantidad': cantidad}
                )
                if created:
                    stocks_creados += 1

        self.stdout.write(f'  ✓ {Stock.objects.count()} registros de stock en total ({stocks_creados} nuevos)')

    def crear_direcciones(self):
        """Crea direcciones para los usuarios existentes"""
        direcciones = []
        
        # Obtener usuarios que no son superusuario
        usuarios = User.objects.filter(is_superuser=False)

        direcciones_ejemplo = [
            {
                'street_address': 'Av. 6 de Agosto 2170',
                'apartment_address': 'Edificio Alameda, Piso 8',
                'city': 'La Paz',
                'state': 'La Paz',
                'country': 'Bolivia',
                'postal_code': '0000',
            },
            {
                'street_address': 'Calle Comercio 1234',
                'apartment_address': 'Depto 302',
                'city': 'Santa Cruz',
                'state': 'Santa Cruz',
                'country': 'Bolivia',
                'postal_code': '0000',
            },
            {
                'street_address': 'Av. América 456',
                'apartment_address': '',
                'city': 'Cochabamba',
                'state': 'Cochabamba',
                'country': 'Bolivia',
                'postal_code': '0000',
            },
        ]

        for usuario in usuarios:
            # Crear 1 o 2 direcciones por usuario
            num_direcciones = random.randint(1, 2)
            for i in range(num_direcciones):
                dir_data = random.choice(direcciones_ejemplo)
                direccion = Address.objects.create(
                    user=usuario,
                    address_type=Address.AddressType.SHIPPING,
                    street_address=dir_data['street_address'],
                    apartment_address=dir_data['apartment_address'],
                    city=dir_data['city'],
                    state=dir_data['state'],
                    country=dir_data['country'],
                    postal_code=dir_data['postal_code'],
                    is_default=(i == 0)  # La primera es predeterminada
                )
                direcciones.append(direccion)

        self.stdout.write(f'  ✓ {len(direcciones)} direcciones creadas')
        return direcciones

    def crear_pedidos_completados(self, variantes, direcciones):
        """Crea pedidos completados con pagos"""
        # Obtener usuarios con direcciones
        usuarios_con_direcciones = User.objects.filter(
            is_superuser=False,
            addresses__isnull=False
        ).distinct()

        if not usuarios_con_direcciones.exists():
            self.stdout.write(self.style.WARNING('  ⚠ No hay usuarios con direcciones'))
            return

        estados_completados = [
            Pedido.EstadoPedido.PAGADO,
            Pedido.EstadoPedido.ENVIADO,
            Pedido.EstadoPedido.ENTREGADO,
        ]

        # Crear entre 10 y 15 pedidos
        num_pedidos = random.randint(10, 15)
        
        for _ in range(num_pedidos):
            usuario = random.choice(usuarios_con_direcciones)
            direccion_usuario = usuario.addresses.filter(is_default=True).first()
            if not direccion_usuario:
                direccion_usuario = usuario.addresses.first()

            # Seleccionar entre 1 y 4 variantes aleatorias
            num_items = random.randint(1, 4)
            variantes_pedido = random.sample(variantes, min(num_items, len(variantes)))

            # Calcular total del pedido
            total_pedido = Decimal('0.00')
            items_data = []
            
            for variante in variantes_pedido:
                cantidad = random.randint(1, 3)
                precio = variante.precio_oferta if variante.precio_oferta else variante.precio
                subtotal = precio * cantidad
                total_pedido += subtotal
                items_data.append({
                    'variante': variante,
                    'cantidad': cantidad,
                    'precio': precio
                })

            # Crear el pedido con fecha aleatoria en los últimos 60 días
            dias_atras = random.randint(1, 60)
            fecha_pedido = timezone.now() - timedelta(days=dias_atras)

            pedido = Pedido.objects.create(
                usuario=usuario,
                email_cliente=usuario.email,
                total_pedido=total_pedido,
                estado=random.choice(estados_completados),
                creado_en=fecha_pedido,
                actualizado_en=fecha_pedido
            )

            # Crear dirección del pedido (snapshot)
            DireccionPedido.objects.create(
                pedido=pedido,
                nombre_completo=f"{usuario.first_name} {usuario.last_name}",
                calle_direccion=direccion_usuario.street_address,
                apartamento_direccion=direccion_usuario.apartment_address or '',
                ciudad=direccion_usuario.city,
                region_estado=direccion_usuario.state,
                pais=direccion_usuario.country,
                codigo_postal=direccion_usuario.postal_code,
                telefono=usuario.phone_number or ''
            )

            # Crear items del pedido
            for item_data in items_data:
                ItemPedido.objects.create(
                    pedido=pedido,
                    variante=item_data['variante'],
                    cantidad=item_data['cantidad'],
                    precio_unitario=item_data['precio']
                )

            # Crear pago completado
            metodo_pago = random.choice([
                Pago.MetodoPago.STRIPE,
                Pago.MetodoPago.QR_MANUAL
            ])

            pago = Pago.objects.create(
                pedido=pedido,
                monto=total_pedido,
                metodo_pago=metodo_pago,
                estado=Pago.EstadoPago.COMPLETADO,
                id_transaccion_pasarela=f"TXN-{random.randint(100000, 999999)}" if metodo_pago == Pago.MetodoPago.STRIPE else None,
                notas_admin="Pago verificado y procesado correctamente" if metodo_pago == Pago.MetodoPago.QR_MANUAL else None,
                creado_en=fecha_pedido,
                actualizado_en=fecha_pedido
            )

            self.stdout.write(
                f'  ✓ Pedido {pedido.id} creado: {len(items_data)} items, '
                f'Total: Bs. {total_pedido}, Estado: {pedido.estado}'
            )

        self.stdout.write(f'  ✓ Total: {num_pedidos} pedidos completados creados')
