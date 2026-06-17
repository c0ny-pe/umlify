import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import './form.css';
import { useAuth } from "../../hooks/useAuth";
import DarkModeToggle from "../DarkModeToggle";

const SignUp = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const { register } = useAuth();

    const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        try {
            setError(null);
            await register({
                username,
                password,
            });
            setUsername("");
            setPassword("");
            setConfirmPassword("");
            navigate("/", { replace: true });
        } catch (exception) {
            setError("No pudimos crear la cuenta. Ese nombre de usuario quizá ya existe.");
        }
    };

    return (
        <div className="auth-page">
            <DarkModeToggle />
            <div className="auth-layout">
                <div className="auth-card">
                    <h1 className="auth-title">Crear Cuenta</h1>
                    <form className="auth-form" onSubmit={handleRegister}>
                        <div className="auth-fields">
                            <div className="auth-field">
                                <label htmlFor="username">Nombre de Usuario</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    id="username"
                                    name="username"
                                    placeholder="user"
                                    value={username}
                                    required
                                    autoComplete="username"
                                    onChange={({ target }) => setUsername(target.value)}>
                                </input>
                            </div>

                            <div className="auth-field">
                                <label htmlFor="password">Contraseña</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="**********"
                                    required
                                    value={password}
                                    autoComplete="new-password"
                                    onChange={({ target }) => setPassword(target.value)}>
                                </input>
                            </div>

                            <div className="auth-field">
                                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder="**********"
                                    required
                                    value={confirmPassword}
                                    autoComplete="new-password"
                                    onChange={({ target }) => setConfirmPassword(target.value)}>
                                </input>
                            </div>

                            {error && <p className="auth-error">{error}</p>}
                        </div>

                        <div className="auth-footer">
                            <div className="auth-actions">
                                <button className="auth-submit" type="submit">
                                    Registrarme
                                </button>
                            </div>

                            <button className="auth-switch-button" type="button" onClick={() => navigate("/login")}>Ya tengo cuenta</button>
                        </div>
                    </form>
                </div>

                <aside className="auth-hero">
                    <h2 className="auth-hero-title">
                        Hacer diagramas UML para CC3002
                        <br />
                        nunca ha sido más facil
                    </h2>
                    <div className="auth-diagram-placeholder">
                        Espacio para diagrama de referencia
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default SignUp;