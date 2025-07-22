# appHotel/tests/test_models/test_usuario.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

Usuario = get_user_model()

class UsuarioModelTest(TestCase):
    def setUp(self):
        self.user_data = {
            'email': 'cliente@test.com',
            'password': 'testpass123',
            'rol': 'cliente'
        }
        self.admin_data = {
            'email': 'admin@test.com',
            'password': 'adminpass123'
        }

    def test_create_standard_user(self):
        """Prueba la creación de un usuario normal"""
        user = Usuario.objects.create_user(**self.user_data)
        self.assertEqual(user.email, self.user_data['email'])
        self.assertEqual(user.rol, 'cliente')
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.is_active)

    def test_create_superuser(self):
        """Prueba la creación de un superusuario"""
        admin = Usuario.objects.create_superuser(**self.admin_data)
        self.assertEqual(admin.email, self.admin_data['email'])
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)
        self.assertEqual(admin.rol, 'admin')

    def test_email_is_required(self):
        """Verifica que el email es obligatorio"""
        with self.assertRaises(ValueError):
            Usuario.objects.create_user(email='', password='testpass123')

    def test_email_unique(self):
        """Verifica que el email debe ser único"""
        Usuario.objects.create_user(**self.user_data)
        with self.assertRaises(Exception):
            Usuario.objects.create_user(**self.user_data)

    def test_rol_choices(self):
        """Verifica que solo se permiten roles válidos"""
        user = Usuario.objects.create_user(**self.user_data)
        valid_roles = [choice[0] for choice in Usuario.ROLES]
        self.assertIn(user.rol, valid_roles)

    def test_str_representation(self):
        """Prueba la representación en string del modelo"""
        user = Usuario.objects.create_user(**self.user_data)
        expected_str = f"{user.email} ({user.get_rol_display()})"
        self.assertEqual(str(user), expected_str)

    def test_default_values(self):
        """Verifica los valores por defecto"""
        user = Usuario.objects.create_user(
            email='test2@example.com',
            password='testpass123'
        )
        self.assertEqual(user.rol, 'cliente')
        self.assertIsNone(user.telefono)
        self.assertIsNone(user.direccion)

    def test_required_fields(self):
        """Verifica que no hay campos requeridos adicionales"""
        self.assertEqual(Usuario.REQUIRED_FIELDS, [])