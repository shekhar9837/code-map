"use client";

import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface RoadmapViewProps {
  content: string;
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ content }) => {
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.data.type === 'YouTube' && node.data.label) {
      const urlMatch = node.data.label.match(/\[.*?\]\((https:\/\/(?:www\.)?youtube\.com\/.*?)\)/);
      if (urlMatch) {
        window.open(urlMatch[1], '_blank');
      }
    }
  }, []);

  const parseMarkdownToGraph = (markdown: string) => {
    const lines = markdown.split('\n');
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let currentY = 0;
    let previousNodeId = '';
    let nodeId = 0;

    lines.forEach((line, index) => {
      if (line.startsWith('#')) {
        // Main topic
        const topic = line.replace(/#/g, '').trim();
        const node = {
          id: `node-${nodeId}`,
          data: { label: topic },
          position: { x: 250, y: currentY },
          type: 'input',
          className: 'bg-primary text-white rounded-lg p-2',
        };
        nodes.push(node);
        previousNodeId = node.id;
        nodeId++;
        currentY += 100;
      } else if (line.includes('YouTube') || line.includes('GitHub')) {
        // Resource nodes
        const resourceType = line.includes('YouTube') ? 'YouTube' : 'GitHub';
        const node = {
          id: `node-${nodeId}`,
          data: { 
            label: line.trim(),
            type: resourceType
          },
          position: { x: resourceType === 'YouTube' ? 100 : 400, y: currentY },
          className: `bg-${resourceType === 'YouTube' ? 'red' : 'gray'}-500 text-white rounded-lg p-2`,
        };
        nodes.push(node);

        if (previousNodeId) {
          edges.push({
            id: `edge-${previousNodeId}-${node.id}`,
            source: previousNodeId,
            target: node.id,
            markerEnd: { type: MarkerType.ArrowClosed },
            className: 'text-gray-500',
          });
        }

        nodeId++;
        currentY += 80;
      }
    });

    return { nodes, edges };
  };

  const { nodes: initialNodes, edges: initialEdges } = parseMarkdownToGraph(content);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-[600px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default RoadmapView;