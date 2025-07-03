import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Container, Row, Col, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { MEDIA_BASE_URL, Api } from '../../api/conexions';
import DatePicker from 'react-datepicker';
import { format, parseISO } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

export default function Reserva() {
    const { habitacionId } = useParams();
    const { user, accessToken } = useAuth();
    const navigate = useNavigate();

    // Estados del formulario
    const [habitacion, setHabitacion] = useState(null);
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);
    const [total, setTotal] = useState(0);
    const [noches, setNoches] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [metodoPago, setMetodoPago] = useState('tarjeta'); // Estado para el método de pago
    const [mostrarDetallesTarjeta, setMostrarDetallesTarjeta] = useState(false); // Controlar visibilidad de detalles de tarjeta

    // Cargar datos de la habitación
    useEffect(() => {
        const loadHabitacion = async () => {
            try {
                const response = await Api.get(`/cliente/habitaciones/${habitacionId}/`);
                setHabitacion(response.data);
                setLoading(false);
            } catch (err) {
                setError('Error al cargar la habitación');
                setLoading(false);
            }
        };

        loadHabitacion();
    }, [habitacionId]);

    // Calcular total cuando cambian las fechas
    useEffect(() => {
        if (fechaInicio && fechaFin && habitacion) {
            const diffTime = fechaFin.getTime() - fechaInicio.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                setNoches(diffDays);
                setTotal(diffDays * parseFloat(habitacion.precio));
            } else {
                setNoches(0);
                setTotal(0);
            }
        }
    }, [fechaInicio, fechaFin, habitacion]);

    // Manejar cambio de método de pago
    const handleMetodoPagoChange = (metodo) => {
        setMetodoPago(metodo);
        setMostrarDetallesTarjeta(metodo === 'tarjeta');
    };

    // Manejar envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!user) {
            navigate('/login');
            return;
        }

        if (!fechaInicio || !fechaFin) {
            setError('Por favor selecciona ambas fechas');
            return;
        }

        if (noches <= 0) {
            setError('La fecha de fin debe ser posterior a la de inicio');
            return;
        }

        setIsSubmitting(true);

        try {
            const reservaData = {
                habitacion: habitacionId,
                fecha_inicio: format(fechaInicio, 'yyyy-MM-dd'),
                fecha_fin: format(fechaFin, 'yyyy-MM-dd'),
                estado: 'Pendiente',
                metodo_pago: metodoPago // Añadimos el método de pago a los datos
            };

            const response = await Api.post('/reservas/', reservaData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            setSuccess('¡Reserva creada con éxito!');
            setTimeout(() => {
                navigate('/mis-reservas');
            }, 2000);
        } catch (err) {
            console.error('Error al crear reserva:', err.response?.data);
            setError(err.response?.data?.message || 'Error al crear la reserva');
        } finally {
            setIsSubmitting(false);
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

    if (!habitacion) {
        return (
            <Container className="py-5">
                <Alert variant="danger">Habitación no encontrada</Alert>
            </Container>
        );
    }

    // Configuración del DatePicker
    const today = new Date();
    const minDate = new Date();
    minDate.setDate(today.getDate() + 1); // No permitir reservas para hoy

    return (
        <Container className="my-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card>
                        <Card.Header as="h4">Reservar Habitación #{habitacion.numero}</Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    {habitacion.tipo.imagen1 && (
                                        <img
                                            src={`${MEDIA_BASE_URL}${habitacion.tipo.imagen1}`}
                                            alt={habitacion.tipo.nombre}
                                            className="img-fluid rounded mb-3"
                                        />
                                    )}
                                    <h5>{habitacion.tipo.nombre}</h5>
                                    <p>{habitacion.tipo.descripcion}</p>
                                    <p><strong>Sede:</strong> {habitacion.sede}</p>
                                    <p><strong>Precio por noche:</strong> S/. {habitacion.precio}</p>
                                </Col>
                                <Col md={6}>
                                    <Form onSubmit={handleSubmit}>
                                        {error && <Alert variant="danger">{error}</Alert>}
                                        {success && <Alert variant="success">{success}</Alert>}

                                        <Form.Group className="mb-3">
                                            <Form.Label className='mx-2'>Fecha de Inicio: </Form.Label>
                                            <DatePicker
                                                selected={fechaInicio}
                                                onChange={(date) => setFechaInicio(date)}
                                                selectsStart
                                                startDate={fechaInicio}
                                                endDate={fechaFin}
                                                minDate={minDate}
                                                className="form-control"
                                                placeholderText="Selecciona fecha de inicio"
                                                dateFormat="yyyy-MM-dd"
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label className='mx-2'>Fecha de Fin: </Form.Label>
                                            <DatePicker
                                                selected={fechaFin}
                                                onChange={(date) => setFechaFin(date)}
                                                selectsEnd
                                                startDate={fechaInicio}
                                                endDate={fechaFin}
                                                minDate={fechaInicio || minDate}
                                                className="form-control"
                                                placeholderText="Selecciona fecha de fin"
                                                dateFormat="yyyy-MM-dd"
                                                required
                                            />
                                        </Form.Group>

                                        <Card className="mb-3">
                                            <Card.Body>
                                                <h6>Resumen de Reserva</h6>
                                                <p><strong>Noches:</strong> {noches}</p>
                                                <p><strong>Total:</strong> S/. {total.toFixed(2)}</p>
                                            </Card.Body>
                                        </Card>

                                        {/* Sección de Pasarela de Pago */}
                                        <Card className="mb-3">
                                            <Card.Header as="h5">Método de Pago</Card.Header>
                                            <Card.Body>
                                                <Form.Group className="mb-3">
                                                    <Form.Check
                                                        type="radio"
                                                        id="tarjeta"
                                                        label="Tarjeta de Crédito/Débito"
                                                        name="metodoPago"
                                                        checked={metodoPago === 'tarjeta'}
                                                        onChange={() => handleMetodoPagoChange('tarjeta')}
                                                    />
                                                    
                                                    {mostrarDetallesTarjeta && (
                                                        <div className="mt-3 p-3 border rounded">
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Número de Tarjeta</Form.Label>
                                                                <Form.Control 
                                                                    type="text" 
                                                                    placeholder="1234 5678 9012 3456" 
                                                                    disabled 
                                                                />
                                                            </Form.Group>
                                                            <Row>
                                                                <Col md={6}>
                                                                    <Form.Group className="mb-3">
                                                                        <Form.Label>Fecha de Expiración</Form.Label>
                                                                        <Form.Control 
                                                                            type="text" 
                                                                            placeholder="MM/AA" 
                                                                            disabled 
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col md={6}>
                                                                    <Form.Group className="mb-3">
                                                                        <Form.Label>CVV</Form.Label>
                                                                        <Form.Control 
                                                                            type="text" 
                                                                            placeholder="123" 
                                                                            disabled 
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Nombre en la Tarjeta</Form.Label>
                                                                <Form.Control 
                                                                    type="text" 
                                                                    placeholder="Nombre Apellido" 
                                                                    disabled 
                                                                />
                                                            </Form.Group>
                                                        </div>
                                                    )}
                                                </Form.Group>

                                                <Form.Group className="mb-3">
                                                    <Form.Check
                                                        type="radio"
                                                        id="transferencia"
                                                        label="Transferencia Bancaria"
                                                        name="metodoPago"
                                                        checked={metodoPago === 'transferencia'}
                                                        onChange={() => handleMetodoPagoChange('transferencia')}
                                                    />
                                                    {metodoPago === 'transferencia' && (
                                                        <div className="mt-3 p-3 border rounded">
                                                            <p className="small text-muted">
                                                                Al seleccionar transferencia bancaria, recibirás las instrucciones de pago por correo electrónico después de completar la reserva.
                                                            </p>
                                                        </div>
                                                    )}
                                                </Form.Group>

                                                <Form.Group className="mb-3">
                                                    <Form.Check
                                                        type="radio"
                                                        id="efectivo"
                                                        label="Pago en Efectivo al Llegar"
                                                        name="metodoPago"
                                                        checked={metodoPago === 'efectivo'}
                                                        onChange={() => handleMetodoPagoChange('efectivo')}
                                                    />
                                                    {metodoPago === 'efectivo' && (
                                                        <div className="mt-3 p-3 border rounded">
                                                            <p className="small text-muted">
                                                                Deberás pagar el total de la reserva al momento de tu llegada al hotel.
                                                            </p>
                                                        </div>
                                                    )}
                                                </Form.Group>
                                            </Card.Body>
                                        </Card>

                                        <Button
                                            variant="primary"
                                            type="submit"
                                            disabled={isSubmitting || noches <= 0}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Spinner
                                                        as="span"
                                                        animation="border"
                                                        size="sm"
                                                        role="status"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="ms-2">Reservando...</span>
                                                </>
                                            ) : (
                                                'Confirmar Reserva'
                                            )}
                                        </Button>
                                    </Form>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}