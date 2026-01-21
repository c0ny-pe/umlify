import { type MarkerTypes } from "../edges/AbstractEdge";

/**
 * Generates the marker path with a custom width and height.
 * 
 * @param {MarkerTypes} markerType The marker to be created.
 * @param {number} markerWidth The marker height desired.
 * @param {number} markerHeight The marker width desired.
 * @returns {string} The path of the marker.
 * 
 * @author Máximo Flores Valenzuela <https://github.com/maxfloresv>
 */
function generatePath(markerType: MarkerTypes, markerWidth: number, markerHeight: number): string {
  const halfWidth = markerWidth / 2;
  const halfHeight = markerHeight / 2;

  switch (markerType) {
    case 'hat':
      return `M 0 0 
              L ${markerWidth} ${halfHeight} 
              L 0 ${markerHeight}`;
    case 'diamond':
      return `M ${halfWidth / 2} ${halfHeight} 
              L ${halfWidth} 1
              L ${halfWidth * 1.5} ${halfHeight} 
              L ${halfWidth} ${markerHeight - 1} Z`;
    case 'triangle':
      return `M 0 0 
              L ${markerWidth} ${halfHeight} 
              L 0 ${markerHeight} 
              Z`;
  }
}

export default generatePath;