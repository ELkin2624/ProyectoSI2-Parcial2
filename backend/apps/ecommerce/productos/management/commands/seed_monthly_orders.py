from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import datetime, timedelta
import calendar
import random

from apps.ecommerce.productos.models import ProductoVariante
from apps.ecommerce.pedidos.models import Pedido, ItemPedido, DireccionPedido
from apps.ecommerce.pagos.models import Pago
from apps.usuarios.models import Address

User = get_user_model()


class Command(BaseCommand):
    help = 'Genera pedidos mensuales (últimos 12 meses) para usuarios específicos'

    TARGET_USERS = [
        # emails provistos por el usuario
        'apazaedixon98@gmail.com',
        'juan@gmail.com',
        'roberto@gmail.com',
    ]

    def handle(self, *args, **options):
        self.stdout.write('📆 Generando pedidos mensuales (últimos 12 meses) para usuarios objetivo...')

        # Obtener primer día del mes actual
        now = timezone.now()
        month_start = now.replace(day=1, hour=12, minute=0, second=0, microsecond=0)

        # Construir lista de primeros días de los últimos 12 meses (incluye mes actual)
        months = []
        current = month_start
        for i in range(12):
            months.append(current)
            prev = (current - timedelta(days=1)).replace(day=1)
            current = prev

        variantes = list(ProductoVariante.objects.filter(activo=True))
        if not variantes:
            self.stdout.write(self.style.WARNING('  ⚠ No hay variantes activas en la base de datos. Ejecute el seed de productos primero.'))
            return

        created_count = 0

        with transaction.atomic():
            for email in self.TARGET_USERS:
                user = User.objects.filter(email=email).first()
                if not user:
                    # Crear usuario mínimo si no existe (nombre básico)
                    user = User.objects.create_user(
                        email=email,
                        password='ChangeMe123!',
                        first_name=email.split('@')[0].capitalize(),
                        last_name=''
                    )
                    self.stdout.write(self.style.NOTICE(f'  ➕ Usuario creado temporal: {email}'))

                # Asegurar que el usuario tenga al menos una dirección
                direccion = user.addresses.filter(is_default=True).first()
                if not direccion:
                    direccion = Address.objects.create(
                        user=user,
                        address_type=Address.AddressType.SHIPPING,
                        street_address='Av. Ejemplo 123',
                        apartment_address='',
                        city='La Paz',
                        state='La Paz',
                        country='Bolivia',
                        postal_code='0000',
                        is_default=True
                    )

                for month in months:
                    year = month.year
                    mon = month.month

                    # Si ya existen pedidos para ese usuario en ese mes, saltar (evita duplicados)
                    if Pedido.objects.filter(usuario=user, creado_en__year=year, creado_en__month=mon).exists():
                        continue

                    # Crear entre 1 y 3 pedidos en ese mes
                    for _ in range(random.randint(1, 3)):
                        # Escoger un día aleatorio del mes
                        last_day = calendar.monthrange(year, mon)[1]
                        day = random.randint(1, last_day)
                        hora = random.randint(9, 20)
                        fecha_pedido = timezone.make_aware(datetime(year, mon, day, hora, 0, 0), timezone.get_current_timezone())

                        # Seleccionar entre 1 y 4 variantes
                        items = random.sample(variantes, k=random.randint(1, min(4, len(variantes))))

                        total = Decimal('0.00')
                        items_data = []
                        for v in items:
                            qty = random.randint(1, 3)
                            price = v.precio_oferta if v.precio_oferta else v.precio
                            subtotal = price * qty
                            total += subtotal
                            items_data.append({'variante': v, 'cantidad': qty, 'precio': price})

                        # Determinar estado: pedidos antiguos están ENTREGADO, recientes PAgado/Enviado
                        months_ago = (now.year - year) * 12 + (now.month - mon)
                        if months_ago >= 3:
                            estado = Pedido.EstadoPedido.ENTREGADO
                        elif months_ago == 2:
                            estado = Pedido.EstadoPedido.ENVIADO
                        else:
                            estado = Pedido.EstadoPedido.PAGADO

                        pedido = Pedido.objects.create(
                            usuario=user,
                            email_cliente=user.email,
                            total_pedido=total,
                            estado=estado,
                            creado_en=fecha_pedido,
                            actualizado_en=fecha_pedido
                        )

                        # Crear snapshot de dirección
                        DireccionPedido.objects.create(
                            pedido=pedido,
                            nombre_completo=f"{user.first_name} {user.last_name}".strip(),
                            calle_direccion=direccion.street_address,
                            apartamento_direccion=direccion.apartment_address or '',
                            ciudad=direccion.city,
                            region_estado=direccion.state,
                            pais=direccion.country,
                            codigo_postal=direccion.postal_code,
                            telefono=user.phone_number or ''
                        )

                        # Crear items
                        for it in items_data:
                            ItemPedido.objects.create(
                                pedido=pedido,
                                variante=it['variante'],
                                cantidad=it['cantidad'],
                                precio_unitario=it['precio']
                            )

                        # Crear pago completado
                        metodo = random.choice([Pago.MetodoPago.STRIPE, Pago.MetodoPago.QR_MANUAL])
                        Pago.objects.create(
                            pedido=pedido,
                            monto=total,
                            metodo_pago=metodo,
                            estado=Pago.EstadoPago.COMPLETADO,
                        )

                        created_count += 1

        self.stdout.write(self.style.SUCCESS(f'  ✓ {created_count} pedidos mensuales creados para usuarios objetivo'))
