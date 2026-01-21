import { Download } from "@mui/icons-material";
import { Button } from "@mui/material";
import { getNodesBounds, Node } from "@xyflow/react";
import { toPng } from "html-to-image";

/**
 * Downloads an image from a given URL.
 * 
 * @param {string} dataUrl The URL of the image to be downloaded.
 */
const downloadImage = (dataUrl: string) => {
  const el = document.createElement("a");
  el.setAttribute("download", "uml_diagram.png");
  el.setAttribute("href", dataUrl);
  el.click();
};

/**
 * Represents a button to export the diagram as a PNG image.
 * 
 * @param {Object} props The props passed to this component.
 * @param {Node[]} props.nodes The canvas' nodes.
 * 
 * @returns {JSX.Element} The button to export the diagram as a PNG image.
 * @author Máximo Flores Valenzuela <https://github.com/maxfloresv>
 */
const ExportButton = ({ nodes }: { nodes: Node[] }): JSX.Element => {
  const flow = document.querySelector('.react-flow__viewport');
  const width = flow?.clientWidth;
  const height = flow?.clientHeight;

  /**
   * Handles the download of the diagram as a PNG image.
   */
  const handleDownload = () => {
    const nodesBounds = getNodesBounds(nodes);
    nodesBounds.height += 50;
    nodesBounds.width += 50;
    let download = document.querySelector('.react-flow__renderer')! as HTMLElement;
    toPng(download, {
      backgroundColor: 'white',
      width,
      height
    }).then((result) => downloadImage(result));
  }

  return (
    <Button onClick={handleDownload} startIcon={<Download />}>
      Export diagram
    </Button>
  );
}

export default ExportButton;