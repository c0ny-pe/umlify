import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./library.css";

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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function Library() {
  const navigate = useNavigate();
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
                <h2 className="library-card-title">{diagram.name || "Sin titulo"}</h2>
                <p className="library-meta">Ult. modificacion: {formatDate(diagram.updated_at)}</p>
                <p className="library-meta">Fecha de creacion: {formatDate(diagram.created_at)}</p>
              </article>
            );
          })}
        </section>
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
