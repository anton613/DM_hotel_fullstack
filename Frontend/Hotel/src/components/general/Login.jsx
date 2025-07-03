import { Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useState } from 'react';
// import { Log_in } from "../../api/conexions";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from 'axios';


export default function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/token/', {
                email,
                password
            });

            const { access, refresh, user } = response.data;
            login(access, user); // ← ENVÍA user y access
            toast.success("Inicio de sesión exitoso");
            navigate('/');
        } catch (error) {
            toast.error("Credenciales inválidas");
        }
    };

    return (
        <Form className="w-50 mx-auto mt-5" onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>Email address</Form.Label>
                <Form.Control type="email" placeholder="Enter email" name='email' value={email} onChange={(e) => setEmail(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" placeholder="Password" name='password' value={password} onChange={(e) => setPassword(e.target.value)} />
            </Form.Group>

            <Button variant="primary" type="submit">
                Submit
            </Button>

            <span className="d-block mt-3"></span>
            Don't have an account? <Link to={'/registro'}>Register</Link>
        </Form>
    );
}