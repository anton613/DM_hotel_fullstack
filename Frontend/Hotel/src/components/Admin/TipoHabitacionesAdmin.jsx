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
    Image,
    Badge,
    Pagination,
    Stack
} from 'react-bootstrap';
import {
    MEDIA_BASE_URL,
    getTiposHabitacion,
    createTipoHabitacion,
    updateTipoHabitacion,
    deleteTipoHabitacion
} from '../../api/conexions';
import { useAuth } from '../context/AuthContext';

export default function TipoHabitacionesAdmin() {
    const { accessToken } = useAuth();
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentTipo, setCurrentTipo] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        imagen1: null,
        imagen2: null,
        imagen3: null
    });
    const [previewImages, setPreviewImages] = useState({
        imagen1: null,
        imagen2: null,
        imagen3: null
    });
    const [validated, setValidated] = useState(false);
    const [formErrors, setFormErrors] = useState({
        nombre: false,
        descripcion: false,
        imagen1: false
    });

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(tipos.length / itemsPerPage);
    const currentItems = tipos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Cargar tipos de habitación
    const loadTipos = async () => {
        try {
            setLoading(true);
            const response = await getTiposHabitacion(accessToken);
            setTipos(response.data);
        } catch (err) {
            setError('Error al cargar los tipos de habitación');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTipos();
    }, [accessToken]);

    // Función para obtener las URLs de las imágenes
    const getImagenesTipo = (tipo) => {
        return [
            tipo.imagen1 ? `${MEDIA_BASE_URL}${tipo.imagen1}` : null,
            tipo.imagen2 ? `${MEDIA_BASE_URL}${tipo.imagen2}` : null,
            tipo.imagen3 ? `${MEDIA_BASE_URL}${tipo.imagen3}` : null
        ].filter(img => img !== null);
    };

    // Manejar cambios en el formulario
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Validación en tiempo real
        if (name === 'nombre' || name === 'descripcion') {
            setFormErrors(prev => ({
                ...prev,
                [name]: value.trim() === ''
            }));
        }
    };

    // Manejar imágenes
    const handleImageChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                [fieldName]: file
            }));

            // Validar imagen principal solo para creación
            if (fieldName === 'imagen1' && !isEditing) {
                setFormErrors(prev => ({
                    ...prev,
                    imagen1: false
                }));
            }

            // Crear preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImages(prev => ({
                    ...prev,
                    [fieldName]: reader.result
                }));
            };
            reader.readAsDataURL(file);
        } else {
            // Si se elimina la imagen principal en creación
            if (fieldName === 'imagen1' && !isEditing) {
                setFormErrors(prev => ({
                    ...prev,
                    imagen1: true
                }));
            }
        }
    };

    // Resetear formulario
    const resetForm = () => {
        setFormData({
            nombre: '',
            descripcion: '',
            imagen1: null,
            imagen2: null,
            imagen3: null
        });
        setPreviewImages({
            imagen1: null,
            imagen2: null,
            imagen3: null
        });
        setCurrentTipo(null);
        setIsEditing(false);
        setValidated(false);
        setFormErrors({
            nombre: false,
            descripcion: false,
            imagen1: false
        });
    };

    // Abrir modal para crear
    const handleCreate = () => {
        resetForm();
        setShowModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (tipo) => {
        setCurrentTipo(tipo);
        setFormData({
            nombre: tipo.nombre,
            descripcion: tipo.descripcion,
            imagen1: null,
            imagen2: null,
            imagen3: null
        });
        setPreviewImages({
            imagen1: tipo.imagen1 ? `${MEDIA_BASE_URL}${tipo.imagen1}` : null,
            imagen2: tipo.imagen2 ? `${MEDIA_BASE_URL}${tipo.imagen2}` : null,
            imagen3: tipo.imagen3 ? `${MEDIA_BASE_URL}${tipo.imagen3}` : null
        });
        setIsEditing(true);
        setShowModal(true);
        setFormErrors({
            nombre: false,
            descripcion: false,
            imagen1: false
        });
    };

    // Validar formulario antes de enviar
    const validateForm = () => {
        const errors = {
            nombre: formData.nombre.trim() === '',
            descripcion: formData.descripcion.trim() === '',
            imagen1: !isEditing && !formData.imagen1 && !previewImages.imagen1
        };

        setFormErrors(errors);
        return !Object.values(errors).some(error => error);
    };

    // Enviar formulario (crear/actualizar)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const form = e.currentTarget;
        if (!validateForm()) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('nombre', formData.nombre);
        formDataToSend.append('descripcion', formData.descripcion);
        if (formData.imagen1) formDataToSend.append('imagen1', formData.imagen1);
        if (formData.imagen2) formDataToSend.append('imagen2', formData.imagen2);
        if (formData.imagen3) formDataToSend.append('imagen3', formData.imagen3);

        try {
            if (isEditing) {
                await updateTipoHabitacion(currentTipo.id, formDataToSend, accessToken);
            } else {
                await createTipoHabitacion(formDataToSend, accessToken);
            }
            loadTipos();
            setShowModal(false);
            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar el tipo de habitación');
            console.error(err);
        }
    };

    // Eliminar tipo de habitación
    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este tipo de habitación?')) {
            try {
                await deleteTipoHabitacion(id, accessToken);
                loadTipos();
            } catch (err) {
                setError('Error al eliminar el tipo de habitación');
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
            <h2 className="mb-3 mb-md-4">Gestión de Tipos de Habitación</h2>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            <Button variant="primary" onClick={handleCreate} className="mb-3">
                Crear Nuevo Tipo
            </Button>

            {/* Filtros */}
            <Card className="mb-3 mb-md-4 shadow-sm">
                <Card.Body>
                    <Stack direction="horizontal" gap={3} className="flex-wrap">
                        <Form.Group className="flex-grow-1" style={{ minWidth: '200px' }}>
                            <Form.Label>Ordenar por nombre:</Form.Label>
                            <Form.Select
                                onChange={(e) => {
                                    const sorted = [...tipos];
                                    if (e.target.value === 'asc') {
                                        sorted.sort((a, b) => a.nombre.localeCompare(b.nombre));
                                    } else if (e.target.value === 'desc') {
                                        sorted.sort((a, b) => b.nombre.localeCompare(a.nombre));
                                    }
                                    setTipos(sorted);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">Sin orden</option>
                                <option value="asc">A-Z</option>
                                <option value="desc">Z-A</option>
                            </Form.Select>
                        </Form.Group>
                    </Stack>
                </Card.Body>
            </Card>

            {/* Listado de tipos */}
            {tipos.length > 0 ? (
                <>
                    {/* Vista de escritorio - Table */}
                    <div className="d-none d-md-block">
                        <Card className="shadow-sm mb-3">
                            <Card.Body className="p-0">
                                <Table responsive striped bordered hover className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Descripción</th>
                                            <th>Imágenes</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map(tipo => {
                                            const imagenes = getImagenesTipo(tipo);

                                            return (
                                                <tr key={tipo.id}>
                                                    <td>{tipo.nombre}</td>
                                                    <td>
                                                        {tipo.descripcion.length > 50
                                                            ? `${tipo.descripcion.substring(0, 50)}...`
                                                            : tipo.descripcion}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            {imagenes.map((imagen, index) => (
                                                                <Image
                                                                    key={index}
                                                                    src={imagen}
                                                                    alt={`${tipo.nombre} ${index + 1}`}
                                                                    thumbnail
                                                                    style={{
                                                                        width: '60px',
                                                                        height: '60px',
                                                                        objectFit: 'cover'
                                                                    }}
                                                                    onError={(e) => {
                                                                        e.target.src = '/placeholder-image.jpg';
                                                                        e.target.onerror = null;
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <Button
                                                                variant="warning"
                                                                size="sm"
                                                                onClick={() => handleEdit(tipo)}
                                                            >
                                                                Editar
                                                            </Button>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleDelete(tipo.id)}
                                                            >
                                                                Eliminar
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </div>

                    {/* Vista móvil - Cards */}
                    <div className="d-md-none">
                        <Stack gap={3} className="mb-3">
                            {currentItems.map(tipo => {
                                const imagenes = getImagenesTipo(tipo);

                                return (
                                    <Card key={tipo.id} className="shadow-sm">
                                        <Card.Body>
                                            <Stack gap={2}>
                                                <div className="d-flex justify-content-between">
                                                    <h5 className="mb-0">{tipo.nombre}</h5>
                                                </div>

                                                <div>
                                                    {tipo.descripcion.length > 100
                                                        ? `${tipo.descripcion.substring(0, 100)}...`
                                                        : tipo.descripcion}
                                                </div>

                                                <div className="d-flex gap-2">
                                                    {imagenes.map((imagen, index) => (
                                                        <Image
                                                            key={index}
                                                            src={imagen}
                                                            alt={`${tipo.nombre} ${index + 1}`}
                                                            thumbnail
                                                            style={{
                                                                width: '60px',
                                                                height: '60px',
                                                                objectFit: 'cover'
                                                            }}
                                                            onError={(e) => {
                                                                e.target.src = '/placeholder-image.jpg';
                                                                e.target.onerror = null;
                                                            }}
                                                        />
                                                    ))}
                                                </div>

                                                <div className="d-flex gap-2 mt-2">
                                                    <Button
                                                        variant="warning"
                                                        size="sm"
                                                        className="flex-grow-1"
                                                        onClick={() => handleEdit(tipo)}
                                                    >
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="flex-grow-1"
                                                        onClick={() => handleDelete(tipo.id)}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </Stack>
                                        </Card.Body>
                                    </Card>
                                );
                            })}
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
                    No hay tipos de habitación registrados
                </Alert>
            )}

            {/* Modal para crear/editar */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {isEditing ? 'Editar Tipo de Habitación' : 'Crear Nuevo Tipo de Habitación'}
                    </Modal.Title>
                </Modal.Header>
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3" controlId="formNombre">
                            <Form.Label>Nombre</Form.Label>
                            <Form.Control
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                                isInvalid={formErrors.nombre}
                            />
                            <Form.Control.Feedback type="invalid">
                                Por favor ingresa un nombre para el tipo de habitación
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formDescripcion">
                            <Form.Label>Descripción</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                required
                                isInvalid={formErrors.descripcion}
                            />
                            <Form.Control.Feedback type="invalid">
                                Por favor ingresa una descripción
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Row className="mb-3">
                            {['imagen1', 'imagen2', 'imagen3'].map((imgField, index) => (
                                <Col md={4} key={imgField}>
                                    <Form.Group controlId={`form${imgField}`}>
                                        <Form.Label>
                                            {index === 0 ? 'Imagen Principal' : `Imagen Secundaria ${index}`}
                                            {index === 0 && !isEditing && <span className="text-danger"> *</span>}
                                        </Form.Label>
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageChange(e, imgField)}
                                            required={index === 0 && !isEditing}
                                            isInvalid={index === 0 && formErrors.imagen1 && !isEditing}
                                        />
                                        {index === 0 && !isEditing && (
                                            <Form.Control.Feedback type="invalid">
                                                Por favor selecciona una imagen principal
                                            </Form.Control.Feedback>
                                        )}
                                        {previewImages[imgField] && (
                                            <Image
                                                src={previewImages[imgField]}
                                                alt={`Preview ${index + 1}`}
                                                thumbnail
                                                className="mt-2"
                                                style={{
                                                    width: '100%',
                                                    height: '120px',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        )}
                                    </Form.Group>
                                </Col>
                            ))}
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