import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

export default function Header() {
    const { user, logout } = useAuth();
    return (
        <Navbar collapseOnSelect expand="lg" bg="dark" data-bs-theme="dark">
            <Container>
                <Navbar.Brand href="/">DM Hotel</Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto">
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        {user ? (
                            <>
                                <NavDropdown title={user.nombre} id="basic-nav-dropdown">
                                    <NavDropdown.Item as={Link} to={"/editar-perfil"}>Perfil</NavDropdown.Item>
                                    <NavDropdown.Item as={Link} to={"/mis-reservas"} >Mis Reservas</NavDropdown.Item>
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item as={Link} to={"/estadisticas"} >Estadisticas</NavDropdown.Item>
                                    <NavDropdown.Item onClick={logout}>Salir</NavDropdown.Item>
                                </NavDropdown>
                            </>
                        ) : (
                            <Nav.Link as={Link} to="/Login">Login</Nav.Link>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}