import { getNodesBounds, type Node, type ReactFlowInstance } from "@xyflow/react";
import { toSvg } from "html-to-image";
import { FileCode2 } from 'lucide-react';

const MARGIN = 48;

/**
 * Downloads a file from a given data URL.
 *
 * @param {string} dataUrl The data URL of the file to download.
 */
const downloadSvg = (dataUrl: string) => {
  const a = document.createElement("a");
  a.setAttribute("download", "uml_diagram.svg");
  a.setAttribute("href", dataUrl);
  a.click();
};

/**
 * Represents a button to export the diagram as an SVG image.
 *
 * The export captures all nodes regardless of the current viewport zoom or pan,
 * sizing the output to the exact bounding box of all nodes plus {@link MARGIN}
 * pixels on each side. The resulting SVG is scalable and suitable for inclusion
 * in academic documentation.
 *
 * @param {Object} props The props passed to this component.
 * @param {Node[]} props.nodes The canvas' nodes.
 * @param {ReactFlowInstance} props.rfInstance The ReactFlow instance used to read
 *   measured node dimensions at click-time.
 *
 * @returns {JSX.Element} The button to export the diagram as an SVG image.
 * @author Constanza Pizarro Oyaneder
 */
const ExportSVGButton = ({ nodes, rfInstance }: { nodes: Node[]; rfInstance?: ReactFlowInstance | null }): JSX.Element => {
  /**
   * Handles the download of the diagram as an SVG image.
   * Computes the bounding box of all nodes, builds an image sized to fit them
   * all with {@link MARGIN} padding, and applies a viewport transform so the
   * capture is independent of the user's current zoom and pan.
   */
  const handleDownload = () => {
    if (!nodes.length) return;

    const enriched = nodes.map((n) => {
      const measured = rfInstance?.getInternalNode(n.id)?.measured;
      return measured?.width && measured?.height
        ? { ...n, measured, width: measured.width, height: measured.height }
        : n;
    });

    const bounds = getNodesBounds(enriched);
    const imageWidth = Math.ceil(bounds.width) + MARGIN * 2;
    const imageHeight = Math.ceil(bounds.height) + MARGIN * 2;

    const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportEl) return;

    toSvg(viewportEl, {
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${-bounds.x + MARGIN}px, ${-bounds.y + MARGIN}px) scale(1)`,
        transformOrigin: 'top left',
      },
    }).then(downloadSvg);
  };

  return (
    <button className="navbar-menu-action" onClick={handleDownload} type="button">
      <FileCode2 size={16} />
      <span>SVG</span>
    </button>
  );
};

export default ExportSVGButton;
