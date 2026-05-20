import { AbstractEdge } from "./AbstractEdge"
import type { EdgeProps } from "@xyflow/react"

/**
 * Represents an Association Edge in an UML diagram.
 * 
 * @param {EdgeProps} props - The properties needed to render the edge.
 * @returns {JSX.Element} The edge to be rendered in the canvas.
 * 
 * @author Máximo Flores Valenzuela <https://github.com/maxfloresv>
 */
const AssociationEdge = (props: EdgeProps): JSX.Element => {
  return (
    <AbstractEdge
      {...props}
      isDashed={false}
      markerType="hat"
    />
  )
}

export default AssociationEdge;