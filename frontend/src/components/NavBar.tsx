import { useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconButton as MuiIconButton, Switch } from '@mui/material';
import { forwardRef, useImperativeHandle } from 'react';
import { Menu, Divider, IconButton } from '@mui/material';
import { Check, Cloud, FolderOpen, Loader2, LogOut, Moon, PencilLine, Settings2, Sun, Waypoints, X } from 'lucide-react';
import './styles/NavBar.css';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useRef, useEffect } from 'react';

type InlineEditableTitleProps = {
        value: string;
        onChange: (next: string) => void;
        onEditingChange?: (editing: boolean) => void;
};

const InlineEditableTitle = forwardRef<{ focusEdit: () => void }, InlineEditableTitleProps>(
    ({ value, onChange, onEditingChange }, ref) => {
        const [editing, setEditing] = useState(false);
        const [text, setText] = useState(value);
        const inputRef = useRef<HTMLInputElement | null>(null);

        useEffect(() => setText(value), [value]);

        useEffect(() => {
            onEditingChange?.(editing);
        }, [editing, onEditingChange]);

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

type SaveStatus = 'idle' | 'saving' | 'saved';

type NavBarProps = {
    editorActions?: ReactNode;
    diagramTitle?: string | null;
    onDiagramTitleChange?: (title: string) => void;
    diagramId?: string | null;
    saveStatus?: SaveStatus;
    onAutoLayout?: () => void;
};

const NavBar = ({ editorActions, diagramTitle, onDiagramTitleChange, saveStatus, onAutoLayout }: NavBarProps) => {
    const { user, isAuthenticated, logout } = useAuth();
    const { isDark, toggle: toggleTheme } = useTheme();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const titleRef = useRef<{ focusEdit: () => void } | null>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [exportAnchorEl, setExportAnchorEl] = useState<HTMLElement | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

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
                {/* Left zone: logo + title + save indicator */}
                <div className="navbar-left">
                    <Link to="/" className="brand-link-authenticated">
                        UMLify
                    </Link>
                    {isEditorView && (
                        <>
                            <div className="navbar-left-divider" />
                            <div className="navbar-diagram-title">
                                {onDiagramTitleChange ? (
                                    <div className="navbar-diagram-title-inner">
                                        <InlineEditableTitle
                                            ref={titleRef}
                                            value={diagramTitle ?? ''}
                                            onChange={onDiagramTitleChange}
                                            onEditingChange={setIsEditingTitle}
                                        />
                                        {!isEditingTitle && (
                                            <MuiIconButton
                                                size="small"
                                                aria-label="Editar nombre"
                                                className="navbar-diagram-edit-button"
                                                onClick={() => titleRef.current?.focusEdit()}
                                            >
                                                <PencilLine size={16} strokeWidth={2} />
                                            </MuiIconButton>
                                        )}
                                    {diagramTitle != null && (
                                        <span className={`navbar-save-status navbar-save-status--${saveStatus ?? 'idle'}`} title={saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'saved' ? 'Guardado' : 'Guardado'}>
                                            {saveStatus === 'saving'
                                                ? <Loader2 size={14} className="navbar-save-spinner" />
                                                : <Cloud size={14} />
                                            }
                                            {saveStatus === 'saved' && <Check size={10} className="navbar-save-check" />}
                                        </span>
                                    )}
                                    </div>
                                ) : (
                                    <span>{diagramTitle ?? ''}</span>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Center zone: always present so the 3-column grid doesn't collapse */}
                <div className="navbar-center">
                    {isEditorView && onAutoLayout && (
                        <button
                            type="button"
                            className="navbar-layout-trigger"
                            onClick={onAutoLayout}
                            title="Auto-organizar diagrama"
                        >
                            <Waypoints size={15} strokeWidth={2} />
                            Auto-layout
                        </button>
                    )}
                </div>

                {/* Right zone: export + avatar */}
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
                        <span className="navbar-avatar" aria-hidden="true" title={userLabel}>
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
                        <Divider className="navbar-export-menu-divider" />
                        <div className="navbar-menu-theme-row navbar-menu-theme-row-compact">
                            <div className="navbar-menu-theme-left">
                                <span className="navbar-menu-theme-icon" aria-hidden="true">
                                    {isDark ? <Moon size={16} strokeWidth={2} /> : <Sun size={16} strokeWidth={2} />}
                                </span>
                                <span className="navbar-menu-theme-label">Modo Oscuro</span>
                            </div>
                            <Switch
                                checked={isDark}
                                onChange={toggleTheme}
                                className="navbar-theme-switch"
                                inputProps={{ 'aria-label': 'Alternar modo oscuro' }}
                            />
                        </div>
                    </Menu>
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