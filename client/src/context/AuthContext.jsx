import { createContext, useContext, useState } from "react";
import api from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem("quiz_user");
        return stored ? JSON.parse(stored) : null;
    });

    const login = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("quiz_token", data.token);
        localStorage.setItem("quiz_user", JSON.stringify(data.user));
        setUser(data.user);
        return data.user;
    };

    const register = async (name, email, password) => {
        await api.post("/auth/register", { name, email, password });
        return login(email, password);
    };

    const logout = () => {
        localStorage.removeItem("quiz_token");
        localStorage.removeItem("quiz_user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
