"use client"

import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { enUS } from 'date-fns/locale';
import { useTeam } from '@/lib/team-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Plus, X, Clock, AlignLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// Helper: format date-time to datetime-local value
function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface AddEventModalProps {
  onClose: () => void;
  onAdd: (title: string, startTime: string, endTime: string) => Promise<void>;
}

function AddEventModal({ onClose, onAdd }: AddEventModalProps) {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const tomorrowNoon = new Date(now);
  tomorrowNoon.setDate(tomorrowNoon.getDate() + 1);
  tomorrowNoon.setHours(12, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowNoon.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(toDatetimeLocal(tomorrowNoon));
  const [endTime, setEndTime] = useState(toDatetimeLocal(tomorrowEnd));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Please enter an event title.'); return; }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) { setError('End time must be after start time.'); return; }
    setLoading(true);
    try {
      await onAdd(title.trim(), start.toISOString(), end.toISOString());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add event.');
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
          <h3 className="font-semibold text-white text-base">Add Calendar Event</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
              <AlignLeft size={11} /> Event Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sprint Planning Meeting"
              autoFocus
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <Clock size={11} /> Start
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <Clock size={11} /> End
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
              />
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
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-white text-sm font-semibold transition-all disabled:opacity-40"
            >
              {loading ? 'Saving...' : 'Add Event'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function CalendarPage() {
  const { team, user } = useTeam();
  const [showModal, setShowModal] = useState(false);

  const eventsQuery = useQuery(api.calendar.list, team ? { teamId: team._id } : "skip");
  const addEvent = useMutation(api.calendar.add);

  const events = eventsQuery ? eventsQuery.map((e: any) => ({
    ...e,
    start: new Date(e.startTime),
    end: new Date(e.endTime),
  })) : [];

  const handleAddEvent = async (title: string, startTime: string, endTime: string) => {
    if (!team || !user) throw new Error('No team or user found');
    await addEvent({ teamId: team._id, title, startTime, endTime, clerkId: user.id });
  };

  return (
    <div className="h-full w-full flex flex-col p-6 relative">
      
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">Team Calendar</h2>
          <p className="text-gray-500 text-sm mt-0.5">Schedule and track team events in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]" />
            Real-time
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>
      </header>

      {eventsQuery === undefined ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">Loading Calendar...</div>
      ) : (
        <div className="flex-1 overflow-hidden bg-[#0b120c] rounded-2xl border border-white/5 shadow-2xl p-5 relative">
          <style dangerouslySetInnerHTML={{__html: `
            .rbc-calendar { font-family: 'Inter', sans-serif; color: #a1a1aa; border: none; background: transparent; }
            .rbc-toolbar { margin-bottom: 20px; }
            .rbc-toolbar-label { font-weight: 700; color: #f4f4f5; font-size: 1rem; }
            .rbc-btn-group { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 3px; border: 1px solid rgba(255,255,255,0.06); display: inline-flex; gap: 2px; }
            .rbc-btn-group + .rbc-btn-group { margin-left: 12px; }
            .rbc-toolbar button { color: #a1a1aa; border: none; background: transparent; border-radius: 8px; padding: 5px 14px; font-weight: 500; font-size: 0.8125rem; transition: all 0.15s; box-shadow: none; }
            .rbc-toolbar button:hover { color: #f4f4f5; background: rgba(255,255,255,0.05); }
            .rbc-toolbar button.rbc-active { background: rgba(249,115,22,0.15); color: #fb923c; border: none; }
            .rbc-month-view, .rbc-time-view { border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; overflow: hidden; background: rgba(255,255,255,0.01); }
            .rbc-day-bg + .rbc-day-bg, .rbc-month-row + .rbc-month-row, .rbc-header + .rbc-header, .rbc-header { border-color: rgba(255,255,255,0.04); }
            .rbc-header { padding: 10px 0; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.06em; color: #52525b; border-bottom: 1px solid rgba(255,255,255,0.04); }
            .rbc-time-content { border-color: rgba(255,255,255,0.04); }
            .rbc-timeslot-group { border-color: rgba(255,255,255,0.04); }
            .rbc-day-slot .rbc-time-slot { border-top: 1px solid rgba(255,255,255,0.02); }
            .rbc-today { background: rgba(249,115,22,0.04); }
            .rbc-current-time-indicator { background-color: #f97316; height: 2px; box-shadow: 0 0 8px #f97316; }
            .rbc-event { background: linear-gradient(135deg, #f97316, #a855f7); border: none; border-radius: 6px; padding: 2px 8px; box-shadow: 0 4px 12px rgba(168,85,247,0.25); transition: transform 0.15s, box-shadow 0.15s; }
            .rbc-event:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(168,85,247,0.35); }
            .rbc-event-content { font-size: 0.75rem; font-weight: 600; }
            .rbc-off-range-bg { background: rgba(0,0,0,0.25); }
            .rbc-time-gutter .rbc-timeslot-group { border-bottom: 1px solid rgba(255,255,255,0.04); }
            .rbc-time-header.rbc-overflowing { border-right-color: rgba(255,255,255,0.04); }
          `}} />
          
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month', 'week', 'day']}
            defaultView="week"
          />
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <AddEventModal onClose={() => setShowModal(false)} onAdd={handleAddEvent} />
        )}
      </AnimatePresence>
    </div>
  );
}
