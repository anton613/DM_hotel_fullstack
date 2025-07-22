from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta
from appHotel.models import (Usuario, Sede, TipoHabitacion, Habitacion, 
                    Cupon, CuponUsuario, Reserva)

class ReservaModelTest(TestCase):
    def setUp(self):
        # Crear datos base
        self.cliente = Usuario.objects.create_user(
            email='cliente@test.com',
            password='testpass123',
            rol='cliente'
        )
        self.sede = Sede.objects.create(
            nombre='Sede Test',
            direccion='Test Address'
        )
        self.tipo = TipoHabitacion.objects.create(
            nombre='Tipo Test',
            descripcion='Descripción Test'
        )
        self.habitacion = Habitacion.objects.create(
            numero='101',
            tipo=self.tipo,
            precio=100.00,
            sede=self.sede
        )
        
        # Datos para reserva
        hoy = date.today()
        self.reserva_data = {
            'cliente': self.cliente,
            'habitacion': self.habitacion,
            'fecha_inicio': hoy,
            'fecha_fin': hoy + timedelta(days=3),
            'estado': 'Pendiente'
        }
        
        # Crear cupón para pruebas
        self.admin = Usuario.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            rol='admin'
        )
        self.cupon = Cupon.objects.create(
            codigo='DESC20',
            valor=20.00,
            creado_por=self.admin,
            fecha_inicio=timezone.now(),
            fecha_fin=timezone.now() + timedelta(days=30),
            tipo='porcentaje'
        )
        self.cupon_usuario = CuponUsuario.objects.create(
            cupon=self.cupon,
            usuario=self.cliente
        )

    def test_create_reserva(self):
        reserva = Reserva.objects.create(**self.reserva_data)
        self.assertEqual(reserva.cliente, self.cliente)
        self.assertEqual(reserva.estado, 'Pendiente')
        self.assertEqual(reserva.total, 300.00)  # 3 noches * 100

    def test_calcular_total_bruto(self):
        reserva = Reserva.objects.create(**self.reserva_data)
        self.assertEqual(reserva.calcular_total_bruto(), 300.00)

    def test_aplicar_descuento(self):
        # Configuración EXTENDIDA
        self.cupon.activo = True
        self.cupon.valor = 20.00  # 20%
        self.cupon.tipo = 'porcentaje'
        self.cupon.fecha_inicio = timezone.now() - timedelta(days=1)
        self.cupon.fecha_fin = timezone.now() + timedelta(days=1)
        self.cupon.save()
        
        self.cupon_usuario.autorizado = True
        self.cupon_usuario.usado = False
        self.cupon_usuario.save()
        
        # Crear reserva SIN guardar para probar aplicar_descuento()
        reserva = Reserva(
            cliente=self.cliente,
            habitacion=self.habitacion,
            fecha_inicio=date.today(),
            fecha_fin=date.today() + timedelta(days=3),
            cupon=self.cupon,
            cupon_usuario=self.cupon_usuario
        )
        
        # Verificar cálculo
        total_bruto, total_descuento, descuento = reserva.aplicar_descuento()
        
        # Conversión a float para comparación (opcional)
        self.assertAlmostEqual(float(descuento), 60.00, places=2,
                            msg=f"Descuento incorrecto. Esperado: ~60.00, Obtenido: {descuento}")
        
        self.assertAlmostEqual(float(total_descuento), 240.00, places=2,
                            msg=f"Total con descuento incorrecto. Esperado: ~240.00, Obtenido: {total_descuento}")
    
    def test_save_method_applies_discount(self):
        reserva = Reserva(
            **self.reserva_data,
            cupon=self.cupon,
            cupon_usuario=self.cupon_usuario
        )
        reserva.save()
        
        # Verificar que los campos se calcularon correctamente
        self.assertEqual(reserva.total, 300.00)
        self.assertEqual(reserva.descuento_aplicado, 60.00)
        self.assertEqual(reserva.total_descuento, 240.00)
        
        # Verificar que el cupón se marcó como usado
        self.cupon_usuario.refresh_from_db()
        self.assertTrue(self.cupon_usuario.usado)
        self.assertIsNotNone(self.cupon_usuario.fecha_uso)

    def test_estado_choices(self):
        reserva = Reserva.objects.create(**self.reserva_data)
        self.assertIn(reserva.estado, [choice[0] for choice in Reserva.ESTADOS])

    def test_str_representation(self):
        reserva = Reserva.objects.create(**self.reserva_data)
        expected_str = f"Reserva #{reserva.id} - {self.cliente.email}"
        self.assertEqual(str(reserva), expected_str)