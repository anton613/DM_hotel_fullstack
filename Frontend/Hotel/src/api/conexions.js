import axios from 'axios';

export const Api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
});

export const MEDIA_BASE_URL = "http://127.0.0.1:8000"; // sin /api/

export const getHabitaciones = () => Api.get("/cliente/habitaciones/");
export const createCliente = (usuario) => Api.post("/cliente/usuario/", usuario);
// export const Log_in = async (datos) => {
//     const response = await Api.post("/token/", datos);
//     const { access, refresh, user } = response.data;
//     return { access, refresh, user }; // ✅ estructura limpia para el context
// };
