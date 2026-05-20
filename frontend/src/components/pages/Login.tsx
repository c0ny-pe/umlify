import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./form.css";
import { useAuth } from "../../hooks/useAuth";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError(null);
      await login({
        username,
        password,
      });
      setUsername("");
      setPassword("");
      navigate("/", { replace: true });
    } catch {
      setError("No pudimos iniciar sesión. Revisa tus credenciales.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <div className="auth-card">
          <h1 className="auth-title">Iniciar Sesión</h1>
          <form className="auth-form" onSubmit={handleLogin}>
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
                  onChange={({ target }) => setUsername(target.value)}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="password">Contraseña</label>
                <input
                  className="form-input"
                  type="password"
                  id="password"
                  name="password"
                  placeholder="**********"
                  value={password}
                  required
                  autoComplete="current-password"
                  onChange={({ target }) => setPassword(target.value)}
                />
              </div>

              {error && <p className="auth-error">{error}</p>}
            </div>

            <div className="auth-footer">
              <div className="auth-actions">
                <button className="auth-submit" type="submit">
                  Entrar
                </button>
                <p className="auth-hint">¿Olvidaste tu contraseña?</p>
              </div>

              <button
                className="auth-switch-button"
                type="button"
                onClick={() => navigate("/signup")}
              >
                Crear cuenta
              </button>
            </div>
          </form>
        </div>

        <aside className="auth-hero">
          <h2 className="auth-hero-title">
            Hacer diagramas UML para CC3002
            <br />
            nunca ha sido más fácil
          </h2>
          <div className="auth-diagram-placeholder">
            Espacio para diagrama de referencia
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Login;
