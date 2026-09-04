'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTeam } from '@/lib/team-context';
import { useUser } from '@clerk/nextjs';
import { useThemeStore } from '@/lib/theme-store';

// Custom Node for Lever (Trigger)
function LeverNode({ id, data }: { id: string, data: any }) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-blue-500/30 shadow-[0_8px_32px_rgba(59,130,246,0.2)] rounded-2xl p-4 w-56 font-sans">
      <div className="text-[10px] font-bold tracking-wider mb-1 uppercase text-blue-400">Trigger</div>
      <input 
        value={data.label} 
        onChange={(e) => updateNodeData(id, { label: e.target.value, config: { ...data.config, label: e.target.value } })}
        className="w-full bg-transparent text-[15px] font-medium text-white outline-none border-b border-transparent hover:border-white/20 focus:border-blue-400 transition-colors pb-1"
      />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-white rounded-full right-[-6px]" />
    </div>
  );
}

// Custom Node for Piston (Action)
function PistonNode({ id, data }: { id: string, data: any }) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-green-500/30 shadow-[0_8px_32px_rgba(34,197,94,0.2)] rounded-2xl p-4 w-56 font-sans">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-green-500 border-2 border-white rounded-full left-[-6px]" />
      <div className="text-[10px] font-bold tracking-wider mb-1 uppercase text-green-400">Action</div>
      <input 
        value={data.label} 
        onChange={(e) => updateNodeData(id, { label: e.target.value, config: { ...data.config, label: e.target.value } })}
        className="w-full bg-transparent text-[15px] font-medium text-white outline-none border-b border-transparent hover:border-white/20 focus:border-green-400 transition-colors pb-1"
      />
    </div>
  );
}

const nodeTypes = {
  lever: LeverNode,
  piston: PistonNode,
};

export function RedstoneLab() {
  const { team } = useTeam();
  const { user } = useUser();
  const { theme } = useThemeStore();
  const automations = useQuery(api.automations.getAutomations, team ? { teamId: team._id } : "skip");
  const saveAutomation = useMutation(api.automations.saveAutomation);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState('Untitled Automation');

  useEffect(() => {
    if (automations && automations.length > 0) {
      const active = automations[0];
      setCurrentId(active._id);
      if (active.name) setFlowName(active.name);
      
      const reactFlowNodes = active.nodes.map(n => ({
        id: n.id,
        position: n.position,
        data: { label: n.config?.label || 'Node', config: n.config },
        type: n.type
      }));
      setNodes(reactFlowNodes as any);
      setEdges(active.edges.map(e => ({ id: e.id, source: e.source, target: e.target })));
    }
  }, [automations]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const handleSave = async () => {
    if (!team || !user) return;
    
    const nodesToSave = nodes.map(n => ({
      id: n.id,
      type: n.type || 'default',
      config: n.data.config,
      position: n.position
    }));
    
    const edgesToSave = edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target
    }));

    try {
      await saveAutomation({
        ...(currentId ? { id: currentId as any } : {}),
        teamId: team._id,
        name: flowName,
        createdBy: user.id,
        enabled: true,
        nodes: nodesToSave,
        edges: edgesToSave
      });
      alert('Saved!');
    } catch (e) {
      console.error(e);
      alert('Failed to save');
    }
  };

  const addTrigger = () => {
    const newNode: Node = {
      id: `lever_${Date.now()}`,
      type: 'lever',
      position: { x: 50, y: 50 },
      data: { label: 'Task Moved', config: { event: 'task_moved', label: 'Task Moved' } },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addAction = () => {
    const newNode: Node = {
      id: `piston_${Date.now()}`,
      type: 'piston',
      position: { x: 300, y: 50 },
      data: { label: 'Post Message', config: { action: 'post_message', message: 'A task was updated!', label: 'Post Message' } },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <ReactFlowProvider>
      <div className="w-full h-full flex flex-col font-sans relative">
        <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-white/5 backdrop-blur-md z-10 relative shadow-md">
          <input 
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="bg-transparent text-xl font-bold tracking-tight text-white outline-none border-b border-transparent hover:border-white/20 focus:border-white/50 transition-colors min-w-[250px] px-2 py-1 -ml-2"
            placeholder="Name this automation..."
          />
          <div className="w-px h-6 bg-white/20 mx-2" />
          <button onClick={addTrigger} className="px-4 py-2.5 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 font-medium transition-all text-sm border border-blue-500/20 shadow-[0_4px_16px_rgba(59,130,246,0.1)]">
            + Add Trigger
          </button>
          <button onClick={addAction} className="px-4 py-2.5 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 font-medium transition-all text-sm border border-green-500/20 shadow-[0_4px_16px_rgba(34,197,94,0.1)]">
            + Add Action
          </button>
          <div className="flex-1" />
        <button onClick={handleSave} className="px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all text-sm shadow-lg shadow-blue-500/30">
          Save Automation
        </button>
      </div>
      <div className="flex-1 bg-transparent">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={{
            style: { stroke: '#ffffff', strokeWidth: 2, opacity: 0.5 },
            type: 'smoothstep'
          }}
        >
          <Background color="#333" gap={24} size={2} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
    </ReactFlowProvider>
  );
}
