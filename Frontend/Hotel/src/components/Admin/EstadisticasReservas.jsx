import { useState, useEffect } from 'react';
import { Container, Card, Alert, Spinner, Row, Col, Form, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { getReservasEstadisticas, generarReportePDF } from '../../api/conexions';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Registrar componentes de Chart.js
ChartJS.register(...registerables);

export default function EstadisticasReservas() {
    const { user, accessToken } = useAuth();
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [generandoPDF, setGenerandoPDF] = useState(false);
    const [filtroSede, setFiltroSede] = useState('Todas');
    const [filtroTiempo, setFiltroTiempo] = useState('ultimos_3_meses');
    const [filtroTipoHabitacion, setFiltroTipoHabitacion] = useState('Todos');

    // Cargar todas las reservas
    const loadReservas = async () => {
        try {
            const response = await getReservasEstadisticas(accessToken);
            setReservas(response.data);
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
        }
    }, [user]);

    // Filtrar reservas según los filtros seleccionados
    const reservasFiltradas = reservas.filter(reserva => {
        const cumpleSede = filtroSede === 'Todas' || reserva.habitacion_info.sede === filtroSede;
        const cumpleTipo = filtroTipoHabitacion === 'Todos' ||
            reserva.habitacion_info.tipo.nombre === filtroTipoHabitacion;
        const fechaReserva = parseISO(reserva.fecha_inicio);
        const ahora = new Date();
        let cumpleTiempo = true;

        if (filtroTiempo === 'ultimo_mes') {
            const ultimoMes = new Date();
            ultimoMes.setMonth(ahora.getMonth() - 1);
            cumpleTiempo = fechaReserva >= ultimoMes;
        } else if (filtroTiempo === 'ultimos_3_meses') {
            const ultimos3Meses = new Date();
            ultimos3Meses.setMonth(ahora.getMonth() - 3);
            cumpleTiempo = fechaReserva >= ultimos3Meses;
        } else if (filtroTiempo === 'ultimo_ano') {
            const ultimoAno = new Date();
            ultimoAno.setFullYear(ahora.getFullYear() - 1);
            cumpleTiempo = fechaReserva >= ultimoAno;
        }

        return cumpleSede && cumpleTiempo && cumpleTipo;
    });

    // Obtener sedes y tipos de habitación únicos para los filtros
    const sedes = [...new Set(reservas.map(reserva => reserva.habitacion_info.sede))];
    const tiposHabitacion = [...new Set(reservas.map(reserva => reserva.habitacion_info.tipo.nombre))];

    // Preparar datos para los gráficos
    const prepararDatosGraficos = () => {
        const estados = ['Pendiente', 'Check-In', 'Check-Out', 'Cancelada'];
        const datosEstados = estados.map(estado =>
            reservasFiltradas.filter(r => r.estado === estado).length
        );

        const datosIngresosPorTipo = tiposHabitacion.map(tipo => {
            return reservasFiltradas
                .filter(r => r.habitacion_info.tipo.nombre === tipo)
                .reduce((sum, r) => sum + parseFloat(r.total), 0);
        });

        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const datosIngresosMensuales = meses.map((mes, index) => {
            return reservasFiltradas
                .filter(r => {
                    const fecha = parseISO(r.fecha_inicio);
                    return fecha.getMonth() === index;
                })
                .reduce((sum, r) => sum + parseFloat(r.total), 0);
        });

        const datosOcupacionSede = sedes.map(sede => {
            return reservasFiltradas
                .filter(r => r.habitacion_info.sede === sede)
                .reduce((sum, r) => {
                    const noches = (new Date(r.fecha_fin) - new Date(r.fecha_inicio)) / (1000 * 60 * 60 * 24);
                    return sum + noches;
                }, 0);
        });

        return {
            estados: {
                labels: estados,
                data: datosEstados
            },
            tiposHabitacion: {
                labels: tiposHabitacion,
                data: datosIngresosPorTipo
            },
            ingresosMensuales: {
                labels: meses,
                data: datosIngresosMensuales
            },
            ocupacionSede: {
                labels: sedes,
                data: datosOcupacionSede
            }
        };
    };

    // Función para generar el reporte PDF
    const handleGenerarReportePDF = async () => {
        setGenerandoPDF(true);
        try {
            const datosGraficos = prepararDatosGraficos();

            // Calcular resumen estadístico
            const totalReservas = reservasFiltradas.length;
            const totalIngresos = reservasFiltradas.reduce((sum, r) => sum + parseFloat(r.total), 0).toFixed(2);
            const promedioReserva = totalReservas > 0 ? (totalIngresos / totalReservas).toFixed(2) : '0.00';
            const totalNoches = reservasFiltradas.reduce((sum, r) => {
                const noches = (new Date(r.fecha_fin) - new Date(r.fecha_inicio)) / (1000 * 60 * 60 * 24);
                return sum + noches;
            }, 0);

            // Preparar datos para el PDF
            const data = {
                filtros: {
                    sede: filtroSede,
                    tipoHabitacion: filtroTipoHabitacion,
                    tiempo: filtroTiempo === 'ultimo_mes' ? 'Último mes' :
                        filtroTiempo === 'ultimos_3_meses' ? 'Últimos 3 meses' :
                            filtroTiempo === 'ultimo_ano' ? 'Último año' : 'Todos los registros',
                    totalReservas: totalReservas,
                    totalIngresos: totalIngresos,
                    promedioReserva: promedioReserva,
                    totalNoches: Math.round(totalNoches)
                },
                datos_graficos: datosGraficos
            };

            // Generar el PDF usando la función de la API
            const response = await generarReportePDF(data, accessToken);

            // Crear enlace para descargar el PDF
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reporte_hoteles_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

        } catch (err) {
            console.error('Error al generar el reporte:', err);
            setError('Error al generar el reporte PDF');
        } finally {
            setGenerandoPDF(false);
        }
    };

    const datosGraficos = prepararDatosGraficos();

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando estadísticas...</span>
                </Spinner>
            </Container>
        );
    }

    return (
        <Container className="my-5">
            <h2 className="mb-4">Estadísticas de Reservas</h2>
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Filtros */}
            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Filtrar por sede:</Form.Label>
                                <Form.Select
                                    value={filtroSede}
                                    onChange={(e) => setFiltroSede(e.target.value)}
                                >
                                    <option value="Todas">Todas las sedes</option>
                                    {sedes.map((sede, index) => (
                                        <option key={index} value={sede}>{sede}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Filtrar por tipo de habitación:</Form.Label>
                                <Form.Select
                                    value={filtroTipoHabitacion}
                                    onChange={(e) => setFiltroTipoHabitacion(e.target.value)}
                                >
                                    <option value="Todos">Todos los tipos</option>
                                    {tiposHabitacion.map((tipo, index) => (
                                        <option key={index} value={tipo}>{tipo}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Rango de tiempo:</Form.Label>
                                <Form.Select
                                    value={filtroTiempo}
                                    onChange={(e) => setFiltroTiempo(e.target.value)}
                                >
                                    <option value="ultimo_mes">Último mes</option>
                                    <option value="ultimos_3_meses">Últimos 3 meses</option>
                                    <option value="ultimo_ano">Último año</option>
                                    <option value="todos">Todos los registros</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className="text-end mt-3">
                        <Button
                            variant="primary"
                            onClick={handleGenerarReportePDF}
                            disabled={generandoPDF}
                        >
                            {generandoPDF ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Generando PDF...
                                </>
                            ) : 'Generar Reporte PDF'}
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Gráficos */}
            <Row className="mb-4">
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Reservas por Estado</Card.Title>
                            <div style={{ height: '300px' }}>
                                <Bar
                                    data={{
                                        labels: datosGraficos.estados.labels,
                                        datasets: [{
                                            label: 'Reservas por Estado',
                                            data: datosGraficos.estados.data,
                                            backgroundColor: [
                                                'rgba(255, 206, 86, 0.7)',
                                                'rgba(54, 162, 235, 0.7)',
                                                'rgba(75, 192, 192, 0.7)',
                                                'rgba(255, 99, 132, 0.7)'
                                            ],
                                            borderColor: [
                                                'rgba(255, 206, 86, 1)',
                                                'rgba(54, 162, 235, 1)',
                                                'rgba(75, 192, 192, 1)',
                                                'rgba(255, 99, 132, 1)'
                                            ],
                                            borderWidth: 1
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: { stepSize: 1 }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Ingresos por Tipo de Habitación</Card.Title>
                            <div style={{ height: '300px' }}>
                                <Pie
                                    data={{
                                        labels: datosGraficos.tiposHabitacion.labels,
                                        datasets: [{
                                            label: 'Ingresos por Tipo de Habitación (S/.)',
                                            data: datosGraficos.tiposHabitacion.data,
                                            backgroundColor: [
                                                'rgba(153, 102, 255, 0.7)',
                                                'rgba(255, 159, 64, 0.7)',
                                                'rgba(54, 162, 235, 0.7)',
                                                'rgba(255, 99, 132, 0.7)',
                                                'rgba(75, 192, 192, 0.7)'
                                            ],
                                            borderColor: [
                                                'rgba(153, 102, 255, 1)',
                                                'rgba(255, 159, 64, 1)',
                                                'rgba(54, 162, 235, 1)',
                                                'rgba(255, 99, 132, 1)',
                                                'rgba(75, 192, 192, 1)'
                                            ],
                                            borderWidth: 1
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            tooltip: {
                                                callbacks: {
                                                    label: function (context) {
                                                        return `S/. ${context.raw.toFixed(2)}`;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mb-4">
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Ocupación por Sede (noches)</Card.Title>
                            <div style={{ height: '300px' }}>
                                <Doughnut
                                    data={{
                                        labels: datosGraficos.ocupacionSede.labels,
                                        datasets: [{
                                            label: 'Noches Reservadas por Sede',
                                            data: datosGraficos.ocupacionSede.data,
                                            backgroundColor: [
                                                'rgba(255, 99, 132, 0.7)',
                                                'rgba(54, 162, 235, 0.7)',
                                                'rgba(255, 206, 86, 0.7)',
                                                'rgba(75, 192, 192, 0.7)'
                                            ],
                                            borderColor: [
                                                'rgba(255, 99, 132, 1)',
                                                'rgba(54, 162, 235, 1)',
                                                'rgba(255, 206, 86, 1)',
                                                'rgba(75, 192, 192, 1)'
                                            ],
                                            borderWidth: 1
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            tooltip: {
                                                callbacks: {
                                                    label: function (context) {
                                                        return `${context.raw} noches`;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Ingresos Mensuales</Card.Title>
                            <div style={{ height: '300px' }}>
                                <Line
                                    data={{
                                        labels: datosGraficos.ingresosMensuales.labels,
                                        datasets: [{
                                            label: 'Ingresos Mensuales (S/.)',
                                            data: datosGraficos.ingresosMensuales.data,
                                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                            borderColor: 'rgba(75, 192, 192, 1)',
                                            borderWidth: 1,
                                            tension: 0.1,
                                            fill: true
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: { beginAtZero: true }
                                        },
                                        plugins: {
                                            tooltip: {
                                                callbacks: {
                                                    label: function (context) {
                                                        return `S/. ${context.raw.toFixed(2)}`;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Resumen estadístico */}
            <Card className="mt-4">
                <Card.Body>
                    <Card.Title>Resumen Estadístico</Card.Title>
                    <Row>
                        <Col md={3} className="text-center">
                            <h3>{reservasFiltradas.length}</h3>
                            <p className="text-muted">Reservas totales</p>
                        </Col>
                        <Col md={3} className="text-center">
                            <h3>S/. {reservasFiltradas.reduce((sum, r) => sum + parseFloat(r.total), 0).toFixed(2)}</h3>
                            <p className="text-muted">Ingresos totales</p>
                        </Col>
                        <Col md={3} className="text-center">
                            <h3>{
                                (reservasFiltradas.length > 0 ?
                                    (reservasFiltradas.reduce((sum, r) => sum + parseFloat(r.total), 0) / reservasFiltradas.length).toFixed(2)
                                    : 0)
                            }</h3>
                            <p className="text-muted">Promedio por reserva</p>
                        </Col>
                        <Col md={3} className="text-center">
                            <h3>{
                                reservasFiltradas.reduce((sum, r) => {
                                    const noches = (new Date(r.fecha_fin) - new Date(r.fecha_inicio)) / (1000 * 60 * 60 * 24);
                                    return sum + Math.ceil(noches);
                                }, 0)
                            }</h3>
                            <p className="text-muted">Noches reservadas</p>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
}