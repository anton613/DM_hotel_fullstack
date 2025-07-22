from django.utils import timezone
from django.contrib.auth.models import AbstractUser,BaseUserManager
from django.db import models,transaction
from django.core.exceptions import ValidationError
from decimal import Decimal

class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('rol', 'admin')
        return self.create_user(email, password, **extra_fields)

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
    objects = UsuarioManager()
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
    EstadoHabitacion = (
        ('Disponible', 'Disponible'),
        ('No Disponible', 'No disponible'),
    )
    
    numero = models.CharField(max_length=10, unique=False)
    tipo = models.ForeignKey(TipoHabitacion, on_delete=models.PROTECT)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    sede = models.ForeignKey(Sede, on_delete=models.PROTECT)
    estadoHabitacion = models.CharField(max_length=20,choices=EstadoHabitacion,default='Disponible',verbose_name= "Estado Habitacion")

    class Meta:
        db_table = 'habitaciones'
        verbose_name = 'Habitación'
        verbose_name_plural = 'Habitaciones'

    def __str__(self):
        return f"{self.numero} - {self.tipo}"
    
    def clean(self):
        if self.precio <= 0:
            raise ValidationError("El precio debe ser positivo")
        
    def save(self, *args, **kwargs):
        self.full_clean()  # Esto fuerza la validación al guardar
        super().save(*args, **kwargs)

class Cupon(models.Model):
    TIPO_DESCUENTO = (
        ('porcentaje', 'Porcentaje'),
        ('fijo', 'Monto fijo'),
    )

    codigo = models.CharField(
        max_length=20, 
        unique=True, 
        verbose_name="Código del cupón"
    )
    valor = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name="Valor del descuento"
    )
    max_usos = models.PositiveIntegerField(
        default=1, 
        verbose_name="Máximo uso permitido"
    )
    creado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name='cupones_creados',
        verbose_name="Creado por"
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de creación"
    )
    fecha_inicio = models.DateTimeField(
        verbose_name="Fecha de inicio de validez"
    )
    fecha_fin = models.DateTimeField(
        verbose_name="Fecha de fin de validez"
    )
    activo = models.BooleanField(
        default=True,
        verbose_name="¿Está activo?"
    )
    tipo = models.CharField(
        max_length=10, 
        choices=TIPO_DESCUENTO,
        default='porcentaje',
        verbose_name="Tipo de descuento"
    )

    class Meta:
        db_table = 'cupones'
        verbose_name = 'Cupón'
        verbose_name_plural = 'Cupones'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.codigo} - Descuento: {self.valor} ({self.get_tipo_display()})"

    def usos_disponibles(self):
        return self.max_usos - self.usuarios_asignados.filter(usado=True).count()
    
    def clean(self):
        if self.fecha_fin <= self.fecha_inicio:
            raise ValidationError("La fecha de fin debe ser posterior a la fecha de inicio")

class CuponUsuario(models.Model):
    cupon = models.ForeignKey(
        Cupon,
        on_delete=models.CASCADE,
        verbose_name="Cupón asignado",
        related_name='usuarios_asignados'
    )
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        verbose_name="Usuario asignado",
        related_name='cupones_asignados'
    )
    autorizado = models.BooleanField(
        default=True,
        verbose_name="¿Autorizado?"
    )
    usado = models.BooleanField(
        default=False,
        verbose_name="¿Usado?"
    )
    fecha_uso = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha de uso"
    )
    fecha_asignacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de asignación"
    )

    class Meta:
        db_table = 'cupones_usuarios'
        verbose_name = 'Asignación de cupón'
        verbose_name_plural = 'Asignaciones de cupones'
        unique_together = ('cupon', 'usuario')

    def __str__(self):
        return f"{self.usuario.email} - {self.cupon.codigo} ({'Usado' if self.usado else 'Disponible'})"

class Reserva(models.Model):
    ESTADOS = (
        ('Pendiente', 'Pendiente'),
        ('Check-In', 'En Curso'),
        ('Check-Out', 'Finalizada'),
        ('Cancelada', 'Cancelada'),
    )
    
    cliente = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='reservas',
        verbose_name="Cliente"
    )
    habitacion = models.ForeignKey(
        Habitacion,
        on_delete=models.CASCADE,
        verbose_name="Habitación"
    )
    fecha_inicio = models.DateField(
        verbose_name="Fecha de inicio"
    )
    fecha_fin = models.DateField(
        verbose_name="Fecha de fin"
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='Pendiente',
        verbose_name="Estado"
    )
    cupon = models.ForeignKey(
        Cupon,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Cupón aplicado"
    )
    cupon_usuario = models.ForeignKey(
        CuponUsuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Relación cupón-usuario"
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        editable=False,
        verbose_name="Total bruto"
    )
    total_descuento = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        editable=False,
        verbose_name="Total con descuento"
    )
    descuento_aplicado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        editable=False,
        verbose_name="Descuento aplicado"
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de creación"
    )

    class Meta:
        db_table = 'reservas'
        verbose_name = 'Reserva'
        verbose_name_plural = 'Reservas'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"Reserva #{self.id} - {self.cliente.email}"

    def calcular_total_bruto(self):
        """Calcula el total basado en las fechas y precio de la habitación"""
        if self.habitacion and self.fecha_inicio and self.fecha_fin:
            noches = (self.fecha_fin - self.fecha_inicio).days
            if noches > 0:
                return noches * self.habitacion.precio
        return 0

    def aplicar_descuento(self):
        total_bruto = self.calcular_total_bruto()
        descuento = Decimal('0')
        
        if (self.cupon and self.cupon_usuario and
            self.cupon_usuario.cupon == self.cupon and
            self.cupon_usuario.usuario == self.cliente and
            self.cupon.activo and
            self.cupon.fecha_inicio <= timezone.now() <= self.cupon.fecha_fin and
            not self.cupon_usuario.usado):
            
            if self.cupon.tipo == 'porcentaje':
                descuento = (total_bruto * Decimal(str(self.cupon.valor))) / Decimal('100')
            elif self.cupon.tipo == 'fijo':
                descuento = min(Decimal(str(self.cupon.valor)), total_bruto)
        
        total_descuento = total_bruto - descuento
        return total_bruto, total_descuento, descuento

    def save(self, *args, **kwargs):
        # Asegurar que los cálculos usen Decimal
        noches = Decimal((self.fecha_fin - self.fecha_inicio).days)
        self.total = noches * Decimal(str(self.habitacion.precio))
        
        # Reiniciar descuento
        self.descuento_aplicado = Decimal('0')
        
        if (self.cupon and self.cupon_usuario and
            self.cupon_usuario.cupon == self.cupon and
            self.cupon_usuario.usuario == self.cliente and
            self.cupon.activo and
            timezone.now() <= self.cupon.fecha_fin and
            not self.cupon_usuario.usado):
            
            if self.cupon.tipo == 'porcentaje':
                self.descuento_aplicado = (self.total * Decimal(str(self.cupon.valor))) / Decimal('100')
            elif self.cupon.tipo == 'fijo':
                self.descuento_aplicado = min(Decimal(str(self.cupon.valor)), self.total)
            
            # Marcar cupón como usado
            self.cupon_usuario.usado = True
            self.cupon_usuario.fecha_uso = timezone.now()
            self.cupon_usuario.save()
        
        self.total_descuento = self.total - self.descuento_aplicado
        super().save(*args, **kwargs)