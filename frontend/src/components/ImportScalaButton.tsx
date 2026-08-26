import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { FileCode2 } from "lucide-react";
import api from "../services/api";
import { useGlobalContext } from "../hooks/useGlobalContext";

const PLACEHOLDER = `abstract class AbstractCuenta(val nombre: String, saldoInicial: Int) {
  def puedeGirar(monto: Int): Boolean
}

class CuentaAhorro(nombre: String, saldoInicial: Int)
    extends AbstractCuenta(nombre, saldoInicial) {
  def puedeGirar(monto: Int): Boolean = monto <= getSaldo
}`;

type ImportScalaButtonProps = {
  /** Recibe el payload de diagrama que devolvió el backend. */
  onImported: (payload: unknown) => void;
  /** Permite advertir que el diagrama actual se va a reemplazar. */
  hasContent?: boolean;
};

function errorMessageFrom(error: unknown): string {
  const response = (error as { response?: { status?: number; data?: { error?: string } } })
    .response;

  if (response?.data?.error) return response.data.error;
  if (response?.status === 400) return "El código no puede estar vacío.";

  return "No se pudo interpretar el código Scala.";
}

export default function ImportScalaButton({ onImported, hasContent }: ImportScalaButtonProps) {
  const { setToast } = useGlobalContext();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
  };

  const handleImport = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post("/importer", { code });
      onImported(data);
      setOpen(false);
      setToast({
        message: `Se importaron ${data.nodes.length} clases desde el código Scala.`,
        severity: "success",
      });
    } catch (requestError) {
      setError(errorMessageFrom(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="navbar-import-trigger"
        onClick={() => setOpen(true)}
        title="Crear el diagrama a partir de código Scala"
      >
        <FileCode2 size={15} strokeWidth={2} />
        Importar
      </button>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{ className: "scala-export-dialog-paper" }}
        TransitionProps={{
          onExited: () => {
            setCode("");
            setError(null);
          },
        }}
      >
        <DialogTitle className="scala-export-dialog-title">Importar código Scala</DialogTitle>
        <DialogContent className="scala-export-dialog-content">
          <DialogContentText sx={{ fontSize: "0.9rem", mb: 1.5 }}>
            Pega tus clases, traits y clases abstractas. Se leen los constructores, los
            atributos y las firmas de los métodos; las implementaciones se ignoran.
            {hasContent ? " El diagrama actual será reemplazado." : ""}
          </DialogContentText>

          {error && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {error}
            </Alert>
          )}

          <TextField
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder={PLACEHOLDER}
            multiline
            minRows={16}
            fullWidth
            autoFocus
            variant="outlined"
            disabled={loading}
            InputProps={{
              sx: {
                fontFamily: "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
                fontSize: "0.9rem",
              },
            }}
          />
        </DialogContent>
        <DialogActions className="scala-export-dialog-actions">
          <Button
            onClick={handleClose}
            disabled={loading}
            className="scala-export-dialog-button scala-export-dialog-button-secondary"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || code.trim().length === 0}
            variant="contained"
            className="scala-export-dialog-button scala-export-dialog-button-primary"
          >
            {loading ? "Importando..." : "Importar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
