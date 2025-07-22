// import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Container from 'react-bootstrap/Container';


import Header from "./components/general/Header";
import Login from "./components/general/Login";
import Habitaciones from "./components/cliente/Habitaciones";
import Registro from "./components/cliente/Registro";
import UserProfile from "./components/cliente/UserProfile";
import Reserva from "./components/cliente/Reserva";
import MisReservas from "./components/cliente/MisReservas";
import EstadisticasReservas from "./components/Admin/EstadisticasReservas";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./components/context/AuthContext";
import ProtectedRoute from "./components/context/ProtectedRoute";
import TipoHabitacionesAdmin from "./components/Admin/TipoHabitacionesAdmin";
import HabitacionesAdmin from "./components/Admin/HabitacionesAdmin";
import CuponAdmin from "./components/Admin/CuponAdmin";
import AsignarCuponAdmin from "./components/Admin/AsignarCuponAdmin";
function App() {
  return (
    <AuthProvider>
      <Container fluid className="p-0 m-0">
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Habitaciones />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />

            {/* rutas privadas usuario logeado */}
            <Route path="/editar-perfil" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/reservar/:habitacionId" element={<ProtectedRoute><Reserva /></ProtectedRoute>} />
            <Route path="/mis-reservas" element={<ProtectedRoute><MisReservas /></ProtectedRoute>} />

            {/* rutas para usuario tipo Admin */}
            <Route path="/estadisticas" element={<ProtectedRoute adminOnly><EstadisticasReservas /></ProtectedRoute>}/>
            <Route path="/tipo-habitaciones" element={<ProtectedRoute adminOnly><TipoHabitacionesAdmin /></ProtectedRoute>}/>
            <Route path="/gestion-habitaciones" element={<ProtectedRoute adminOnly><HabitacionesAdmin /></ProtectedRoute>}/>
            <Route path="/gestion-cupon" element={<ProtectedRoute adminOnly><CuponAdmin /></ProtectedRoute>}/>
            <Route path="/asignar-cupon" element={<ProtectedRoute adminOnly><AsignarCuponAdmin /></ProtectedRoute>}/>

          </Routes>
          <Toaster />
        </BrowserRouter>
      </Container>
    </AuthProvider>
  )
}

export default App
