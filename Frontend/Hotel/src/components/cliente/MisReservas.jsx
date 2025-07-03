import { useState, useEffect } from 'react';
import { Container, Card, Table, Alert, Spinner, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { Api } from '../../api/conexions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function MisReservas() {
    const { user, accessToken } = useAuth();
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Estados para filtros
    const [filtroEstado, setFiltroEstado] = useState('Todas');
    const [filtroFecha, setFiltroFecha] = useState('recientes');

    // Cargar reservas del usuario
    const loadReservas = async () => {
        try {
            const response = await Api.get('/reservas/', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            // Filtrar reservas solo para el usuario logueado
            const reservasUsuario = response.data.filter(reserva =>
                reserva.cliente.id === user.id
            );

            setReservas(reservasUsuario);
            setLoading(false);
        } catch (err) {
            setError('Error al cargar las reservas');
            setLoading(false);
            console.error('Error fetching reservas:', err);
        }
    };

    useEffect(() => {
        if (user) {
            loadReservas();
        } else {
            navigate('/login');
        }
    }, [user, navigate]);

    // Filtrar reservas según los filtros seleccionados
    const reservasFiltradas = reservas.filter(reserva => {
        const cumpleEstado = filtroEstado === 'Todas' || reserva.estado === filtroEstado;
        return cumpleEstado;
    }).sort((a, b) => {
        if (filtroFecha === 'recientes') {
            return new Date(b.fecha_inicio) - new Date(a.fecha_inicio);
        } else {
            return new Date(a.fecha_inicio) - new Date(b.fecha_inicio);
        }
    });

    // Formatear fecha para mostrar
    const formatFecha = (fecha) => {
        return format(new Date(fecha), 'PPP', { locale: es });
    };

    // Traducir estados
    const getEstadoLabel = (estado) => {
        const estados = {
            'Pendiente': { label: 'Pendiente', variant: 'warning' },
            'Check-In': { label: 'En Curso', variant: 'primary' },
            'Check-Out': { label: 'Finalizada', variant: 'success' },
            'Cancelada': { label: 'Cancelada', variant: 'danger' }
        };
        return estados[estado] || { label: estado, variant: 'secondary' };
    };

    // Cancelar una reserva
    const handleCancelar = async (reservaId) => {
        if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
            return;
        }

        try {
            await Api.patch(`/reservas/${reservaId}/cancelar/`, {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            loadReservas(); // Recargar las reservas después de cancelar
        } catch (err) {
            setError('Error al cancelar la reserva');
            console.error('Error cancelando reserva:', err);
        }
    };

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando reservas...</span>
                </Spinner>
            </Container>
        );
    }

    return (
        <Container className="my-5">
            <h2 className="mb-4">Mis Reservas</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Filtros */}
            <Card className="mb-4">
                <Card.Body>
                    <div className="d-flex flex-wrap gap-3">
                        <div>
                            <label className="form-label">Filtrar por estado:</label>
                            <select
                                className="form-select"
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                            >
                                <option value="Todas">Todas</option>
                                <option value="Pendiente">Pendientes</option>
                                <option value="Check-In">En Curso</option>
                                <option value="Check-Out">Finalizadas</option>
                                <option value="Cancelada">Canceladas</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Ordenar por fecha:</label>
                            <select
                                className="form-select"
                                value={filtroFecha}
                                onChange={(e) => setFiltroFecha(e.target.value)}
                            >
                                <option value="recientes">Más recientes primero</option>
                                <option value="antiguas">Más antiguas primero</option>
                            </select>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Listado de reservas */}
            {reservasFiltradas.length > 0 ? (
                <Card>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Habitación</th>
                                        <th>Fechas</th>
                                        <th>Noches</th>
                                        <th>Total</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservasFiltradas.map(reserva => (
                                        <tr key={reserva.id}>
                                            <td>
                                                <strong>Habitación #{reserva.habitacion_info.numero}</strong><br />
                                                <small className="text-muted">
                                                    {reserva.habitacion_info.tipo.nombre} - {reserva.habitacion_info.sede}
                                                </small>
                                            </td>
                                            <td>
                                                {formatFecha(reserva.fecha_inicio)} <br />
                                                al {formatFecha(reserva.fecha_fin)}
                                            </td>
                                            <td>
                                                {Math.ceil(
                                                    (new Date(reserva.fecha_fin) - new Date(reserva.fecha_inicio))
                                                    / (1000 * 60 * 60 * 24)
                                                )}
                                            </td>
                                            <td>S/. {reserva.total}</td>
                                            <td>
                                                <Badge bg={getEstadoLabel(reserva.estado).variant}>
                                                    {getEstadoLabel(reserva.estado).label}
                                                </Badge>
                                            </td>
                                            <td>
                                                {reserva.estado === 'Pendiente' && (
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleCancelar(reserva.id)}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            ) : (
                <Alert variant="info">
                    No tienes reservas {filtroEstado !== 'Todas' ? `con estado ${filtroEstado}` : ''}
                </Alert>
            )}
        </Container>
    );
}