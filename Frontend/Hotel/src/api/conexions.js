import axios from 'axios';

export const Api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
    // baseURL: "https://smpjwjtp-8000.brs.devtunnels.ms/api/",
    // withCredentials: true,
});

export const MEDIA_BASE_URL = "http://127.0.0.1:8000"; // sin /api/
// export const MEDIA_BASE_URL = "https://smpjwjtp-8000.brs.devtunnels.ms/"; // sin /api/

export const getHabitaciones = () => Api.get("/cliente/habitaciones/");
export const createCliente = (usuario) => Api.post("/cliente/usuario/", usuario);
export const loginUser = (email, password) => Api.post("/token/", { email, password });
// export const loginUser = (email, password) => 
//     Api.post("/token/", { email, password }, { withCredentials: true });

// Reservas
export const getHabitacionDetalle = (habitacionId) => Api.get(`/cliente/habitaciones/${habitacionId}/`);
export const validarCupon = (codigo, accessToken) => Api.get(`/cupones/validar/?codigo=${codigo}`, {
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
});
export const confirmarPagoReserva = (orderID, reservaData, accessToken) => Api.post('/reserva/confirmar-pago/', { orderID, reserva: reservaData },
    {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

// Funciones para reservas
export const getMisReservas = (accessToken) => Api.get('/reservas/mis_reservas/', {
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
});
export const cancelarReserva = (reservaId, accessToken) => Api.patch(`/reservas/${reservaId}/cancelar/`, {}, {
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
});

// Funciones para administración de cupones
export const getUsuariosConEstadisticas = (accessToken) => Api.get('/admin/usuario/reservas-stats/', {
    headers: { Authorization: `Bearer ${accessToken}` }
});
export const getCuponesActivos = (accessToken) => Api.get('/cupones/', {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { activo: true }
});
export const asignarCuponExistente = (usuarios, cuponId, accessToken) => Api.post('/cupones/asignar_existente/', { usuarios, cupon_id: cuponId },
    {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
export const getCupones = (accessToken) => Api.get('/cupones/', {
    headers: { Authorization: `Bearer ${accessToken}` }
});
export const createCupon = (cuponData, accessToken) => Api.post('/cupones/', cuponData, {
    headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    }
});
export const updateCupon = (id, cuponData, accessToken) => Api.patch(`/cupones/${id}/`, cuponData, {
    headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    }
});
export const toggleEstadoCupon = (id, activo, accessToken) => Api.patch(`/cupones/${id}/`, { activo: !activo }, {
    headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    }
});
export const deleteCupon = (id, accessToken) => Api.delete(`/cupones/${id}/`, {
    headers: { Authorization: `Bearer ${accessToken}` }
});

// Funciones para estadísticas y reportes
export const getReservasEstadisticas = (accessToken) => Api.get('/reservas/', {
    headers: { Authorization: `Bearer ${accessToken}` }
});
export const generarReportePDF = (data, accessToken) => Api.post('/generar-reporte/', data, {
    headers: { Authorization: `Bearer ${accessToken}` },
    responseType: 'blob'
});

// Funciones para gestión de habitaciones
export const getHabitacionesAdmin = (accessToken) => Api.get('/admin/habitaciones/', {
    headers: { Authorization: `Bearer ${accessToken}` }
});
export const getTiposHabitacion = (accessToken) => Api.get('/tipoHabitaciones/', {
    headers: { Authorization: `Bearer ${accessToken}` }
});
export const getSedes = (accessToken) => Api.get('/sedes/', {
    headers: { Authorization: `Bearer ${accessToken}` }
});
export const createHabitacion = (habitacionData, accessToken) => Api.post('/admin/habitaciones/', habitacionData, {
    headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    }
});
export const updateHabitacion = (id, habitacionData, accessToken) => Api.patch(`/admin/habitaciones/${id}/`, habitacionData, {
    headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    }
});
export const deleteHabitacion = (id, accessToken) => Api.delete(`/admin/habitaciones/${id}/`, {
    headers: { Authorization: `Bearer ${accessToken}` }
});
export const createTipoHabitacion = (formData, accessToken) => Api.post("/tipoHabitaciones/", formData, {
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data'
    }
});
export const updateTipoHabitacion = (id, formData, accessToken) => Api.patch(`/tipoHabitaciones/${id}/`, formData, {
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data'
    }
});
export const deleteTipoHabitacion = (id, accessToken) => Api.delete(`/tipoHabitaciones/${id}/`, {
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
});