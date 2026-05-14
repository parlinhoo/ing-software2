import { TextField, InputAdornment } from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import "./css/LoginScreen.scss"

export function LoginScreen() {
    return (
        <section className="login">
            <div className="login__top">
                <MenuBookIcon className="login__logo" />
                <h1>
                    Gestor de Convivencia
                </h1>
            </div>
            <div className="login__main">
                <p>
                    Ingrese sus datos de usuario.
                </p>
                <TextField
                    required
                    className="username-input"
                    label="Nombre de Usuario"
                    variant="outlined"
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
                    type="password"
                    variant="outlined"
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon />
                                </InputAdornment>
                            ),
                        }
                    }}
                />
                
                <button className="login-button">
                    Iniciar sesión
                </button>
            </div>
        </section>
    )
}