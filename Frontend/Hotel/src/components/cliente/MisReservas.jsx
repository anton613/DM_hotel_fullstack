import { useState, useEffect } from 'react';
import { Container, Card, Table, Alert, Spinner, Button, Badge, Form, Pagination, Stack } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { getMisReservas, cancelarReserva } from '../../api/conexions';
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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Cargar reservas del usuario
    const loadReservas = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await getMisReservas(accessToken);
            setReservas(response.data);
        } catch (err) {
            console.error('Error al obtener reservas:', err.response?.data || err.message);
            setError(err.response?.data?.error || 'Error al cargar las reservas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && accessToken) {
            loadReservas();
        } else {
            navigate('/login');
        }
    }, [user, accessToken, navigate]);

    // Filtrar y ordenar reservas
    const reservasFiltradas = reservas.filter(reserva => {
        return filtroEstado === 'Todas' || reserva.estado === filtroEstado;
    }).sort((a, b) => {
        return filtroFecha === 'recientes'
            ? new Date(b.fecha_inicio) - new Date(a.fecha_inicio)
            : new Date(a.fecha_inicio) - new Date(b.fecha_inicio);
    });

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = reservasFiltradas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(reservasFiltradas.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Formatear fecha para mostrar
    const formatFecha = (fecha) => {
        return format(new Date(fecha), 'PPP', { locale: es });
    };

    // Formatear fecha corta para móviles
    const formatFechaCorta = (fecha) => {
        return format(new Date(fecha), 'dd/MM/yyyy');
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
            await cancelarReserva(reservaId, accessToken);
            loadReservas();
            setCurrentPage(1);
        } catch (err) {
            console.error('Error al cancelar reserva:', err.response?.data || err.message);
            setError(err.response?.data?.error || 'Error al cancelar la reserva');
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
        <Container className="my-3 my-md-5">
            <h2 className="mb-3 mb-md-4">Mis Reservas</h2>
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            {/* Filtros */}
            <Card className="mb-3 mb-md-4 shadow-sm">
                <Card.Body>
                    <Stack direction="horizontal" gap={3} className="flex-wrap">
                        <Form.Group className="flex-grow-1" style={{ minWidth: '200px' }}>
                            <Form.Label>Filtrar por estado:</Form.Label>
                            <Form.Select
                                value={filtroEstado}
                                onChange={(e) => {
                                    setFiltroEstado(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="Todas">Todas</option>
                                <option value="Pendiente">Pendientes</option>
                                <option value="Check-In">En Curso</option>
                                <option value="Check-Out">Finalizadas</option>
                                <option value="Cancelada">Canceladas</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="flex-grow-1" style={{ minWidth: '200px' }}>
                            <Form.Label>Ordenar por fecha:</Form.Label>
                            <Form.Select
                                value={filtroFecha}
                                onChange={(e) => {
                                    setFiltroFecha(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="recientes">Más recientes primero</option>
                                <option value="antiguas">Más antiguas primero</option>
                            </Form.Select>
                        </Form.Group>
                    </Stack>
                </Card.Body>
            </Card>

            {/* Listado de reservas */}
            {reservasFiltradas.length > 0 ? (
                <>
                    {/* Vista de escritorio - Table */}
                    <div className="d-none d-md-block">
                        <Card className="shadow-sm mb-3">
                            <Card.Body className="p-0">
                                <Table responsive striped bordered hover className="mb-0">
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
                                        {currentItems.map(reserva => (
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
                            </Card.Body>
                        </Card>
                    </div>

                    {/* Vista móvil - Cards */}
                    <div className="d-md-none">
                        <Stack gap={3} className="mb-3">
                            {currentItems.map(reserva => (
                                <Card key={reserva.id} className="shadow-sm">
                                    <Card.Body>
                                        <Stack gap={2}>
                                            <div className="d-flex justify-content-between">
                                                <h5 className="mb-0">Habitación #{reserva.habitacion_info.numero}</h5>
                                                <Badge bg={getEstadoLabel(reserva.estado).variant}>
                                                    {getEstadoLabel(reserva.estado).label}
                                                </Badge>
                                            </div>

                                            <div className="text-muted small">
                                                {reserva.habitacion_info.tipo.nombre} - {reserva.habitacion_info.sede}
                                            </div>

                                            <div className="d-flex justify-content-between">
                                                <span>Fechas:</span>
                                                <span>
                                                    {formatFechaCorta(reserva.fecha_inicio)} - {formatFechaCorta(reserva.fecha_fin)}
                                                </span>
                                            </div>

                                            <div className="d-flex justify-content-between">
                                                <span>Noches:</span>
                                                <span>
                                                    {Math.ceil(
                                                        (new Date(reserva.fecha_fin) - new Date(reserva.fecha_inicio))
                                                        / (1000 * 60 * 60 * 24)
                                                    )}
                                                </span>
                                            </div>

                                            <div className="d-flex justify-content-between fw-bold">
                                                <span>Total:</span>
                                                <span>S/. {reserva.total}</span>
                                            </div>

                                            {reserva.estado === 'Pendiente' && (
                                                <div className="mt-2">
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="w-100"
                                                        onClick={() => handleCancelar(reserva.id)}
                                                    >
                                                        Cancelar Reserva
                                                    </Button>
                                                </div>
                                            )}
                                        </Stack>
                                    </Card.Body>
                                </Card>
                            ))}
                        </Stack>
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center">
                            <Pagination>
                                <Pagination.First
                                    onClick={() => paginate(1)}
                                    disabled={currentPage === 1}
                                />
                                <Pagination.Prev
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                />

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                    <Pagination.Item
                                        key={number}
                                        active={number === currentPage}
                                        onClick={() => paginate(number)}
                                    >
                                        {number}
                                    </Pagination.Item>
                                ))}

                                <Pagination.Next
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                />
                                <Pagination.Last
                                    onClick={() => paginate(totalPages)}
                                    disabled={currentPage === totalPages}
                                />
                            </Pagination>
                        </div>
                    )}
                </>
            ) : (
                <Alert variant="info">
                    No tienes reservas {filtroEstado !== 'Todas' ? `con estado ${filtroEstado}` : ''}
                </Alert>
            )}
        </Container>
    );
}