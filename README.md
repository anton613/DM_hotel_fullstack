# Sistema de Gestión Hotelera - FullStack

## 📝 Descripción 
Proyecto académico desarrollado para el curso **Integrador de Sistemas II** que simula un sistema de gestión para cadenas hoteleras. Implementa funcionalidades básicas de reservas, administración de habitaciones y autenticación de usuarios.

## 🛠 Tecnologías

### Backend
| Tecnología | Uso |
|------------|-----|
| Python | Lenguaje principal |
| Django | Framework backend |
| Django REST Framework | API REST |
| SQLite | Base de datos (desarrollo) |
| JWT | Autenticación |

### Frontend
| Tecnología | Uso |
|------------|-----|
| React | Librería principal |
| Vite | Bundler |
| Context API | Gestión de estado |
| Axios | Conexión API |

## 🚀 Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/proyecto-hotel.git
cd proyecto-hotel
## 🌐 Documentación de la API REST

### 🔐 Autenticación
| Método | Endpoint               | Descripción                  | Acceso   |
|--------|------------------------|------------------------------|----------|
| POST   | `/api/token/`          | Obtener token JWT            | Público  |
| POST   | `/api/token/refresh/`  | Refrescar token              | Público  |

### 📋 Tabla Completa de Endpoints
| Verbo  | Endpoint                          | Controlador               | Permisos       |
|--------|-----------------------------------|---------------------------|----------------|
| GET    | `/api/sedes/`                     | SedeViewSet               | Público        |
| POST   | `/api/sedes/`                     | SedeViewSet               | Admin          |
| GET    | `/api/tipoHabitaciones/`          | TipoHabitacionViewSet     | Público        |
| POST   | `/api/tipoHabitaciones/`          | TipoHabitacionViewSet     | Admin          |
| GET    | `/api/cliente/usuario/`           | ClienteUsuarioViewSet     | Cliente        |
| PUT    | `/api/cliente/usuario/{id}/`      | ClienteUsuarioViewSet     | Cliente (Owner)|
| GET    | `/api/admin/usuarios/`            | AdminUsuarioViewSet       | Admin          |
| POST   | `/api/admin/usuarios/`            | AdminUsuarioViewSet       | Admin          |
| GET    | `/api/cliente/habitaciones/`      | ClienteHabitacionViewSet  | Cliente        |
| GET    | `/api/admin/habitaciones/`        | AdminHabitacionViewSet    | Admin          |
| POST   | `/api/admin/habitaciones/`        | AdminHabitacionViewSet    | Admin          |
| GET    | `/api/reservas/`                  | ReservaViewSet            | Cliente        |
| POST   | `/api/reservas/`                  | ReservaViewSet            | Cliente        |

### 📌 Estructura del Router DRF
```python
# Configuración original de endpoints
from rest_framework.routers import DefaultRouter
from appHotel.api.views import *

router = DefaultRouter()
router.register(r'sedes', SedeViewSet)
router.register(r'tipoHabitaciones', TipoHabitacionViewSet)
router.register(r'cliente/usuario', ClienteUsuarioViewSet)
router.register(r'admin/usuarios', AdminUsuarioViewSet)
router.register(r'cliente/habitaciones', ClienteHabitacionViewSet)
router.register(r'admin/habitaciones', AdminHabitacionViewSet)
router.register(r'reservas', ReservaViewSet)
