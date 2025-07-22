import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

export default function Header() {
    const { user, logout, isAdmin } = useAuth();
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
                                <NavDropdown title={user.nombre} id="basic-nav-dropdown" className='text-capitalize'>
                                    <NavDropdown.Item as={Link} to={"/editar-perfil"}>Perfil</NavDropdown.Item>
                                    <NavDropdown.Item as={Link} to={"/mis-reservas"}>Mis Reservas</NavDropdown.Item>
                                    <NavDropdown.Divider />
                                    {isAdmin && (
                                        <>
                                            <NavDropdown.Item as={Link} to={"/estadisticas"}>Estadisticas</NavDropdown.Item>
                                            
                                            {/* Submenú Habitaciones (se abre a la izquierda) */}
                                            <NavDropdown drop="start" title="Habitaciones" id="habitaciones-submenu">
                                                <NavDropdown.Item as={Link} to={"/tipo-habitaciones"}>T. Habitacion</NavDropdown.Item>
                                                <NavDropdown.Item as={Link} to={"/gestion-habitaciones"}>G. Habitacion</NavDropdown.Item>
                                            </NavDropdown>
                                            
                                            {/* Submenú Cupones (se abre a la izquierda) */}
                                            <NavDropdown drop="start" title="Cupones" id="cupones-submenu">
                                                <NavDropdown.Item as={Link} to={"/gestion-cupon"}>G. Cupon</NavDropdown.Item>
                                                <NavDropdown.Item as={Link} to={"/asignar-cupon"}>A. Cupon</NavDropdown.Item>
                                            </NavDropdown>
                                        </>
                                    )}
                                </NavDropdown>
                                <Nav.Link onClick={logout}>Salir</Nav.Link>
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