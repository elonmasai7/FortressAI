'use client';

import '@xyflow/react/dist/style.css';
import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from '@xyflow/react';

const nodes: Node[] = [
  { id: 'recon', position: { x: 20, y: 90 }, data: { label: 'Recon Agent' }, style: { background: '#16181d', color: '#fff', border: '1px solid #E11D48' } },
  { id: 'simulate', position: { x: 200, y: 90 }, data: { label: 'Simulate Agent' }, style: { background: '#16181d', color: '#fff', border: '1px solid #E11D48' } },
  { id: 'hub', position: { x: 390, y: 70 }, data: { label: 'Neural Shield Hub' }, style: { background: '#0f2718', color: '#22C55E', border: '1px solid #22C55E' } },
  { id: 'respond', position: { x: 590, y: 90 }, data: { label: 'Respond Agent' }, style: { background: '#16181d', color: '#fff', border: '1px solid #22C55E' } },
  { id: 'log', position: { x: 760, y: 90 }, data: { label: 'Log Agent' }, style: { background: '#16181d', color: '#fff', border: '1px solid #22C55E' } },
];

const edges: Edge[] = [
  { id: 'e1', source: 'recon', target: 'simulate', markerEnd: { type: MarkerType.ArrowClosed }, animated: true },
  { id: 'e2', source: 'simulate', target: 'hub', markerEnd: { type: MarkerType.ArrowClosed }, animated: true },
  { id: 'e3', source: 'hub', target: 'respond', markerEnd: { type: MarkerType.ArrowClosed }, animated: true },
  { id: 'e4', source: 'respond', target: 'log', markerEnd: { type: MarkerType.ArrowClosed }, animated: true },
];

export function AgentFlow() {
  return (
    <div className="h-[240px] rounded-xl border border-fortress-green/60 bg-black/30">
      <ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{ padding: 0.1 }} nodesDraggable={false} nodesConnectable={false}>
        <Background gap={20} color="#1f2937" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
