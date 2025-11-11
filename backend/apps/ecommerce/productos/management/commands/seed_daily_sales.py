# apps/ecommerce/productos/management/commands/seed_daily_sales.py
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta, datetime
import random

from apps.ecommerce.productos.models import ProductoVariante
from apps.ecommerce.pedidos.models import Pedido, ItemPedido, DireccionPedido
from apps.ecommerce.pagos.models import Pago
from apps.usuarios.models import Address

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed de ventas diarias durante 3-4 meses para análisis'

    def add_arguments(self, parser):
        parser.add_argument(
            '--months',
            type=int,
            default=4,
            help='Número de meses de ventas a generar (default: 4)'
        )
        parser.add_argument(
            '--min-daily-orders',
            type=int,
            default=3,
            help='Mínimo de pedidos por día (default: 3)'
        )
        parser.add_argument(
            '--max-daily-orders',
            type=int,
            default=12,
            help='Máximo de pedidos por día (default: 12)'
        )

    def handle(self, *args, **options):
        months = options['months']
        min_daily_orders = options['min_daily_orders']
        max_daily_orders = options['max_daily_orders']

        self.stdout.write(self.style.SUCCESS(
            f'🌱 Iniciando seed de ventas diarias ({months} meses)...'
        ))

        # Obtener datos necesarios (fuera de transaction)
        variantes = list(ProductoVariante.objects.filter(activo=True).select_related('producto'))
        if not variantes:
            self.stdout.write(self.style.ERROR('❌ No hay variantes de productos disponibles'))
            return

        usuarios = list(User.objects.filter(is_superuser=False, is_active=True).prefetch_related('addresses'))
        if not usuarios:
            self.stdout.write(self.style.ERROR('❌ No hay usuarios disponibles'))
            return

        # Verificar que los usuarios tengan direcciones
        usuarios_con_direcciones = []
        for usuario in usuarios:
            if usuario.addresses.exists():
                usuarios_con_direcciones.append(usuario)

        if not usuarios_con_direcciones:
            self.stdout.write(self.style.WARNING('⚠️  No hay usuarios con direcciones, creando direcciones...'))
            usuarios_con_direcciones = self.crear_direcciones_faltantes(usuarios)

        # Calcular fechas
        fecha_fin = timezone.now()
        fecha_inicio = fecha_fin - timedelta(days=30 * months)

        self.stdout.write(f'📅 Generando ventas desde {fecha_inicio.date()} hasta {fecha_fin.date()}')

        # Generar ventas por día con transacciones en batch
        total_pedidos = 0
        fecha_actual = fecha_inicio
        batch_size = 7  # Procesar 1 semana a la vez

        dias_procesados = 0
        total_dias = (fecha_fin - fecha_inicio).days + 1

        while fecha_actual <= fecha_fin:
            # Procesar un batch de días
            with transaction.atomic():
                pedidos_batch = []
                items_batch = []
                direcciones_batch = []
                pagos_batch = []

                for _ in range(batch_size):
                    if fecha_actual > fecha_fin:
                        break

                    # Número aleatorio de pedidos por día
                    num_pedidos_dia = random.randint(min_daily_orders, max_daily_orders)
                    
                    # Variar según el día de la semana (más ventas en fin de semana)
                    if fecha_actual.weekday() in [5, 6]:  # Sábado y Domingo
                        num_pedidos_dia = int(num_pedidos_dia * 1.3)
                    
                    # Temporadas especiales (ejemplo: diciembre más ventas)
                    if fecha_actual.month == 12:
                        num_pedidos_dia = int(num_pedidos_dia * 1.5)

                    for _ in range(num_pedidos_dia):
                        # Hora aleatoria del día
                        hora = random.randint(8, 22)
                        minuto = random.randint(0, 59)
                        segundo = random.randint(0, 59)
                        
                        fecha_pedido = fecha_actual.replace(
                            hour=hora, 
                            minute=minuto, 
                            second=segundo,
                            microsecond=0
                        )

                        # Preparar datos del pedido
                        pedido_data = self.preparar_pedido_aleatorio(
                            usuarios_con_direcciones,
                            variantes,
                            fecha_pedido
                        )
                        
                        if pedido_data:
                            pedidos_batch.append(pedido_data)

                    # Avanzar al siguiente día
                    fecha_actual += timedelta(days=1)
                    dias_procesados += 1

                # Crear todos los pedidos del batch
                if pedidos_batch:
                    pedidos_creados = Pedido.objects.bulk_create([p['pedido'] for p in pedidos_batch])
                    
                    # Asociar IDs a los pedidos
                    for idx, pedido in enumerate(pedidos_creados):
                        pedidos_batch[idx]['pedido'] = pedido
                        # Preparar direcciones con FK
                        direccion = pedidos_batch[idx]['direccion']
                        direccion.pedido = pedido
                        direcciones_batch.append(direccion)
                        
                        # Preparar items con FK
                        for item in pedidos_batch[idx]['items']:
                            item.pedido = pedido
                            items_batch.append(item)
                        
                        # Preparar pagos con FK
                        if pedidos_batch[idx]['pago']:
                            pago = pedidos_batch[idx]['pago']
                            pago.pedido = pedido
                            pagos_batch.append(pago)

                    # Bulk create de direcciones, items y pagos
                    DireccionPedido.objects.bulk_create(direcciones_batch)
                    ItemPedido.objects.bulk_create(items_batch)
                    if pagos_batch:
                        Pago.objects.bulk_create(pagos_batch)

                    total_pedidos += len(pedidos_creados)
                    
                    # Mostrar progreso
                    progreso = (dias_procesados / total_dias) * 100
                    self.stdout.write(f'  📊 Progreso: {progreso:.1f}% ({dias_procesados}/{total_dias} días) - {total_pedidos} pedidos')

        self.stdout.write(self.style.SUCCESS(
            f'✅ ¡Seed completado! {total_pedidos} pedidos generados'
        ))

    def crear_direcciones_faltantes(self, usuarios):
        """Crea direcciones para usuarios que no tienen"""
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

        usuarios_con_direcciones = []
        for usuario in usuarios:
            if not usuario.addresses.exists():
                dir_data = random.choice(direcciones_ejemplo)
                Address.objects.create(
                    user=usuario,
                    address_type=Address.AddressType.SHIPPING,
                    street_address=dir_data['street_address'],
                    apartment_address=dir_data['apartment_address'],
                    city=dir_data['city'],
                    state=dir_data['state'],
                    country=dir_data['country'],
                    postal_code=dir_data['postal_code'],
                    is_default=True
                )
            usuarios_con_direcciones.append(usuario)

        return usuarios_con_direcciones

    def preparar_pedido_aleatorio(self, usuarios, variantes, fecha_pedido):
        """Prepara datos de un pedido aleatorio para bulk create"""
        try:
            # Seleccionar usuario aleatorio
            usuario = random.choice(usuarios)
            
            # Obtener dirección del usuario (ya precargada con prefetch_related)
            direccion_usuario = None
            for addr in usuario.addresses.all():
                if addr.is_default:
                    direccion_usuario = addr
                    break
            if not direccion_usuario and usuario.addresses.all():
                direccion_usuario = list(usuario.addresses.all())[0]
            
            if not direccion_usuario:
                return None

            # Seleccionar entre 1 y 5 variantes aleatorias
            num_items = random.randint(1, 5)
            variantes_pedido = random.sample(variantes, min(num_items, len(variantes)))

            # Calcular total del pedido
            total_pedido = Decimal('0.00')
            items_list = []
            
            for variante in variantes_pedido:
                # Cantidad aleatoria (más probabilidad de 1-2 unidades)
                cantidad = random.choices([1, 2, 3, 4], weights=[50, 30, 15, 5])[0]
                precio = variante.precio_oferta if variante.precio_oferta else variante.precio
                subtotal = precio * cantidad
                total_pedido += subtotal
                
                # Crear objeto ItemPedido (sin guardar)
                item = ItemPedido(
                    variante=variante,
                    cantidad=cantidad,
                    precio_unitario=precio
                )
                items_list.append(item)

            # Determinar estado del pedido según la antigüedad
            dias_desde_pedido = (timezone.now() - fecha_pedido).days
            
            if dias_desde_pedido > 30:
                # Pedidos antiguos: mayoría entregados
                estado = random.choices(
                    [
                        Pedido.EstadoPedido.ENTREGADO,
                        Pedido.EstadoPedido.ENVIADO,
                        Pedido.EstadoPedido.CANCELADO
                    ],
                    weights=[85, 10, 5]
                )[0]
            elif dias_desde_pedido > 7:
                # Pedidos recientes: en proceso o entregados
                estado = random.choices(
                    [
                        Pedido.EstadoPedido.ENTREGADO,
                        Pedido.EstadoPedido.ENVIADO,
                        Pedido.EstadoPedido.PAGADO
                    ],
                    weights=[70, 20, 10]
                )[0]
            else:
                # Pedidos muy recientes: varios estados
                estado = random.choices(
                    [
                        Pedido.EstadoPedido.PAGADO,
                        Pedido.EstadoPedido.ENVIADO,
                        Pedido.EstadoPedido.ENTREGADO,
                        Pedido.EstadoPedido.PENDIENTE
                    ],
                    weights=[40, 30, 20, 10]
                )[0]

            # Crear objeto Pedido (sin guardar)
            pedido = Pedido(
                usuario=usuario,
                email_cliente=usuario.email,
                total_pedido=total_pedido,
                estado=estado,
                creado_en=fecha_pedido,
                actualizado_en=fecha_pedido
            )

            # Crear objeto DireccionPedido (sin guardar, pedido se asignará después)
            direccion = DireccionPedido(
                nombre_completo=f"{usuario.first_name} {usuario.last_name}",
                calle_direccion=direccion_usuario.street_address,
                apartamento_direccion=direccion_usuario.apartment_address or '',
                ciudad=direccion_usuario.city,
                region_estado=direccion_usuario.state,
                pais=direccion_usuario.country,
                codigo_postal=direccion_usuario.postal_code,
                telefono=usuario.phone_number or ''
            )

            # Preparar pago si el pedido no está pendiente
            pago = None
            if estado != Pedido.EstadoPedido.PENDIENTE:
                metodo_pago = random.choices(
                    [Pago.MetodoPago.STRIPE, Pago.MetodoPago.QR_MANUAL],
                    weights=[70, 30]
                )[0]

                estado_pago = Pago.EstadoPago.COMPLETADO if estado != Pedido.EstadoPedido.CANCELADO else Pago.EstadoPago.FALLIDO

                pago = Pago(
                    monto=total_pedido,
                    metodo_pago=metodo_pago,
                    estado=estado_pago,
                    id_transaccion_pasarela=f"TXN-{random.randint(100000, 999999)}" if metodo_pago == Pago.MetodoPago.STRIPE else None,
                    notas_admin="Pago verificado automáticamente" if metodo_pago == Pago.MetodoPago.QR_MANUAL else None,
                    creado_en=fecha_pedido,
                    actualizado_en=fecha_pedido
                )

            return {
                'pedido': pedido,
                'direccion': direccion,
                'items': items_list,
                'pago': pago
            }

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error preparando pedido: {str(e)}'))
            return None
