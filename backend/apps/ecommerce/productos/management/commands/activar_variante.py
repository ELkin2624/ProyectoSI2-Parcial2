from django.core.management.base import BaseCommand
from apps.ecommerce.productos.models import ProductoVariante

class Command(BaseCommand):
    help = 'Activa una variante por su ID'

    def add_arguments(self, parser):
        parser.add_argument('variante_id', type=int, help='ID de la variante a activar')

    def handle(self, *args, **options):
        variante_id = options['variante_id']
        
        try:
            variante = ProductoVariante.objects.get(id=variante_id)
            
            self.stdout.write(f'Variante encontrada: {variante.sku}')
            self.stdout.write(f'Estado actual - Activo: {variante.activo}')
            self.stdout.write(f'Producto padre activo: {variante.producto.activo}')
            
            if not variante.activo:
                variante.activo = True
                variante.save()
                self.stdout.write(self.style.SUCCESS(f'✅ Variante {variante.sku} activada correctamente'))
            else:
                self.stdout.write(self.style.WARNING(f'⚠️  La variante ya estaba activa'))
                
            if not variante.producto.activo:
                self.stdout.write(self.style.WARNING(f'⚠️  ADVERTENCIA: El producto padre NO está activo'))
                
        except ProductoVariante.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ No se encontró variante con ID {variante_id}'))
