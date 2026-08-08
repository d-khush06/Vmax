"use client"

import React, { useState } from 'react';
import { DndContext, closestCorners, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTeam } from '@/lib/team-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Plus, X, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const defaultCols = [
  { id: 'todo', title: 'To Do', color: 'from-blue-500/20 to-blue-500/5', dot: 'bg-blue-400' },
  { id: 'in_progress', title: 'In Progress', color: 'from-orange-500/20 to-orange-500/5', dot: 'bg-orange-400' },
  { id: 'done', title: 'Done', color: 'from-green-500/20 to-green-500/5', dot: 'bg-green-400' },
];

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[200px] rounded-xl bg-white/[0.01] border border-dashed border-white/5 p-2">
      {children}
    </div>
  );
}

function SortableTask({ task }: { task: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group relative bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 hover:border-white/10 p-4 rounded-xl cursor-default transition-all mb-2.5 ${isDragging ? 'opacity-0' : ''}`}
    >
      <div className="flex items-start gap-2">
        <div {...listeners} className="mt-0.5 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0 transition-colors">
          <GripVertical size={14} />
        </div>
        <p className="text-gray-300 text-sm font-medium leading-snug flex-1">{task.content}</p>
      </div>
    </div>
  );
}

interface AddTaskModalProps {
  onClose: () => void;
  onAdd: (content: string, columnId: string) => Promise<void>;
}

function AddTaskModal({ onClose, onAdd }: AddTaskModalProps) {
  const [content, setContent] = useState('');
  const [column, setColumn] = useState('todo');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await onAdd(content.trim(), column);
      onClose();
    } catch (err: any) {
      alert('Failed: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-md bg-[#0e0e10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="font-semibold text-white text-base">Add New Task</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Task Description</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Review PR for the new auth module"
              rows={3}
              autoFocus
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition-all resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Column</label>
            <div className="grid grid-cols-3 gap-2">
              {defaultCols.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setColumn(col.id)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    column === col.id
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`}
                >
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${col.dot}`} />
                  {col.title}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-300 text-sm font-medium hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || loading}
              className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function KanbanPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { team, user } = useTeam();

  const tasksQuery = useQuery(api.kanban.list, team ? { teamId: team._id } : "skip");
  const addTask = useMutation(api.kanban.add);
  const updateColumn = useMutation(api.kanban.updateColumn);

  const tasks = tasksQuery || [];

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = active.id;
    const overId = over.id;
    let newColumnId = overId;

    const overTask = tasks.find((t: any) => t._id === overId);
    if (overTask) newColumnId = overTask.status;

    const activeTask = tasks.find((t: any) => t._id === taskId);
    if (activeTask && activeTask.status !== newColumnId) {
      await updateColumn({ taskId, status: newColumnId });
    }
  };

  const handleAddTask = async (title: string, status: string) => {
    if (!team || !user) throw new Error('No team or user found');
    await addTask({ teamId: team._id, title, status, clerkId: user.id });
  };

  return (
    <div className="h-full w-full flex flex-col p-6 relative">
      
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">Team Tasks</h2>
          <p className="text-gray-500 text-sm mt-0.5">Drag tasks between columns to update their status.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]" />
            Real-time
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)]"
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </header>

      {tasksQuery === undefined ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">Loading tasks...</div>
      ) : (
        <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
          <DndContext collisionDetection={closestCorners} onDragStart={(e) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
            {defaultCols.map(col => {
              const colTasks = tasks.filter((t: any) => t.status === col.id);
              return (
                <div key={col.id} className="w-[300px] flex-shrink-0 flex flex-col">
                  {/* Column header */}
                  <div className={`mb-3 px-4 py-3 rounded-xl bg-gradient-to-b ${col.color} border border-white/5`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                        <h3 className="font-semibold text-gray-200 text-sm">{col.title}</h3>
                      </div>
                      <span className="bg-white/10 text-gray-400 text-xs px-2 py-0.5 rounded-full font-medium">{colTasks.length}</span>
                    </div>
                  </div>

                  <DroppableColumn id={col.id}>
                    <SortableContext id={col.id} items={colTasks.map((t: any) => t._id)} strategy={verticalListSortingStrategy}>
                      {colTasks.map((task: any) => (
                        <SortableTask key={task._id} task={task} />
                      ))}
                      {colTasks.length === 0 && (
                        <div className="h-full min-h-[150px] flex items-center justify-center text-gray-600 text-xs">
                          No tasks yet
                        </div>
                      )}
                    </SortableContext>
                  </DroppableColumn>

                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-2 w-full flex items-center gap-2 justify-center py-2.5 rounded-xl text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-all text-xs font-medium border border-dashed border-white/5 hover:border-white/10"
                  >
                    <Plus size={13} /> Add card
                  </button>
                </div>
              );
            })}

            <DragOverlay>
              {activeId ? (
                <div className="bg-white/10 p-4 rounded-xl border border-orange-500/50 text-sm text-white shadow-2xl scale-105 cursor-grabbing">
                  {tasks.find((t: any) => t._id === activeId)?.title}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <AddTaskModal onClose={() => setShowAddModal(false)} onAdd={handleAddTask} />
        )}
      </AnimatePresence>
    </div>
  );
}
