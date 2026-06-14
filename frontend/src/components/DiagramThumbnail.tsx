import { useMemo } from "react";

type ThumbnailNode = {
  id: string;
  name: string;
  classType: string;
  x: number;
  y: number;
};

type ThumbnailEdge = {
  source: string;
  target: string;
  type?: string;
};

type DiagramThumbnailProps = {
  nodes: ThumbnailNode[];
  edges: ThumbnailEdge[];
};

const VB_W = 220;
const VB_H = 120;
const NODE_W = 200;
const NODE_H = 60;
const PADDING = 14;

export default function DiagramThumbnail({ nodes, edges }: DiagramThumbnailProps) {
  const view = useMemo(() => {
    if (!nodes.length) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + NODE_W);
      maxY = Math.max(maxY, n.y + NODE_H);
    }

    const rawW = maxX - minX || 1;
    const rawH = maxY - minY || 1;
    const contentW = VB_W - PADDING * 2;
    const contentH = VB_H - PADDING * 2;
    // Never scale so small that nodes lose their labels — minimum 38px wide in viewBox space.
    const naturalScale = Math.min(contentW / rawW, contentH / rawH, 1);
    const scale = Math.max(naturalScale, 38 / NODE_W);

    const scaledW = rawW * scale;
    const scaledH = rawH * scale;
    const ox = PADDING + (contentW - scaledW) / 2;
    const oy = PADDING + (contentH - scaledH) / 2;

    const sx = (x: number) => (x - minX) * scale + ox;
    const sy = (y: number) => (y - minY) * scale + oy;
    const sw = NODE_W * scale;
    const sh = NODE_H * scale;

    const scaledNodes = nodes.map((n) => ({
      id: n.id,
      name: n.name,
      rx: sx(n.x),
      ry: sy(n.y),
      rw: sw,
      rh: sh,
    }));

    const nodeById = Object.fromEntries(scaledNodes.map((n) => [n.id, n]));

    const DASHED_TYPES = new Set(["dependency", "implementation"]);

    const scaledEdges = edges.flatMap((e, i) => {
      const src = nodeById[e.source];
      const tgt = nodeById[e.target];
      if (!src || !tgt) return [];
      return [{
        key: i,
        x1: src.rx + src.rw / 2,
        y1: src.ry + src.rh / 2,
        x2: tgt.rx + tgt.rw / 2,
        y2: tgt.ry + tgt.rh / 2,
        dashed: DASHED_TYPES.has(e.type ?? ""),
      }];
    });

    return { scaledNodes, scaledEdges };
  }, [nodes, edges]);

  if (!view) {
    return (
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={{ display: "block", width: "100%", height: "100%" }}
      >
        <text
          x={VB_W / 2}
          y={VB_H / 2 + 4}
          textAnchor="middle"
          fontSize={10}
          fill="currentColor"
          fillOpacity={0.4}
          fontFamily="Inter, sans-serif"
        >
          Diagrama vacío
        </text>
      </svg>
    );
  }

  const { scaledNodes, scaledEdges } = view;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      {scaledEdges.map((e) => {
        const midX = (e.x1 + e.x2) / 2;
        const d = `M ${e.x1} ${e.y1} L ${midX} ${e.y1} L ${midX} ${e.y2} L ${e.x2} ${e.y2}`;
        return (
          <path
            key={e.key}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.3}
            strokeWidth={1}
            strokeDasharray={e.dashed ? "3 3" : undefined}
          />
        );
      })}

      {scaledNodes.map((n) => {
        const fontSize = Math.min(11, Math.max(8, n.rw / 13));
        const maxChars = Math.floor(n.rw / (fontSize * 0.58));
        const label =
          n.name.length > maxChars ? n.name.slice(0, maxChars - 1) + "…" : n.name;

        return (
          <g key={n.id}>
            <rect
              x={n.rx} y={n.ry}
              width={n.rw} height={n.rh}
              rx={2}
              fill="var(--surface)"
              stroke="currentColor"
              strokeOpacity={0.35}
              strokeWidth={1}
            />
            {n.rw > 20 && n.rh > 10 && (
              <text
                x={n.rx + n.rw / 2}
                y={n.ry + n.rh / 2 + fontSize * 0.38}
                textAnchor="middle"
                fontSize={fontSize}
                fontWeight={600}
                fill="currentColor"
                fontFamily="JetBrains Mono, monospace"
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
