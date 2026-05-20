import { AbstractEdge } from "./AbstractEdge"
import type { EdgeProps } from "@xyflow/react"

/**
 * Represents a Composition Edge in an UML diagram.
 * 
 * @param {EdgeProps} props - The properties needed to render the edge.
 * @returns {JSX.Element} The edge to be rendered in the canvas.
 * 
 * @author Máximo Flores Valenzuela <https://github.com/maxfloresv>
 */
const CompositionEdge = (props: EdgeProps): JSX.Element => {
  return (
    <AbstractEdge
      {...props}
      isDashed={false}
      markerFilled={true}
      markerType="diamond"
    />
  )
}

export default CompositionEdge;