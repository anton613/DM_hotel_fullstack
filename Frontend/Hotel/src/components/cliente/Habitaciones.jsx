import { useState, useEffect } from 'react';
import { getHabitaciones, MEDIA_BASE_URL } from "../../api/conexions";
import { Container, Row, Col, Card, Form, Button, Carousel, Pagination, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

export default function Habitaciones() {
    const [habitaciones, setHabitaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [totalDisponibles, setTotalDisponibles] = useState(0);

    // Estados para los filtros
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroSede, setFiltroSede] = useState('');
    const [precioMin, setPrecioMin] = useState('');
    const [precioMax, setPrecioMax] = useState('');
    const [ordenPrecio, setOrdenPrecio] = useState('');

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const handleReservar = (habitacionId) => {
        if (!user) {
            navigate('/login');
        } else {
            navigate(`/reservar/${habitacionId}`);
        }
    };

    const loadHabitaciones = async () => {
        try {
            const response = await getHabitaciones();
            console.log('Datos recibidos:', response.data); // Para depuración
            
            // Solución 2: Filtro case-insensitive y verificación de null/undefined
            const habitacionesDisponibles = response.data.filter(h => {
                const estado = h.estadoHabitacion?.toString().toLowerCase();
                return estado === 'disponible';
            });
            
            console.log('Habitaciones disponibles filtradas:', habitacionesDisponibles);
            setHabitaciones(habitacionesDisponibles);
            setTotalDisponibles(habitacionesDisponibles.length);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching habitaciones:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHabitaciones();
    }, []);

    // Obtener valores únicos para los filtros (con comprobación de seguridad)
    const tipos = [...new Set(habitaciones.map(h => h.tipo?.nombre).filter(Boolean))];
    const sedes = [...new Set(habitaciones.map(h => h.sede).filter(Boolean))];
    const precios = habitaciones.map(h => parseFloat(h.precio || 0));
    const precioMinDisponible = precios.length > 0 ? Math.min(...precios) : 0;
    const precioMaxDisponible = precios.length > 0 ? Math.max(...precios) : 0;

    // Filtrar y ordenar habitaciones
    const habitacionesFiltradas = habitaciones
        .filter(habitacion => {
            const precio = parseFloat(habitacion.precio || 0);
            const cumpleTipo = filtroTipo === '' || habitacion.tipo?.nombre === filtroTipo;
            const cumpleSede = filtroSede === '' || habitacion.sede === filtroSede;
            const cumplePrecioMin = precioMin === '' || precio >= parseFloat(precioMin || 0);
            const cumplePrecioMax = precioMax === '' || precio <= parseFloat(precioMax || 0);

            return cumpleTipo && cumpleSede && cumplePrecioMin && cumplePrecioMax;
        })
        .sort((a, b) => {
            if (ordenPrecio === 'asc') {
                return parseFloat(a.precio || 0) - parseFloat(b.precio || 0);
            } else if (ordenPrecio === 'desc') {
                return parseFloat(b.precio || 0) - parseFloat(a.precio || 0);
            }
            return 0;
        });

    const resetFiltros = () => {
        setFiltroTipo('');
        setFiltroSede('');
        setPrecioMin('');
        setPrecioMax('');
        setOrdenPrecio('');
        setCurrentPage(1);
    };

    const getImagenesTipo = (tipo) => {
        if (!tipo) return [];
        return [tipo.imagen1, tipo.imagen2, tipo.imagen3]
            .filter(img => img !== null && img !== undefined)
            .map(img => `${MEDIA_BASE_URL}${img}`);
    };

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = habitacionesFiltradas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(habitacionesFiltradas.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando habitaciones...</span>
                </Spinner>
            </Container>
        );
    }

    return (
        <Container className="my-4">
            <Row className="mb-4">
                <Col className="text-center">
                    <h2>Habitaciones Disponibles</h2>
                    <p className="text-muted">
                        {totalDisponibles > 0 
                            ? `${totalDisponibles} habitaciones disponibles para reserva`
                            : 'No hay habitaciones disponibles actualmente'}
                    </p>
                    <hr className="mx-auto" style={{ width: '200px' }} />
                </Col>
            </Row>

            <Row className="flex-column-reverse flex-lg-row">
                <Col lg={3} className="mb-4 d-none d-lg-block">
                    <Card className="shadow-sm">
                        <Card.Header className="bg-primary text-white">
                            <h5 className="mb-0">Filtrar Habitaciones</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Ordenar por precio</Form.Label>
                                    <Form.Select
                                        value={ordenPrecio}
                                        onChange={(e) => {
                                            setOrdenPrecio(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <option value="">Sin orden</option>
                                        <option value="asc">Menor a mayor</option>
                                        <option value="desc">Mayor a menor</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Tipo de habitación</Form.Label>
                                    <Form.Select
                                        value={filtroTipo}
                                        onChange={(e) => {
                                            setFiltroTipo(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <option value="">Todos los tipos</option>
                                        {tipos.map((tipo, index) => (
                                            <option key={index} value={tipo}>{tipo}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Sede</Form.Label>
                                    <Form.Select
                                        value={filtroSede}
                                        onChange={(e) => {
                                            setFiltroSede(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <option value="">Todas las sedes</option>
                                        {sedes.map((sede, index) => (
                                            <option key={index} value={sede}>{sede}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Rango de precios (S/.)</Form.Label>
                                    <div className="d-flex align-items-center mb-2">
                                        <Form.Control
                                            type="number"
                                            placeholder="Mínimo"
                                            value={precioMin}
                                            onChange={(e) => {
                                                setPrecioMin(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            min={precioMinDisponible}
                                            max={precioMaxDisponible}
                                        />
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <Form.Control
                                            type="number"
                                            placeholder="Máximo"
                                            value={precioMax}
                                            onChange={(e) => {
                                                setPrecioMax(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            min={precioMinDisponible}
                                            max={precioMaxDisponible}
                                        />
                                    </div>
                                </Form.Group>

                                <div className="d-grid gap-2">
                                    <Button 
                                        variant="outline-secondary" 
                                        onClick={resetFiltros}
                                    >
                                        Limpiar filtros
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={9}>
                    {habitacionesFiltradas.length === 0 ? (
                        <Card className="text-center py-4">
                            <Card.Body>
                                <Card.Title>No hay habitaciones disponibles</Card.Title>
                                <Card.Text>
                                    {habitaciones.length === 0 
                                        ? "No hemos encontrado habitaciones disponibles en este momento." 
                                        : "No hay habitaciones que coincidan con tus criterios de búsqueda."}
                                </Card.Text>
                                <Button variant="primary" onClick={resetFiltros}>
                                    {habitaciones.length === 0 ? "Recargar" : "Mostrar todas"}
                                </Button>
                            </Card.Body>
                        </Card>
                    ) : (
                        <>
                            <Row xs={1} md={2} lg={3} className="g-4">
                                {currentItems.map((habitacion) => {
                                    const imagenes = getImagenesTipo(habitacion.tipo);

                                    return (
                                        <Col key={habitacion.id}>
                                            <Card className="h-100 shadow-sm">
                                                {imagenes.length > 0 && (
                                                    <>
                                                        {imagenes.length > 1 ? (
                                                            <Carousel interval={null} indicators={imagenes.length > 1}>
                                                                {imagenes.map((imagen, index) => (
                                                                    <Carousel.Item key={index}>
                                                                        <Card.Img
                                                                            variant="top"
                                                                            src={imagen}
                                                                            alt={`${habitacion.tipo?.nombre || 'Habitación'} - Imagen ${index + 1}`}
                                                                            style={{ height: '200px', objectFit: 'cover' }}
                                                                        />
                                                                    </Carousel.Item>
                                                                ))}
                                                            </Carousel>
                                                        ) : (
                                                            <Card.Img
                                                                variant="top"
                                                                src={imagenes[0]}
                                                                alt={habitacion.tipo?.nombre || 'Habitación'}
                                                                style={{ height: '200px', objectFit: 'cover' }}
                                                            />
                                                        )}
                                                    </>
                                                )}

                                                <Card.Body>
                                                    <Card.Title className="d-flex justify-content-between align-items-start">
                                                        <span>Habitación {habitacion.numero}</span>
                                                        <div>
                                                            <span className="badge bg-primary">
                                                                S/. {habitacion.precio}
                                                            </span>
                                                        </div>
                                                    </Card.Title>
                                                    <Card.Subtitle className="mb-2 text-muted small">
                                                        {habitacion.tipo?.nombre || 'Sin tipo'} • {habitacion.sede || 'Sin sede'}
                                                    </Card.Subtitle>
                                                    {habitacion.tipo?.descripcion && (
                                                        <Card.Text className="small">
                                                            {habitacion.tipo.descripcion.length > 100 
                                                                ? `${habitacion.tipo.descripcion.substring(0, 100)}...` 
                                                                : habitacion.tipo.descripcion}
                                                        </Card.Text>
                                                    )}
                                                    <div className="d-grid mt-3">
                                                        <Button 
                                                            variant="primary" 
                                                            onClick={() => handleReservar(habitacion.id)}
                                                            size="sm"
                                                        >
                                                            Reservar ahora
                                                        </Button>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>

                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-4">
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
                    )}
                </Col>
            </Row>

            {/* Filtros móviles */}
            <Card className="shadow-sm d-lg-none mt-4">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">Filtrar Habitaciones</h5>
                </Card.Header>
                <Card.Body className="p-2">
                    <Form>
                        <Form.Group className="mb-2">
                            <Form.Label className="small">Ordenar por precio</Form.Label>
                            <Form.Select
                                size="sm"
                                className="w-100"
                                value={ordenPrecio}
                                onChange={(e) => {
                                    setOrdenPrecio(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">Sin orden</option>
                                <option value="asc">Menor a mayor</option>
                                <option value="desc">Mayor a menor</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label className="small">Tipo de habitación</Form.Label>
                            <Form.Select
                                size="sm"
                                className="w-100"
                                value={filtroTipo}
                                onChange={(e) => {
                                    setFiltroTipo(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">Todos los tipos</option>
                                {tipos.map((tipo, index) => (
                                    <option key={index} value={tipo}>{tipo}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label className="small">Sede</Form.Label>
                            <Form.Select
                                size="sm"
                                className="w-100"
                                value={filtroSede}
                                onChange={(e) => {
                                    setFiltroSede(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">Todas las sedes</option>
                                {sedes.map((sede, index) => (
                                    <option key={index} value={sede}>{sede}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label className="small">Rango de precios (S/.)</Form.Label>
                            <div className="d-flex align-items-center mb-1 gap-1">
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    placeholder="Mín"
                                    value={precioMin}
                                    onChange={(e) => {
                                        setPrecioMin(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    min={precioMinDisponible}
                                    max={precioMaxDisponible}
                                    className="flex-grow-1"
                                />
                                <span className="mx-1">-</span>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    placeholder="Máx"
                                    value={precioMax}
                                    onChange={(e) => {
                                        setPrecioMax(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    min={precioMinDisponible}
                                    max={precioMaxDisponible}
                                    className="flex-grow-1"
                                />
                            </div>
                        </Form.Group>

                        <div className="d-grid gap-1">
                            <Button 
                                variant="outline-secondary" 
                                onClick={resetFiltros}
                                size="sm"
                            >
                                Limpiar filtros
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}