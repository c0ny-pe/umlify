import { useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, MenuItem, Divider, IconButton } from '@mui/material';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import './styles/NavBar.css';
import { useAuth } from '../hooks/useAuth';

type NavBarProps = {
    editorActions?: ReactNode;
};

const NavBar = ({ editorActions }: NavBarProps) => {
    const { user, isAuthenticated, logout } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [exportAnchorEl, setExportAnchorEl] = useState<HTMLElement | null>(null);

    const isLibraryView = pathname === '/';
    const isEditorView = pathname === '/editor' || pathname.startsWith('/editor/');
    const initial = user?.username?.trim().charAt(0).toUpperCase() || '?';
    const menuOpen = Boolean(anchorEl);
    const exportMenuOpen = Boolean(exportAnchorEl);

    const userLabel = useMemo(() => user?.username ?? '', [user?.username]);

    const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleOpenExportMenu = (event: MouseEvent<HTMLElement>) => {
        setExportAnchorEl(event.currentTarget);
    };

    const handleCloseExportMenu = () => {
        setExportAnchorEl(null);
    };

    const handleNavigate = (path: string) => {
        handleCloseMenu();
        navigate(path);
    };

    const handleLogout = () => {
        handleCloseMenu();
        logout();
        navigate('/login', { replace: true });
    };

    if (isAuthenticated) {
        return (
            <nav className="navbar navbar-authenticated">
                <Link to="/" className="brand-link-authenticated">
                    UMLify
                </Link>
                <div className="navbar-right">
                    {isEditorView && editorActions && (
                        <>
                            <button
                                type="button"
                                className="navbar-export-trigger"
                                onClick={handleOpenExportMenu}
                            >
                                Exportar
                            </button>
                            <Menu
                                anchorEl={exportAnchorEl}
                                open={exportMenuOpen}
                                onClose={handleCloseExportMenu}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                MenuListProps={{ sx: { p: 0 } }}
                                PaperProps={{ className: 'navbar-export-menu-paper' }}
                            >
                                <div className="navbar-export-menu-header">Exportar como</div>
                                <Divider className="navbar-export-menu-divider" />
                                <div className="navbar-export-menu-actions" onClick={handleCloseExportMenu}>
                                    {editorActions}
                                </div>
                            </Menu>
                        </>
                    )}
                    {isLibraryView ? (
                        <>
                            <span className="navbar-user">Hola, {user?.username}</span>
                            <button
                                type="button"
                                className="navbar-button navbar-button-secondary navbar-button-disabled"
                                disabled
                                aria-disabled="true"
                                title="Ajustes aún no disponible"
                            >
                                Ajustes
                            </button>
                        </>
                    ) : (
                        <>
                            <IconButton
                                aria-label={`Abrir menú de ${userLabel}`}
                                onClick={handleOpenMenu}
                                disableRipple
                                disableFocusRipple
                                sx={{
                                    p: 0,
                                    minWidth: 0,
                                    width: '2.2rem',
                                    height: '2.2rem',
                                    flexShrink: 0,
                                    '&:hover': { backgroundColor: 'transparent' },
                                }}
                            >
                                <span
                                    className="navbar-avatar"
                                    aria-hidden="true"
                                    title={userLabel}
                                >
                                    {initial}
                                </span>
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={menuOpen}
                                onClose={handleCloseMenu}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                MenuListProps={{ sx: { p: 0 } }}
                                PaperProps={{ className: 'navbar-export-menu-paper' }}
                            >
                                <div className="navbar-export-menu-header">{userLabel || 'Usuario'}</div>
                                <Divider className="navbar-export-menu-divider" />
                                <MenuItem className="navbar-export-menu-item" onClick={() => handleNavigate('/')}>
                                    <FolderOpenOutlinedIcon />
                                    Biblioteca
                                </MenuItem>
                                <MenuItem className="navbar-export-menu-item" onClick={() => handleNavigate('/settings')}>
                                    <SettingsOutlinedIcon />
                                    Ajustes
                                </MenuItem>
                                <MenuItem className="navbar-export-menu-item navbar-export-menu-item-danger" onClick={handleLogout}>
                                    <LogoutIcon /> Cerrar sesión
                                </MenuItem>
                            </Menu>
                        </>
                    )}
                    {isLibraryView && (
                        <button type="button" className="navbar-button navbar-button-secondary" onClick={handleLogout}>
                            Cerrar sesión
                        </button>
                    )}
                </div>
            </nav>
        );
    }

    return (
        <nav className="navbar navbar-guest">
            <Link to="/" className="brand-link-guest">
                UMLify
            </Link>
        </nav>
    );
};

export default NavBar;