import { TextField, InputAdornment, Alert, CircularProgress, IconButton } from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import heroImg from '../assets/img/Hero_Convivencia_Escolar.png'
import "./css/LoginScreen.scss"
import { useState } from "react";

import { useAuth } from "../context/authContext.tsx";
import axiosInstance from "../services/axiosInstance.ts";
import Paths from "../services/paths.ts";

export function LoginScreen( {onSuccess}: {onSuccess: () => void} ) {
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    
    const onLoginSubmit = async () => {
        if (!email || !password) {
            setError("Por favor, ingrese todos los campos.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await axiosInstance.post(Paths.AUTH.SIGN_IN, { email, password });
            const data = response.data;

            login(data.token, data.user);
            onSuccess();
        } catch (err: any) {
            const message = err?.response?.data?.error || "Error de conexión. Intente nuevamente.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <section className="login">
            <div className="login__top">
                <img src={heroImg} alt="Gestión de Convivencia Escolar" className="login__hero" />
            </div>
            <div className="login__main">
                <p>Ingrese sus datos de usuario.</p>
                {error && (
                    <Alert severity="error" className="login-alert">
                        {error}
                    </Alert>
                )}
                <TextField
                    required
                    className="username-input"
                    label="Correo Institucional"
                    variant="outlined"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonIcon />
                                </InputAdornment>
                            ),
                        }
                    }}
                />
                <TextField
                    required
                    className="password-input"
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    variant="outlined"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(v => !v)}
                                        edge="end"
                                        size="small"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }
                    }}
                />
                <button 
                    className="login-button" 
                    onClick={onLoginSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
                    {isLoading ? "Cargando..." : "Iniciar sesión"}
                </button>
            </div>
        </section>
    )
}
