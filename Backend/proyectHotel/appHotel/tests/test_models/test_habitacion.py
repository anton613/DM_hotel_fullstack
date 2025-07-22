from django.test import TestCase
from appHotel.models import Sede, TipoHabitacion, Habitacion
from django.core.exceptions import ValidationError

class HabitacionModelTest(TestCase):
    def setUp(self):
        self.sede = Sede.objects.create(
            nombre='Sede Test',
            direccion='Test Address'
        )
        self.tipo = TipoHabitacion.objects.create(
            nombre='Tipo Test',
            descripcion='Descripción Test'
        )
        self.habitacion_data = {
            'numero': '101',
            'tipo': self.tipo,
            'precio': 150.00,
            'sede': self.sede,
            'estadoHabitacion': 'Disponible'
        }

    def test_create_habitacion(self):
        habitacion = Habitacion.objects.create(**self.habitacion_data)
        self.assertEqual(habitacion.numero, self.habitacion_data['numero'])
        self.assertEqual(habitacion.tipo, self.tipo)
        self.assertEqual(habitacion.estadoHabitacion, 'Disponible')

    def test_estado_choices(self):
        habitacion = Habitacion.objects.create(**self.habitacion_data)
        self.assertIn(habitacion.estadoHabitacion, 
                     [choice[0] for choice in Habitacion.EstadoHabitacion])

    def test_str_representation(self):
        habitacion = Habitacion.objects.create(**self.habitacion_data)
        expected_str = f"{habitacion.numero} - {habitacion.tipo}"
        self.assertEqual(str(habitacion), expected_str)

    def test_precio_positive(self):
        with self.assertRaises(ValidationError):
            habitacion = Habitacion(
                numero='101',
                tipo=self.tipo,
                precio=-100,
                sede=self.sede,
                estadoHabitacion='Disponible'
            )
            habitacion.full_clean()