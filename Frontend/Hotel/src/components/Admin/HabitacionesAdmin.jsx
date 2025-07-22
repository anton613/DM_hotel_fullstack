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
    Pagination,
    Stack,
    Badge
} from 'react-bootstrap';
import {
    getHabitacionesAdmin,
    getTiposHabitacion,
    getSedes,
    createHabitacion,
    updateHabitacion,
    deleteHabitacion
} from '../../api/conexions';
import { useAuth } from '../context/AuthContext';

export default function HabitacionesAdmin() {
    const { accessToken } = useAuth();
    const [habitaciones, setHabitaciones] = useState([]);
    const [filteredHabitaciones, setFilteredHabitaciones] = useState([]);
    const [tiposHabitacion, setTiposHabitacion] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingDependencias, setLoadingDependencias] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentHabitacion, setCurrentHabitacion] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        numero: '',
        tipo: '',
        sede: '',
        precio: '',
        estadoHabitacion: 'Disponible'
    });
    const [validated, setValidated] = useState(false);
    const [formErrors, setFormErrors] = useState({
        numero: false,
        tipo: false,
        sede: false,
        precio: false
    });

    // Filtros avanzados
    const [filters, setFilters] = useState({
        numero: '',
        tipo: '',
        sede: '',
        estado: '',
        precioMin: '',
        precioMax: '',
        sortField: 'numero',
        sortOrder: 'asc'
    });

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(filteredHabitaciones.length / itemsPerPage);
    const currentItems = filteredHabitaciones.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Cargar datos
    const loadHabitaciones = async () => {
        try {
            setLoading(true);
            const response = await getHabitacionesAdmin(accessToken);
            setHabitaciones(response.data);
            applyFilters(response.data);
        } catch (err) {
            setError('Error al cargar las habitaciones');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadDependencias = async () => {
        try {
            setLoadingDependencias(true);
            const [tiposRes, sedesRes] = await Promise.all([
                getTiposHabitacion(accessToken),
                getSedes(accessToken)
            ]);
            setTiposHabitacion(tiposRes.data);
            setSedes(sedesRes.data);
        } catch (err) {
            setError('Error al cargar dependencias');
            console.error(err);
        } finally {
            setLoadingDependencias(false);
        }
    };

    // Aplicar filtros
    const applyFilters = (data = habitaciones) => {
        let result = [...data];
        
        if (filters.numero) {
            result = result.filter(h => 
                h.numero.toLowerCase().includes(filters.numero.toLowerCase())
            );
        }
        
        if (filters.tipo) {
            result = result.filter(h => h.tipo.id.toString() === filters.tipo);
        }
        
        if (filters.sede) {
            result = result.filter(h => h.sede.toString() === filters.sede);
        }
        
        if (filters.estado) {
            result = result.filter(h => h.estadoHabitacion === filters.estado);
        }
        
        if (filters.precioMin) {
            result = result.filter(h => h.precio >= parseFloat(filters.precioMin));
        }
        
        if (filters.precioMax) {
            result = result.filter(h => h.precio <= parseFloat(filters.precioMax));
        }
        
        result.sort((a, b) => {
            const fieldA = a[filters.sortField];
            const fieldB = b[filters.sortField];
            
            if (typeof fieldA === 'string' && typeof fieldB === 'string') {
                return filters.sortOrder === 'asc' 
                    ? fieldA.localeCompare(fieldB)
                    : fieldB.localeCompare(fieldA);
            } else {
                return filters.sortOrder === 'asc' 
                    ? fieldA - fieldB
                    : fieldB - fieldA;
            }
        });
        
        setFilteredHabitaciones(result);
        setCurrentPage(1);
    };

    // Manejar cambios en los filtros
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    useEffect(() => {
        if (habitaciones.length > 0) {
            applyFilters();
        }
    }, [filters]);

    useEffect(() => {
        loadDependencias();
        loadHabitaciones();
    }, [accessToken]);

    // Manejar cambios en el formulario
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'numero' || name === 'precio') {
            setFormErrors(prev => ({
                ...prev,
                [name]: value.trim() === ''
            }));
        } else if (name === 'tipo' || name === 'sede') {
            setFormErrors(prev => ({
                ...prev,
                [name]: value === ''
            }));
        }
    };

    // Resetear formulario
    const resetForm = () => {
        setFormData({
            numero: '',
            tipo: '',
            sede: '',
            precio: '',
            estadoHabitacion: 'Disponible'
        });
        setCurrentHabitacion(null);
        setIsEditing(false);
        setValidated(false);
        setFormErrors({
            numero: false,
            tipo: false,
            sede: false,
            precio: false
        });
    };

    // Abrir modal para crear
    const handleCreate = () => {
        resetForm();
        setShowModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (habitacion) => {
        setCurrentHabitacion(habitacion);
        setFormData({
            numero: habitacion.numero,
            tipo: habitacion.tipo.id,
            sede: habitacion.sede,
            precio: habitacion.precio,
            estadoHabitacion: habitacion.estadoHabitacion
        });
        setIsEditing(true);
        setShowModal(true);
    };

    // Validar formulario
    const validateForm = () => {
        const errors = {
            numero: formData.numero.trim() === '',
            tipo: formData.tipo === '',
            sede: formData.sede === '',
            precio: formData.precio === '' || isNaN(formData.precio)
        };

        setFormErrors(errors);
        return !Object.values(errors).some(error => error);
    };

    // Enviar formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        const dataToSend = {
            numero: formData.numero,
            precio: parseFloat(formData.precio),
            estadoHabitacion: formData.estadoHabitacion
        };

        if (isEditing) {
            if (formData.tipo !== currentHabitacion?.tipo?.id) {
                dataToSend.tipo_id = formData.tipo;
            }
            if (formData.sede !== currentHabitacion?.sede) {
                dataToSend.sede_id = formData.sede;
            }
        } else {
            dataToSend.tipo_id = formData.tipo;
            dataToSend.sede_id = formData.sede;
        }

        try {
            if (isEditing) {
                await updateHabitacion(currentHabitacion.id, dataToSend, accessToken);
            } else {
                await createHabitacion(dataToSend, accessToken);
            }
            loadHabitaciones();
            setShowModal(false);
            resetForm();
        } catch (err) {
            const errorData = err.response?.data;
            let errorMessage = 'Error al guardar la habitación';

            if (errorData) {
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else {
                    errorMessage = Object.entries(errorData)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('\n');
                }
            }

            setError(errorMessage);
            console.error('Error detallado:', err);
        }
    };

    // Eliminar habitación
    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta habitación?')) {
            try {
                await deleteHabitacion(id, accessToken);
                loadHabitaciones();
            } catch (err) {
                setError('Error al eliminar la habitación');
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

    if (loading || loadingDependencias) {
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
            <h2 className="mb-3 mb-md-4">Gestión de Habitaciones</h2>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            <Button variant="primary" onClick={handleCreate} className="mb-3">
                Crear Nueva Habitación
            </Button>

            {/* Filtros avanzados */}
            <Card className="mb-3 mb-md-4 shadow-sm">
                <Card.Header className="bg-light">
                    <h5 className="mb-0">Filtros Avanzados</h5>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={6} lg={3} className="mb-3">
                            <Form.Group>
                                <Form.Label>Número de Habitación</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="numero"
                                    value={filters.numero}
                                    onChange={handleFilterChange}
                                    placeholder="Buscar por número"
                                />
                            </Form.Group>
                        </Col>
                        
                        <Col md={6} lg={3} className="mb-3">
                            <Form.Group>
                                <Form.Label>Tipo de Habitación</Form.Label>
                                <Form.Select
                                    name="tipo"
                                    value={filters.tipo}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Todos los tipos</option>
                                    {tiposHabitacion.map(tipo => (
                                        <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        
                        <Col md={6} lg={3} className="mb-3">
                            <Form.Group>
                                <Form.Label>Sede</Form.Label>
                                <Form.Select
                                    name="sede"
                                    value={filters.sede}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Todas las sedes</option>
                                    {sedes.map(sede => (
                                        <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        
                        <Col md={6} lg={3} className="mb-3">
                            <Form.Group>
                                <Form.Label>Estado</Form.Label>
                                <Form.Select
                                    name="estado"
                                    value={filters.estado}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="Disponible">Disponible</option>
                                    <option value="No Disponible">No Disponible</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        
                        <Col md={6} lg={3} className="mb-3">
                            <Form.Group>
                                <Form.Label>Precio Mínimo</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="precioMin"
                                    value={filters.precioMin}
                                    onChange={handleFilterChange}
                                    placeholder="S/. 0"
                                    min="0"
                                />
                            </Form.Group>
                        </Col>
                        
                        <Col md={6} lg={3} className="mb-3">
                            <Form.Group>
                                <Form.Label>Precio Máximo</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="precioMax"
                                    value={filters.precioMax}
                                    onChange={handleFilterChange}
                                    placeholder="S/. 1000"
                                    min="0"
                                />
                            </Form.Group>
                        </Col>
                        
                        <Col md={6} lg={3} className="mb-3">
                            <Form.Group>
                                <Form.Label>Ordenar por</Form.Label>
                                <Form.Select
                                    name="sortField"
                                    value={filters.sortField}
                                    onChange={handleFilterChange}
                                >
                                    <option value="numero">Número</option>
                                    <option value="precio">Precio</option>
                                    <option value="tipo">Tipo</option>
                                    <option value="sede">Sede</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        
                        <Col md={6} lg={3} className="mb-3">
                            <Form.Group>
                                <Form.Label>Dirección</Form.Label>
                                <Form.Select
                                    name="sortOrder"
                                    value={filters.sortOrder}
                                    onChange={handleFilterChange}
                                >
                                    <option value="asc">Ascendente</option>
                                    <option value="desc">Descendente</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    
                    <div className="d-flex justify-content-end mt-2">
                        <Button 
                            variant="outline-secondary" 
                            onClick={() => setFilters({
                                numero: '',
                                tipo: '',
                                sede: '',
                                estado: '',
                                precioMin: '',
                                precioMax: '',
                                sortField: 'numero',
                                sortOrder: 'asc'
                            })}
                        >
                            Limpiar Filtros
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Resumen de resultados */}
            <Card className="mb-3 shadow-sm">
                <Card.Body className="py-2">
                    <Row className="align-items-center">
                        <Col md={6}>
                            <strong>Total:</strong> {filteredHabitaciones.length} habitaciones
                        </Col>
                        <Col md={6} className="text-md-end">
                            <span className="me-3">
                                <Badge bg="success" className="me-1">Disponible</Badge>
                                {filteredHabitaciones.filter(h => h.estadoHabitacion === 'Disponible').length}
                            </span>
                            <span>
                                <Badge bg="secondary" className="me-1">No Disponible</Badge>
                                {filteredHabitaciones.filter(h => h.estadoHabitacion === 'No Disponible').length}
                            </span>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Listado de habitaciones */}
            {filteredHabitaciones.length > 0 ? (
                <>
                    {/* Vista de escritorio - Table */}
                    <div className="d-none d-md-block">
                        <Card className="shadow-sm mb-3">
                            <Card.Body className="p-0">
                                <Table responsive striped bordered hover className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Número</th>
                                            <th>Tipo</th>
                                            <th>Sede</th>
                                            <th>Precio</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map(habitacion => (
                                            <tr key={habitacion.id}>
                                                <td>{habitacion.numero}</td>
                                                <td>{habitacion.tipo.nombre}</td>
                                                <td>{habitacion.sede}</td>
                                                <td>S/. {habitacion.precio.toLocaleString()}</td>
                                                <td>
                                                    <Badge 
                                                        bg={habitacion.estadoHabitacion === 'Disponible' ? 'success' : 'secondary'}
                                                    >
                                                        {habitacion.estadoHabitacion}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <Button
                                                            variant="warning"
                                                            size="sm"
                                                            onClick={() => handleEdit(habitacion)}
                                                        >
                                                            Editar
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(habitacion.id)}
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
                            {currentItems.map(habitacion => (
                                <Card key={habitacion.id} className="shadow-sm">
                                    <Card.Body>
                                        <Stack gap={2}>
                                            <div className="d-flex justify-content-between">
                                                <h5 className="mb-0">Habitación {habitacion.numero}</h5>
                                                <Badge 
                                                    bg={habitacion.estadoHabitacion === 'Disponible' ? 'success' : 'secondary'}
                                                >
                                                    {habitacion.estadoHabitacion}
                                                </Badge>
                                            </div>

                                            <div>
                                                <strong>Tipo:</strong> {habitacion.tipo.nombre}
                                            </div>

                                            <div>
                                                <strong>Sede:</strong> {habitacion.sede}
                                            </div>

                                            <div>
                                                <strong>Precio:</strong> S/. {habitacion.precio.toLocaleString()}
                                            </div>

                                            <div className="d-flex gap-2 mt-2">
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="flex-grow-1"
                                                    onClick={() => handleEdit(habitacion)}
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="flex-grow-1"
                                                    onClick={() => handleDelete(habitacion.id)}
                                                >
                                                    Eliminar
                                                </Button>
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
                    No se encontraron habitaciones con los filtros aplicados
                </Alert>
            )}

            {/* Modal para crear/editar */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {isEditing ? 'Editar Habitación' : 'Crear Nueva Habitación'}
                    </Modal.Title>
                </Modal.Header>
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="formNumero">
                                    <Form.Label>Número de Habitación</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="numero"
                                        value={formData.numero}
                                        onChange={handleChange}
                                        required
                                        isInvalid={formErrors.numero}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Por favor ingresa el número de habitación
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="formPrecio">
                                    <Form.Label>Precio (S/.)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="precio"
                                        value={formData.precio}
                                        onChange={handleChange}
                                        required
                                        isInvalid={formErrors.precio}
                                        min="0"
                                        step="0.01"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Por favor ingresa un precio válido
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="formTipo">
                                    <Form.Label>Tipo de Habitación</Form.Label>
                                    <Form.Select
                                        name="tipo"
                                        value={formData.tipo}
                                        onChange={handleChange}
                                        required
                                        isInvalid={formErrors.tipo}
                                    >
                                        <option value="">Seleccione un tipo</option>
                                        {tiposHabitacion.map(tipo => (
                                            <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        Por favor selecciona un tipo de habitación
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="formSede">
                                    <Form.Label>Sede</Form.Label>
                                    <Form.Select
                                        name="sede"
                                        value={formData.sede}
                                        onChange={handleChange}
                                        required
                                        isInvalid={formErrors.sede}
                                    >
                                        <option value="">Seleccione una sede</option>
                                        {sedes.map(sede => (
                                            <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        Por favor selecciona una sede
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="formEstado">
                                    <Form.Label>Estado</Form.Label>
                                    <Form.Select
                                        name="estadoHabitacion"
                                        value={formData.estadoHabitacion}
                                        onChange={handleChange}
                                    >
                                        <option value="Disponible">Disponible</option>
                                        <option value="No Disponible">No Disponible</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
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