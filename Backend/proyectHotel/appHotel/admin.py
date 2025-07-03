from django.contrib import admin
from .models import Usuario , Sede , TipoHabitacion , Habitacion, Reserva
from django.utils.html import mark_safe

# Register your models here.
admin.site.register(Usuario)
admin.site.register(Sede)
admin.site.register(Habitacion)

@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'habitacion', 'sede', 'fecha_inicio', 'fecha_fin', 'estado', 'total')
    list_filter = ('estado', 'fecha_inicio', 'fecha_fin', 'habitacion__sede')  # Filtro por sede
    readonly_fields = ('total',)
    
    # Método para mostrar la sede en el listado
    def sede(self, obj):
        return obj.habitacion.sede
    sede.short_description = 'Sede'  # Nombre de la columna
    sede.admin_order_field = 'habitacion__sede'  # Permite ordenar por sede

@admin.register(TipoHabitacion)
class TipoHabitacionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    readonly_fields = ('ver_imagen1', 'ver_imagen2', 'ver_imagen3')
    
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
    
    def ver_imagen1(self, obj):
        if obj.imagen1:
            return mark_safe(f'<img src="{obj.imagen1.url}" width="300" height="200" />')
        return "No hay imagen disponible"
    
    def ver_imagen2(self, obj):
        if obj.imagen2:
            return mark_safe(f'<img src="{obj.imagen2.url}" width="300" height="200" />')
        return "No hay imagen disponible"
    
    def ver_imagen3(self, obj):
        if obj.imagen3:
            return mark_safe(f'<img src="{obj.imagen3.url}" width="300" height="200" />')
        return "No hay imagen disponible"
    
    ver_imagen1.short_description = "Vista Previa Imagen 1"
    ver_imagen2.short_description = "Vista Previa Imagen 2"
    ver_imagen3.short_description = "Vista Previa Imagen 3"
