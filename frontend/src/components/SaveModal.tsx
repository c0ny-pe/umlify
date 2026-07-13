import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useNavigate } from "react-router-dom";

export function SaveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ className: "scala-export-dialog-paper" }}
    >
      <DialogTitle className="scala-export-dialog-title">
        Guarda tu diagrama
      </DialogTitle>
      <DialogContent className="scala-export-dialog-content">
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Para guardar tu diagrama necesitas una cuenta en UMLify. Después de registrarte
          o iniciar sesión, tu progreso se guardará automáticamente en tu cuenta.
        </p>
      </DialogContent>
      <DialogActions className="scala-export-dialog-actions">
        <Button
          className="scala-export-dialog-button scala-export-dialog-button-secondary"
          onClick={() => go("/login")}
        >
          Iniciar sesión
        </Button>
        <Button
          className="scala-export-dialog-button scala-export-dialog-button-primary"
          onClick={() => go("/signup")}
        >
          Crear cuenta
        </Button>
      </DialogActions>
    </Dialog>
  );
}
