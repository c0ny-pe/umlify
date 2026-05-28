import { useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconButton as MuiIconButton } from '@mui/material';
import { forwardRef, useImperativeHandle } from 'react';
import { Menu, Divider, IconButton } from '@mui/material';
import { Check, FolderOpen, LogOut, PencilLine, Settings2, X } from 'lucide-react';
import './styles/NavBar.css';
import { useAuth } from '../hooks/useAuth';
import { useRef, useEffect } from 'react';

type InlineEditableTitleProps = {
        value: string;
        onChange: (next: string) => void;
};

const InlineEditableTitle = forwardRef<{ focusEdit: () => void }, InlineEditableTitleProps>(
    ({ value, onChange }, ref) => {
        const [editing, setEditing] = useState(false);
        const [text, setText] = useState(value);
        const inputRef = useRef<HTMLInputElement | null>(null);

        useEffect(() => setText(value), [value]);

        useEffect(() => {
            if (editing && inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        }, [editing]);

        useImperativeHandle(ref, () => ({
            focusEdit: () => setEditing(true),
        }));

        const confirm = () => {
            setEditing(false);
            const trimmed = text.trim();
            if (trimmed && trimmed !== value) {
                onChange(trimmed);
            } else {
                setText(value);
            }
        };

        const cancel = () => {
            setText(value);
            setEditing(false);
        };

        return editing ? (
            <div className="navbar-diagram-editing">
                <input
                    ref={inputRef}
                    className="navbar-diagram-title-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') confirm();
                        if (e.key === 'Escape') cancel();
                    }}
                />
                <MuiIconButton size="small" className="navbar-diagram-confirm-button" onClick={confirm} aria-label="Confirmar nombre">
                    <Check size={16} strokeWidth={2} />
                </MuiIconButton>
                <MuiIconButton size="small" className="navbar-diagram-cancel-button" onClick={cancel} aria-label="Cancelar edición">
                    <X size={16} strokeWidth={2} />
                </MuiIconButton>
            </div>
        ) : (
            <span className="navbar-diagram-title-text">{value}</span>
        );
    }
);
InlineEditableTitle.displayName = 'InlineEditableTitle';

type NavBarProps = {
    editorActions?: ReactNode;
    diagramTitle?: string | null;
    onDiagramTitleChange?: (title: string) => void;
    diagramId?: string | null;
};

const NavBar = ({ editorActions, diagramTitle, onDiagramTitleChange }: NavBarProps) => {
    const { user, isAuthenticated, logout } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const titleRef = useRef<{ focusEdit: () => void } | null>(null);
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
                {/* no left-side title - title will appear on the right next to Export */}
                <div className="navbar-right">
                    {isEditorView && editorActions && (
                        <>
                            <div className="navbar-export-with-title">
                                <div className="navbar-diagram-title">
                                    {onDiagramTitleChange ? (
                                        <div className="navbar-diagram-title-inner">
                                            <InlineEditableTitle
                                                ref={titleRef}
                                                value={diagramTitle ?? 'Diagrama sin título'}
                                                onChange={onDiagramTitleChange}
                                            />
                                            <MuiIconButton
                                                size="small"
                                                aria-label="Editar nombre"
                                                className="navbar-diagram-edit-button"
                                                onClick={() => {
                                                    titleRef.current?.focusEdit();
                                                }}
                                            >
                                                <PencilLine size={16} strokeWidth={2} />
                                            </MuiIconButton>
                                        </div>
                                    ) : (
                                        <span>{diagramTitle ?? 'Diagrama sin título'}</span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className="navbar-export-trigger"
                                    onClick={handleOpenExportMenu}
                                >
                                    Exportar
                                </button>
                            </div>
                            <Menu
                                anchorEl={exportAnchorEl}
                                open={exportMenuOpen}
                                onClose={handleCloseExportMenu}
                                keepMounted
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
                                className="navbar-button navbar-button-secondary"
                                onClick={() => navigate('/settings')}
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
                                <button
                                    type="button"
                                    className="navbar-menu-action navbar-menu-action-avatar"
                                    onClick={() => handleNavigate('/')}
                                >
                                    <FolderOpen size={18} strokeWidth={2} />
                                    <span>Biblioteca</span>
                                </button>
                                <button
                                    type="button"
                                    className="navbar-menu-action navbar-menu-action-avatar"
                                    onClick={() => handleNavigate('/settings')}
                                >
                                    <Settings2 size={18} strokeWidth={2} />
                                    <span>Ajustes</span>
                                </button>
                                <button
                                    type="button"
                                    className="navbar-menu-action navbar-menu-action-avatar navbar-menu-action-danger"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={18} strokeWidth={2} />
                                    <span>Cerrar sesión</span>
                                </button>
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