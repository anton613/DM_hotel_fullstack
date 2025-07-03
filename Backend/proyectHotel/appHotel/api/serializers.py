from rest_framework import serializers
from appHotel.models import Sede, Usuario , TipoHabitacion , Habitacion, Reserva
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
    tipo = TipoHabitacionSerializer()  # Serializador anidado
    sede = serializers.StringRelatedField()  # Solo muestra el nombre de la sede

    class Meta:
        model = Habitacion
        fields = ['id', 'numero', 'tipo', 'sede', 'precio']
        read_only_fields = ['id']

    # def to_representation(self, instance):
    #     representation = super().to_representation(instance)
    #     representation['tipo'] = instance.tipo.nombre if instance.tipo else None
    #     representation['sede'] = instance.sede.nombre if instance.sede else None
    #     return representation

class ReservaSerializer(serializers.ModelSerializer):
    cliente = UsuarioSerializer(read_only=True)
    # Cambia habitacion para que no sea read_only y permita escritura
    habitacion = serializers.PrimaryKeyRelatedField(
        queryset=Habitacion.objects.all(),
        write_only=True
    )
    habitacion_info = HabitacionSerializer(source='habitacion', read_only=True)

    class Meta:
        model = Reserva
        fields = ['id', 'cliente', 'habitacion', 'habitacion_info', 'fecha_inicio', 'fecha_fin', 'estado', 'total']
        read_only_fields = ['id', 'total', 'cliente']

    def create(self, validated_data):
        # Asigna automáticamente el usuario autenticado como cliente
        validated_data['cliente'] = self.context['request'].user
        
        # Asegúrate de que la habitación está en los datos validados
        if 'habitacion' not in validated_data:
            raise serializers.ValidationError({"habitacion": "Este campo es requerido."})
            
        return super().create(validated_data)

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