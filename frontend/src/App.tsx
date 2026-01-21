import {
  useEffect,
  useCallback,
  useMemo,
  SetStateAction,
  Dispatch,
} from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnectEnd,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  NodeTypes,
  NodeProps,
  EdgeTypes,
  ConnectionMode,
  OnNodesDelete,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import ContextMenu from "./styles/menu";

import StyledNode from "./components/nodes/StyledNode";
import AggregationEdge from "./components/edges/AggregationEdge";
import AssociationEdge from "./components/edges/AssociationEdge";
import CompositionEdge from "./components/edges/CompositionEdge";
import DependencyEdge from "./components/edges/DependencyEdge";
import ImplementationEdge from "./components/edges/ImplementationEdge";
import InheritanceEdge from "./components/edges/InheritanceEdge";

import { useGlobalContext, type GlobalContext } from "./hooks/useGlobalContext";
import UMLNode, { CustomNode, EdgeType } from "./model/UMLNode";
import Trait from "./model/Trait";
import AbstractClass from "./model/AbstractClass";
import ConcreteClass from "./model/ConcreteClass";
import ExportButton from "./components/ExportButton";
import DownloadJSON from "./components/DownloadJSON";
import UploadJSON from "./components/UploadJSON";

function App() {
  const ctx: GlobalContext = useGlobalContext();

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
      if (changes.length > 0 && changes[0].type !== "remove") {
        ctx.setNodes((nodes) => {
          const nodeList = nodes.map((n) => n.getNode());
          // We can only apply changes to a Node[] type.
          const modifiedNodes = applyNodeChanges(changes, nodeList);

          // Update each node with its correspondant modified node.
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
    },
    [ctx.nodes, ctx.edges]
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

  /**
   * Checks if a given type is composed of a target class name or not.
   * @param {string} type - The type to be checked.
   * @param {string} target - The target class name.
   * @returns {boolean} True if the type is composed of the target class name, otherwise false.
   */
  function isTypeComposed(type: string, target: string): boolean {
    let startIndex,
      endIndex: number | null = null;

    for (let i = 0; i < type.length; i++) {
      if (type[i] === "[") {
        startIndex = i;
      } else if (type[i] === "]") {
        while (i < type.length) {
          if (type[i] === "]") endIndex = i;

          i++;
        }
      }
    }

    // There's a [ or ] character missing, so it can't be a composition.
    if (!startIndex || !endIndex) return false;

    // We don't wanna include the [ and ] characters.
    const composition = type.slice(startIndex + 1, endIndex);
    return composition
      .split(",")
      .map((type) => type.trim())
      .includes(target);
  }

  function setHandleId(handleId: string, targetHandleNumber: number): string {
    let fixedHandle: string[] = handleId.split("-");
    fixedHandle[fixedHandle.length - 1] = String(targetHandleNumber);
    return fixedHandle.join("-");
  }

  const onConnectEnd: OnConnectEnd = (_event, connectionState) => {
    // We can only proceed when the connection is clearly between two nodes.
    console.log(_event, connectionState);
    if (
      connectionState.fromNode &&
      connectionState.fromHandle &&
      connectionState.toNode &&
      connectionState.toHandle
    ) {
      const sourceId = connectionState.fromNode.id;
      const targetId = connectionState.toNode.id;

      let nodes: UMLNode[] = ctx.nodes;

      const sourceNode = nodes.find(
        (node) => node.id === Number(sourceId)
      ) as UMLNode;
      const targetNode = nodes.find(
        (node) => node.id === Number(targetId)
      ) as UMLNode;

      let edgeTypes: { type: EdgeType; id: number }[] = [];

      //TODO: remove
      const [sourceHandleNumber] = (connectionState.fromHandle.id as string)
        .split("-")
        .slice(-1);

      switch (sourceHandleNumber) {
        case "1":
          edgeTypes.push({ type: "association", id: 1 });
          break;
        case "2":
          let inheritance = defineEdgeType(sourceNode, targetNode);
          edgeTypes.push({ type: inheritance, id: 2 });
          break;
        default:
          edgeTypes.push({ type: "aggregation", id: 3 });
          break;
      }
      /*
      const targetName = targetNode.getName();
      const sourceFields = sourceNode.getFields();
      const sourceMethods = sourceNode.getMethods();

      const fieldUses = sourceFields.some((field) => field.type == targetName);
      const methodUses = sourceMethods.some((method) => {
        return (
          method.domType.includes(targetName) || method.codType == targetName
        );
      });

      if (fieldUses || methodUses) {
        edgeTypes.push({ type: "association", id: 1 });
      }

      try {
        let inheritance = defineEdgeType(sourceNode, targetNode);
        edgeTypes.push({ type: inheritance, id: 2 });
      } catch {
        return;
      }

      const fieldCompositions = sourceFields.some((field) => {
        return isTypeComposed(field.type, targetName);
      });

      const methodCompositions = sourceMethods.some((method) => {
        return (
          isTypeComposed(method.codType as string, targetName) ||
          method.domType.some((type) => isTypeComposed(type, targetName))
        );
      });

      if (fieldCompositions || methodCompositions) {
        edgeTypes.push({ type: "aggregation", id: 3 });
      }
      */
      if (edgeTypes.length === 0) return;

      let newEdges = ctx.edges;
      for (let { type, id } of edgeTypes) {
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

  /** Custom node styling under the StyledNode component. */
  // Empty dependences causes this to not rerender.

  const createNodeComponent = (
    ctx: GlobalContext,
    props: NodeProps<CustomNode>
  ) => (
    <StyledNode setNodes={ctx.setNodes} setEdges={ctx.setEdges} node={props} />
  );

  function CustomNodeTypes(ctx: GlobalContext): NodeTypes {
    return useMemo(() => {
      return {
        abstractClass: (props) => createNodeComponent(ctx, props),
        concreteClass: (props) => createNodeComponent(ctx, props),
        trait: (props) => createNodeComponent(ctx, props),
      };
    }, []);
  }

  function CustomEdgeTypes(
    edgeSetter: Dispatch<SetStateAction<Edge[]>>
  ): EdgeTypes {
    return useMemo(() => {
      const setterProperty = { setEdges: edgeSetter };
      return {
        aggregation: (props) =>
          AggregationEdge({ ...props, ...setterProperty }),
        association: (props) =>
          AssociationEdge({ ...props, ...setterProperty }),
        composition: (props) =>
          CompositionEdge({ ...props, ...setterProperty }),
        dependency: (props) => DependencyEdge({ ...props, ...setterProperty }),
        implementation: (props) =>
          ImplementationEdge({ ...props, ...setterProperty }),
        inheritance: (props) =>
          InheritanceEdge({ ...props, ...setterProperty }),
      };
    }, []);
  }

  return (
    <div
      ref={ctx.reactFlowWrapper}
      onContextMenu={(e) => {
        e.preventDefault();
        ctx.setRightClicked(true);

        const reactFlowBounds =
          ctx.reactFlowWrapper.current?.getBoundingClientRect();

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
      style={{ height: "100%" }}
    >
      <>
        {ctx.rightClicked && ctx.isMenuContextActive && (
          <ContextMenu top={ctx.mouseCoordinate.y} left={ctx.mouseCoordinate.x}>
            <>
              <ul>
                <li
                  onClick={() => {
                    ctx.setNodes((oldNodes) => {
                      const newNode = new Trait(
                        ctx.generateNodeId(),
                        ctx.DEFAULT_NODE_NAME,
                        ctx.DEFAULT_NODE_METHODS,
                        ctx.DEFAULT_NODE_FIELDS,
                        ctx.relativeMouseCoordinate.x,
                        ctx.relativeMouseCoordinate.y
                      );
                      return [...oldNodes, newNode];
                    });
                  }}
                >
                  Add Trait
                </li>
                <li
                  onClick={() => {
                    ctx.setNodes((oldNodes) => {
                      const newNode = new AbstractClass(
                        ctx.generateNodeId(),
                        ctx.DEFAULT_NODE_NAME,
                        ctx.DEFAULT_NODE_METHODS,
                        ctx.DEFAULT_NODE_FIELDS,
                        ctx.relativeMouseCoordinate.x,
                        ctx.relativeMouseCoordinate.y
                      );
                      return [...oldNodes, newNode];
                    });
                  }}
                >
                  Add Abstract Class
                </li>
                <li
                  onClick={() => {
                    ctx.setNodes((oldNodes) => {
                      const newNode = new ConcreteClass(
                        ctx.generateNodeId(),
                        ctx.DEFAULT_NODE_NAME,
                        ctx.DEFAULT_NODE_METHODS,
                        ctx.DEFAULT_NODE_FIELDS,
                        ctx.relativeMouseCoordinate.x,
                        ctx.relativeMouseCoordinate.y
                      );
                      return [...oldNodes, newNode];
                    });
                  }}
                >
                  Add Concrete Class
                </li>
              </ul>
            </>
          </ContextMenu>
        )}

        <ReactFlow
          nodes={ctx.nodes.map((n) => n.getNode())}
          edges={ctx.edges}
          nodeTypes={CustomNodeTypes(ctx)}
          edgeTypes={CustomEdgeTypes(ctx.setEdges)}
          onNodesChange={onNodesChange}
          onNodesDelete={onNodesDelete}
          onEdgesChange={onEdgesChange}
          onInit={ctx.setReactFlowInstance}
          onConnectEnd={onConnectEnd}
          connectionMode={ConnectionMode.Loose}
          fitView={false}
        >
          <Panel style={{ backgroundColor: "white" }} position="top-right">
            <UploadJSON setNodes={ctx.setNodes} setEdges={ctx.setEdges} />
            <DownloadJSON nodes={ctx.nodes} edges={ctx.edges} />
            <ExportButton nodes={ctx.nodes.map((n) => n.getNode())} />
          </Panel>
          <Background />
          <Controls />
        </ReactFlow>
      </>
    </div>
  );
}

export default App;
