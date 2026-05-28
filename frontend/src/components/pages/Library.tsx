import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import api from "../../services/api";
import "./library.css";
import { IconButton } from "@mui/material";
import { Copy, PencilLine, PlusCircle, Trash2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useGlobalContext } from "../../hooks/useGlobalContext";

type Diagram = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  content: {
    nodes?: unknown[];
    edges?: unknown[];
  };
};

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.locale("es");

function formatRelativeTime(value: string) {
  const date = dayjs.utc(value).local().locale("es");
  if (!date.isValid()) {
    return "-";
  }

  return date.fromNow();
}

export default function Library() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDiagrams = async () => {
      try {
        setError(null);
        const { data } = await api.get<Diagram[]>("/diagrams");
        if (!cancelled) {
          setDiagrams(data);
        }
      } catch {
        if (!cancelled) {
          setError("No pudimos cargar tu biblioteca de diagramas.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDiagrams();

    return () => {
      cancelled = true;
    };
  }, []);
  const ctx = useGlobalContext();

  // Dialog state: rename, duplicate, delete
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; diagram?: Diagram }>({ open: false });
  const [renameText, setRenameText] = useState<string>("");

  const [duplicateDialog, setDuplicateDialog] = useState<{ open: boolean; diagram?: Diagram }>({ open: false });
  const [duplicateText, setDuplicateText] = useState<string>("");

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; diagram?: Diagram }>({ open: false });

  const openRename = (diagram: Diagram, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameDialog({ open: true, diagram });
    setRenameText(diagram.name ?? "");
  };

  const doRename = async () => {
    if (!renameDialog.diagram) return;
    const trimmed = renameText.trim();
    if (!trimmed) {
      ctx.setToast({ message: 'El nombre no puede estar vacío', severity: 'error' });
      return;
    }
    try {
      const { data } = await api.put(`/diagrams/${renameDialog.diagram.id}`, { name: trimmed, content: renameDialog.diagram.content });
      setDiagrams((current) => current.map((d) => (d.id === renameDialog.diagram!.id ? (data ?? { ...d, name: trimmed }) : d)));
      setRenameDialog({ open: false });
      ctx.setToast({ message: 'Nombre actualizado', severity: 'success' });
    } catch (err) {
      console.error('Error renombrando diagrama', err);
      ctx.setToast({ message: 'No se pudo renombrar el diagrama', severity: 'error' });
    }
  };

  const openDuplicate = (diagram: Diagram, e: React.MouseEvent) => {
    e.stopPropagation();
    setDuplicateDialog({ open: true, diagram });
    setDuplicateText(`Copia de ${diagram.name ?? 'Diagrama'}`);
  };

  const doDuplicate = async () => {
    if (!duplicateDialog.diagram) return;
    try {
      const name = duplicateText.trim() || `Copia de ${duplicateDialog.diagram.name ?? 'Diagrama'}`;
      const { data } = await api.post('/diagrams', { user_id: user?.id, name, content: duplicateDialog.diagram.content });
      if (data?.id) {
        navigate(`/editor/${data.id}`);
        ctx.setToast({ message: 'Diagrama duplicado', severity: 'success' });
      } else {
        const { data: list } = await api.get<Diagram[]>('/diagrams');
        setDiagrams(list);
        ctx.setToast({ message: 'Diagrama duplicado', severity: 'success' });
      }
      setDuplicateDialog({ open: false });
    } catch (err) {
      console.error('Error duplicando diagrama', err);
      ctx.setToast({ message: 'No se pudo duplicar el diagrama', severity: 'error' });
    }
  };

  const openDelete = (diagram: Diagram, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialog({ open: true, diagram });
  };

  const doDelete = async () => {
    if (!deleteDialog.diagram) return;
    try {
      await api.delete(`/diagrams/${deleteDialog.diagram.id}`);
      setDiagrams((current) => current.filter((d) => d.id !== deleteDialog.diagram!.id));
      setDeleteDialog({ open: false });
      ctx.setToast({ message: 'Diagrama eliminado', severity: 'success' });
    } catch (err) {
      console.error('Error eliminando diagrama', err);
      ctx.setToast({ message: 'No se pudo eliminar el diagrama', severity: 'error' });
    }
  };

  

  return (
    <div className="library-page">
      <header className="library-header">
        <h1 className="library-title">Mis Diagramas</h1>
        <button className="library-new-button" onClick={() => navigate("/editor")}>+ Nuevo Diagrama</button>
      </header>

      {loading && <p className="library-message">Cargando diagramas...</p>}
      {error && <p className="library-message library-error">{error}</p>}

      {!loading && !error && diagrams.length > 0 && (
        <section className="library-grid">
          {diagrams.map((diagram) => {
            const nodesCount = diagram.content?.nodes?.length ?? 0;
            const edgesCount = diagram.content?.edges?.length ?? 0;

            return (
              <article key={diagram.id} className="library-card" onClick={() => navigate(`/editor/${diagram.id}`)}>
                <div className="library-preview">
                  <span>{nodesCount} nodos</span>
                  <span>{edgesCount} relaciones</span>
                </div>
                <div className="library-card-header">
                  <h2 className="library-card-title">{diagram.name || "Sin titulo"}</h2>
                  <div className="library-card-actions">
                    <IconButton size="small" onClick={(e) => { openRename(diagram, e); }} aria-label="Editar diagrama">
                      <PencilLine size={18} strokeWidth={1.8} />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => { openDuplicate(diagram, e); }} aria-label="Duplicar diagrama">
                      <Copy size={18} strokeWidth={1.8} />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => { openDelete(diagram, e); }} aria-label="Eliminar diagrama">
                      <Trash2 size={18} strokeWidth={1.8} />
                    </IconButton>
                  </div>
                </div>
                <p className="library-meta">Modificado {formatRelativeTime(diagram.updated_at)}</p>
                <p className="library-meta">Creado {formatRelativeTime(diagram.created_at)}</p>
              </article>
            );
          })}
        </section>
      )}

      {/* Rename dialog */}
      {renameDialog.open && renameDialog.diagram && (
        <div className="library-modal-overlay" onClick={() => setRenameDialog({ open: false })}>
          <div className="library-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Renombrar diagrama</h3>
            <input value={renameText} onChange={(e) => setRenameText(e.target.value)} className="library-modal-input" />
            <div className="library-modal-actions">
              <button onClick={() => setRenameDialog({ open: false })}>Cancelar</button>
              <button onClick={doRename}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate dialog */}
      {duplicateDialog.open && duplicateDialog.diagram && (
        <div className="library-modal-overlay" onClick={() => setDuplicateDialog({ open: false })}>
          <div className="library-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Duplicar diagrama</h3>
            <input value={duplicateText} onChange={(e) => setDuplicateText(e.target.value)} className="library-modal-input" />
            <div className="library-modal-actions">
              <button onClick={() => setDuplicateDialog({ open: false })}>Cancelar</button>
              <button onClick={doDuplicate}>Crear copia</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteDialog.open && deleteDialog.diagram && (
        <div className="library-modal-overlay" onClick={() => setDeleteDialog({ open: false })}>
          <div className="library-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar diagrama</h3>
            <p>¿Eliminar "{deleteDialog.diagram.name}"? Esta acción no se puede deshacer.</p>
            <div className="library-modal-actions">
              <button onClick={() => setDeleteDialog({ open: false })}>Cancelar</button>
              <button onClick={doDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && diagrams.length === 0 && (
        <div className="library-empty-wide">
          <h2>Todavía no tienes diagramas</h2>
          <p>Crea tu primer diagrama para comenzar.</p>
        </div>
      )}
    </div>
  );
}
