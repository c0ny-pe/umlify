import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type UMLNode from "../model/UMLNode";
import type { Edge } from "@xyflow/react";

type EditorCanvasContextValue = {
  setNodes: Dispatch<SetStateAction<UMLNode[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  nodeNames: string[];
  getUniqueNodeName: (baseName: string, excludedName?: string) => string;
  getNodeEditMode: (nodeId: number) => boolean;
  setNodeEditMode: (nodeId: number, nextEditMode: boolean) => void;
  onDuplicateName: (attemptedName: string) => void;
  onEmptyName: (message: string) => void;
};

const EditorCanvasContext = createContext<EditorCanvasContextValue | null>(null);

export function EditorCanvasProvider({
  value,
  children,
}: {
  value: EditorCanvasContextValue;
  children: React.ReactNode;
}) {
  return <EditorCanvasContext.Provider value={value}>{children}</EditorCanvasContext.Provider>;
}

export function useEditorCanvas() {
  const context = useContext(EditorCanvasContext);
  if (!context) {
    throw new Error("useEditorCanvas must be used within an EditorCanvasProvider");
  }

  return context;
}
