import { AbstractEdge, EdgePropsWithSetter } from "./AbstractEdge"

/**
 * Represents a Composition Edge in an UML diagram.
 * 
 * @param {EdgeProps} props - The properties needed to render the edge.
 * @returns {JSX.Element} The edge to be rendered in the canvas.
 * 
 * @author Máximo Flores Valenzuela <https://github.com/maxfloresv>
 */
const CompositionEdge = (props: EdgePropsWithSetter): JSX.Element => {
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