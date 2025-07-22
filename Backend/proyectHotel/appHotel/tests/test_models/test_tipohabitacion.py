from django.test import TestCase
from appHotel.models import TipoHabitacion

class TipoHabitacionModelTest(TestCase):
    def setUp(self):
        self.tipo_data = {
            'nombre': 'Suite Presidencial',
            'descripcion': 'La mejor habitación del hotel'
        }

    def test_create_tipo_habitacion(self):
        tipo = TipoHabitacion.objects.create(**self.tipo_data)
        self.assertFalse(tipo.imagen1)  # Cambiado de assertIsNone a assertFalse
        self.assertEqual(tipo.nombre, self.tipo_data['nombre'])

    def test_str_representation(self):
        tipo = TipoHabitacion.objects.create(**self.tipo_data)
        self.assertEqual(str(tipo), tipo.nombre)

    def test_imagenes_optional(self):
        tipo = TipoHabitacion.objects.create(**self.tipo_data)
        self.assertFalse(tipo.imagen1)
        self.assertFalse(tipo.imagen2)
        self.assertFalse(tipo.imagen3)