import { TextField, InputAdornment } from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import heroImg from '../assets/img/Hero_Convivencia_Escolar.png'
import "./css/LoginScreen.scss"

type Props = {
  onLogin: () => void
}

export function LoginScreen({ onLogin }: Props) {
    return (
        <section className="login">
            <div className="login__top">
                <img src={heroImg} alt="Gestión de Convivencia Escolar" className="login__hero" />
            </div>
            <div className="login__main">
                <p>Ingrese sus datos de usuario.</p>
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
                <button className="login-button" onClick={onLogin}>Iniciar sesión</button>
            </div>
        </section>
    )
}
