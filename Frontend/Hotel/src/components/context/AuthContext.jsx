// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);

    const isAdmin = user?.rol === 'admin'; /// 

    // Recuperar del localStorage al cargar la app
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedAccess = localStorage.getItem("access");

        if (storedUser && storedAccess) {
            try {
                setUser(JSON.parse(storedUser));
                setAccessToken(storedAccess);
            } catch (err) {
                console.error("Error al cargar user desde localStorage:", err);
            }
        }
    }, []);

    const login = (access, user) => {
        setUser(user);
        setAccessToken(access);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("access", access);
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        localStorage.clear();
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, login, logout, setUser, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
