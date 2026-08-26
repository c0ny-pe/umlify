import {
  useEffect,
  useCallback,
  useMemo,
  useState,
  useRef,
} from "react";
import "./App.css";
import api, { API_BASE_URL } from "./services/api";
import { getStoredCsrfToken } from "./utils/authSession";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useReactFlow,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnectEnd,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  ConnectionMode,
  OnNodesDelete,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MousePointerClick, HelpCircle } from "lucide-react";

import { BrowserRouter, Navigate, Route, Routes, useParams, useNavigate } from "react-router-dom";
import ContextMenu from "./styles/menu";
import NavBar from "./components/NavBar";
import Login from "./components/pages/Login";
import SignUp from "./components/pages/Signup";
import Library from "./components/pages/Library";
import Settings from "./components/pages/Settings";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ThemeProvider } from "./hooks/useTheme";
import { useGlobalContext, type GlobalContext } from "./hooks/useGlobalContext";
import UMLNode, { EdgeType } from "./model/UMLNode";
import Trait from "./model/Trait";
import AbstractClass from "./model/AbstractClass";
import ConcreteClass from "./model/ConcreteClass";
import ExportPNGButton from "./components/ExportPNGButton";
import ExportSVGButton from "./components/ExportSVGButton";
import ExportScalaButton, { type DiagramPayload } from "./components/ExportScalaButton";
import ImportScalaButton from "./components/ImportScalaButton";
import { SaveModal } from "./components/SaveModal";
import ToastAlert from "./components/ToastAlert";
import { hydrateDiagramData, parseAndHydrateDiagram } from "./utils/diagramHydration";
import { applyDagreLayout } from "./utils/autoLayout";
import { EditorCanvasProvider } from "./components/editorCanvasContext";
import { edgeTypes, nodeTypes } from "./components/editorTypes";

function buildDiagramPayload(nodes: GlobalContext["nodes"], edges: GlobalContext["edges"]): DiagramPayload {
  return {
    nodes: nodes.map((n) => ({
      id: String(n.id),
      name: n.name,
      classType: n.classType,
      fields: n.fields,
      methods: n.methods,
      x: n.x,
      y: n.y,
    })),
    edges: edges.map((e) => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: e.type as string,
    })),
  };
}

// Signature of the saveable diagram content (nodes + edges, no viewport).
// Used to skip autosaves that don't change anything meaningful, e.g. when
// ReactFlow reports node measurements (dimensions) after a reload.
function diagramContentSignature(
  nodes: GlobalContext["nodes"],
  edges: GlobalContext["edges"]
): string {
  return JSON.stringify({
    nodes: nodes.map((n) => ({
      id: String(n.id),
      name: n.name,
      classType: n.classType,
      fields: n.fields.filter((f) => f.type && f.type.trim() !== ""),
      methods: n.methods,
      x: n.x,
      y: n.y,
    })),
    edges: edges.map((e) => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: e.type,
    })),
  });
}

type Viewport = { x: number; y: number; zoom: number };

function FitViewOnLoad({ active, onDone, savedViewport }: { active: boolean; onDone: () => void; savedViewport?: Viewport | null }) {
  const { setViewport } = useReactFlow();
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => {
      if (savedViewport) {
        setViewport(savedViewport, { duration: 0 });
      }
      onDoneRef.current();
    }, 150);
    return () => clearTimeout(id);
  }, [active, savedViewport, setViewport]);

  return null;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

type EditorScreenProps = {
  ctx: GlobalContext;
  onNodesChange: OnNodesChange;
  onNodesDelete: OnNodesDelete;
  onEdgesChange: OnEdgesChange;
  onConnectEnd: OnConnectEnd;
  resetEditMode: () => void;
  setDiagramTitle?: (title: string | null) => void;
  setDiagramId?: (id: string | null) => void;
  diagramTitle?: string | null;
  setSaveStatus?: (s: SaveStatus) => void;
  getNodeEditMode: (nodeId: number) => boolean;
};

function EditorScreen({
  ctx,
  onNodesChange,
  onNodesDelete,
  onEdgesChange,
  onConnectEnd,
  resetEditMode,
  setDiagramTitle,
  setDiagramId,
  diagramTitle,
  setSaveStatus,
  getNodeEditMode,
}: EditorScreenProps) {
  const { diagramId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loadingDiagram, setLoadingDiagram] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [needsFitView, setNeedsFitView] = useState(false);
  const [savedViewport, setSavedViewport] = useState<Viewport | null>(null);
  const [showCanvasHint, setShowCanvasHint] = useState(true);
  const {
    setNodes,
    setEdges,
    setNextNodeId,
    setToast,
  } = ctx;

  const saveTimeoutRef = useRef<number | null>(null);
  const hasPendingSaveRef = useRef(false);
  const viewportSaveTimeoutRef = useRef<number | null>(null);
  const diagramLoadedRef = useRef(false);
  const justLoadedRef = useRef(false);
  // Content of the last successful save; autosave is skipped when unchanged.
  const lastSavedSignatureRef = useRef<string | null>(null);

  const diagramTitleRef = useRef<string | null>(diagramTitle ?? null);
  diagramTitleRef.current = diagramTitle ?? null;

  useEffect(() => {
    let cancelled = false;

    const clearEditor = () => {
      setNodes([]);
      setEdges([]);
      setNextNodeId(1);
      if (setDiagramTitle) setDiagramTitle(null);
      if (setDiagramId) setDiagramId(null);
      resetEditMode();
    };

    const loadDiagram = async () => {
      if (!diagramId) {
        clearEditor();
        setLoadingDiagram(false);
        setLoadingError(null);
        return;
      }

      setLoadingDiagram(true);
      setLoadingError(null);
      hasPendingSaveRef.current = false;
      diagramLoadedRef.current = false;
      clearEditor();

      try {
        const { data } = await api.get(`/diagrams/${diagramId}`);
        // Update parent/app with the diagram name so NavBar can display it
        if (setDiagramTitle) setDiagramTitle(data.name ?? null);
        if (setDiagramId) setDiagramId(data.id ?? null);
        const hydrated = hydrateDiagramData(data.content);

        if (cancelled) {
          return;
        }

        setNodes(hydrated.nodes);
        setEdges(hydrated.edges);
        setNextNodeId(hydrated.nextNodeId);
        lastSavedSignatureRef.current = diagramContentSignature(hydrated.nodes, hydrated.edges);
        resetEditMode();
        setSavedViewport(hydrated.viewport ?? null);
        if (hydrated.viewport) setNeedsFitView(true);
        diagramLoadedRef.current = true;
        justLoadedRef.current = true;
      } catch {
        if (!cancelled) {
          setLoadingError("No pudimos cargar el diagrama guardado.");
          setToast({
            message: "No pudimos cargar el diagrama guardado.",
            severity: "error",
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingDiagram(false);
        }
      }
    };

    loadDiagram();

    return () => {
      cancelled = true;
    };
  }, [diagramId]);

  // All of these are updated synchronously every render so they're never stale
  // in beforeunload or flush-on-unmount callbacks (which run outside React's
  // effect scheduling and could otherwise read an outdated .current).
  const rfInstanceRef = useRef(ctx.reactFlowInstance);
  rfInstanceRef.current = ctx.reactFlowInstance;
  // Updated by onViewportChange on the ReactFlow component — reliable for all
  // viewport changes (pan, zoom, fitView, setViewport) regardless of instance state.
  const latestViewportRef = useRef<Viewport | null>(null);
  const nodesRef = useRef(ctx.nodes);
  nodesRef.current = ctx.nodes;
  const edgesRef = useRef(ctx.edges);
  edgesRef.current = ctx.edges;
  const diagramIdRef = useRef<string | undefined>(diagramId);
  diagramIdRef.current = diagramId;
  const loadingDiagramRef = useRef(loadingDiagram);
  loadingDiagramRef.current = loadingDiagram;

  const buildPayload = () => ({
    nodes: nodesRef.current.map((n) => ({
      id: String(n.id),
      name: n.name,
      classType: n.classType,
      fields: n.fields.filter((f) => f.type && f.type.trim() !== ""),
      methods: n.methods,
      x: n.x,
      y: n.y,
    })),
    edges: edgesRef.current.map((e) => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: e.type as string,
    })),
    viewport: latestViewportRef.current ?? rfInstanceRef.current?.getViewport(),
  });

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (!diagramId || loadingDiagram) return;
    if (justLoadedRef.current) { justLoadedRef.current = false; return; }

    // Snapshot current data for this debounce window
    const nodes = ctx.nodes;
    const edges = ctx.edges;

    hasPendingSaveRef.current = true;
    saveTimeoutRef.current = setTimeout(async () => {
      hasPendingSaveRef.current = false;

      // Skip the save when nothing meaningful changed (e.g. node measurement
      // after a reload). Position/field/method/edge edits change the signature.
      const signature = diagramContentSignature(nodes, edges);
      if (signature === lastSavedSignatureRef.current) {
        return;
      }

      setSaveStatus?.('saving');
      try {
        await api.put(`/diagrams/${diagramId}`, {
          name: diagramTitleRef.current ?? "Diagrama sin título",
          content: {
            nodes: nodes.map((n) => ({
              id: String(n.id),
              name: n.name,
              classType: n.classType,
              fields: n.fields.filter((f) => f.type && f.type.trim() !== ""),
              methods: n.methods,
              x: n.x,
              y: n.y,
            })),
            edges: edges.map((e) => ({
              source: e.source,
              target: e.target,
              sourceHandle: e.sourceHandle,
              targetHandle: e.targetHandle,
              type: e.type as string,
            })),
            viewport: rfInstanceRef.current?.getViewport() ?? latestViewportRef.current,
          },
        });
        lastSavedSignatureRef.current = signature;
        setSaveStatus?.('saved');
        setTimeout(() => setSaveStatus?.('idle'), 2000);
      } catch (err) {
        console.error("Error saving diagram:", err);
        setSaveStatus?.('idle');
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [ctx.nodes, ctx.edges, diagramId, loadingDiagram]);

  // Flush pending save immediately when navigating away within the SPA
  useEffect(() => {
    return () => {
      const hasPending = hasPendingSaveRef.current || viewportSaveTimeoutRef.current !== null;
      if (!hasPending || !diagramIdRef.current || loadingDiagramRef.current || !diagramLoadedRef.current) return;
      hasPendingSaveRef.current = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (viewportSaveTimeoutRef.current) clearTimeout(viewportSaveTimeoutRef.current);
      viewportSaveTimeoutRef.current = null;
      api.put(`/diagrams/${diagramIdRef.current}`, {
        name: diagramTitleRef.current ?? "Diagrama sin título",
        content: buildPayload(),
      }).catch(console.error);
    };
  }, []);

  // Flush pending save on page reload or tab close (keepalive survives unload)
  useEffect(() => {
    const apiBase = API_BASE_URL;

    const handleBeforeUnload = () => {
      const hasPending = hasPendingSaveRef.current || viewportSaveTimeoutRef.current !== null;
      if (!hasPending || !diagramIdRef.current || loadingDiagramRef.current || !diagramLoadedRef.current) return;
      hasPendingSaveRef.current = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (viewportSaveTimeoutRef.current) clearTimeout(viewportSaveTimeoutRef.current);
      viewportSaveTimeoutRef.current = null;
      const csrfToken = getStoredCsrfToken();
      fetch(`${apiBase}/diagrams/${diagramIdRef.current}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({
          name: diagramTitleRef.current ?? "Diagrama sin título",
          content: buildPayload(),
        }),
        keepalive: true,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return (
    <div className="canvas-shell">
      {loadingDiagram && (
        <p className="library-message">Cargando diagrama guardado...</p>
      )}
      {loadingError && (
        <p className="library-message library-error">{loadingError}</p>
      )}
      <div
        className="reactflow-wrapper"
        ref={ctx.reactFlowWrapper}
        style={needsFitView ? { opacity: 0 } : { opacity: 1, transition: 'opacity 0.15s ease' }}
        onContextMenu={(e) => {
          e.preventDefault();
          ctx.setRightClicked(true);

          const reactFlowBounds = ctx.reactFlowWrapper.current?.getBoundingClientRect();

          if (!ctx.reactFlowInstance || !reactFlowBounds) {
            return;
          }

          const position = ctx.reactFlowInstance.screenToFlowPosition({
            x: e.clientX - reactFlowBounds.left,
            y: e.clientY - reactFlowBounds.top,
          });

          ctx.setRelativeMouseCoordinate(position);
          ctx.setMouseCoordinate({ x: e.clientX, y: e.clientY });
        }}
      >
        <>
          {ctx.rightClicked && ctx.isMenuContextActive && (
            <ContextMenu top={ctx.mouseCoordinate.y} left={ctx.mouseCoordinate.x}>
              <>
                <ul>
                  <li
                    onClick={async () => {
                      const uniqueName = ctx.getUniqueNodeName(ctx.DEFAULT_NODE_NAME);

                      const newNode = new Trait(
                        ctx.generateNodeId(),
                        uniqueName,
                        ctx.DEFAULT_NODE_METHODS,
                        ctx.DEFAULT_NODE_FIELDS,
                        ctx.relativeMouseCoordinate.x,
                        ctx.relativeMouseCoordinate.y
                      );

                      // Build the complete nodes array upfront
                      const allNodes = [...ctx.nodes, newNode];

                      // Update local state immediately
                      ctx.setNodes(() => allNodes);

                      // If there's no diagramId yet, create a new diagram on the server
                      if (!diagramId) {
                        if (!isAuthenticated) return;
                        try {
                          const payload = {
                            nodes: allNodes.map((n) => ({
                              id: String(n.id),
                              name: n.name,
                              classType: n.classType,
                              fields: n.fields,
                              methods: n.methods,
                              x: n.x,
                              y: n.y,
                            })),
                            edges: ctx.edges.map((e) => ({
                              source: e.source,
                              target: e.target,
                              sourceHandle: e.sourceHandle,
                              targetHandle: e.targetHandle,
                              type: e.type as string,
                            })),
                          };

                          const { data } = await api.post("/diagrams", {
                            name: "Diagrama sin título",
                            content: payload,
                          });

                          navigate(`/editor/${data.id}`);
                        } catch {
                          ctx.setToast({ message: "No se pudo crear el diagrama.", severity: "error" });
                        }
                      }
                    }}
                  >
                    Add Trait
                  </li>
                  <li
                    onClick={async () => {
                      const uniqueName = ctx.getUniqueNodeName(ctx.DEFAULT_NODE_NAME);

                      const newNode = new AbstractClass(
                        ctx.generateNodeId(),
                        uniqueName,
                        ctx.DEFAULT_NODE_METHODS,
                        ctx.DEFAULT_NODE_FIELDS,
                        ctx.relativeMouseCoordinate.x,
                        ctx.relativeMouseCoordinate.y
                      );

                      // Build the complete nodes array upfront
                      const allNodes = [...ctx.nodes, newNode];

                      ctx.setNodes(() => allNodes);

                      if (!diagramId) {
                        if (!isAuthenticated) return;
                        try {
                          const payload = {
                            nodes: allNodes.map((n) => ({
                              id: String(n.id),
                              name: n.name,
                              classType: n.classType,
                              fields: n.fields,
                              methods: n.methods,
                              x: n.x,
                              y: n.y,
                            })),
                            edges: ctx.edges.map((e) => ({
                              source: e.source,
                              target: e.target,
                              sourceHandle: e.sourceHandle,
                              targetHandle: e.targetHandle,
                              type: e.type as string,
                            })),
                          };

                          const { data } = await api.post("/diagrams", {
                            name: "Diagrama sin título",
                            content: payload,
                          });

                          navigate(`/editor/${data.id}`);
                        } catch {
                          ctx.setToast({ message: "No se pudo crear el diagrama.", severity: "error" });
                        }
                      }
                    }}
                  >
                    Add Abstract Class
                  </li>
                  <li
                    onClick={async () => {
                      const uniqueName = ctx.getUniqueNodeName(ctx.DEFAULT_NODE_NAME);

                      const newNode = new ConcreteClass(
                        ctx.generateNodeId(),
                        uniqueName,
                        ctx.DEFAULT_NODE_METHODS,
                        ctx.DEFAULT_NODE_FIELDS,
                        ctx.relativeMouseCoordinate.x,
                        ctx.relativeMouseCoordinate.y
                      );

                      // Build the complete nodes array upfront
                      const allNodes = [...ctx.nodes, newNode];

                      ctx.setNodes(() => allNodes);

                      if (!diagramId) {
                        if (!isAuthenticated) return;
                        try {
                          const payload = {
                            nodes: allNodes.map((n) => ({
                              id: String(n.id),
                              name: n.name,
                              classType: n.classType,
                              fields: n.fields,
                              methods: n.methods,
                              x: n.x,
                              y: n.y,
                            })),
                            edges: ctx.edges.map((e) => ({
                              source: e.source,
                              target: e.target,
                              sourceHandle: e.sourceHandle,
                              targetHandle: e.targetHandle,
                              type: e.type as string,
                            })),
                          };

                          const { data } = await api.post("/diagrams", {
                            name: "Diagrama sin título",
                            content: payload,
                          });

                          navigate(`/editor/${data.id}`);
                        } catch {
                          ctx.setToast({ message: "No se pudo crear el diagrama.", severity: "error" });
                        }
                      }
                    }}
                  >
                    Add Concrete Class
                  </li>
                </ul>
              </>
            </ContextMenu>
          )}

          <ReactFlow
            nodes={ctx.nodes.map((n) => {
              const rfNode = n.getNode();
              return getNodeEditMode(n.id) ? { ...rfNode, zIndex: 1000 } : rfNode;
            })}
            edges={ctx.edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onNodesDelete={onNodesDelete}
            onEdgesChange={onEdgesChange}
            onInit={ctx.setReactFlowInstance}
            onConnectEnd={onConnectEnd}
            onViewportChange={(vp) => {
              latestViewportRef.current = vp;
              if (!diagramLoadedRef.current || !diagramIdRef.current || loadingDiagramRef.current) return;
              if (viewportSaveTimeoutRef.current) clearTimeout(viewportSaveTimeoutRef.current);
              viewportSaveTimeoutRef.current = window.setTimeout(async () => {
                viewportSaveTimeoutRef.current = null;
                try {
                  await api.put(`/diagrams/${diagramIdRef.current}`, {
                    name: diagramTitleRef.current ?? "Diagrama sin título",
                    content: buildPayload(),
                  });
                } catch { /* silent — node/edge autosave will retry if needed */ }
              }, 1000);
            }}
            connectionMode={ConnectionMode.Loose}
            fitView={false}
          >
            <Background />
            <Controls />
            <Panel position="bottom-right">
              {showCanvasHint ? (
                <div className="canvas-hint">
                  <MousePointerClick size={15} strokeWidth={2} />
                  <span>Haz click derecho para agregar un elemento</span>
                  <button
                    type="button"
                    className="canvas-hint-toggle"
                    aria-label="Ocultar ayuda"
                    onClick={() => setShowCanvasHint(false)}
                  >
                    <HelpCircle size={15} strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="canvas-hint-toggle canvas-hint-toggle-standalone"
                  aria-label="Mostrar ayuda"
                  onClick={() => setShowCanvasHint(true)}
                >
                  <HelpCircle size={16} strokeWidth={2} />
                </button>
              )}
            </Panel>
            <FitViewOnLoad active={needsFitView} onDone={() => setNeedsFitView(false)} savedViewport={savedViewport} />
          </ReactFlow>
          <ToastAlert
            toastKey={ctx.toast?.version}
            open={Boolean(ctx.toast)}
            message={ctx.toast?.message ?? null}
            severity={ctx.toast?.severity ?? "error"}
            onClose={() => ctx.setToast(null)}
          />
        </>
      </div>
    </div>
  );
}
function AppContent() {
  const ctx: GlobalContext = useGlobalContext();
  const { isAuthenticated, isInitializing, user } = useAuth();
  const navigate = useNavigate();
  const [diagramTitle, setDiagramTitle] = useState<string | null>(null);
  const [diagramIdState, setDiagramIdState] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editModeByNodeId, setEditModeByNodeId] = useState<
    Record<number, boolean>
  >({});

  const prevIsAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    const wasAnonymous = !prevIsAuthRef.current;
    prevIsAuthRef.current = isAuthenticated;
    if (!wasAnonymous || !isAuthenticated || !user) return;
    if (ctx.nodes.length === 0 && !diagramTitle) return;
    api.post('/diagrams', {
      name: diagramTitle ?? 'Diagrama sin título',
      content: buildDiagramPayload(ctx.nodes, ctx.edges),
    }).then(({ data }) => {
      setDiagramIdState(data.id);
      navigate(`/editor/${data.id}`, { replace: true });
    }).catch(() => {
      ctx.setToast({ message: 'No se pudo guardar el diagrama.', severity: 'error' });
    });
  }, [isAuthenticated]);
  const getNodeEditMode = useCallback(
    (nodeId: number) => Boolean(editModeByNodeId[nodeId]),
    [editModeByNodeId]
  );

  const setNodeEditMode = useCallback(
    (nodeId: number, nextEditMode: boolean) => {
      setEditModeByNodeId((currentEditModeById) => ({
        ...currentEditModeById,
        [nodeId]: nextEditMode,
      }));
    },
    []
  );

  const onDuplicateName = useCallback(
    (attemptedName: string) => {
      ctx.setToast({
        message: `"${attemptedName}" ya existe. No se guardó.`,
        severity: "error",
      });
    },
    [ctx]
  );

  const onEmptyName = useCallback(
    (message: string) => {
      ctx.setToast({
        message,
        severity: "error",
      });
    },
    [ctx]
  );

  /** This handles the right-clicks on the canvas. */
  // Reference: https://blog.logrocket.com/creating-react-context-menu/
  useEffect(() => {
    const handleClick = () => ctx.setRightClicked(false);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      // Apply position and dimensions changes. Dimensions (ReactFlow's node
      // measurement) MUST be applied so nodes are marked initialized; dropping
      // them makes dragging fail with ReactFlow error #015 (node disappears).
      // Removal is handled by onNodesDelete; selection is visual only. Autosave
      // is deduped by content signature, so applying dimensions is harmless.
      const relevant = changes.filter(
        (c) => c.type === "position" || c.type === "dimensions"
      );
      if (relevant.length > 0) {
        ctx.setNodes((nodes) => {
          const nodeList = nodes.map((n) => n.getNode());
          const modifiedNodes = applyNodeChanges(relevant, nodeList);
          for (let i = 0; i < nodes.length; i++) {
            nodes[i].updatePosition(modifiedNodes[i]);
          }

          return [...nodes];
        });
      }
    },
    [ctx.setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) =>
      ctx.setEdges((edges) => {
        return applyEdgeChanges(changes, edges);
      }),
    [ctx.setEdges]
  );

  const onNodesDelete: OnNodesDelete = useCallback(
    (deleted) => {
      ctx.setNodes((nodes) => {
        const newNodes = nodes.filter((node) => {
          return !deleted.map((del) => del.id).includes(String(node.id));
        });

        return newNodes;
      });

      setEditModeByNodeId((currentEditModeById) => {
        const deletedIds = new Set(deleted.map((node) => Number(node.id)));
        const nextEditModeById: Record<number, boolean> = {};

        Object.entries(currentEditModeById).forEach(([id, isEditMode]) => {
          const numericId = Number(id);
          if (!deletedIds.has(numericId)) {
            nextEditModeById[numericId] = isEditMode;
          }
        });

        return nextEditModeById;
      });
    },
    [ctx.setNodes]
  );

  /**
   * Applies a set of rules in UML construction to determine the type of edge between two nodes.
   *
   * @param {UMLNode} source The source node.
   * @param {UMLNode} target The target node.
   * @returns {EdgeType} The type of the edge between the source and target nodes.
   */
  function defineEdgeType(source: UMLNode, target: UMLNode): EdgeType {
    return source.getEdgeType(target);
  }

  function setHandleId(handleId: string, targetHandleNumber: number): string {
    const fixedHandle: string[] = handleId.split("-");
    fixedHandle[fixedHandle.length - 1] = String(targetHandleNumber);
    return fixedHandle.join("-");
  }

  function hasManualFieldType(sourceNode: UMLNode, expectedType: string): boolean {
    return sourceNode
      .getFields()
      .some(
        (field) =>
          field.type.trim().toLowerCase() === expectedType.trim().toLowerCase()
      );
  }

  function hasManualAssociationField(sourceNode: UMLNode, targetName: string): boolean {
    return hasManualFieldType(sourceNode, targetName);
  }

  function hasManualAggregationField(sourceNode: UMLNode, targetName: string): boolean {
    return hasManualFieldType(sourceNode, `List[${targetName}]`);
  }

  function hasManualCompositionField(sourceNode: UMLNode, targetName: string): boolean {
    return hasManualFieldType(sourceNode, targetName);
  }

  const onConnectEnd: OnConnectEnd = (_event, connectionState) => {
    // We can only proceed when the connection is clearly between two nodes.
    if (
      connectionState.fromNode &&
      connectionState.fromHandle &&
      connectionState.toNode &&
      connectionState.toHandle
    ) {
      const sourceId = connectionState.fromNode.id;
      const targetId = connectionState.toNode.id;

      const nodes: UMLNode[] = ctx.nodes;

      const sourceNode = nodes.find(
        (node) => node.id === Number(sourceId)
      ) as UMLNode;
      const targetNode = nodes.find(
        (node) => node.id === Number(targetId)
      ) as UMLNode;

      const edgeTypes: { type: EdgeType; id: number }[] = [];

      //TODO: remove
      const [sourceHandleNumber] = (connectionState.fromHandle.id as string)
        .split("-")
        .slice(-1);

      switch (sourceHandleNumber) {
        case "1": {
          edgeTypes.push({ type: "association", id: 1 });

          // Advertencia si no existe field manual para esta asociación
          const targetName = targetNode.getName();
          const fieldExists = hasManualAssociationField(sourceNode, targetName);
          if (!fieldExists) {
            ctx.setToast({
              message: `Se generará automáticamente en el código a exportar: val ${targetName.toLowerCase()}: ${targetName} = ???`,
              severity: "warning",
            });
          }
          break;
        }
        case "2":
          try {
            // Validar que no haya herencia múltiple
            const existingInheritanceEdges = ctx.edges.filter(
              (edge) => edge.source === sourceId && edge.type === "inheritance"
            );
            if (existingInheritanceEdges.length > 0) {
              throw new Error("Una clase solo puede extender de una única clase");
            }

            const inheritance = defineEdgeType(sourceNode, targetNode);
            edgeTypes.push({ type: inheritance, id: 2 });
          } catch (error) {
            ctx.setToast({
              message: error instanceof Error ? error.message : "No se pudo crear la herencia",
              severity: "error",
            });
            return;
          }
          break;
        case "3": {
          edgeTypes.push({ type: "aggregation", id: 3 });

          // Advertencia si no existe field manual para esta relación
          const aggTargetName = targetNode.getName();
          const aggFieldExists = hasManualAggregationField(sourceNode, aggTargetName);
          if (!aggFieldExists) {
            ctx.setToast({
              message: `Se generará automáticamente en el código a exportar: val ${aggTargetName.toLowerCase()}: ${aggTargetName} = ???`,
              severity: "warning",
            });
          }
          break;
        }
        case "4": {
          edgeTypes.push({ type: "composition", id: 4 });

          // Advertencia si no existe field manual para esta relación
          const compTargetName = targetNode.getName();
          const compFieldExists = hasManualCompositionField(sourceNode, compTargetName);
          if (!compFieldExists) {
            ctx.setToast({
              message: `Se generará automáticamente en el código a exportar: val ${compTargetName.toLowerCase()}: ${compTargetName} = ???`,
              severity: "warning",
            });
          }
          break;
        }
        default:
          return;
      }
      if (edgeTypes.length === 0) return;

      let newEdges = ctx.edges;
      for (const { type, id } of edgeTypes) {
        newEdges = addEdge(
          {
            source: sourceId,
            target: targetId,
            sourceHandle: setHandleId(
              connectionState.fromHandle?.id as string,
              id
            ),
            targetHandle: setHandleId(
              connectionState.toHandle?.id as string,
              id
            ),
            type,
          },
          newEdges
        );
      }

      ctx.setEdges(newEdges);
    }
  };

  const editorActions = (
    <>
      <ExportScalaButton
        payload={buildDiagramPayload(ctx.nodes, ctx.edges)}
        onToast={ctx.setToast}
      />
      <ExportSVGButton nodes={ctx.nodes.map((node) => node.getNode())} rfInstance={ctx.reactFlowInstance} />
      <ExportPNGButton nodes={ctx.nodes.map((node) => node.getNode())} rfInstance={ctx.reactFlowInstance} />
    </>
  );

  const resetEditMode = useCallback(() => {
    setEditModeByNodeId({});
  }, []);

  const editorCanvasValue = useMemo(
    () => ({
      setNodes: ctx.setNodes,
      setEdges: ctx.setEdges,
      nodeNames: ctx.nodeNames,
      getUniqueNodeName: ctx.getUniqueNodeName,
      getNodeEditMode,
      setNodeEditMode,
      onDuplicateName,
      onEmptyName,
    }),
    [
      ctx.nodeNames,
      ctx.getUniqueNodeName,
      ctx.setEdges,
      ctx.setNodes,
      getNodeEditMode,
      onDuplicateName,
      onEmptyName,
      setNodeEditMode,
    ]
  );

  const handleAutoLayout = useCallback(() => {
    const rfInstance = ctx.reactFlowInstance;
    if (!rfInstance || ctx.nodes.length === 0) return;
    applyDagreLayout(ctx.nodes, ctx.edges, rfInstance);
    ctx.setNodes((prev) => [...prev]);
    setTimeout(() => rfInstance.fitView({ padding: 0.2, duration: 200 }), 50);
  }, [ctx]);

  // El importador de Scala devuelve el mismo payload que se guarda en la base,
  // así que se hidrata igual que un diagrama cargado desde el servidor.
  const handleImportedDiagram = useCallback(
    (payload: unknown) => {
      const hydrated = parseAndHydrateDiagram(payload);

      ctx.setNodes(hydrated.nodes);
      ctx.setEdges(hydrated.edges);
      ctx.setNextNodeId(hydrated.nextNodeId);
      resetEditMode();

      // Dagre necesita que React Flow ya haya medido los nodos recién creados.
      window.setTimeout(() => {
        const rfInstance = ctx.reactFlowInstance;
        if (!rfInstance) return;
        applyDagreLayout(hydrated.nodes, hydrated.edges, rfInstance);
        ctx.setNodes([...hydrated.nodes]);
        window.setTimeout(() => rfInstance.fitView({ padding: 0.2, duration: 200 }), 60);
      }, 250);
    },
    [ctx, resetEditMode]
  );

  return (
    <>
      <NavBar
        editorActions={editorActions}
        importActions={
          <ImportScalaButton
            onImported={handleImportedDiagram}
            hasContent={ctx.nodes.length > 0}
          />
        }
        diagramTitle={diagramTitle}
        saveStatus={saveStatus}
        onAutoLayout={handleAutoLayout}
        onSaveAnonymous={!isAuthenticated ? () => setShowSaveModal(true) : undefined}
        onDiagramTitleChange={async (nextTitle: string) => {
          setDiagramTitle(nextTitle);
          if (!diagramIdState) {
            if (!isAuthenticated) return;
            try {
              const { data } = await api.post('/diagrams', { name: nextTitle, content: buildDiagramPayload(ctx.nodes, ctx.edges) });
              setDiagramIdState(data.id);
              navigate(`/editor/${data.id}`, { replace: true });
            } catch {
              ctx.setToast({ message: 'No se pudo crear el diagrama.', severity: 'error' });
            }
            return;
          }
          try {
            await api.put(`/diagrams/${diagramIdState}`, { name: nextTitle, content: buildDiagramPayload(ctx.nodes, ctx.edges) });
          } catch {
            ctx.setToast({ message: 'No se pudo guardar el nombre del diagrama.', severity: 'error' });
          }
        }}
      />
      <SaveModal open={showSaveModal} onClose={() => setShowSaveModal(false)} />
      <Routes>
        <Route path="/" element={isInitializing ? null : isAuthenticated ? <Library /> : <Navigate to="/login" replace />} />
        <Route
          path="/editor"
          element={<EditorCanvasProvider value={editorCanvasValue}><EditorScreen ctx={ctx} onNodesChange={onNodesChange} onNodesDelete={onNodesDelete} onEdgesChange={onEdgesChange} onConnectEnd={onConnectEnd} resetEditMode={resetEditMode} setDiagramTitle={setDiagramTitle} setDiagramId={setDiagramIdState} diagramTitle={diagramTitle} setSaveStatus={setSaveStatus} getNodeEditMode={getNodeEditMode} /></EditorCanvasProvider>}
        />
        <Route
          path="/editor/:diagramId"
          element={isInitializing ? null : isAuthenticated ? <EditorCanvasProvider value={editorCanvasValue}><EditorScreen ctx={ctx} onNodesChange={onNodesChange} onNodesDelete={onNodesDelete} onEdgesChange={onEdgesChange} onConnectEnd={onConnectEnd} resetEditMode={resetEditMode} setDiagramTitle={setDiagramTitle} setDiagramId={setDiagramIdState} diagramTitle={diagramTitle} setSaveStatus={setSaveStatus} getNodeEditMode={getNodeEditMode} /></EditorCanvasProvider> : <Navigate to="/login" replace />}
        />
        <Route path="/login" element={isInitializing ? null : isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/signup" element={isInitializing ? null : isAuthenticated ? <Navigate to="/" replace /> : <SignUp />} />
        <Route path="/settings" element={isInitializing ? null : isAuthenticated ? <Settings /> : <Navigate to="/login" replace />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
      </Routes>
    </>
  );
}

// React Router basename: matches Vite's base path so client routes resolve under
// the deploy subpath (e.g. "/umlify"). Falls back to "/" in local dev.
const ROUTER_BASENAME =
  String(import.meta.env?.BASE_URL ?? "/").replace(/\/+$/, "") || "/";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter basename={ROUTER_BASENAME}>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
