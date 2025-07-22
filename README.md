# Sistema de Gestión Hotelera - DM Hotel 🏨

## 📝 Descripción 
Sistema completo de gestión hotelera desarrollado para el curso **Integrador de Sistemas II**. Plataforma fullstack que gestiona reservas, habitaciones, usuarios, cupones de descuento, estadísticas y pagos. Incluye funcionalidades avanzadas como reportes PDF, sistema de cupones, notificaciones por email y dashboard administrativo con gráficos estadísticos.

## ✨ Características Principales

### 🎯 Para Clientes
- **Registro y autenticación** con JWT
- **Búsqueda y filtrado** de habitaciones por sede, tipo y disponibilidad
- **Sistema de reservas** con cálculo automático de precios
- **Aplicación de cupones** de descuento (porcentaje o monto fijo)
- **Gestión de perfil** personal
- **Historial de reservas** con estados (Pendiente, Check-In, Check-Out, Cancelada)
- **Cancelación** de reservas pendientes

### 👔 Para Administradores
- **Dashboard completo** con estadísticas en tiempo real
- **Gestión de usuarios** y roles (Admin, Cliente, Empleado)
- **Administración de sedes** hoteleras
- **Gestión de tipos de habitaciones** con múltiples imágenes
- **Control de habitaciones** por sede con precios y disponibilidad
- **Sistema de cupones**:
  - Creación y gestión de cupones
  - Asignación masiva a usuarios
  - Validación automática y control de usos
  - Notificación por email
- **Reportes y estadísticas**:
  - Gráficos de reservas por estado
  - Ingresos por tipo de habitación
  - Ocupación por sede
  - Ingresos mensuales
  - **Exportación a PDF** con gráficos integrados
- **Gestión avanzada de reservas**

## 🛠 Stack Tecnológico

### 🔧 Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Python** | 3.x | Lenguaje principal |
| **Django** | 5.2.3 | Framework web |
| **Django REST Framework** | Latest | API REST |
| **SimpleJWT** | Latest | Autenticación JWT |
| **SQLite** | - | Base de datos (desarrollo) |
| **django-cors-headers** | Latest | Manejo de CORS |
| **Matplotlib** | Latest | Generación de gráficos |
| **xhtml2pdf** | Latest | Generación de reportes PDF |

### ⚛️ Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **React** | 19.1.0 | Framework frontend |
| **Vite** | 7.0.0 | Build tool y bundler |
| **React Router** | 7.6.3 | Enrutamiento SPA |
| **Axios** | 1.10.0 | Cliente HTTP |
| **Bootstrap** | 5.3.7 | Framework CSS |
| **React Bootstrap** | 2.10.10 | Componentes React-Bootstrap |
| **Chart.js** | 4.5.0 | Gráficos interactivos |
| **React Hot Toast** | 2.5.2 | Notificaciones |
| **React Icons** | 5.5.0 | Iconografía |
| **React DatePicker** | 8.4.0 | Selección de fechas |
| **PayPal SDK** | 8.2.0 | Integración de pagos |

### 🔒 Integración de Pagos
- **PayPal SDK** configurado en modo sandbox
- Procesamiento seguro de pagos
- Confirmación automática de reservas

### 📧 Sistema de Notificaciones
- **SMTP Gmail** configurado
- Templates HTML personalizados
- Notificaciones automáticas de cupones

## 🚀 Instalación y Configuración

### 🔴 Prerrequisitos
- **Python 3.8+**
- **Node.js 18+** y npm/yarn
- **Git**

### 💻 Instalación del Backend (Django)

```bash
# 1. Clonar el repositorio
git clone <tu-repositorio>
cd "Proyecto Hotel Fullstack"

# 2. Crear entorno virtual
python -m venv venv

# 3. Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate

# 4. Instalar dependencias (crear requirements.txt si no existe)
cd Backend/proyectHotel
pip install django djangorestframework djangorestframework-simplejwt
pip install django-cors-headers matplotlib xhtml2pdf

# 5. Ejecutar migraciones
python manage.py makemigrations
python manage.py migrate

# 6. Crear superusuario (opcional)
python manage.py createsuperuser

# 7. Ejecutar servidor de desarrollo
python manage.py runserver
```

### ⚛️ Instalación del Frontend (React)

```bash
# 1. Navegar al directorio del frontend
cd Frontend/Hotel

# 2. Instalar dependencias
npm install
# o con yarn:
yarn install

# 3. Ejecutar servidor de desarrollo
npm run dev
# o con yarn:
yarn dev
```

### ⚙️ Configuración Adicional

#### Variables de Entorno (Backend)
Configura las siguientes variables en `settings.py`:

```python
# Email (Gmail SMTP)
EMAIL_HOST_USER = 'tu-email@gmail.com'
EMAIL_HOST_PASSWORD = 'tu-app-password'

# PayPal
PAYPAL_CLIENT_ID = 'tu-paypal-client-id'
PAYPAL_SECRET = 'tu-paypal-secret'
```

#### Puertos por Defecto
- **Backend Django**: `http://localhost:8000`
- **Frontend React**: `http://localhost:5173`

## 🧪 Testing

### Ejecutar Tests del Backend
```bash
cd Backend/proyectHotel
python manage.py test appHotel.tests
```

El proyecto incluye tests unitarios para:
- Modelos de Usuario, Sede, Habitación, Reserva, Cupón
- Validaciones de negocio
- Casos de uso principales

## 🌐 API REST - Documentación Completa

### 🔐 Autenticación JWT
| Método | Endpoint               | Descripción                  | Acceso   |
|--------|------------------------|------------------------------|----------|
| POST   | `/api/token/`          | Obtener token JWT            | Público  |
| POST   | `/api/token/refresh/`  | Refrescar token              | Público  |

### 📋 Endpoints Principales

#### 📍 Gestión Básica
| Verbo  | Endpoint                          | Descripción                     | Permisos       |
|--------|-----------------------------------|---------------------------------|----------------|
| GET    | `/api/sedes/`                     | Listar sedes                    | Público        |
| POST   | `/api/sedes/`                     | Crear sede                      | Admin          |
| GET    | `/api/tipoHabitaciones/`          | Listar tipos de habitaciones    | Público        |
| POST   | `/api/tipoHabitaciones/`          | Crear tipo de habitación        | Admin          |

#### 💼 Gestión de Usuarios
| Verbo  | Endpoint                          | Descripción                     | Permisos       |
|--------|-----------------------------------|---------------------------------|----------------|
| GET    | `/api/cliente/usuario/`           | Perfil del cliente              | Cliente        |
| PUT    | `/api/cliente/usuario/{id}/`      | Actualizar perfil               | Cliente (Owner)|
| POST   | `/api/cliente/usuario/`           | Registro de cliente             | Público        |
| GET    | `/api/admin/usuario/`             | Listar usuarios (admin)         | Admin          |
| POST   | `/api/admin/usuario/`             | Crear usuario (admin)           | Admin          |
| GET    | `/api/admin/usuario/reservas-stats/` | Estadísticas de usuarios      | Admin          |

#### 🏨 Habitaciones
| Verbo  | Endpoint                          | Descripción                     | Permisos       |
|--------|-----------------------------------|---------------------------------|----------------|
| GET    | `/api/cliente/habitaciones/`      | Listar habitaciones (cliente)   | Público        |
| GET    | `/api/admin/habitaciones/`        | Listar habitaciones (admin)     | Admin          |
| POST   | `/api/admin/habitaciones/`        | Crear habitación               | Admin          |
| PUT    | `/api/admin/habitaciones/{id}/`   | Actualizar habitación          | Admin          |
| DELETE | `/api/admin/habitaciones/{id}/`   | Eliminar habitación            | Admin          |

#### 📋 Reservas
| Verbo  | Endpoint                          | Descripción                     | Permisos       |
|--------|-----------------------------------|---------------------------------|----------------|
| GET    | `/api/reservas/`                  | Listar reservas                 | Cliente        |
| POST   | `/api/reservas/`                  | Crear reserva                   | Cliente        |
| GET    | `/api/reservas/mis_reservas/`     | Mis reservas                    | Cliente        |
| PATCH  | `/api/reservas/{id}/cancelar/`    | Cancelar reserva                | Cliente        |
| POST   | `/api/reserva/confirmar-pago/`    | Confirmar pago y crear reserva  | Cliente        |

#### 🎟️ Sistema de Cupones
| Verbo  | Endpoint                          | Descripción                     | Permisos       |
|--------|-----------------------------------|---------------------------------|----------------|
| GET    | `/api/cupones/`                   | Listar cupones                  | Admin          |
| POST   | `/api/cupones/`                   | Crear cupón                     | Admin          |
| GET    | `/api/cupones/validar/`           | Validar cupón                   | Cliente        |
| POST   | `/api/cupones/asignar_masivo/`    | Asignar cupón a usuarios        | Admin          |
| POST   | `/api/cupones/asignar_existente/` | Asignar cupón existente         | Admin          |
| GET    | `/api/cupones-usuario/`           | Cupones del usuario             | Cliente        |
| POST   | `/api/cupones-usuario/{id}/marcar_como_usado/` | Marcar cupón usado | Cliente |

#### 📈 Reportes y Estadísticas
| Verbo  | Endpoint                          | Descripción                     | Permisos       |
|--------|-----------------------------------|---------------------------------|----------------|
| POST   | `/api/generar-reporte/`           | Generar reporte PDF con gráficos | Admin        |

### 📌 Estructura del Router DRF
```python
# Configuración de endpoints principales
from rest_framework.routers import DefaultRouter
from appHotel.api.views import (
    SedeViewSet, AdminUsuarioViewSet, TipoHabitacionViewSet,
    ClienteUsuarioViewSet, AdminHabitacionViewSet,
    ClienteHabitacionViewSet, ReservaViewSet,
    CuponUsuarioViewSet, CuponViewSet
)

router = DefaultRouter()
router.register(r'sedes', SedeViewSet)
router.register(r'tipoHabitaciones', TipoHabitacionViewSet)
router.register(r'cliente/usuario', ClienteUsuarioViewSet)
router.register(r'admin/usuario', AdminUsuarioViewSet)
router.register(r'cliente/habitaciones', ClienteHabitacionViewSet)
router.register(r'admin/habitaciones', AdminHabitacionViewSet)
router.register(r'reservas', ReservaViewSet)
router.register(r'cupones', CuponViewSet)
router.register(r'cupones-usuario', CuponUsuarioViewSet)
```

## 📊 Modelos de Datos

### 📄 Principales Entidades

- **Usuario**: Sistema de autenticación personalizado con roles (Admin, Cliente, Empleado)
- **Sede**: Diferentes ubicaciones de la cadena hotelera
- **TipoHabitacion**: Categorías de habitaciones con imágenes múltiples
- **Habitacion**: Habitaciones individuales por sede con precios
- **Reserva**: Gestiona el ciclo completo de reservas con estados
- **Cupon**: Sistema de descuentos con tipos porcentaje/fijo
- **CuponUsuario**: Relación entre cupones y usuarios con control de uso

### 🔗 Relaciones Principales
- Usuario 1:N Reservas
- Habitacion N:1 Sede
- Habitacion N:1 TipoHabitacion
- Reserva N:1 Habitacion
- Cupon N:M Usuario (a través de CuponUsuario)

## 📱 Interfaz de Usuario

### 🎆 Componentes Principales

#### Para Clientes
- **Registro/Login**: Autenticación JWT
- **Búsqueda de Habitaciones**: Filtros avanzados
- **Proceso de Reserva**: Paso a paso con validación
- **Mis Reservas**: Historial y gestión
- **Perfil de Usuario**: Edición de datos personales

#### Para Administradores
- **Dashboard**: Estadísticas en tiempo real con Chart.js
- **Gestión de Habitaciones**: CRUD completo
- **Administración de Cupones**: Creación y asignación masiva
- **Reportes**: Generación de PDFs con gráficos
- **Estadísticas de Reservas**: Análisis detallado

## 📊 Funcionalidades Avanzadas

### 🎟️ Sistema de Cupones
- **Tipos de descuento**: Porcentaje o monto fijo
- **Validación temporal**: Fechas de inicio y fin
- **Control de usos**: Límite de usos por cupón
- **Asignación dirigida**: A usuarios específicos
- **Notificaciones**: Envío automático por email

### 📈 Sistema de Reportes
- **Gráficos interactivos**: Chart.js para visualización web
- **Exportación PDF**: Reportes con gráficos integrados usando matplotlib
- **Filtros dinámicos**: Por sede, tipo de habitación, periodo
- **Métricas clave**: Ocupación, ingresos, tendencias

### 🔒 Seguridad
- **Autenticación JWT**: Tokens seguros con expiración
- **Roles y permisos**: Control granular de acceso
- **Validación de datos**: En frontend y backend
- **CORS configurado**: Para desarrollo y producción

## 🗺️ Arquitectura del Proyecto

```
Proyecto Hotel Fullstack/
├── Backend/
│   └── proyectHotel/
│       ├── appHotel/
│       │   ├── api/              # API REST
│       │   ├── models.py         # Modelos de datos
│       │   ├── tests/            # Tests unitarios
│       │   └── templates/        # Templates HTML
│       └── proyectHotel/
│           └── settings.py       # Configuración Django
└── Frontend/
    └── Hotel/
        ├── src/
        │   ├── components/       # Componentes React
        │   │   ├── Admin/        # Panel administrativo
        │   │   ├── cliente/      # Interfaz cliente
        │   │   └── context/      # Context API
        │   └── api/              # Configuración Axios
        └── package.json          # Dependencias Node.js
```

## 🚦 Estados del Proyecto

### ✅ Funcionalidades Completadas
- ✅ Sistema de autenticación JWT
- ✅ CRUD completo de entidades
- ✅ Sistema de reservas
- ✅ Gestión de cupones con email
- ✅ Dashboard administrativo
- ✅ Reportes PDF con gráficos
- ✅ Integración PayPal
- ✅ Tests unitarios
- ✅ Responsive design

### 🛠️ Posibles Mejoras
- 📊 Notificaciones en tiempo real (WebSockets)
- 📱 Aplicación móvil con React Native
- 🔍 Sistema de búsqueda avanzada
- 🌍 Soporte multi-idioma
- 📋 Sistema de comentarios y calificaciones
- 🔔 Notificaciones push

## 👥 Contribución

Este es un proyecto académico desarrollado para **Integrador de Sistemas II**. 

### 📝 Licencia
Proyecto educativo - Todos los derechos reservados.

### 📧 Contacto
- **Desarrollador**: Equipo Integrador de Sistemas II
- **Email**: manuel.24.sco@gmail.com
- **Institución**: [Tu Institución Educativa]

---

⭐ **¡Gracias por revisar nuestro proyecto!** ⭐
