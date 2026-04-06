import { ToastSeverity } from "../hooks/useGlobalContext";
import { Alert, Snackbar } from "@mui/material";

type ToastAlertProps = {
  open: boolean;
  message: string | null;
  severity: ToastSeverity;
  onClose: () => void;
  toastKey?: number;
};

const ToastAlert = ({ open, message, severity, onClose, toastKey }: ToastAlertProps) => {
  return (
    <Snackbar
      key={toastKey}
      open={open}
      autoHideDuration={2500}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default ToastAlert;
