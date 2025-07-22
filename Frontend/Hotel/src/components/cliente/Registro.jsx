import { Button, Form, FloatingLabel, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { createCliente, loginUser } from "../../api/conexions";
import { toast } from 'react-hot-toast';
import { useAuth } from "../context/AuthContext";

export default function Registro() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [validated, setValidated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
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
        setError('');

        if (form.checkValidity() === false) {
            event.stopPropagation();
            setValidated(true);
            return;
        }

        setLoading(true);

        try {
            // Registrar al cliente
            await createCliente(formData);

            // Iniciar sesión automáticamente después del registro
            const response = await loginUser(formData.email, formData.password);

            const { access, refresh, user } = response.data;
            login(access, user);

            toast.success("Registro exitoso. Bienvenido!");
            navigate('/');
        } catch (error) {
            const errorMessage = error.response?.data?.email?.[0] ||
                error.response?.data?.password?.[0] ||
                "Error al registrar. Por favor intenta nuevamente.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        if (name === 'telefono' && !/^\d*$/.test(value)) {
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <Form
                noValidate
                validated={validated}
                onSubmit={handleSubmit}
                className="border p-4 rounded shadow-sm bg-white"
                style={{ width: '100%', maxWidth: '500px' }}
            >
                <h2 className="text-center mb-4">Crear Cuenta</h2>

                {error && <Alert variant="danger" className="text-center">{error}</Alert>}

                <div className="row g-3 mb-3">
                    <div className="col-md-6">
                        <FloatingLabel controlId="floatingFirstName" label="Nombres" className="mb-3">
                            <Form.Control
                                required
                                type="text"
                                placeholder="Nombres"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                isInvalid={validated && !formData.first_name}
                            />
                            <Form.Control.Feedback type="invalid">
                                Ingresa tus nombres
                            </Form.Control.Feedback>
                        </FloatingLabel>
                    </div>
                    <div className="col-md-6">
                        <FloatingLabel controlId="floatingLastName" label="Apellidos" className="mb-3">
                            <Form.Control
                                required
                                type="text"
                                placeholder="Apellidos"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                isInvalid={validated && !formData.last_name}
                            />
                            <Form.Control.Feedback type="invalid">
                                Ingresa tus apellidos
                            </Form.Control.Feedback>
                        </FloatingLabel>
                    </div>
                </div>

                <FloatingLabel controlId="floatingEmail" label="Correo electrónico" className="mb-3">
                    <Form.Control
                        required
                        type="email"
                        placeholder="nombre@ejemplo.com"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        isInvalid={validated && !formData.email}
                    />
                    <Form.Control.Feedback type="invalid">
                        Ingresa un correo válido
                    </Form.Control.Feedback>
                </FloatingLabel>

                <FloatingLabel controlId="floatingPassword" label="Contraseña" className="mb-3">
                    <Form.Control
                        required
                        type="password"
                        placeholder="Contraseña"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        isInvalid={validated && !formData.password}
                    />
                    <Form.Control.Feedback type="invalid">
                        Ingresa una contraseña
                    </Form.Control.Feedback>
                </FloatingLabel>

                <FloatingLabel controlId="floatingPhone" label="Teléfono" className="mb-4">
                    <Form.Control
                        required
                        type="tel"
                        placeholder="999999999"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        isInvalid={validated && !formData.telefono}
                        maxLength="9"
                        pattern="[0-9]*"
                    />
                    <Form.Control.Feedback type="invalid">
                        Ingresa un teléfono válido (9 dígitos)
                    </Form.Control.Feedback>
                </FloatingLabel>

                <div className="d-grid mb-3">
                    <Button
                        variant="primary"
                        type="submit"
                        size="lg"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Registrando...
                            </>
                        ) : 'Registrarse'}
                    </Button>
                </div>

                <div className="text-center">
                    <span className="text-muted">¿Ya tienes una cuenta? </span>
                    <Link to="/login" className="text-decoration-none">Inicia sesión</Link>
                </div>
            </Form>
        </div>
    );
}