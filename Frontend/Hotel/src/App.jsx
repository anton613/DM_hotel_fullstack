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
            <Route path="/editar-perfil" element={<UserProfile />} />
            <Route path="/reservar/:habitacionId" element={<Reserva />} />
            <Route path="/mis-reservas" element={<MisReservas />} />
            <Route path="/estadisticas" element={<EstadisticasReservas />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </Container>
    </AuthProvider>


  )
}

export default App
