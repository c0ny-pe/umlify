import { Edge, ReactFlowInstance } from "@xyflow/react";
import UMLNode, { FieldType, MethodType } from "../model/UMLNode";
import React, { useState, useRef } from "react";
import useCanvasRightClick from "./useCanvasRightClick";
import { getUniqueName } from "../utils/nodeName";

type GlobalContext = {
  DEFAULT_NODE_NAME: string;
  DEFAULT_NODE_FIELDS: FieldType[];
  DEFAULT_NODE_METHODS: MethodType[];
  nodes: UMLNode[];
  nodeNames: string[];
  setNodes: React.Dispatch<React.SetStateAction<UMLNode[]>>;
  setNodeNames: React.Dispatch<React.SetStateAction<string[]>>;
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
  const [nodeNames, setNodeNames] = useState<string[]>(
    INITIAL_NODES.map((node) => node.name)
  );
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);
  const nextNodeIdRef = useRef<number>(1);

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

  const doesNodeNameExist = (name: string, excludedName?: string) => {
    const normalizedName = name.trim().toLowerCase();

    return nodeNames.some((nodeName) => {
      if (excludedName && nodeName.trim().toLowerCase() === excludedName.trim().toLowerCase()) {
        return false;
      }

      return nodeName.trim().toLowerCase() === normalizedName;
    });
  };

  const getUniqueNodeName = (baseName: string, excludedName?: string) => {
    const usedNames = excludedName
      ? nodeNames.filter((name) => name !== excludedName)
      : nodeNames;

    return getUniqueName(baseName, usedNames, DEFAULT_NODE_NAME);
  };

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
    setNodeNames,
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
  };
};

export { useGlobalContext, type GlobalContext };
