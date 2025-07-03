// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);

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
        <AuthContext.Provider value={{ user, accessToken, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);


// import { createContext, useContext, useState, useEffect } from 'react';
// import axios from 'axios';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [token, setToken] = useState(localStorage.getItem("token"));
//     const [user, setUser] = useState(() => {
//         const storedUser = localStorage.getItem("user");
//         return storedUser ? JSON.parse(storedUser) : null;
//     });

//     useEffect(() => {
//         console.log(user)
//         if (token) {
//             localStorage.setItem("token", token);
//             axios.get(`http://127.0.0.1:8000/api/cliente/usuario/`, {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 }
//             }).then(res => {
//                 const data = Array.isArray(res.data) ? res.data[0] : res.data;
//                 setUser(data);
//                 console.log(result)
//                 localStorage.setItem("user", JSON.stringify(data));
//             }).catch(() => {
//                 setToken(null);
//                 setUser(null);
//                 localStorage.removeItem("token");
//                 localStorage.removeItem("user");
//             });
//         } else {
//             localStorage.removeItem("token");
//             localStorage.removeItem("user");
//             setUser(null);
//         }
//     }, [token]);

//     const login = (newToken, userData) => {
//         setToken(newToken);
//         setUser(userData);
//         localStorage.setItem("token", newToken);
//         localStorage.setItem("user", JSON.stringify(userData));
//     };

//     const logout = () => {
//         setToken(null);
//         setUser(null);
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");
//     };

//     return (
//         <AuthContext.Provider value={{ token, user, setUser, login, logout, isAuthenticated: !!token }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };
// export const useAuth = () => useContext(AuthContext);