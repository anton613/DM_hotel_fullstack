from rest_framework.routers import *
from appHotel.api.views import SedeViewSet,AdminUsuarioViewSet,TipoHabitacionViewSet,ClienteUsuarioViewSet,AdminHabitacionViewSet,ClienteHabitacionViewSet, ReservaViewSet

router = DefaultRouter()
router.register(r'sedes', SedeViewSet, basename='productos')
router.register(r'tipoHabitaciones', TipoHabitacionViewSet, basename='tipoHabitaciones')
router.register(r'cliente/usuario', ClienteUsuarioViewSet, basename='cliente-usuario')
router.register(r'admin/usuarios', AdminUsuarioViewSet, basename='admin-usuarios')
router.register(r'cliente/habitaciones', ClienteHabitacionViewSet, basename='cliente-habitaciones')
router.register(r'admin/habitaciones', AdminHabitacionViewSet, basename='admin-habitaciones')
router.register(r'reservas', ReservaViewSet, basename='reservas')

urlpatterns = router.urls
