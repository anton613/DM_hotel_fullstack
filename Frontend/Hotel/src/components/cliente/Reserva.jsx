import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Container, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import {
    MEDIA_BASE_URL,
    getHabitacionDetalle,
    validarCupon,
    confirmarPagoReserva
} from '../../api/conexions';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import { loadScript } from "@paypal/paypal-js";

export default function Reserva() {
    const { habitacionId } = useParams();
    const { user, accessToken } = useAuth();
    const navigate = useNavigate();
    const paypalRef = useRef(null);

    const [habitacion, setHabitacion] = useState(null);
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);
    const [totalBruto, setTotalBruto] = useState(0);
    const [totalDescuento, setTotalDescuento] = useState(0);
    const [descuentoAplicado, setDescuentoAplicado] = useState(0);
    const [noches, setNoches] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paypalLoaded, setPaypalLoaded] = useState(false);
    const [cuponCodigo, setCuponCodigo] = useState('');
    const [cuponInfo, setCuponInfo] = useState(null);
    const [validandoCupon, setValidandoCupon] = useState(false);
    const [errorCupon, setErrorCupon] = useState('');

    // Cargar habitación
    useEffect(() => {
        const loadHabitacion = async () => {
            try {
                const response = await getHabitacionDetalle(habitacionId);
                setHabitacion(response.data);
                setLoading(false);
            } catch (err) {
                setError('Error al cargar la habitación');
                setLoading(false);
            }
        };
        loadHabitacion();
    }, [habitacionId]);

    // Cargar PayPal
    useEffect(() => {
        const loadPaypal = async () => {
            try {
                await loadScript({
                    clientId: "AbFvBIAoq8hFuPL-o6_RNr-fVtyc4nSRpUhqR9cGXCYUeKTi19sJMki9FkHFx_TnVIkaMPxi4z_Kj3BR",
                    currency: "USD",
                    intent: "capture"
                });
                setPaypalLoaded(true);
            } catch (error) {
                console.error("Error al cargar PayPal:", error);
                setPaypalLoaded(true);
            }
        };
        loadPaypal();
    }, []);

    // Configurar botones de PayPal
    useEffect(() => {
        if (paypalLoaded && window.paypal && totalDescuento > 0 && paypalRef.current) {
            paypalRef.current.innerHTML = '';
            window.paypal.Buttons({
                createOrder: (data, actions) => {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: totalDescuento.toFixed(2),
                                currency_code: "USD"
                            }
                        }]
                    });
                },
                onApprove: async (data, actions) => {
                    try {
                        await actions.order.capture();
                        await handleCreateReservation(data.orderID);
                    } catch (err) {
                        console.error('PayPal error:', err);
                        setError('Error al capturar el pago');
                    }
                },
                onError: (err) => {
                    console.error('Error de PayPal:', err);
                    setError('Error en el proceso de pago');
                }
            }).render(paypalRef.current);
        }
    }, [paypalLoaded, totalDescuento]);

    // Cálculo de noches y total
    useEffect(() => {
        if (fechaInicio && fechaFin && habitacion) {
            const diffTime = fechaFin.getTime() - fechaInicio.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
                setNoches(diffDays);
                const nuevoTotalBruto = diffDays * parseFloat(habitacion.precio);
                setTotalBruto(nuevoTotalBruto);

                if (cuponInfo) {
                    aplicarDescuento(nuevoTotalBruto, cuponInfo);
                } else {
                    setTotalDescuento(nuevoTotalBruto);
                    setDescuentoAplicado(0);
                }
            } else {
                setNoches(0);
                setTotalBruto(0);
                setTotalDescuento(0);
                setDescuentoAplicado(0);
            }
        }
    }, [fechaInicio, fechaFin, habitacion, cuponInfo]);

    // Función para validar un cupón
    const validarCuponHandler = async () => {
        if (!cuponCodigo.trim()) {
            setErrorCupon('Por favor ingrese un código de cupón');
            return;
        }

        setValidandoCupon(true);
        setErrorCupon('');
        setCuponInfo(null);

        try {
            const response = await validarCupon(cuponCodigo, accessToken);

            if (response.data.valido) {
                setCuponInfo(response.data.cupon);
                if (totalBruto > 0) {
                    aplicarDescuento(totalBruto, response.data.cupon);
                }
                setErrorCupon('');
            } else {
                setErrorCupon(response.data.mensaje || 'Cupón no válido');
            }
        } catch (err) {
            console.error('Error al validar cupón:', err);
            let mensajeError = 'Error al validar el cupón';

            if (err.response) {
                if (err.response.data && err.response.data.mensaje) {
                    mensajeError = err.response.data.mensaje;
                } else if (err.response.data && err.response.data.error) {
                    mensajeError = err.response.data.error;
                    if (err.response.data.detalle) {
                        mensajeError += `: ${err.response.data.detalle}`;
                    }
                } else if (err.response.status === 404) {
                    mensajeError = 'Cupón no encontrado';
                } else if (err.response.status === 403) {
                    mensajeError = 'No tienes permiso para usar este cupón';
                } else if (err.response.status === 400) {
                    mensajeError = 'Datos de solicitud inválidos';
                }
            } else if (err.request) {
                mensajeError = 'No se recibió respuesta del servidor';
            } else {
                mensajeError = 'Error al configurar la solicitud';
            }

            setErrorCupon(mensajeError);
        } finally {
            setValidandoCupon(false);
        }
    };

    // Función para aplicar el descuento
    const aplicarDescuento = (total, cupon) => {
        let descuento = 0;

        if (cupon.tipo === 'porcentaje') {
            descuento = (total * cupon.valor) / 100;
        } else if (cupon.tipo === 'fijo') {
            descuento = Math.min(cupon.valor, total);
        }

        setDescuentoAplicado(descuento);
        setTotalDescuento(total - descuento);
    };

    // Función para remover el cupón
    const removerCupon = () => {
        setCuponCodigo('');
        setCuponInfo(null);
        setErrorCupon('');
        setTotalDescuento(totalBruto);
        setDescuentoAplicado(0);
    };

    // Función para crear reserva
    const handleCreateReservation = async (orderID) => {
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            if (!accessToken) {
                throw new Error('No se encontró el token de autenticación');
            }

            const reservaData = {
                habitacion: habitacionId,
                fecha_inicio: format(fechaInicio, 'yyyy-MM-dd'),
                fecha_fin: format(fechaFin, 'yyyy-MM-dd'),
                estado: 'Pendiente',
                cupon: cuponInfo?.id || null
            };

            await confirmarPagoReserva(orderID, reservaData, accessToken);

            setSuccess('¡Reserva creada con éxito!');
            setTimeout(() => navigate('/mis-reservas'), 2000);
        } catch (err) {
            console.error('Error al crear reserva:', err);
            setError(err.response?.data?.error || err.message || 'Error al crear la reserva');
        } finally {
            setIsSubmitting(false);
        }
    };

    const today = new Date();
    const minDate = new Date();
    minDate.setDate(today.getDate() + 1);

    if (loading) {
        return <Container className="text-center py-5"><Spinner animation="border" /></Container>;
    }

    if (!habitacion) {
        return <Container className="py-5"><Alert variant="danger">Habitación no encontrada</Alert></Container>;
    }

    return (
        <Container className="my-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card>
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
                                    <Form>
                                        {error && <Alert variant="danger">{error}</Alert>}
                                        {success && <Alert variant="success">{success}</Alert>}

                                        <Form.Group className="mb-3">
                                            <Form.Label className='me-2'>Fecha de Inicio:</Form.Label>
                                            <DatePicker
                                                selected={fechaInicio}
                                                onChange={(date) => setFechaInicio(date)}
                                                selectsStart
                                                startDate={fechaInicio}
                                                endDate={fechaFin}
                                                minDate={minDate}
                                                className="form-control"
                                                dateFormat="yyyy-MM-dd"
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label className='me-2'>Fecha de Fin:</Form.Label>
                                            <DatePicker
                                                selected={fechaFin}
                                                onChange={(date) => setFechaFin(date)}
                                                selectsEnd
                                                startDate={fechaInicio}
                                                endDate={fechaFin}
                                                minDate={fechaInicio || minDate}
                                                className="form-control"
                                                dateFormat="yyyy-MM-dd"
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Cupón de descuento:</Form.Label>
                                            <div className="d-flex">
                                                <Form.Control
                                                    type="text"
                                                    value={cuponCodigo}
                                                    onChange={(e) => setCuponCodigo(e.target.value)}
                                                    placeholder="Ingrese código de cupón"
                                                    disabled={!!cuponInfo}
                                                />
                                                {cuponInfo ? (
                                                    <Button
                                                        variant="outline-danger"
                                                        onClick={removerCupon}
                                                        className="ms-2"
                                                    >
                                                        Quitar
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline-primary"
                                                        onClick={validarCuponHandler}
                                                        disabled={validandoCupon || !cuponCodigo.trim()}
                                                        className="ms-2"
                                                    >
                                                        {validandoCupon ? (
                                                            <Spinner animation="border" size="sm" />
                                                        ) : 'Aplicar'}
                                                    </Button>
                                                )}
                                            </div>
                                            {errorCupon && <Alert variant="danger" className="mt-2">{errorCupon}</Alert>}
                                            {cuponInfo && (
                                                <Alert variant="success" className="mt-2">
                                                    <strong>Cupón aplicado:</strong> {cuponInfo.codigo} -
                                                    {cuponInfo.tipo === 'porcentaje' ? (
                                                        ` ${cuponInfo.valor}% de descuento`
                                                    ) : (
                                                        ` S/. ${cuponInfo.valor} de descuento fijo`
                                                    )}
                                                    {cuponInfo.max_usos > 1 && (
                                                        <span> (Usos restantes: {cuponInfo.usos_disponibles})</span>
                                                    )}
                                                </Alert>
                                            )}
                                        </Form.Group>

                                        <Card className="mb-3">
                                            <Card.Body>
                                                <h6>Resumen de Reserva</h6>
                                                <p><strong>Noches:</strong> {noches}</p>
                                                <p><strong>Precio por noche:</strong> S/. {habitacion.precio}</p>
                                                <p><strong>Subtotal:</strong> S/. {totalBruto.toFixed(2)}</p>

                                                {cuponInfo && (
                                                    <p>
                                                        <strong>Descuento:</strong>
                                                        <span className="text-danger">
                                                            - S/. {descuentoAplicado.toFixed(2)}
                                                            {cuponInfo.tipo === 'porcentaje' && (
                                                                <Badge bg="info" className="ms-2">
                                                                    {cuponInfo.valor}%
                                                                </Badge>
                                                            )}
                                                        </span>
                                                    </p>
                                                )}

                                                <p className="fw-bold">
                                                    <strong>Total:</strong>
                                                    <span className={cuponInfo ? "text-success" : ""}>
                                                        S/. {totalDescuento.toFixed(2)}
                                                    </span>
                                                    {cuponInfo && (
                                                        <Badge bg="success" className="ms-2">
                                                            Ahorras S/. {descuentoAplicado.toFixed(2)}
                                                        </Badge>
                                                    )}
                                                </p>
                                            </Card.Body>
                                        </Card>

                                        <div ref={paypalRef} className="mb-3" />
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