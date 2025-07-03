import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { Container, Form, Button, Spinner } from 'react-bootstrap';

export default function UserProfile() {
    const { token, user, setUser } = useAuth(); // `user` ya viene precargado desde el contexto
    const [formData, setFormData] = useState(null); // null indica que aún no cargó

    // Cargar datos del usuario en el formulario
    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email || '',
                nombre: user.nombre || '',
                apellido: user.apellido || '',
                telefono: user.telefono || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put("http://127.0.0.1:8000/api/usuario/", formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            toast.success("Perfil actualizado correctamente");
            setUser(res.data); // 🔁 ACTUALIZA el usuario en el contexto sin recargar
        } catch (error) {
            toast.error("Error al actualizar el perfil");
        }
    };

    // Si los datos aún no cargan
    if (!formData) {
        return (
            <Container className='mt-5 text-center'>
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    return (
        <Container className='mt-5' style={{ maxWidth: '500px' }}>
            <h2>Mi Perfil</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group className='mb-3'>
                    <Form.Label>Nombre</Form.Label>
                    <Form.Control
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                    />
                </Form.Group>
                <Form.Group className='mb-3'>
                    <Form.Label>Apellido</Form.Label>
                    <Form.Control
                        type="text"
                        name="apellido"
                        value={formData.apellido}
                        onChange={handleChange}
                    />
                </Form.Group>
                <Form.Group className='mb-3'>
                    <Form.Label>Teléfono</Form.Label>
                    <Form.Control
                        type="text"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                    />
                </Form.Group>
                <Button type="submit">Actualizar</Button>
            </Form>
        </Container>
    );
}