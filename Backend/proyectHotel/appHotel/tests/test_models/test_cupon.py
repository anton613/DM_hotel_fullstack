from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from appHotel.models import Usuario, Cupon
from django.core.exceptions import ValidationError

class CuponModelTest(TestCase):
    def setUp(self):
        self.user = Usuario.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            rol='admin'
        )
        self.cupon_data = {
            'codigo': 'TEST20',
            'valor': 20.00,
            'max_usos': 10,
            'creado_por': self.user,
            'fecha_inicio': timezone.now(),
            'fecha_fin': timezone.now() + timedelta(days=30),
            'tipo': 'porcentaje'
        }

    def test_create_cupon(self):
        cupon = Cupon.objects.create(**self.cupon_data)
        self.assertEqual(cupon.codigo, self.cupon_data['codigo'])
        self.assertEqual(cupon.tipo, 'porcentaje')
        self.assertTrue(cupon.activo)

    def test_codigo_unique(self):
        Cupon.objects.create(**self.cupon_data)
        with self.assertRaises(Exception):
            Cupon.objects.create(**self.cupon_data)

    def test_usos_disponibles(self):
        cupon = Cupon.objects.create(**self.cupon_data)
        self.assertEqual(cupon.usos_disponibles(), 10)

    def test_str_representation(self):
        cupon = Cupon.objects.create(**self.cupon_data)
        expected_str = f"{cupon.codigo} - Descuento: {cupon.valor} ({cupon.get_tipo_display()})"
        self.assertEqual(str(cupon), expected_str)

    def test_fecha_fin_after_fecha_inicio(self):
        with self.assertRaises(ValidationError):
            cupon = Cupon(
                codigo='INVALID',
                valor=10.00,  # Campo requerido que faltaba
                creado_por=self.user,
                fecha_inicio=timezone.now(),
                fecha_fin=timezone.now() - timedelta(days=1),
                tipo='fijo'
            )
            cupon.full_clean()  # Esto activará la validación