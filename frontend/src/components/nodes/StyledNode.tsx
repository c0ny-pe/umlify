import { Dispatch, SetStateAction, useState, useRef } from "react";
import { Edge, Handle, NodeProps, Position } from "@xyflow/react";
import UMLNode, { CustomNode, Visibility } from "../../model/UMLNode";

import NodeFields from "./NodeFields";
import NodeMethods from "./NodeMethods";
import NodeHeader from "./NodeHeader";

import "../styles/paragraph.css";
import "../styles/containers.css";

type StyledNodeProps = {
  setNodes: Dispatch<SetStateAction<UMLNode[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  node: NodeProps<CustomNode>;
};

/**
 * Represents a custom node in the canvas.
 *
 * @param {StyledNodeProps} props - The properties needed to render the node.
 * @returns {JSX.Element} The node to be rendered in the canvas.
 *
 * @author Máximo Flores Valenzuela <https://github.com/maxfloresv>
 */
const StyledNode = (props: StyledNodeProps): JSX.Element => {
  const { setNodes, setEdges, node } = props;
  const { data } = node;
  /** Defines the handles for each side of the node */
  const LEFT_RIGHT_HANDLES = 3;
  const DEFAULT_HANDLE_STYLE = {
    width: 10,
    height: 10,
  };

  /** Whether the current node is in edit mode or not */
  const [editMode, setEditMode] = useState<boolean>(false);
  // Allows forcing rerenders in this component
  const [_, setLastChange] = useState<Date | null>(null);
  /** Set the current panel expanded considering fields and methods */
  const [expanded, setExpanded] = useState<string | false>(false);
  const [mouseHover, setMouseHover] = useState<boolean>(false);

  const nodeRef = useRef<HTMLDivElement>(null);

  /**
   * Translates the visibility attribute into its symbol using pattern matching.
   *
   * @param {Visibility | null} visibility - The visibility of the field or method.
   * @returns {string} The symbol that represents the visibility.
   */
  const drawVisibility = (visibility: Visibility | null): string => {
    switch (visibility) {
      case "public":
        return "+";
      case "protected":
        return "#";
      case "private":
        return "-";
      default:
        return "?";
    }
  };

  const handlePanelChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
    };

  const forceUpdate = () => setLastChange(new Date());

  /**
   * Creates an array of handles to be rendered in a certain position of the node.
   *
   * @param {Position} position - The position of the handles in the node.
   * @param {number} numHandles - The number of handles to be created.
   * @returns {JSX.Element[]} An array of handles to be rendered.
   */
  const createMultipleHandles = (
    position: Position,
    numHandles: number
  ): JSX.Element[] => {
    let identifier: string;
    let handles: JSX.Element[] = [];

    switch (position) {
      case Position.Left:
        identifier = "left";
        break;
      case Position.Right:
        identifier = "right";
        break;
      case Position.Top:
        identifier = "top";
        break;
      case Position.Bottom:
        identifier = "bottom";
        break;
    }

    /**
     * Generates equispaced handles given a certain position in the node.
     *
     * @param {number} id The identifier in the handle line.
     * @returns {React.CSSProperties} The style of the handle.
     */
    const defineStyle = (id: number): React.CSSProperties => ({
      ...DEFAULT_HANDLE_STYLE,
      visibility: mouseHover ? "visible" : "hidden",
      top:
        position === Position.Left || position === Position.Right
          ? `${(100 * id) / (numHandles + 1)}%`
          : position === Position.Top
          ? 0
          : "auto",
      left:
        position === Position.Top || position === Position.Bottom
          ? `${(100 * id) / (numHandles + 1)}%`
          : "auto",
    });

    for (let i = 1; i <= numHandles; i++) {
      handles.push(
        <Handle
          key={`${identifier}-handle-${i}`}
          type="source"
          position={position}
          id={`${identifier}-handle-${i}`}
          style={defineStyle(i)}
        />
      );
    }

    return handles;
  };

  /** Common props to be passed to each section of the node. */
  const commonSectionProps = {
    data,
    setNodes,
    editMode,
    forceUpdate,
    mouseHover,
  };

  return (
    <>
      <div
        onMouseEnter={() => setMouseHover(true)}
        onMouseLeave={() => setMouseHover(false)}
        ref={nodeRef}
        style={{ maxWidth: "425px" }}
      >
        {createMultipleHandles(Position.Top, LEFT_RIGHT_HANDLES)}
        {createMultipleHandles(Position.Bottom, LEFT_RIGHT_HANDLES)}
        {createMultipleHandles(Position.Left, LEFT_RIGHT_HANDLES)}
        {createMultipleHandles(Position.Right, LEFT_RIGHT_HANDLES)}

        <div className="box-container">
          <NodeHeader
            {...commonSectionProps}
            node={node}
            setEdges={setEdges}
            setEditMode={setEditMode}
          />

          <NodeFields
            {...commonSectionProps}
            drawVisibility={drawVisibility}
            expanded={expanded}
            handlePanelChange={handlePanelChange}
            setExpanded={setExpanded}
          />

          <NodeMethods
            {...commonSectionProps}
            drawVisibility={drawVisibility}
            expanded={expanded}
            handlePanelChange={handlePanelChange}
            setExpanded={setExpanded}
          />
        </div>
      </div>
    </>
  );
};

export default StyledNode;
