from django.contrib import admin
from .models import (Usuario , Sede , TipoHabitacion , Habitacion, Reserva,Cupon,CuponUsuario)
from django.utils.html import mark_safe

# Register your models here.
@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('first_name','last_name','email','rol','is_active','is_staff')
    list_filter = ('is_active','is_staff','rol')
    list_per_page = 25
    search_fields = ('first_name','last_name')
    ordering = ('date_joined',)

@admin.register(Sede)
class SedeAdmin(admin.ModelAdmin):
    list_display = ('nombre','direccion','telefono')
@admin.register(Habitacion)
class HabitacionAdmin(admin.ModelAdmin):
    list_display = ('numero','tipo','precio','sede','estadoHabitacion')
    list_filter = ('tipo','sede','estadoHabitacion')
    search_fields = ('numero',)
    list_per_page = 15

@admin.register(Cupon)
class CuponAdmin(admin.ModelAdmin):
    list_display = ('codigo','valor','tipo','fecha_inicio_formateada','fecha_fin_formateada','activo')
    list_filter = ('activo','tipo',)
    list_per_page = 10
    # Método para formatear fecha_inicio
    def fecha_inicio_formateada(self,obj):
        return obj.fecha_inicio.strftime("%d/%m/%Y")
    fecha_inicio_formateada.short_description = 'Fecha inicio'
    fecha_inicio_formateada.admin_order_field = 'fecha_inicio'
    # Método para formatear fecha_fin
    def fecha_fin_formateada(self,obj):
        return obj.fecha_inicio.strftime("%d/%m/%Y")
    fecha_fin_formateada.short_description = 'Fecha fin'
    fecha_fin_formateada.admin_order_field = 'fecha_fin'

@admin.register(CuponUsuario)
class CuponUsuarioAdmin(admin.ModelAdmin):
    list_display = ('codigo_cupon', 'nombre_cliente', 'fecha_uso_formateado', 'fecha_asignacion_formateado', 'usado')
    list_filter = ('usado',)
    list_per_page = 10
    
    # Método para mostrar el código del cupón
    def codigo_cupon(self, obj):
        return obj.cupon.codigo
    codigo_cupon.short_description = 'Código Cupón'
    codigo_cupon.admin_order_field = 'cupon__codigo'
    
    # Método para mostrar el nombre completo del cliente
    def nombre_cliente(self, obj):
        return f"{obj.usuario.first_name} {obj.usuario.last_name}"
    nombre_cliente.short_description = 'Cliente'
    nombre_cliente.admin_order_field = 'usuario__first_name'  # Fixed from 'cliente__first_name'
    
    # Método para formatear fecha_uso
    def fecha_uso_formateado(self, obj):
        return obj.fecha_uso.strftime("%d/%m/%Y") if obj.fecha_uso else ""
    fecha_uso_formateado.short_description = 'Fecha uso'
    fecha_uso_formateado.admin_order_field = 'fecha_uso'

    # Método para formatear fecha_asignacion
    def fecha_asignacion_formateado(self, obj):
        return obj.fecha_asignacion.strftime("%d/%m/%Y")
    fecha_asignacion_formateado.short_description = 'Fecha asignación'  # Fixed description
    fecha_asignacion_formateado.admin_order_field = 'fecha_asignacion'  # Fixed order field

# admin.site.register(Reserva)
@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = (
        'nombre_cliente', 'habitacion', 'sede', 'fecha_inicio_formateada', 
        'fecha_fin_formateada', 'estado', 'total', 'descuento_aplicado', 
        'total_descuento', 'detalle_cupon')
    list_filter = ('estado', 'fecha_inicio', 'fecha_fin', 'habitacion__sede')
    readonly_fields = ('total', 'total_descuento', 'descuento_aplicado', 'detalle_cupon')
    list_per_page = 10
    search_fields = ['cliente__first_name', 'cliente__last_name', 'cliente__email']
    ordering = ('fecha_creacion',)
    
    fieldsets = (
        (None, {
            'fields': ('cliente', 'habitacion', 'fecha_inicio', 'fecha_fin', 'estado')
        }),
        ('Información de Pago', {
            'fields': ('total', 'descuento_aplicado', 'total_descuento', 'cupon', 'detalle_cupon')
        }),
    )

    def nombre_cliente(self, obj):
        if obj.cliente:
            return f"{obj.cliente.first_name or ''} {obj.cliente.last_name or ''}".strip()
        return "Sin cliente"
    nombre_cliente.short_description = 'Cliente'

    def sede(self, obj):
        if obj.habitacion and obj.habitacion.sede:
            return obj.habitacion.sede.nombre
        return "Sin sede"
    sede.short_description = 'Sede'

    def fecha_inicio_formateada(self, obj):
        if obj.fecha_inicio:
            return obj.fecha_inicio.strftime("%d/%m/%Y")
        return "Sin fecha"
    fecha_inicio_formateada.short_description = 'Fecha inicio'

    def fecha_fin_formateada(self, obj):
        if obj.fecha_fin:
            return obj.fecha_fin.strftime("%d/%m/%Y")
        return "Sin fecha"
    fecha_fin_formateada.short_description = 'Fecha fin'

    def detalle_cupon(self, obj):
        if obj.cupon:
            tipo = obj.cupon.get_tipo_display() if obj.cupon.tipo else "Sin tipo"
            valor = obj.cupon.valor if obj.cupon.valor else "0"
            return f"{obj.cupon.codigo or 'Sin código'} ({tipo} - {valor})"
        return "Sin cupón"
    detalle_cupon.short_description = 'Detalle Cupón'
        
@admin.register(TipoHabitacion)
class TipoHabitacionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion', 'ver_imagen1_thumbnail', 'ver_imagen2_thumbnail', 'ver_imagen3_thumbnail')
    readonly_fields = ('ver_imagen1', 'ver_imagen2', 'ver_imagen3')
    list_per_page = 10
    
    # Campos para mostrar en el formulario de edición
    fieldsets = (
        (None, {
            'fields': ('nombre', 'descripcion')
        }),
        ('Imágenes', {
            'fields': (
                ('imagen1', 'ver_imagen1'),
                ('imagen2', 'ver_imagen2'),
                ('imagen3', 'ver_imagen3')
            )
        }),
    )
    
    # Para el listado (thumbnails más pequeños)
    def ver_imagen1_thumbnail(self, obj):
        if obj.imagen1:
            return mark_safe(f'<img src="{obj.imagen1.url}" width="100" height="75" style="object-fit: cover;" />')
        return "No hay imagen"
    
    def ver_imagen2_thumbnail(self, obj):
        if obj.imagen2:
            return mark_safe(f'<img src="{obj.imagen2.url}" width="100" height="75" style="object-fit: cover;" />')
        return "No hay imagen"
    
    def ver_imagen3_thumbnail(self, obj):
        if obj.imagen3:
            return mark_safe(f'<img src="{obj.imagen3.url}" width="100" height="75" style="object-fit: cover;" />')
        return "No hay imagen"
    
    # Para el formulario de edición (pueden ser un poco más grandes)
    def ver_imagen1(self, obj):
        if obj.imagen1:
            return mark_safe(f'<img src="{obj.imagen1.url}" width="200" height="150" style="object-fit: cover;" />')
        return "No hay imagen disponible"
    
    def ver_imagen2(self, obj):
        if obj.imagen2:
            return mark_safe(f'<img src="{obj.imagen2.url}" width="200" height="150" style="object-fit: cover;" />')
        return "No hay imagen disponible"
    
    def ver_imagen3(self, obj):
        if obj.imagen3:
            return mark_safe(f'<img src="{obj.imagen3.url}" width="200" height="150" style="object-fit: cover;" />')
        return "No hay imagen disponible"
    
    ver_imagen1_thumbnail.short_description = "Imagen 1"
    ver_imagen2_thumbnail.short_description = "Imagen 2"
    ver_imagen3_thumbnail.short_description = "Imagen 3"
    ver_imagen1.short_description = "Vista Previa Imagen 1"
    ver_imagen2.short_description = "Vista Previa Imagen 2"
    ver_imagen3.short_description = "Vista Previa Imagen 3"