import { useState, useEffect } from 'react';
import {
    Container,
    Table,
    Button,
    Modal,
    Form,
    Alert,
    Spinner,
    Card,
    Row,
    Col,
    Badge,
    Pagination,
    Stack
} from 'react-bootstrap';
import {
    getCupones,
    createCupon,
    updateCupon,
    toggleEstadoCupon,
    deleteCupon
} from '../../api/conexions';
import { useAuth } from '../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function CuponAdmin() {
    const { accessToken, user } = useAuth();
    const [allCupones, setAllCupones] = useState([]);
    const [filteredCupones, setFilteredCupones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentCupon, setCurrentCupon] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [validated, setValidated] = useState(false);
    const [currentFilter, setCurrentFilter] = useState('');

    // Estado del formulario
    const [formData, setFormData] = useState({
        codigo: '',
        valor: '',
        tipo: 'porcentaje',
        max_usos: 1,
        fecha_inicio: new Date(),
        fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        activo: true
    });

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(filteredCupones.length / itemsPerPage);
    const currentItems = filteredCupones.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Cargar cupones
    const loadCupones = async () => {
        try {
            setLoading(true);
            const response = await getCupones(accessToken);
            setAllCupones(response.data);
            setFilteredCupones(response.data);
            setCurrentFilter('');
        } catch (err) {
            setError('Error al cargar los cupones');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCupones();
    }, [accessToken]);

    // Manejar cambios en el formulario
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Manejar cambios en fechas
    const handleDateChange = (date, field) => {
        setFormData(prev => ({
            ...prev,
            [field]: date
        }));
    };

    // Resetear formulario
    const resetForm = () => {
        setFormData({
            codigo: '',
            valor: '',
            tipo: 'porcentaje',
            max_usos: 1,
            fecha_inicio: new Date(),
            fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            activo: true
        });
        setCurrentCupon(null);
        setIsEditing(false);
        setValidated(false);
    };

    // Abrir modal para crear
    const handleCreate = () => {
        resetForm();
        setShowModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (cupon) => {
        setCurrentCupon(cupon);
        setFormData({
            codigo: cupon.codigo,
            valor: cupon.valor,
            tipo: cupon.tipo,
            max_usos: cupon.max_usos,
            fecha_inicio: new Date(cupon.fecha_inicio),
            fecha_fin: new Date(cupon.fecha_fin),
            activo: cupon.activo
        });
        setIsEditing(true);
        setShowModal(true);
    };

    // Validar formulario
    const validateForm = () => {
        const errors = {
            codigo: formData.codigo.trim() === '',
            valor: formData.valor === '' || isNaN(formData.valor),
            max_usos: formData.max_usos === '' || isNaN(formData.max_usos) || formData.max_usos < 1,
            fecha_inicio: !formData.fecha_inicio,
            fecha_fin: !formData.fecha_fin || formData.fecha_fin <= formData.fecha_inicio
        };

        return !Object.values(errors).some(error => error);
    };

    // Enviar formulario (crear/actualizar)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            setValidated(true);
            return;
        }

        const dataToSend = {
            ...formData,
            fecha_inicio: formData.fecha_inicio.toISOString(),
            fecha_fin: formData.fecha_fin.toISOString(),
            creado_por: user.id
        };

        try {
            if (isEditing) {
                await updateCupon(currentCupon.id, dataToSend, accessToken);
            } else {
                await createCupon(dataToSend, accessToken);
            }
            loadCupones();
            setShowModal(false);
            resetForm();
        } catch (err) {
            const errorData = err.response?.data;
            let errorMessage = 'Error al guardar el cupón';

            if (errorData) {
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else {
                    // Para errores de validación de Django
                    errorMessage = Object.entries(errorData)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                        .join('\n');
                }
            }

            setError(errorMessage);
            console.error('Error detallado:', {
                error: err,
                response: err.response?.data,
                requestData: dataToSend
            });
        }
    };

    // Cambiar estado activo/inactivo
    const toggleActivo = async (id, activo) => {
        try {
            await toggleEstadoCupon(id, activo, accessToken);
            loadCupones();
        } catch (err) {
            setError('Error al cambiar el estado del cupón');
            console.error(err);
        }
    };

    // Eliminar cupón
    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este cupón?')) {
            try {
                await deleteCupon(id, accessToken);
                loadCupones();
            } catch (err) {
                setError('Error al eliminar el cupón');
                console.error(err);
            }
        }
    };

    // Paginación
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const paginationItems = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let number = startPage; number <= endPage; number++) {
        paginationItems.push(
            <Pagination.Item
                key={number}
                active={number === currentPage}
                onClick={() => paginate(number)}
            >
                {number}
            </Pagination.Item>
        );
    }

    // Aplicar filtro
    const applyFilter = (filter) => {
        setCurrentFilter(filter);
        setCurrentPage(1);

        if (filter === 'activos') {
            setFilteredCupones(allCupones.filter(c => c.activo));
        } else if (filter === 'inactivos') {
            setFilteredCupones(allCupones.filter(c => !c.activo));
        } else {
            setFilteredCupones([...allCupones]);
        }
    };

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </Spinner>
            </Container>
        );
    }

    return (
        <Container className="my-3 my-md-5">
            <h2 className="mb-3 mb-md-4">Gestión de Cupones de Descuento</h2>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            <Button variant="primary" onClick={handleCreate} className="mb-3">
                Crear Nuevo Cupón
            </Button>

            {/* Filtros */}
            <Card className="mb-3 mb-md-4 shadow-sm">
                <Card.Body>
                    <Stack direction="horizontal" gap={3} className="flex-wrap">
                        <Form.Group className="flex-grow-1" style={{ minWidth: '200px' }}>
                            <Form.Label>Filtrar por estado:</Form.Label>
                            <Form.Select
                                value={currentFilter}
                                onChange={(e) => applyFilter(e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="activos">Activos</option>
                                <option value="inactivos">Inactivos</option>
                            </Form.Select>
                        </Form.Group>
                    </Stack>
                </Card.Body>
            </Card>

            {/* Listado de cupones */}
            {filteredCupones.length > 0 ? (
                <>
                    {/* Vista de escritorio - Table */}
                    <div className="d-none d-md-block">
                        <Card className="shadow-sm mb-3">
                            <Card.Body className="p-0">
                                <Table responsive striped bordered hover className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Código</th>
                                            <th>Descuento</th>
                                            <th>Tipo</th>
                                            <th>Usos Disp.</th>
                                            <th>Válido Desde</th>
                                            <th>Válido Hasta</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map(cupon => (
                                            <tr key={cupon.id}>
                                                <td><strong>{cupon.codigo}</strong></td>
                                                <td>
                                                    {cupon.tipo === 'porcentaje' ?
                                                        `${cupon.valor}%` :
                                                        `$${cupon.valor}`
                                                    }
                                                </td>
                                                <td>
                                                    <Badge bg={cupon.tipo === 'porcentaje' ? 'info' : 'success'}>
                                                        {cupon.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
                                                    </Badge>
                                                </td>
                                                <td>{cupon.usos_disponibles} / {cupon.max_usos}</td>
                                                <td>{new Date(cupon.fecha_inicio).toLocaleDateString()}</td>
                                                <td>{new Date(cupon.fecha_fin).toLocaleDateString()}</td>
                                                <td>
                                                    <Form.Check
                                                        type="switch"
                                                        id={`activo-${cupon.id}`}
                                                        checked={cupon.activo}
                                                        onChange={() => toggleActivo(cupon.id, cupon.activo)}
                                                        label={cupon.activo ? 'Activo' : 'Inactivo'}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <Button
                                                            variant="warning"
                                                            size="sm"
                                                            onClick={() => handleEdit(cupon)}
                                                        >
                                                            Editar
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(cupon.id)}
                                                        >
                                                            Eliminar
                                                        </Button>
                                                    </div>
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
                            {currentItems.map(cupon => (
                                <Card key={cupon.id} className="shadow-sm">
                                    <Card.Body>
                                        <Stack gap={2}>
                                            <div className="d-flex justify-content-between">
                                                <h5 className="mb-0">{cupon.codigo}</h5>
                                                <Badge bg={cupon.tipo === 'porcentaje' ? 'info' : 'success'}>
                                                    {cupon.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
                                                </Badge>
                                            </div>

                                            <div>
                                                <strong>Descuento:</strong> {cupon.tipo === 'porcentaje' ?
                                                    `${cupon.valor}%` :
                                                    `$${cupon.valor}`
                                                }
                                            </div>

                                            <div>
                                                <strong>Usos:</strong> {cupon.usos_disponibles} / {cupon.max_usos}
                                            </div>

                                            <div>
                                                <strong>Válido:</strong> {new Date(cupon.fecha_inicio).toLocaleDateString()} - {new Date(cupon.fecha_fin).toLocaleDateString()}
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <Form.Check
                                                    type="switch"
                                                    id={`activo-mobile-${cupon.id}`}
                                                    checked={cupon.activo}
                                                    onChange={() => toggleActivo(cupon.id, cupon.activo)}
                                                    label={cupon.activo ? 'Activo' : 'Inactivo'}
                                                />

                                                <div className="d-flex gap-2">
                                                    <Button
                                                        variant="warning"
                                                        size="sm"
                                                        onClick={() => handleEdit(cupon)}
                                                    >
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(cupon.id)}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </div>
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

                                {startPage > 1 && (
                                    <Pagination.Ellipsis disabled />
                                )}

                                {paginationItems}

                                {endPage < totalPages && (
                                    <Pagination.Ellipsis disabled />
                                )}

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
                    No hay cupones {currentFilter === 'activos' ? 'activos' : currentFilter === 'inactivos' ? 'inactivos' : ''} registrados
                </Alert>
            )}

            {/* Modal para crear/editar */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {isEditing ? 'Editar Cupón' : 'Crear Nuevo Cupón'}
                    </Modal.Title>
                </Modal.Header>
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="formCodigo">
                                    <Form.Label>Código del Cupón</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="codigo"
                                        value={formData.codigo}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ej: VERANO202X"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Por favor ingresa un código para el cupón
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="formTipo">
                                    <Form.Label>Tipo de Descuento</Form.Label>
                                    <Form.Select
                                        name="tipo"
                                        value={formData.tipo}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="porcentaje">Porcentaje (%)</option>
                                        <option value="fijo">Monto Fijo</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="formValor">
                                    <Form.Label>
                                        Valor del Descuento ({formData.tipo === 'porcentaje' ? '%' : '$'})
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="valor"
                                        value={formData.valor}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        step={formData.tipo === 'porcentaje' ? "1" : "0.01"}
                                        placeholder={formData.tipo === 'porcentaje' ? "Ej: 10" : "Ej: 50.00"}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Por favor ingresa un valor válido
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="formMaxUsos">
                                    <Form.Label>Máximo de Usos Permitidos</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="max_usos"
                                        value={formData.max_usos}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                        placeholder="Ej: 100"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Por favor ingresa un número válido (mínimo 1)
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="formFechaInicio">
                                    <Form.Label>Fecha de Inicio</Form.Label>
                                    <DatePicker
                                        selected={formData.fecha_inicio}
                                        onChange={(date) => handleDateChange(date, 'fecha_inicio')}
                                        selectsStart
                                        startDate={formData.fecha_inicio}
                                        endDate={formData.fecha_fin}
                                        minDate={new Date()}
                                        className="form-control"
                                        required
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="Selecciona fecha"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="formFechaFin">
                                    <Form.Label>Fecha de Fin</Form.Label>
                                    <DatePicker
                                        selected={formData.fecha_fin}
                                        onChange={(date) => handleDateChange(date, 'fecha_fin')}
                                        selectsEnd
                                        startDate={formData.fecha_inicio}
                                        endDate={formData.fecha_fin}
                                        minDate={formData.fecha_inicio}
                                        className="form-control"
                                        required
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="Selecciona fecha"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3" controlId="formActivo">
                            <Form.Check
                                type="switch"
                                id="custom-switch"
                                label="¿Cupón activo?"
                                name="activo"
                                checked={formData.activo}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit">
                            {isEditing ? 'Actualizar' : 'Crear'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}