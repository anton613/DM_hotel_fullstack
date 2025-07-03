import { Button, Col, Form, Row, Container } from 'react-bootstrap';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCliente } from "../../api/conexions";
import { toast } from 'react-hot-toast';
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Registro() {

    const navigate = useNavigate();
    const { login } = useAuth();

    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        telefono: ''
    });

    const handleSubmit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        if (form.checkValidity() === false) {
            event.stopPropagation();
        } else {
            try {
                // 1. Crear el usuario
                await createCliente(formData);

                // 2. Iniciar sesión automáticamente
                const response = await axios.post("http://127.0.0.1:8000/api/token/", {
                    email: formData.email,
                    password: formData.password
                });

                const { access, refresh, user } = response.data;

                // 3. Guardar datos en el contexto
                login(access, user);

                // 4. Mostrar mensaje y redirigir
                toast.success("Registro exitoso. Bienvenido!");
                navigate('/');
            } catch (error) {
                console.error(error);
                toast.error("Error al registrar o iniciar sesión");
            }
        }

        setValidated(true);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Container>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Row className="mb-3">
                    <Form.Group as={Col} md="4" controlId="validationCustom01">
                        <Form.Label>First name</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            placeholder="First name"
                            name='first_name'
                            onChange={handleChange}
                        />
                        <Form.Control.Feedback type="invalid">Ingrese su nombre</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group as={Col} md="4" controlId="validationCustom02">
                        <Form.Label>Last name</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            placeholder="Last name"
                            name='last_name'
                            onChange={handleChange}
                        />
                        <Form.Control.Feedback type="invalid">Ingrese su apellido</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group as={Col} md="4" controlId="validationCustom03">
                        <Form.Label>Teléfono</Form.Label>
                        <Form.Control type="text" placeholder="99999999" required name='telefono' onChange={handleChange} />
                        <Form.Control.Feedback type="invalid">
                            Ingrese su teléfono.
                        </Form.Control.Feedback>
                    </Form.Group>
                </Row>
                <Row className="mb-3">
                    <Form.Group as={Col} md="6" controlId="validationCustomUsername">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" placeholder="Enter email" required name='email' onChange={handleChange} />
                        <Form.Control.Feedback type="invalid">
                            Ingresa tu email.
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group as={Col} md="6" controlId="validationCustom04">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" placeholder="******" required name='password' onChange={handleChange} />
                        <Form.Control.Feedback type="invalid">
                            Ingresa tu contraseña.
                        </Form.Control.Feedback>
                    </Form.Group>
                </Row>
                <Button type="submit">Registrarse</Button>
            </Form>
        </Container>
    );
}
