from rest_framework import serializers
from appHotel.models import Sede, Usuario , TipoHabitacion , Habitacion, Reserva, Cupon ,CuponUsuario
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'password', 'rol', 'first_name','telefono', 'direccion' ,'last_name']
        read_only_fields = ['id']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Usuario(**validated_data)
        user.set_password(password)  # 🔒 Encripta el password
        user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)  # 🔒 Encripta el nuevo password

        instance.save()
        return instance

class SedeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sede
        fields = ['id', 'nombre', 'direccion', 'telefono']
        read_only_fields = ['id']

class TipoHabitacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoHabitacion
        fields = ['id', 'nombre', 'descripcion', 'imagen1', 'imagen2', 'imagen3']
        read_only_fields = ['id']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['imagen1'] = instance.imagen1.url if instance.imagen1 else None
        representation['imagen2'] = instance.imagen2.url if instance.imagen2 else None
        representation['imagen3'] = instance.imagen3.url if instance.imagen3 else None
        return representation

class HabitacionSerializer(serializers.ModelSerializer):
    # Para lectura (GET)
    tipo = TipoHabitacionSerializer(read_only=True)
    sede = serializers.StringRelatedField(read_only=True)
    
    # Para escritura (POST/PUT/PATCH)
    tipo_id = serializers.PrimaryKeyRelatedField(
        queryset=TipoHabitacion.objects.all(),
        source='tipo',
        write_only=True,
        required=False  # Hacerlo opcional para actualizaciones parciales
    )
    sede_id = serializers.PrimaryKeyRelatedField(
        queryset=Sede.objects.all(),
        source='sede',
        write_only=True,
        required=False  # Hacerlo opcional para actualizaciones parciales
    )

    class Meta:
        model = Habitacion
        fields = ['id', 'numero', 'tipo', 'sede', 'precio', 'tipo_id', 'sede_id','estadoHabitacion']
        read_only_fields = ['id']

class CuponSerializer(serializers.ModelSerializer):
    usos_disponibles = serializers.SerializerMethodField()
    
    class Meta:
        model = Cupon
        fields = [
            'id', 'codigo', 'valor', 'tipo', 'max_usos', 
            'usos_disponibles', 'fecha_inicio', 'fecha_fin', 
            'activo', 'creado_por', 'fecha_creacion'
        ]
        read_only_fields = ['creado_por', 'fecha_creacion']
    
    def get_usos_disponibles(self, obj):
        return obj.usos_disponibles()

class ReservaSerializer(serializers.ModelSerializer):
    cliente = UsuarioSerializer(read_only=True)
    habitacion = serializers.PrimaryKeyRelatedField(
        queryset=Habitacion.objects.all(),
        write_only=True
    )
    habitacion_info = HabitacionSerializer(source='habitacion', read_only=True)
    cupon_info = CuponSerializer(source='cupon', read_only=True)

    class Meta:
        model = Reserva
        fields = [
            'id', 'cliente', 'habitacion', 'habitacion_info', 
            'fecha_inicio', 'fecha_fin', 'estado', 'total',
            'total_descuento', 'descuento_aplicado', 'cupon', 'cupon_info'
        ]
        read_only_fields = [
            'id', 'total', 'cliente', 'total_descuento', 
            'descuento_aplicado', 'cupon_info'
        ]

    def create(self, validated_data):
        validated_data['cliente'] = self.context['request'].user
        
        # Obtener cupón del contexto si existe
        cupon = self.context.get('cupon')
        cupon_usuario = self.context.get('cupon_usuario')
        
        if cupon:
            validated_data['cupon'] = cupon
            validated_data['cupon_usuario'] = cupon_usuario
        
        # Crear reserva (los cálculos se harán en save())
        reserva = Reserva.objects.create(**validated_data)
        return reserva

class CuponUsuarioSerializer(serializers.ModelSerializer):
    cupon = CuponSerializer(read_only=True)
    usuario = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = CuponUsuario
        fields = [
            'id', 'cupon', 'usuario', 'autorizado', 
            'usado', 'fecha_uso', 'fecha_asignacion'
        ]
        read_only_fields = ['fecha_asignacion']

class ValidarCuponSerializer(serializers.Serializer):
    codigo = serializers.CharField(max_length=20, required=True)
    valido = serializers.BooleanField(read_only=True)
    mensaje = serializers.CharField(read_only=True)
    cupon = CuponSerializer(read_only=True)

# Serializador personalizado para el token JWT
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['rol'] = user.rol
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'rol': self.user.rol,
            'nombre': self.user.first_name,
            'apellido':self.user.last_name,
            'telefono':self.user.telefono,
            'direccion':self.user.direccion
        }
        return data