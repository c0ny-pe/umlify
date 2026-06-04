import { useEffect, useState, type FormEvent } from 'react';
import { BadgeCheck, Lock, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useGlobalContext } from '../../hooks/useGlobalContext';
import './settings.css';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
    const { user, updateProfile } = useAuth();
    const { setToast } = useGlobalContext();
    const [username, setUsername] = useState(user?.username ?? '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setUsername(user?.username ?? '');
    }, [user?.username]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextUsername = username.trim();
        if (!nextUsername) {
            setToast({ message: 'El nombre de usuario no puede estar vacío.', severity: 'error' });
            return;
        }

        if (!user) {
            setToast({ message: 'No pudimos identificar tu sesión actual.', severity: 'error' });
            return;
        }

        if (nextUsername === user.username.trim()) {
            setToast({ message: 'No hay cambios para guardar.', severity: 'warning' });
            return;
        }

        setIsSaving(true);

        try {
            await updateProfile({ username: nextUsername });
            setToast({ message: 'Nombre de usuario actualizado.', severity: 'success' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setUsername(nextUsername);
        } catch (error: any) {
            const message = error?.response?.status === 409
                ? 'Ese nombre de usuario ya está en uso.'
                : 'No pudimos guardar los cambios.';
            setToast({ message, severity: 'error' });
            return;
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-shell">
                <section className="settings-hero">
                    <p className="settings-kicker">Cuenta</p>
                    <h1>Ajustes</h1>
                    <div className="settings-identity-card">
                        <span className="settings-avatar" aria-hidden="true">
                            <span className="settings-avatar-letter">
                                {(username || user?.username || '?').trim().charAt(0).toUpperCase()}
                            </span>
                        </span>
                        <div>
                            <strong>{username || user?.username || 'Usuario'}</strong>
                            <span>Tu cuenta activa en UMLify</span>
                        </div>
                    </div>
                </section>

                <section className="settings-panel">
                    <form className="settings-form" onSubmit={handleSubmit}>
                        <div className="settings-section">
                            <div className="settings-section-header">
                                <User size={18} strokeWidth={2} />
                                <div>
                                    <h2>Perfil</h2>
                                    <p>Cambia el nombre que se muestra en la barra superior.</p>
                                </div>
                            </div>
                            <label className="settings-field">
                                <span>Nombre de usuario</span>
                                <input
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    placeholder="Tu nombre de usuario"
                                    className="settings-input"
                                    autoComplete="username"
                                />
                            </label>
                        </div>

                        <div className="settings-section">
                            <div className="settings-section-header">
                                <Lock size={18} strokeWidth={2} />
                                <div>
                                    <h2>Seguridad</h2>
                                    {/* <p>Campos listos para el cambio de contraseña.</p> */}
                                </div>
                            </div>
                            <div className="settings-password-grid" aria-disabled="true">
                                <label className="settings-field">
                                    <span>Contraseña actual</span>
                                    <input
                                        value={currentPassword}
                                        onChange={(event) => setCurrentPassword(event.target.value)}
                                        placeholder="Contraseña actual"
                                        className="settings-input"
                                        autoComplete="current-password"
                                        disabled
                                    />
                                </label>
                                <label className="settings-field">
                                    <span>Nueva contraseña</span>
                                    <input
                                        value={newPassword}
                                        onChange={(event) => setNewPassword(event.target.value)}
                                        placeholder="Nueva contraseña"
                                        className="settings-input"
                                        autoComplete="new-password"
                                        disabled
                                    />
                                </label>
                                <label className="settings-field">
                                    <span>Confirmar contraseña</span>
                                    <input
                                        value={confirmPassword}
                                        onChange={(event) => setConfirmPassword(event.target.value)}
                                        placeholder="Confirmar contraseña"
                                        className="settings-input"
                                        autoComplete="new-password"
                                        disabled
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="settings-actions">
                            <button
                                type="submit"
                                className="settings-save-button"
                                disabled={isSaving}
                                onClick={() => navigate('/')}
                            >
                                {isSaving ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                            <div className="settings-status">
                                <BadgeCheck size={16} strokeWidth={2} />
                                <span>Los cambios de nombre se reflejan en tu sesión actual.</span>
                            </div>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
}
