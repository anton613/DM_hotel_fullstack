from rest_framework import viewsets ,  status, mixins
from appHotel.api.serializers import UsuarioSerializer, SedeSerializer , TipoHabitacionSerializer , CustomTokenObtainPairSerializer , HabitacionSerializer, ReservaSerializer
from appHotel.models import Usuario, Sede , TipoHabitacion , Habitacion , Reserva
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import BasePermission
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

# Serializador personalizado para el token JWT
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# Permiso personalizado para verificar que el usuario sea administrador.
class IsAdminUser(BasePermission):
    """
    Permiso personalizado para verificar que el usuario sea administrador.
    """
    message = "Solo los administradores pueden realizar esta acción."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.rol == 'admin')

# Permiso personalizado para verificar que el usuario sea cliente.
class IsClienteUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.rol == 'cliente'

    def has_object_permission(self, request, view, obj):
        return obj == request.user

# ViewSet para manejar las operaciones CRUD de los usuarios.
# Acceso restringido solo a administradores autenticados con JWT.
class AdminUsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]  # Solo usuarios admin pueden acceder

class ClienteUsuarioViewSet(mixins.CreateModelMixin,mixins.RetrieveModelMixin,mixins.UpdateModelMixin,viewsets.GenericViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]  # Permite registro sin autenticación
        return [IsAuthenticated(), IsClienteUser()]

    def get_queryset(self):
        # Solo devuelve el usuario autenticado
        return Usuario.objects.filter(id=self.request.user.id)

    def perform_create(self, serializer):
        serializer.save(rol='cliente')  # Forzar rol cliente

class SedeViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar las operaciones CRUD de las sedes.
    Acceso restringido solo a administradores autenticados con JWT.
    """
    queryset = Sede.objects.all()
    serializer_class = SedeSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]  # Solo usuarios admin pueden acceder

class TipoHabitacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar las operaciones CRUD de los tipos de habitación.
    Acceso restringido solo a administradores autenticados con JWT.
    """
    queryset = TipoHabitacion.objects.all()
    serializer_class = TipoHabitacionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]  # Solo usuarios admin pueden acceder

    def get_serializer_class(self):
        if self.action == 'list' or self.action == 'retrieve':
            return TipoHabitacionSerializer
        return super().get_serializer_class()

class AdminHabitacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar las operaciones CRUD de las habitaciones.
    Acceso restringido solo a administradores autenticados con JWT.
    """
    queryset = Habitacion.objects.all()
    serializer_class = HabitacionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]  # Solo usuarios admin pueden acceder

    def get_serializer_class(self):
        if self.action == 'list' or self.action == 'retrieve':
            return HabitacionSerializer
        return super().get_serializer_class()

class ClienteHabitacionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Habitacion.objects.all().select_related('tipo', 'sede')
    serializer_class = HabitacionSerializer

class ReservaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar las operaciones CRUD de las reservas.
    Acceso restringido solo a administradores autenticados con JWT.
    """
    queryset = Reserva.objects.all().select_related('cliente', 'habitacion')
    serializer_class = ReservaSerializer
    @action(detail=False, methods=['get'])
    def mis_reservas(self, request):
        # Obtener solo las reservas del usuario autenticado
        queryset = self.queryset.filter(cliente=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def cancelar(self, request, pk=None):
        reserva = self.get_object()
        if reserva.cliente != request.user:
            return Response({'error': 'No autorizado'}, status=403)
        
        if reserva.estado != 'Pendiente':
            return Response({'error': 'Solo se pueden cancelar reservas pendientes'}, status=400)
            
        reserva.estado = 'Cancelada'
        reserva.save()
        return Response({'status': 'Reserva cancelada'})
