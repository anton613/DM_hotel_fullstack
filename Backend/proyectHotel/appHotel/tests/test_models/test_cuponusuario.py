from django.test import TestCase
from django.utils import timezone
from appHotel.models import Usuario, Cupon, CuponUsuario
from datetime import timedelta

class CuponUsuarioModelTest(TestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            rol='admin'
        )
        self.cliente = Usuario.objects.create_user(
            email='cliente@test.com',
            password='testpass123',
            rol='cliente'
        )
        self.cupon = Cupon.objects.create(
            codigo='TEST20',
            valor=20.00,
            creado_por=self.admin,
            fecha_inicio=timezone.now(),
            fecha_fin=timezone.now() + timedelta(days=30),
            tipo='porcentaje'
        )
        self.cupon_usuario_data = {
            'cupon': self.cupon,
            'usuario': self.cliente
        }

    def test_create_cupon_usuario(self):
        cupon_usuario = CuponUsuario.objects.create(**self.cupon_usuario_data)
        self.assertEqual(cupon_usuario.cupon, self.cupon)
        self.assertEqual(cupon_usuario.usuario, self.cliente)
        self.assertTrue(cupon_usuario.autorizado)
        self.assertFalse(cupon_usuario.usado)

    def test_unique_together(self):
        CuponUsuario.objects.create(**self.cupon_usuario_data)
        with self.assertRaises(Exception):
            CuponUsuario.objects.create(**self.cupon_usuario_data)

    def test_str_representation(self):
        cupon_usuario = CuponUsuario.objects.create(**self.cupon_usuario_data)
        expected_str = f"{self.cliente.email} - {self.cupon.codigo} (Disponible)"
        self.assertEqual(str(cupon_usuario), expected_str)

    def test_mark_as_used(self):
        cupon_usuario = CuponUsuario.objects.create(**self.cupon_usuario_data)
        cupon_usuario.usado = True
        cupon_usuario.fecha_uso = timezone.now()
        cupon_usuario.save()
        self.assertTrue(cupon_usuario.usado)
        self.assertIsNotNone(cupon_usuario.fecha_uso)