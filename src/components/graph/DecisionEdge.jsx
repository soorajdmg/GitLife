import { useState } from 'react';
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react';

export default function DecisionEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, selected,
}) {
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const isBroken = data?.sourceBroken;
  const strokeColor = isBroken
    ? 'oklch(60% 0.18 30)'
    : selected
    ? 'oklch(52% 0.2 260)'
    : 'oklch(72% 0.01 260)';

  return (
    <>
      {/* Invisible wider hit area for hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: strokeColor, strokeWidth: selected ? 2 : 1.5 }}
        markerEnd={`url(#arrow-${isBroken ? 'broken' : 'normal'})`}
      />

      {/* Edge note label on hover */}
      {(hovered || selected) && data?.note && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: 'white',
              border: '1px solid oklch(88% 0.008 260)',
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: 11,
              color: 'oklch(38% 0.01 260)',
              boxShadow: '0 2px 8px oklch(25% 0.05 260 / 0.12)',
              pointerEvents: 'none',
              maxWidth: 160,
              zIndex: 10,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              whiteSpace: 'pre-wrap',
            }}
            className="nodrag nopan"
          >
            {data.note}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
