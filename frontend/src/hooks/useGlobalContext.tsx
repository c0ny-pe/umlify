import { Edge, ReactFlowInstance } from "@xyflow/react";
import UMLNode, { FieldType, MethodType } from "../model/UMLNode";
import React, { useCallback, useMemo, useState, useRef } from "react";
import useCanvasRightClick from "./useCanvasRightClick";
import { getUniqueName } from "../utils/nodeName";

export type ToastSeverity = "success" | "warning" | "error";
export type ToastPayload = {
  message: string;
  severity: ToastSeverity;
};
type ToastState = ToastPayload & { version: number };

type GlobalContext = {
  DEFAULT_NODE_NAME: string;
  DEFAULT_NODE_FIELDS: FieldType[];
  DEFAULT_NODE_METHODS: MethodType[];
  nodes: UMLNode[];
  nodeNames: string[];
  setNodes: React.Dispatch<React.SetStateAction<UMLNode[]>>;
  getNodes: () => UMLNode[];
  generateNodeId: () => number;
  setNextNodeId: (nextNodeId: number) => void;
  getUniqueNodeName: (baseName: string, excludedName?: string) => string;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  rightClicked: boolean;
  setRightClicked: React.Dispatch<React.SetStateAction<boolean>>;
  mouseCoordinate: { x: number; y: number };
  setMouseCoordinate: React.Dispatch<
    React.SetStateAction<{ x: number; y: number }>
  >;
  isMenuContextActive: boolean;
  setIsMenuContextActive: React.Dispatch<React.SetStateAction<boolean>>;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  reactFlowInstance: ReactFlowInstance | null;
  setReactFlowInstance: React.Dispatch<
    React.SetStateAction<ReactFlowInstance | null>
  >;
  relativeMouseCoordinate: { x: number; y: number };
  setRelativeMouseCoordinate: React.Dispatch<
    React.SetStateAction<{ x: number; y: number }>
  >;
  toast: ToastState | null;
  setToast: (toast: ToastPayload | null) => void;
};

/**
 * The global store of states and functions/methods that are used across the application.
 * @returns {GlobalContext} The global context of the application.
 */
const useGlobalContext = (): GlobalContext => {
  /** Nodes are the main elements of the diagram. They can be connected by edges. */
  const INITIAL_NODES: UMLNode[] = [];
  const INITIAL_EDGES: Edge[] = [];

  const DEFAULT_NODE_NAME: string = "Name";
  const DEFAULT_NODE_FIELDS: FieldType[] = [];
  const DEFAULT_NODE_METHODS: MethodType[] = [];

  const [nodes, setNodes] = useState<UMLNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);
  const [toast, setToastState] = useState<ToastState | null>(null);
  const toastVersionRef = useRef<number>(0);
  const nextNodeIdRef = useRef<number>(1);
  const stableNodeNamesRef = useRef<string[]>([]);

  const getNodes = () => {
    return nodes;
  };

  const generateNodeId = () => {
    const nextNodeId = nextNodeIdRef.current;
    nextNodeIdRef.current += 1;
    return nextNodeId;
  };

  const setNextNodeId = (nextNodeId: number) => {
    nextNodeIdRef.current = nextNodeId;
  };

  const nodeNames = useMemo(() => {
    const nextNames = nodes.map((node) => node.name);
    const prevNames = stableNodeNamesRef.current;

    const isSameList =
      prevNames.length === nextNames.length &&
      prevNames.every((name, index) => name === nextNames[index]);

    if (isSameList) {
      return prevNames;
    }

    stableNodeNamesRef.current = nextNames;
    return nextNames;
  }, [nodes]);

  const getUniqueNodeName = useCallback(
    (baseName: string, excludedName?: string) => {
      const usedNames = excludedName
        ? stableNodeNamesRef.current.filter((name) => name !== excludedName)
        : stableNodeNamesRef.current;

      return getUniqueName(baseName, usedNames, DEFAULT_NODE_NAME);
    },
    []
  );

  const setToast = useCallback((nextToast: ToastPayload | null) => {
    if (!nextToast) {
      setToastState(null);
      return;
    }

    toastVersionRef.current += 1;
    setToastState({
      ...nextToast,
      version: toastVersionRef.current,
    });
  }, []);

  // Allows me to disable the context menu in some components
  const [isMenuContextActive, setIsMenuContextActive] = useState<boolean>(true);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const {
    rightClicked,
    setRightClicked,
    mouseCoordinate,
    setMouseCoordinate,
    relativeMouseCoordinate,
    setRelativeMouseCoordinate,
  } = useCanvasRightClick();

  return {
    DEFAULT_NODE_NAME,
    DEFAULT_NODE_FIELDS,
    DEFAULT_NODE_METHODS,
    nodes,
    nodeNames,
    setNodes,
    getNodes,
    generateNodeId,
    setNextNodeId,
    getUniqueNodeName,
    edges,
    setEdges,
    rightClicked,
    setRightClicked,
    mouseCoordinate,
    setMouseCoordinate,
    isMenuContextActive,
    setIsMenuContextActive,
    reactFlowWrapper,
    reactFlowInstance,
    setReactFlowInstance,
    relativeMouseCoordinate,
    setRelativeMouseCoordinate,
    toast,
    setToast,
  };
};

export { useGlobalContext, type GlobalContext };
