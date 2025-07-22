from rest_framework.routers import *
from appHotel.api.views import (
    SedeViewSet,AdminUsuarioViewSet,
    TipoHabitacionViewSet,
    ClienteUsuarioViewSet,
    AdminHabitacionViewSet,
    ClienteHabitacionViewSet, 
    PagoReservaView,
    ReservaViewSet,
    CuponUsuarioViewSet,
    CuponViewSet)
from appHotel.api.views2 import GenerarReportePDF

router = DefaultRouter()
router.register(r'sedes', SedeViewSet, basename='productos')
router.register(r'tipoHabitaciones', TipoHabitacionViewSet, basename='tipoHabitaciones')
router.register(r'cliente/usuario', ClienteUsuarioViewSet, basename='cliente-usuario')
router.register(r'admin/usuario', AdminUsuarioViewSet, basename='admin-usuario')
router.register(r'cliente/habitaciones', ClienteHabitacionViewSet, basename='cliente-habitaciones')
router.register(r'admin/habitaciones', AdminHabitacionViewSet, basename='admin-habitaciones')
router.register(r'reservas', ReservaViewSet, basename='reservas') 
router.register(r'cupones', CuponViewSet, basename='cupones')
router.register(r'cupones-usuario', CuponUsuarioViewSet, basename='cupones-usuario')


urlpatterns = [
    path('generar-reporte/', GenerarReportePDF.as_view(), name='generar_reporte'),
    path('reserva/confirmar-pago/', PagoReservaView.as_view(), name='pago-reserva'),
    ] + router.urls
