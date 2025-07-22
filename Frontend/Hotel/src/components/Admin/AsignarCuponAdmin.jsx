import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, Alert, Spinner, Badge, Row, Col } from 'react-bootstrap';
import {
    getUsuariosConEstadisticas,
    getCuponesActivos,
    asignarCuponExistente
} from '../../api/conexions';
import { useAuth } from '../context/AuthContext';

export default function AsignarCuponAdmin() {
    const { accessToken } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [cupones, setCupones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cuponesLoading, setCuponesLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedCupon, setSelectedCupon] = useState('');
    const [filter, setFilter] = useState('0');

    // Cargar usuarios y cupones
    const loadData = async () => {
        try {
            setLoading(true);
            const [usersResponse, cuponesResponse] = await Promise.all([
                getUsuariosConEstadisticas(accessToken),
                getCuponesActivos(accessToken)
            ]);

            setUsuarios(usersResponse.data);
            setCupones(cuponesResponse.data);
            setError('');
        } catch (err) {
            setError('Error al cargar datos: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
            setCuponesLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [accessToken]);

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const filteredUsers = usuarios.filter(user => {
        if (filter === '0') return true;
        return user.total_reservas >= parseInt(filter);
    });

    const handleAsignarCupon = async () => {
        if (selectedUsers.length === 0) {
            setError('Debes seleccionar al menos un usuario');
            return;
        }

        if (!selectedCupon) {
            setError('Debes seleccionar un cupón');
            return;
        }

        setLoading(true);
        try {
            const response = await asignarCuponExistente(
                selectedUsers,
                selectedCupon,
                accessToken
            );

            setSuccess(response.data.message);

            // Actualizar la lista de usuarios después de la asignación
            await loadData();

            // Limpiar selecciones solo si fue exitoso
            if (response.data.enviados > 0) {
                setSelectedUsers([]);
                setSelectedCupon('');
            }
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Error al asignar cupón');
        } finally {
            setLoading(false);
        }
    };

    if (loading || cuponesLoading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Cargando datos...</p>
            </Container>
        );
    }

    return (
        <Container className="my-5">
            <Card>
                <Card.Header as="h5" className="bg-primary text-white">
                    Asignación de Cupones a Usuarios
                </Card.Header>
                <Card.Body>
                    {error && (
                        <Alert variant="danger" onClose={() => setError('')} dismissible>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
                            {success}
                        </Alert>
                    )}

                    <Row className="mb-4">
                        <Col md={6}>
                            <Form.Group controlId="formCupon">
                                <Form.Label>Seleccionar Cupón</Form.Label>
                                <Form.Select
                                    value={selectedCupon}
                                    onChange={(e) => setSelectedCupon(e.target.value)}
                                    disabled={cuponesLoading}
                                >
                                    <option value="">Seleccione un cupón</option>
                                    {cupones.map(cupon => (
                                        <option key={cupon.id} value={cupon.id}>
                                            {cupon.codigo} - {cupon.valor}{cupon.tipo === 'porcentaje' ? '%' : ' S/'}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="formFilter">
                                <Form.Label>Filtrar por reservas mínimas</Form.Label>
                                <Form.Select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                >
                                    <option value="0">Todos los usuarios</option>
                                    <option value="3">Más de 3 reservas</option>
                                    <option value="5">Más de 5 reservas</option>
                                    <option value="10">Más de 10 reservas</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mb-3">
                        <Button
                            variant="primary"
                            onClick={handleAsignarCupon}
                            disabled={selectedUsers.length === 0 || !selectedCupon || loading}
                        >
                            {loading ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                    <span className="ms-2">Asignando...</span>
                                </>
                            ) : (
                                `Asignar Cupón a Seleccionados (${selectedUsers.length})`
                            )}
                        </Button>
                    </div>

                    <Table striped bordered hover responsive className="mt-3">
                        <thead className="table-dark">
                            <tr>
                                <th style={{ width: '50px' }}></th>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Reservas totales</th>
                                <th>Última reserva</th>
                                <th>Cupones asignados</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <Form.Check
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => toggleUserSelection(user.id)}
                                            />
                                        </td>
                                        <td>{user.first_name} {user.last_name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <Badge
                                                bg={user.total_reservas > 5 ? 'success' :
                                                    user.total_reservas > 0 ? 'primary' : 'secondary'}
                                            >
                                                {user.total_reservas}
                                            </Badge>
                                        </td>
                                        <td>{user.ultima_reserva || 'N/A'}</td>
                                        <td>{user.cupones_asignados}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center">
                                        No se encontraron usuarios con los filtros seleccionados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
    );
}