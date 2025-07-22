import { Button, Form, FloatingLabel, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from 'axios';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [validated, setValidated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/token/', {
                email,
                password
            });

            const { access, refresh, user } = response.data;
            login(access, user);
            toast.success("Inicio de sesión exitoso");
            navigate('/');
        } catch (error) {
            const errorMessage = error.response?.data?.detail || "Credenciales inválidas";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
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
                <h2 className="text-center mb-4">Iniciar Sesión</h2>
                
                {error && <Alert variant="danger" className="text-center">{error}</Alert>}
                
                <FloatingLabel
                    controlId="floatingEmail"
                    label="Correo Electrónico"
                    className="mb-3"
                >
                    <Form.Control
                        required
                        type="email"
                        placeholder="nombre@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        isInvalid={validated && !email}
                    />
                    <Form.Control.Feedback type="invalid">
                        Por favor ingresa un correo válido
                    </Form.Control.Feedback>
                </FloatingLabel>

                <FloatingLabel
                    controlId="floatingPassword"
                    label="Contraseña"
                    className="mb-4"
                >
                    <Form.Control
                        required
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        isInvalid={validated && (!password || password.length < 6)}
                    />
                    <Form.Control.Feedback type="invalid">
                        {!password ? 'Campo requerido' : 'Mínimo 5 caracteres'}
                    </Form.Control.Feedback>
                </FloatingLabel>

                <div className="d-grid mb-3">
                    <Button 
                        variant="primary" 
                        type="submit" 
                        disabled={loading}
                        size="lg"
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
                                Iniciando Sesión...
                            </>
                        ) : 'Iniciar Sesión'}
                    </Button>
                </div>

                <div className="text-center">
                    <span className="text-muted">¿No tienes cuenta? </span>
                    <Link to="/registro" className="text-decoration-none">Regístrate</Link>
                </div>
            </Form>
        </div>
    );
}