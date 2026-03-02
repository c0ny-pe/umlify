import { useState } from "react";

const useCanvasRightClick = () => {
  /** Whether the user has right-clicked the canvas. */
  const [rightClicked, setRightClicked] = useState<boolean>(false);

  /** The (x, y) point in the canvas where the user right-clicked.  */
  interface Point {
    x: number;
    y: number;
  };

  // This is absolute to the screen.
  const [mouseCoordinate, setMouseCoordinate] = useState<Point>({
    x: 0,
    y: 0,
  });

  // This is relative to the canvas.
  const [relativeMouseCoordinate, setRelativeMouseCoordinate] = useState<Point>({
    x: 0,
    y: 0,
  });

  return {
    rightClicked,
    setRightClicked,
    mouseCoordinate,
    setMouseCoordinate,
    relativeMouseCoordinate,
    setRelativeMouseCoordinate
  };
}

export default useCanvasRightClick;