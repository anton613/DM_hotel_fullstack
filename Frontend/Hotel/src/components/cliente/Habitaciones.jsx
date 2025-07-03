import { useState, useEffect } from 'react';
import { getHabitaciones, MEDIA_BASE_URL } from "../../api/conexions";
import { Container, Row, Col, Card, Form, Button, InputGroup, Carousel } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";


export default function Habitaciones() {
    const [habitaciones, setHabitaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth(); // esto te dice si hay usuario logeado
    const navigate = useNavigate();

    const handleReservar = (habitacionId) => {
        if (!user) {
            navigate('/login');
        } else {
            navigate(`/reservar/${habitacionId}`); // ← Puedes crear esa ruta luego
        }
    };

    const loadHabitaciones = async () => {
        try {
            const response = await getHabitaciones();
            setHabitaciones(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching habitaciones:", error);
            setLoading(false);
        }
    }

    useEffect(() => {
        loadHabitaciones();
    }, []);

    // Estados para los filtros
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroSede, setFiltroSede] = useState('');
    const [precioMin, setPrecioMin] = useState('');
    const [precioMax, setPrecioMax] = useState('');

    // Obtener valores únicos para los filtros
    const tipos = [...new Set(habitaciones.map(h => h.tipo.nombre))];
    const sedes = [...new Set(habitaciones.map(h => h.sede))];
    const precios = habitaciones.map(h => parseFloat(h.precio));
    const precioMinDisponible = Math.min(...precios);
    const precioMaxDisponible = Math.max(...precios);

    // Filtrar habitaciones
    const habitacionesFiltradas = habitaciones.filter(habitacion => {
        const precio = parseFloat(habitacion.precio);
        const cumpleTipo = filtroTipo === '' || habitacion.tipo.nombre === filtroTipo;
        const cumpleSede = filtroSede === '' || habitacion.sede === filtroSede;
        const cumplePrecioMin = precioMin === '' || precio >= parseFloat(precioMin);
        const cumplePrecioMax = precioMax === '' || precio <= parseFloat(precioMax);

        return cumpleTipo && cumpleSede && cumplePrecioMin && cumplePrecioMax;
    });

    // Resetear filtros
    const resetFiltros = () => {
        setFiltroTipo('');
        setFiltroSede('');
        setPrecioMin('');
        setPrecioMax('');
    };

    // Función para obtener imágenes disponibles de un tipo
    const getImagenesTipo = (tipo) => {
        return [tipo.imagen1, tipo.imagen2, tipo.imagen3]
            .filter(img => img !== null)
            .map(img => `${MEDIA_BASE_URL}${img}`);
    };

    if (loading) {
        return <div className="text-center py-5">Cargando habitaciones...</div>;
    }

    return (
        <Container className="mt-5">
            <h1 className="mb-4">Habitaciones</h1>

            {/* Filtros */}
            <Card className="mb-4">
                <Card.Body>
                    <Form>
                        <Row>
                            <Col md={3}>
                                <Form.Group controlId="filtroTipo">
                                    <Form.Label>Tipo de habitación</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={filtroTipo}
                                        onChange={(e) => setFiltroTipo(e.target.value)}
                                    >
                                        <option value="">Todos los tipos</option>
                                        {tipos.map((tipo, index) => (
                                            <option key={index} value={tipo}>{tipo}</option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group controlId="filtroSede">
                                    <Form.Label>Sede</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={filtroSede}
                                        onChange={(e) => setFiltroSede(e.target.value)}
                                    >
                                        <option value="">Todas las sedes</option>
                                        {sedes.map((sede, index) => (
                                            <option key={index} value={sede}>{sede}</option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group controlId="precioMin">
                                    <Form.Label>Precio mínimo (S/.)</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="number"
                                            placeholder="Mínimo"
                                            value={precioMin}
                                            onChange={(e) => setPrecioMin(e.target.value)}
                                            min={precioMinDisponible}
                                            max={precioMaxDisponible}
                                        />
                                        <InputGroup.Text>.00</InputGroup.Text>
                                    </InputGroup>
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group controlId="precioMax">
                                    <Form.Label>Precio máximo (S/.)</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="number"
                                            placeholder="Máximo"
                                            value={precioMax}
                                            onChange={(e) => setPrecioMax(e.target.value)}
                                            min={precioMinDisponible}
                                            max={precioMaxDisponible}
                                        />
                                        <InputGroup.Text>.00</InputGroup.Text>
                                    </InputGroup>
                                </Form.Group>
                            </Col>

                            <Col md={12} className="mt-3 d-flex justify-content-end">
                                <Button variant="outline-secondary" onClick={resetFiltros}>
                                    Limpiar filtros
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Listado de habitaciones */}
            <Row>
                {habitacionesFiltradas.map((habitacion) => {
                    const imagenes = getImagenesTipo(habitacion.tipo);

                    return (
                        <Col key={habitacion.id} md={4} className="mb-4">
                            <Card className="h-100">
                                {/* Carrusel de imágenes si hay más de una, sino imagen simple */}
                                {imagenes.length > 0 && (
                                    <>
                                        {imagenes.length > 1 ? (
                                            <Carousel interval={null} indicators={imagenes.length > 1}>
                                                {imagenes.map((imagen, index) => (
                                                    <Carousel.Item key={index}>
                                                        <Card.Img
                                                            variant="top"
                                                            src={imagen}
                                                            alt={`${habitacion.tipo.nombre} - Imagen ${index + 1}`}
                                                            style={{ height: '200px', objectFit: 'cover' }}
                                                        />
                                                    </Carousel.Item>
                                                ))}
                                            </Carousel>
                                        ) : (
                                            <Card.Img
                                                variant="top"
                                                src={imagenes[0]}
                                                alt={habitacion.tipo.nombre}
                                                style={{ height: '200px', objectFit: 'cover' }}
                                            />
                                        )}
                                    </>
                                )}

                                <Card.Body>
                                    <Card.Title>Habitación {habitacion.numero}</Card.Title>
                                    <Card.Subtitle className="mb-2 text-muted">
                                        Tipo: {habitacion.tipo.nombre}
                                    </Card.Subtitle>
                                    {habitacion.tipo.descripcion && (
                                        <Card.Text className="small text-muted">
                                            {habitacion.tipo.descripcion}
                                        </Card.Text>
                                    )}
                                    <Card.Text>
                                        <strong>Sede:</strong> {habitacion.sede}<br />
                                        <strong>Precio:</strong> S/. {habitacion.precio}
                                    </Card.Text>
                                    <Button variant="primary" onClick={() => handleReservar(habitacion.id)}>
                                        Reservar
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {habitacionesFiltradas.length === 0 && !loading && (
                <div className="text-center py-4">
                    <p>No se encontraron habitaciones con los filtros seleccionados</p>
                    <Button variant="primary" onClick={resetFiltros}>
                        Mostrar todas
                    </Button>
                </div>
            )}
        </Container>
    );
}