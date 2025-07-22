from rest_framework import viewsets ,  status, mixins,views
from appHotel.api.serializers import (
    UsuarioSerializer, SedeSerializer , TipoHabitacionSerializer , 
    CustomTokenObtainPairSerializer , HabitacionSerializer, 
    ReservaSerializer,CuponSerializer,CuponUsuarioSerializer,ValidarCuponSerializer)
from appHotel.models import Usuario, Sede , TipoHabitacion , Habitacion , Reserva,Cupon,CuponUsuario
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import BasePermission
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Count,Max
from django.core.mail import send_mail
from django.template.loader import render_to_string
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
    permission_classes = [IsAdminUser]
    
    @action(
    detail=False,
    methods=['get'],
    url_path='reservas-stats',
    url_name='reservas-stats'
)
    def reservas_stats(self, request):
        usuarios = Usuario.objects.filter(
            reservas__isnull=False
        ).annotate(
            total_reservas=Count('reservas'),
            ultima_reserva=Max('reservas__fecha_creacion'),
            total_cupones=Count('cupones_asignados')  # Changed from cupones_asignados to total_cupones
        ).order_by('-total_reservas')
        
        data = [{
            'id': usuario.id,
            'first_name': usuario.first_name,
            'last_name': usuario.last_name,
            'email': usuario.email,
            'total_reservas': usuario.total_reservas,
            'ultima_reserva': usuario.ultima_reserva.strftime('%d/%m/%Y') if usuario.ultima_reserva else None,
            'cupones_asignados': usuario.total_cupones  # Updated to use the new annotation name
        } for usuario in usuarios]
        
        return Response(data)

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

class CuponViewSet(viewsets.ModelViewSet):
    queryset = Cupon.objects.all()
    serializer_class = CuponSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def asignar_existente(self, request):
        usuarios_ids = request.data.get('usuarios', [])
        cupon_id = request.data.get('cupon_id')
        
        if not usuarios_ids:
            return Response({'error': 'No se seleccionaron usuarios'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not cupon_id:
            return Response({'error': 'No se seleccionó cupón'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            cupon = Cupon.objects.get(id=cupon_id)
        except Cupon.DoesNotExist:
            return Response({'error': 'Cupón no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        
        # Validaciones del cupón
        ahora = timezone.now()
        if not cupon.activo:
            return Response({'error': 'El cupón no está activo'}, status=status.HTTP_400_BAD_REQUEST)
        if ahora < cupon.fecha_inicio:
            return Response({'error': f'El cupón será válido a partir del {cupon.fecha_inicio.strftime("%d/%m/%Y")}'}, 
                        status=status.HTTP_400_BAD_REQUEST)
        if ahora > cupon.fecha_fin:
            return Response({'error': 'El cupón ha expirado'}, status=status.HTTP_400_BAD_REQUEST)
        
        usuarios_asignados = []
        usuarios_no_asignados = []
        
        for usuario_id in usuarios_ids:
            try:
                usuario = Usuario.objects.get(id=usuario_id)
                
                # Verificar si ya tiene asignado este cupón
                if CuponUsuario.objects.filter(cupon=cupon, usuario=usuario).exists():
                    usuarios_no_asignados.append(usuario_id)
                    continue
                
                # Crear relación cupón-usuario
                CuponUsuario.objects.create(
                    cupon=cupon,
                    usuario=usuario,
                    autorizado=True
                )
                
                usuarios_asignados.append(usuario_id)
                
                # Enviar correo (opcional)
                try:
                    html_message = render_to_string('email/cupon_asignado.html', {
                        'usuario': usuario,
                        'cupon': cupon,
                        'mensaje': f'Se te ha asignado el cupón {cupon.codigo}'
                    })
                    
                    send_mail(
                        f'Tienes un nuevo cupón de descuento - {settings.SITE_NAME}',
                        '',
                        settings.DEFAULT_FROM_EMAIL,
                        [usuario.email],
                        html_message=html_message
                    )
                except Exception as e:
                    print(f"Error enviando email a usuario {usuario_id}: {str(e)}")
                    
            except Usuario.DoesNotExist:
                usuarios_no_asignados.append(usuario_id)
            except Exception as e:
                print(f"Error al asignar cupón a usuario {usuario_id}: {str(e)}")
                usuarios_no_asignados.append(usuario_id)
        
        total_asignados = len(usuarios_asignados)
        total_seleccionados = len(usuarios_ids)
        
        return Response({
            'message': f'Cupón asignado a {total_asignados} usuarios de {total_seleccionados} seleccionados',
            'enviados': total_asignados,
            'no_enviados': len(usuarios_no_asignados),
            'cupon_id': cupon.id,
            'usuarios_asignados': usuarios_asignados,
            'usuarios_no_asignados': usuarios_no_asignados
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def asignar_masivo(self, request):
        """
        Crea un nuevo cupón y lo asigna a múltiples usuarios
        """
        usuarios_ids = request.data.get('usuarios', [])
        cupon_data = request.data.get('cupon', {})
        
        if not usuarios_ids:
            return Response({'error': 'No se seleccionaron usuarios'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Crear el cupón
            cupon = Cupon.objects.create(
                codigo=cupon_data.get('codigo'),
                valor=cupon_data.get('valor'),
                tipo=cupon_data.get('tipo'),
                max_usos=cupon_data.get('max_usos', 1),
                fecha_inicio=cupon_data.get('fecha_inicio'),
                fecha_fin=cupon_data.get('fecha_fin'),
                creado_por=request.user,
                activo=True
            )
            
            # Asignar a usuarios seleccionados
            enviados = 0
            for usuario_id in usuarios_ids:
                try:
                    usuario = Usuario.objects.get(id=usuario_id)
                    
                    # Crear relación cupón-usuario
                    CuponUsuario.objects.create(
                        cupon=cupon,
                        usuario=usuario,
                        autorizado=True
                    )
                    
                    # Enviar correo
                    html_message = render_to_string('email/cupon_asignado.html', {
                        'usuario': usuario,
                        'cupon': cupon,
                        'mensaje': cupon_data.get('mensaje', ''),
                    })
                    
                    send_mail(
                        f'Tienes un nuevo cupón de descuento - {settings.SITE_NAME}',
                        '',
                        settings.DEFAULT_FROM_EMAIL,
                        [usuario.email],
                        html_message=html_message
                    )
                    
                    enviados += 1
                except Exception as e:
                    print(f"Error al asignar cupón a usuario {usuario_id}: {str(e)}")
                    continue
            
            return Response({
                'message': f'Cupón asignado a {enviados} usuarios de {len(usuarios_ids)} seleccionados',
                'enviados': enviados,
                'cupon_id': cupon.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': 'Error al asignar cupones',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], serializer_class=ValidarCuponSerializer)
    def validar(self, request):
        """
        Valida si un cupón es válido para ser usado
        """
        try:
            serializer = ValidarCuponSerializer(data=request.query_params)
            serializer.is_valid(raise_exception=True)
            
            codigo = serializer.validated_data['codigo']
            response_data = {
                'codigo': codigo,
                'valido': False,
                'mensaje': '',
                'cupon': None
            }
            
            try:
                cupon = Cupon.objects.get(codigo=codigo)
            except ObjectDoesNotExist:
                response_data['mensaje'] = 'Cupón no encontrado'
                return Response(response_data, status=status.HTTP_404_NOT_FOUND)
            
            # Validar fechas del cupón
            ahora = timezone.now()
            if ahora < cupon.fecha_inicio:
                response_data['mensaje'] = f'Este cupón será válido a partir del {cupon.fecha_inicio.strftime("%d/%m/%Y")}'
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
            
            if ahora > cupon.fecha_fin:
                response_data['mensaje'] = 'Este cupón ha expirado'
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
            
            # Validar estado activo
            if not cupon.activo:
                response_data['mensaje'] = 'Este cupón no está activo'
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
            
            # Validar usos disponibles
            if cupon.usos_disponibles() <= 0:
                response_data['mensaje'] = 'Este cupón ha alcanzado su límite de usos'
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar si el usuario ya usó este cupón
            cupon_usuario, created = CuponUsuario.objects.get_or_create(
                cupon=cupon,
                usuario=request.user,
                defaults={'autorizado': True}
            )
            
            if not cupon_usuario.autorizado:
                response_data['mensaje'] = 'No estás autorizado para usar este cupón'
                return Response(response_data, status=status.HTTP_403_FORBIDDEN)
            
            if cupon_usuario.usado:
                response_data['mensaje'] = 'Ya has usado este cupón'
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
            
            # Si pasa todas las validaciones
            response_data.update({
                'valido': True,
                'mensaje': 'Cupón válido',
                'cupon': CuponSerializer(cupon).data
            })
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error al validar cupón: {str(e)}")
            return Response({
                'error': 'Error interno del servidor al validar el cupón',
                'detalle': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class CuponUsuarioViewSet(viewsets.ModelViewSet):
    queryset = CuponUsuario.objects.all()
    serializer_class = CuponUsuarioSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return self.queryset.filter(usuario=self.request.user)
    
    @action(detail=True, methods=['post'])
    def marcar_como_usado(self, request, pk=None):
        cupon_usuario = self.get_object()
        
        if cupon_usuario.usado:
            return Response(
                {'detail': 'Este cupón ya fue usado anteriormente'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cupon_usuario.usado = True
        cupon_usuario.fecha_uso = timezone.now()
        cupon_usuario.save()
        
        return Response(
            {'detail': 'Cupón marcado como usado correctamente'},
            status=status.HTTP_200_OK
        )

class PagoReservaView(views.APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        reserva_data = request.data.get('reserva')
        
        # Validar cupón si existe
        cupon_id = reserva_data.get('cupon')
        cupon = None
        cupon_usuario = None
        
        if cupon_id:
            try:
                cupon = Cupon.objects.get(id=cupon_id, activo=True)
                cupon_usuario = CuponUsuario.objects.get(
                    cupon=cupon,
                    usuario=request.user,
                    autorizado=True,
                    usado=False
                )
                
                # Validar fechas del cupón
                ahora = timezone.now()
                if ahora < cupon.fecha_inicio or ahora > cupon.fecha_fin:
                    return Response({'error': 'Cupón no válido en este momento'}, status=400)
                    
            except (Cupon.DoesNotExist, CuponUsuario.DoesNotExist):
                return Response({'error': 'Cupón no válido o ya utilizado'}, status=400)
        
        # Crear reserva con contexto
        serializer = ReservaSerializer(
            data=reserva_data,
            context={
                'request': request,
                'cupon': cupon,
                'cupon_usuario': cupon_usuario
            }
        )
        
        if serializer.is_valid():
            reserva = serializer.save()
            return Response(ReservaSerializer(reserva).data, status=201)
        
        return Response(serializer.errors, status=400)