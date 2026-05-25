import { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, TextField } from "@mui/material";
import { codeToHtml } from "shiki/bundle/full";
import api from "../services/api";
import { type ToastPayload, useGlobalContext } from "../hooks/useGlobalContext";

export type DiagramPayload = {
  nodes: Array<{
    id: string;
    name: string;
    classType: string;
    fields: Array<{ name: string; type: string; visibility: string | null }>;
    methods: Array<{
      name: string;
      domType: string[];
      codType: string | null;
      visibility: string | null;
      abstract: boolean;
    }>;
    x: number;
    y: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    type: string;
  }>;
};

type ExportScalaButtonProps = {
  payload: DiagramPayload;
  onToast?: (toast: ToastPayload | null) => void;
};

export default function ExportScalaButton({ payload, onToast }: ExportScalaButtonProps) {
  const { setToast } = useGlobalContext();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const [copyToastOpen, setCopyToastOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const renderHighlightedCode = async () => {
      if (!open || loading || !code) {
        setHighlightedHtml("");
        return;
      }

      try {
        const html = await codeToHtml(code, {
          lang: "scala" as any,
          theme: "github-light",
        });

        if (!cancelled) {
          setHighlightedHtml(html);
        }
      } catch (error) {
        console.error("Error highlighting Scala code", error);
        if (!cancelled) {
          setHighlightedHtml("");
        }
      }
    };

    renderHighlightedCode();

    return () => {
      cancelled = true;
    };
  }, [open, code, loading]);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    setCode("");
    setHighlightedHtml("");

    try {
      const response = await api.post<string>("/generator", payload, {
        responseType: "text",
      });

      setCode(String(response.data ?? ""));
    } catch (error) {
      console.error("Error generating Scala code", error);
      setCode("No se pudo generar el código Scala.");
      onToast?.({ message: "No se pudo generar el código Scala.", severity: "error" });
      setToast({ message: "No se pudo generar el código Scala.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      onToast?.({ message: "Copiado", severity: "success" });
      setCopyToastOpen(true);
    } catch (error) {
      console.error("Error copying Scala code", error);
      onToast?.({ message: "No se pudo copiar el código", severity: "error" });
      setToast({ message: "No se pudo copiar el código", severity: "error" });
    }
  };

  return (
    <>
      <Button onClick={handleOpen}>Código fuente en Scala</Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Código fuente en Scala</DialogTitle>
        <DialogContent>
          {loading ? (
            <TextField
              value="Generando código..."
              multiline
              minRows={18}
              fullWidth
              variant="outlined"
              InputProps={{
                readOnly: true,
                sx: {
                  fontFamily: "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
                  fontSize: "0.9rem",
                },
              }}
              sx={{ mt: 1 }}
            />
          ) : highlightedHtml ? (
            <div
              className="scala-code-preview"
              style={{
                marginTop: 8,
                overflowX: "auto",
                padding: "1rem 1.1rem",
                borderRadius: 10,
                border: "1px solid rgba(34,49,59,0.16)",
                background: "#fff",
              }}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          ) : (
            <TextField
              value={code}
              multiline
              minRows={18}
              fullWidth
              variant="outlined"
              InputProps={{
                readOnly: true,
                sx: {
                  fontFamily: "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
                  fontSize: "0.9rem",
                },
              }}
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cerrar</Button>
          <Button onClick={handleCopy} disabled={!code || loading} variant="contained">
            Copiar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copyToastOpen}
        autoHideDuration={2200}
        onClose={() => setCopyToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 100 }}
      >
        <Alert
          onClose={() => setCopyToastOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Copiado
        </Alert>
      </Snackbar>
    </>
  );
}