"use client"

import React, { useState } from 'react';
import { DndContext, closestCorners, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTeam } from '@/lib/team-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Plus, X, GripVertical, CheckSquare, Calendar, User, Tag, Trash2, CheckCircle2, Circle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const defaultCols = [
  { id: 'todo', title: 'To Do', color: 'from-white/10 to-transparent', dot: 'bg-white/50' },
  { id: 'in_progress', title: 'In Progress', color: 'from-blue-500/20 to-transparent', dot: 'bg-blue-400' },
  { id: 'done', title: 'Done', color: 'from-green-500/20 to-transparent', dot: 'bg-green-400' },
];

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[200px] bg-white/5 backdrop-blur-3xl rounded-b-3xl p-4 border-x border-b border-white/20 shadow-inner">
      {children}
    </div>
  );
}

function CustomSelect({ value, onChange, options, placeholder }: { value: string, onChange: (v: string) => void, options: { label: string, value: string }[], placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative w-full">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-transparent text-white/80 text-sm focus:outline-none flex items-center justify-between py-1"
      >
        <span className={selectedOption ? "capitalize" : "text-white/40"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="text-white/40 text-[10px]">▼</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute top-full left-0 mt-2 w-full bg-[#2c2c2e] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 flex flex-col"
            >
              <div className="max-h-60 overflow-y-auto hide-scrollbar flex flex-col">
                <button
                  type="button"
                  onClick={() => { onChange(''); setIsOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm capitalize transition-colors flex-shrink-0 ${!value ? 'bg-blue-500/20 text-blue-400' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                >
                  {placeholder}
                </button>
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm capitalize transition-colors flex-shrink-0 ${value === opt.value ? 'bg-blue-500/20 text-blue-400' : 'text-white hover:bg-white/10'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortableTask({ task, onClick }: { task: any, onClick: (t: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 };

  const getPriorityIcon = (p: string) => {
    switch (p) {
      case 'urgent': return '🚨';
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return null;
    }
  };

  const completedChecklist = task.checklist ? task.checklist.filter((c: any) => c.completed).length : 0;
  const totalChecklist = task.checklist ? task.checklist.length : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group relative bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-[60px] rounded-2xl cursor-default transition-all mb-4 shadow-lg hover:shadow-xl ${isDragging ? 'opacity-50 scale-105 shadow-[0_0_30px_rgba(59,130,246,0.3)] z-50 ring-2 ring-blue-500' : ''}`}
    >
      {/* Drag Handle Area */}
      <div 
        {...listeners}
        className="absolute top-0 left-0 w-full h-8 rounded-t-2xl cursor-grab active:cursor-grabbing flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-white/10 to-transparent"
      >
        <div className="w-10 h-1 bg-white/30 rounded-full" />
      </div>

      <div className="p-5 pt-6 flex flex-col gap-2">
         {task.tags && task.tags.length > 0 && (
           <div className="flex flex-wrap gap-1">
             {task.tags.map((tag: string) => (
                <span key={tag} className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-white/10 text-white/70">{tag}</span>
             ))}
           </div>
         )}
         
         <p className="text-white text-[15px] font-medium leading-snug">{task.title}</p>
         
         {/* Footer meta - Always render a slight footer so they see a change */}
         <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/10">
           <div className="flex items-center gap-3">
              {task.priority ? (
                 <span title={`Priority: ${task.priority}`} className="text-sm">
                   {getPriorityIcon(task.priority)}
                 </span>
              ) : (
                 <span className="text-xs text-white/30 italic">No priority</span>
              )}
              {totalChecklist > 0 && (
                 <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                    <CheckSquare size={14} /> 
                    {completedChecklist}/{totalChecklist}
                 </span>
              )}
           </div>
           
           <div className="flex items-center gap-2">
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 onClick(task);
               }}
               className="text-xs bg-white/10 hover:bg-white/20 text-white/70 hover:text-white px-2 py-1 rounded-md transition-colors"
             >
               Open
             </button>
             {task.assignee && (
                <img src={task.assignee.avatarUrl || task.assignee.avatar_url || '/logo.png'} alt="Assignee" className="w-6 h-6 rounded-full border border-white/20 object-cover" />
             )}
           </div>
         </div>
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
        className="w-full max-w-md bg-white/10 backdrop-blur-[60px] border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h3 className="font-semibold text-white text-lg tracking-wide">Add New Task</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Task Description</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Build the Hotbar component"
              rows={3}
              autoFocus
              className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:bg-white/5 transition-all resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Column</label>
            <div className="grid grid-cols-3 gap-3">
              {defaultCols.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setColumn(col.id)}
                  className={`py-3 rounded-xl transition-all text-xs font-semibold flex items-center justify-center border ${
                    column === col.id
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                      : 'bg-white/5 text-white/50 border-white/5 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${col.dot}`} />
                  {col.title}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-all border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || loading}
              className="flex-1 py-3 bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 shadow-lg shadow-blue-500/25"
            >
              {loading ? 'Adding...' : 'Ship task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function TaskDetailsModal({ task, onClose, teammates, onUpdate, onAddChecklist, onToggleChecklist, onRemoveChecklist }: any) {
  const [desc, setDesc] = useState(task.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newChecklist, setNewChecklist] = useState('');
  
  const priorityOptions = ['low', 'medium', 'high', 'urgent'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-4xl max-h-[85vh] bg-[#1c1c1e] border border-white/20 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row"
      >
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8 border-r border-white/10">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {defaultCols.find(c => c.id === task.status)?.title || 'Task'}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-8 leading-snug">{task.title}</h2>
          
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2"><FileText size={16} /> Description</h3>
            <div className="space-y-3">
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onBlur={() => onUpdate({ description: desc })}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-[15px] text-white focus:outline-none focus:border-blue-500 focus:bg-white/5 transition-colors min-h-[120px] resize-none"
                placeholder="Add a more detailed description..."
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2"><CheckSquare size={16} /> Checklist</h3>
            <div className="space-y-2 mb-4">
              {task.checklist?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg group">
                  <button onClick={() => onToggleChecklist(item.id)} className="text-white/50 hover:text-blue-400 transition-colors">
                    {item.completed ? <CheckCircle2 size={20} className="text-green-500" /> : <Circle size={20} />}
                  </button>
                  <span className={`flex-1 text-[15px] ${item.completed ? 'line-through text-white/30' : 'text-white/80'}`}>{item.title}</span>
                  <button onClick={() => onRemoveChecklist(item.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={newChecklist}
                onChange={(e) => setNewChecklist(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newChecklist.trim()) {
                    onAddChecklist(newChecklist.trim());
                    setNewChecklist('');
                  }
                }}
                placeholder="Add an item..."
                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-blue-500"
              />
              <button 
                onClick={() => { if (newChecklist.trim()) { onAddChecklist(newChecklist.trim()); setNewChecklist(''); } }}
                disabled={!newChecklist.trim()}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded-xl text-white font-semibold text-sm transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="w-full md:w-72 bg-white/5 p-6 flex flex-col gap-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all">
            <X size={18} />
          </button>
          
          <div className="mt-8">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Assignee</label>
            <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/5">
              <CustomSelect 
                value={task.assigneeId || ''} 
                onChange={(v) => onUpdate({ assigneeId: v || undefined })}
                options={(teammates || []).map((m: any) => ({ label: m.user?.full_name || m.user?.name || m.user?.email || 'Unknown', value: m.user?.clerkId }))}
                placeholder="Unassigned"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Priority</label>
            <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/5">
              <CustomSelect 
                value={task.priority || ''} 
                onChange={(v) => onUpdate({ priority: v || undefined })}
                options={priorityOptions.map(p => ({ label: p, value: p }))}
                placeholder="None"
              />
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

export default function KanbanPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const { team, user, teammates } = useTeam();

  const tasksQuery = useQuery(api.kanban.list, team ? { teamId: team._id } : "skip");
  const addTask = useMutation(api.kanban.add);
  const updateColumn = useMutation(api.kanban.updateColumn);
  const updateDetails = useMutation(api.kanban.updateDetails);
  const addChecklist = useMutation(api.kanban.addChecklist);
  const toggleChecklist = useMutation(api.kanban.toggleChecklist);
  const removeChecklist = useMutation(api.kanban.removeChecklist);

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
    <div className="h-full w-full flex flex-col p-6 relative bg-transparent font-sans">
      
      <header className="mb-6 flex justify-between items-center bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl p-5 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Tasks</h2>
          <p className="text-white/50 text-sm mt-1 font-medium">Drag tasks between columns to update their status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} />
            Add Task
          </button>
        </div>
      </header>

      {tasksQuery === undefined ? (
        <div className="flex-1 flex items-center justify-center text-white/50">Loading tasks...</div>
      ) : (
        <div className="flex gap-4 flex-1 overflow-x-auto pb-4 hide-scrollbar">
          <DndContext collisionDetection={closestCorners} onDragStart={(e) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
            {defaultCols.map(col => {
              const colTasks = tasks.filter((t: any) => t.status === col.id);
              return (
                <div key={col.id} className="w-[300px] flex-shrink-0 flex flex-col">
                  {/* Column header */}
                  <div className={`mb-0 px-5 py-4 rounded-t-3xl bg-white/10 backdrop-blur-3xl border border-white/20 shadow-sm bg-gradient-to-b ${col.color}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.dot} shadow-[0_0_8px_currentColor]`} />
                        <h3 className="font-bold text-white text-[15px]">{col.title}</h3>
                      </div>
                      <span className="bg-black/30 border border-white/10 text-white/70 text-xs px-2.5 py-1 rounded-lg font-medium">{colTasks.length}</span>
                    </div>
                  </div>

                  <DroppableColumn id={col.id}>
                    <SortableContext id={col.id} items={colTasks.map((t: any) => t._id)} strategy={verticalListSortingStrategy}>
                      {colTasks.map((task: any) => (
                        <SortableTask key={task._id} task={task} onClick={(t) => setSelectedTask(t)} />
                      ))}
                      {colTasks.length === 0 && (
                        <div className="h-full min-h-[150px] flex items-center justify-center text-white/30 text-sm italic">
                          No tasks yet
                        </div>
                      )}
                    </SortableContext>
                  </DroppableColumn>

                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-3 w-full flex items-center gap-2 justify-center py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-[13px] font-semibold"
                  >
                    <Plus size={16} /> Add card
                  </button>
                </div>
              );
            })}

            <DragOverlay>
              {activeId ? (
                <div className="bg-white/20 backdrop-blur-[60px] p-5 rounded-2xl border-2 border-blue-400 text-[15px] font-medium text-white shadow-[0_30px_60px_rgba(0,0,0,0.6)] scale-105 cursor-grabbing">
                  {tasks.find((t: any) => t._id === activeId)?.title}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      <AnimatePresence>
        {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} onAdd={handleAddTask} />}
        {selectedTask && (
          <TaskDetailsModal 
            task={tasks.find((t: any) => t._id === selectedTask._id) || selectedTask} 
            onClose={() => setSelectedTask(null)}
            teammates={teammates}
            onUpdate={(updates: any) => updateDetails({ taskId: selectedTask._id, ...updates })}
            onAddChecklist={(title: string) => addChecklist({ taskId: selectedTask._id, title })}
            onToggleChecklist={(itemId: string) => toggleChecklist({ taskId: selectedTask._id, itemId })}
            onRemoveChecklist={(itemId: string) => removeChecklist({ taskId: selectedTask._id, itemId })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
