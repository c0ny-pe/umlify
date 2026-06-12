import { getNodesBounds, Node } from "@xyflow/react";
import { toPng } from "html-to-image";
import { Image } from 'lucide-react';

/** Padding in pixels applied around all nodes in the exported image. */
const MARGIN = 48;

/**
 * Downloads an image from a given URL.
 *
 * @param {string} dataUrl The URL of the image to be downloaded.
 */
const downloadImage = (dataUrl: string) => {
  const a = document.createElement("a");
  a.setAttribute("download", "uml_diagram.png");
  a.setAttribute("href", dataUrl);
  a.click();
};

/**
 * Represents a button to export the diagram as a PNG image.
 *
 * The export captures all nodes regardless of the current viewport zoom or pan,
 * sizing the output image to the exact bounding box of all nodes plus {@link MARGIN}
 * pixels on each side.
 *
 * @param {Object} props The props passed to this component.
 * @param {Node[]} props.nodes The canvas' nodes.
 *
 * @returns {JSX.Element} The button to export the diagram as a PNG image.
 * @author Máximo Flores Valenzuela <https://github.com/maxfloresv>
 */
const ExportPNGButton = ({ nodes }: { nodes: Node[] }): JSX.Element => {
  /**
   * Handles the download of the diagram as a PNG image.
   * Computes the bounding box of all nodes, builds an image sized to fit them
   * all with {@link MARGIN} padding, and applies a viewport transform so the
   * capture is independent of the user's current zoom and pan.
   */
  const handleDownload = () => {
    if (!nodes.length) return;

    const bounds = getNodesBounds(nodes);
    const imageWidth = Math.ceil(bounds.width) + MARGIN * 2;
    const imageHeight = Math.ceil(bounds.height) + MARGIN * 2;

    const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportEl) return;

    toPng(viewportEl, {
      backgroundColor: 'white',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${-bounds.x + MARGIN}px, ${-bounds.y + MARGIN}px) scale(1)`,
        transformOrigin: 'top left',
      },
    }).then(downloadImage);
  };

  return (
    <button className="navbar-menu-action" onClick={handleDownload} type="button">
      <Image size={16} />
      <span>PNG</span>
    </button>
  );
};

export default ExportPNGButton;