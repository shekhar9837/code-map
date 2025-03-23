"use client";

import React, { useCallback, useMemo } from 'react';
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

// Define nodeTypes and edgeTypes outside of the component
const nodeTypes = {};
const edgeTypes = {};

export interface RoadmapViewProps {
  content: {
    resources: {
      blogs: string[];
      github: string[];
    };
    steps: {
      id: string;
      title: string;
      duration: string;
      description: string;
      resources: string[];
      practice: string[];
    }[];
  };
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ content }) => {
  console.log('RoadmapView content:', content);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.data.type === 'YouTube' && node.data.label) {
      const urlMatch = node.data.label.match(/\[.*?\]\((https:\/\/(?:www\.)?youtube\.com\/.*?)\)/);
      if (urlMatch) {
        window.open(urlMatch[1], '_blank');
      }
    }
  }, []);

  const parseContentToGraph = (content: RoadmapViewProps['content']) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let currentY = 0;
    let previousNodeId = '';
    let nodeId = 0;

    content.steps?.forEach((step, index) => {
      // Main topic node
      const node = {
        id: `node-${nodeId}`,
        data: { label: step.title },
        position: { x: 250, y: currentY },
        type: 'input',
        className: 'bg-primary text-white rounded-lg p-4 shadow-md',
      };
      nodes.push(node);
      previousNodeId = node.id;
      nodeId++;
      currentY += 120;

      // Resource nodes
      step.resources.forEach((resource) => {
        const resourceType = resource.includes('YouTube') ? 'YouTube' : 'GitHub';
        const resourceNode = {
          id: `node-${nodeId}`,
          data: { 
            label: resource.trim(),
            type: resourceType
          },
          position: { x: resourceType === 'YouTube' ? 100 : 400, y: currentY },
          className: `bg-${resourceType === 'YouTube' ? 'red' : 'gray'}-500 text-white rounded-lg p-4 shadow-md`,
        };
        nodes.push(resourceNode);

        if (previousNodeId) {
          edges.push({
            id: `edge-${previousNodeId}-${resourceNode.id}`,
            source: previousNodeId,
            target: resourceNode.id,
            markerEnd: { type: MarkerType.ArrowClosed },
            className: 'stroke-current text-gray-500',
          });
        }

        nodeId++;
        currentY += 100;
      });
    });

    return { nodes, edges };
  };

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => parseContentToGraph(content), [content]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Debug logs to check nodes and edges data
  console.log('Nodes:', nodes);
  console.log('Edges:', edges);

  return (
    <div className="w-full h-[600px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default RoadmapView;