from django.test import TestCase
from appHotel.models import Sede

class SedeModelTest(TestCase):
    def setUp(self):
        self.sede_data = {
            'nombre': 'Sede Principal',
            'direccion': 'Av. Principal 123',
            'telefono': '+1234567890'
        }

    def test_create_sede(self):
        sede = Sede.objects.create(**self.sede_data)
        self.assertEqual(sede.nombre, self.sede_data['nombre'])
        self.assertEqual(sede.direccion, self.sede_data['direccion'])
        self.assertTrue(Sede.objects.filter(nombre=self.sede_data['nombre']).exists())

    def test_nombre_unique(self):
        Sede.objects.create(**self.sede_data)
        with self.assertRaises(Exception):
            Sede.objects.create(**self.sede_data)

    def test_str_representation(self):
        sede = Sede.objects.create(**self.sede_data)
        self.assertEqual(str(sede), sede.nombre)

    def test_telefono_optional(self):
        sede_data = self.sede_data.copy()
        del sede_data['telefono']
        sede = Sede.objects.create(**sede_data)
        self.assertIsNone(sede.telefono)