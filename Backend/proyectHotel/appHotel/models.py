from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    ROLES = (
        ('admin', 'Administrador'),
        ('cliente', 'Cliente'),
        ('empleado', 'Empleado'),
    )

    rol = models.CharField(max_length=20, choices=ROLES, default='cliente', verbose_name='Rol del usuario')
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)

    username = None  # Eliminar username
    email = models.EmailField(unique=True)  # Usar email como identificador

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Puedes añadir campos obligatorios adicionales aquí

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f"{self.email} ({self.get_rol_display()})"

class Sede(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    direccion = models.TextField()
    telefono = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'sedes'
        verbose_name = 'Sede'
        verbose_name_plural = 'Sedes'

    def __str__(self):
        return self.nombre

class TipoHabitacion(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    
    imagen1 = models.ImageField(
        upload_to='tipos_habitacion/',
        blank=True,
        null=True,
        verbose_name="Imagen Principal"
    )
    
    imagen2 = models.ImageField(
        upload_to='tipos_habitacion/',
        blank=True,
        null=True,
        verbose_name="Imagen Secundaria 1"
    )
    
    imagen3 = models.ImageField(
        upload_to='tipos_habitacion/',
        blank=True,
        null=True,
        verbose_name="Imagen Secundaria 2"
    )
    
    def __str__(self):
        return self.nombre

class Habitacion(models.Model):
    numero = models.CharField(max_length=10, unique=True)
    tipo = models.ForeignKey(TipoHabitacion, on_delete=models.PROTECT)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    sede = models.ForeignKey(Sede, on_delete=models.PROTECT)

    class Meta:
        db_table = 'habitaciones'
        verbose_name = 'Habitación'
        verbose_name_plural = 'Habitaciones'

    def __str__(self):
        return f"{self.numero} - {self.tipo}"

class Reserva(models.Model):
    
    Estado = (
        ('Pendiente', 'Pendiente'),
        ('Check-In', 'En Curso'),
        ('Check-Out', 'Finalizada'),
        ('Cancelada', 'Cancelada'),
    )
    
    cliente = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='reservas')
    habitacion = models.ForeignKey(Habitacion, on_delete=models.CASCADE)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    total = models.DecimalField(  # 👈 Campo guardado en BD
        max_digits=10, 
        decimal_places=2, 
        default=0
    )
    estado = models.CharField(max_length=20, choices=Estado, default='Pendiente')

    def calcular_total(self):
        """Calcula el total basado en fechas y precio de la habitación."""
        if self.habitacion and self.fecha_inicio and self.fecha_fin:
            noches = (self.fecha_fin - self.fecha_inicio).days
            if noches > 0:
                return noches * self.habitacion.precio
        return 0

    def save(self, *args, **kwargs):
        """Calcula y guarda el total automáticamente al guardar."""
        self.total = self.calcular_total()
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'reservas'
        verbose_name = 'Reserva'
        verbose_name_plural = 'Reservas'

    def __str__(self):
        return f"Reserva de {self.cliente.email} para {self.habitacion.numero} del {self.fecha_inicio} al {self.fecha_fin}"