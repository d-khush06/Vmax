'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTeam } from '@/lib/team-context';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, MessageCircle, Users, Activity, Loader2, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export function LivingWorld() {
  const { team, onlineUsers, teammates, user } = useTeam();
  
  const incidents = useQuery(api.incidents.getActiveIncidents, team ? { teamId: team._id } : "skip");
  const reportIncident = useMutation(api.incidents.reportIncident);
  
  const campfires = useQuery(api.campfires.getActiveCampfires, team ? { teamId: team._id } : "skip");
  const igniteCampfire = useMutation(api.campfires.igniteCampfire);
  const extinguishCampfire = useMutation(api.campfires.extinguishCampfire);
  const resolveIncident = useMutation(api.incidents.resolveIncident);
  
  const tasks = useQuery(api.kanban.list, team ? { teamId: team._id } : "skip");
  
  const [showCampfireForm, setShowCampfireForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Compute Task Stats
  const todoCount = tasks?.filter((t: any) => t.status === 'todo').length || 0;
  const inProgressCount = tasks?.filter((t: any) => t.status === 'in_progress').length || 0;
  const doneCount = tasks?.filter((t: any) => t.status === 'done').length || 0;
  
  const taskDistribution = [
    { name: 'To Do', value: todoCount, color: '#f59e0b' }, // Yellow
    { name: 'In Progress', value: inProgressCount, color: '#3b82f6' }, // Blue
    { name: 'Done', value: doneCount, color: '#10b981' }, // Green
  ].filter(d => d.value > 0);

  // If no tasks exist, show a dummy distribution so the chart isn't empty
  const displayDistribution = taskDistribution.length > 0 ? taskDistribution : [
    { name: 'No Tasks', value: 1, color: '#ffffff20' }
  ];

  const velocityData = useMemo(() => {
    if (!tasks) return [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    
    tasks.forEach((t: any) => {
      // Assuming _creationTime is available on Convex documents
      if (t._creationTime) {
        const date = new Date(t._creationTime);
        counts[date.getDay()]++;
      }
    });

    // We want the chart to order days logically, maybe starting from Monday or just all 7 days
    return [
      { name: 'Mon', tasks: counts[1] },
      { name: 'Tue', tasks: counts[2] },
      { name: 'Wed', tasks: counts[3] },
      { name: 'Thu', tasks: counts[4] },
      { name: 'Fri', tasks: counts[5] },
      { name: 'Sat', tasks: counts[6] },
      { name: 'Sun', tasks: counts[0] },
    ];
  }, [tasks]);

  const handleReportIncident = async () => {
    if (!team) return;
    const severities = ["low", "medium", "high", "critical"];
    const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
    
    await reportIncident({
      teamId: team._id,
      title: `Random Incident ${Math.floor(Math.random() * 1000)}`,
      severity: randomSeverity
    });
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="w-full h-full p-8 overflow-y-auto hide-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Workspace Analytics</h1>
            <p className="text-white/60 text-sm">Real-time insights for <span className="text-white font-medium">{team?.name || 'Loading...'}</span></p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleReportIncident} 
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-white/70 hover:text-red-400 rounded-xl text-sm font-medium transition-all"
            >
              <AlertCircle size={16} /> Report Issue
            </button>
            <button 
              onClick={() => setShowCampfireForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/25"
            >
              <MessageCircle size={16} /> New Discussion
            </button>
          </div>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl"><Activity size={24} /></div>
              <span className="flex items-center text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded-lg"><TrendingUp size={14} className="mr-1" /> Active</span>
            </div>
            <h3 className="text-white/50 text-sm font-medium mb-1">Weekly Velocity</h3>
            <div className="text-3xl font-bold text-white">
              {tasks?.filter((t: any) => t._creationTime && t._creationTime >= Date.now() - 7 * 24 * 60 * 60 * 1000).length || 0} Tasks
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-green-500/20 text-green-400 rounded-2xl"><CheckCircle2 size={24} /></div>
              <span className="flex items-center text-xs font-semibold text-white/40 bg-white/5 px-2 py-1 rounded-lg">All time</span>
            </div>
            <h3 className="text-white/50 text-sm font-medium mb-1">Tasks Completed</h3>
            <div className="text-3xl font-bold text-white">{doneCount}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-500/20 text-orange-400 rounded-2xl"><MessageCircle size={24} /></div>
              <span className="flex items-center text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-1 rounded-lg"><TrendingDown size={14} className="mr-1" /> -4%</span>
            </div>
            <h3 className="text-white/50 text-sm font-medium mb-1">Active Discussions</h3>
            <div className="text-3xl font-bold text-white">{campfires?.length || 0}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl"><Users size={24} /></div>
              <div className="flex -space-x-2">
                 {teammates?.filter(tm => onlineUsers.includes(tm.clerkId)).slice(0, 3).map((tm, i) => (
                    <img key={i} src={tm.avatar_url || tm.avatarUrl || '/logo.png'} className="w-6 h-6 rounded-full border border-[#1c1c1e]" />
                 ))}
              </div>
            </div>
            <h3 className="text-white/50 text-sm font-medium mb-1">Online Now</h3>
            <div className="text-3xl font-bold text-white">{onlineUsers.length}</div>
          </motion.div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Velocity Area Chart */}
          <div className="col-span-1 lg:col-span-2 bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-6">Team Velocity</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#ffffff30" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff30" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#ffffff20', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Area type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Distribution Pie Chart */}
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl p-6 flex flex-col">
            <h2 className="text-lg font-bold text-white mb-2">Task Distribution</h2>
            <div className="flex-1 min-h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {displayDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#ffffff20', borderRadius: '12px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend overlay */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                 <div className="text-3xl font-bold text-white">{tasks?.length || 0}</div>
                 <div className="text-xs text-white/50 uppercase tracking-widest font-semibold">Total</div>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs font-medium text-white/70">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> To Do</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Progress</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Done</div>
            </div>
          </div>

        </div>

        {/* Lower Grid: Incidents & Campfires */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Active Incidents */}
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <AlertCircle size={20} className="text-red-400" /> Active Issues
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto hide-scrollbar pr-2">
              {!incidents ? (
                <div className="flex items-center gap-2 text-white/50"><Loader2 className="w-4 h-4 animate-spin" /> Loading issues...</div>
              ) : incidents.length === 0 ? (
                <div className="text-white/50 text-sm p-8 bg-white/5 rounded-2xl border border-white/5 text-center font-medium">No active issues. Looking good!</div>
              ) : (
                incidents.map(inc => (
                  <div key={inc._id} className={`flex items-center justify-between p-4 rounded-2xl border ${getSeverityColor(inc.severity)}`}>
                    <div>
                      <div className="font-semibold">{inc.metadata?.title || 'Unknown Incident'}</div>
                      <div className="text-xs opacity-70 mt-1 uppercase tracking-wider font-bold">{inc.severity}</div>
                    </div>
                    <button 
                      onClick={() => resolveIncident({ incidentId: inc._id })}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Campfires */}
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <MessageCircle size={20} className="text-blue-400" /> Active Discussions
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto hide-scrollbar pr-2">
              {!campfires ? (
                <div className="text-white/50 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading discussions...</div>
              ) : campfires.length === 0 ? (
                <div className="text-white/50 text-sm p-8 bg-white/5 rounded-2xl border border-white/5 text-center font-medium">No active discussions. Start a new thread for async collaboration.</div>
              ) : (
                campfires.map(cf => (
                  <div key={cf._id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group cursor-pointer">
                    <div>
                      <h3 className="font-bold text-blue-400 mb-1 group-hover:text-blue-300 transition-colors">{cf.title}</h3>
                      <p className="text-sm text-white/60 line-clamp-2">{cf.description}</p>
                    </div>
                    <button 
                      onClick={() => extinguishCampfire({ campfireId: cf._id })}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Resolve
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      <AnimatePresence>
        {showCampfireForm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 px-4"
          >
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#111111]/90 backdrop-blur-[60px] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl font-sans">
              <h2 className="font-bold text-white mb-2 text-xl tracking-tight">New Discussion</h2>
              <p className="text-sm text-white/50 mb-6">Start an asynchronous discussion thread. Great for topics that don't need immediate attention.</p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                const formData = new FormData(e.currentTarget);
                if (team && user) {
                  try {
                    await igniteCampfire({
                      teamId: team._id,
                      clerkId: user.id,
                      title: formData.get('title') as string,
                      description: formData.get('desc') as string,
                    });
                    setShowCampfireForm(false);
                  } finally {
                    setLoading(false);
                  }
                }
              }}>
                <input name="title" required placeholder="Topic Name" className="w-full bg-white/5 border border-white/10 rounded-xl text-white p-3 mb-4 outline-none focus:border-blue-500 focus:bg-white/10 text-sm transition-all" />
                <textarea name="desc" required placeholder="Description / Details" className="w-full bg-white/5 border border-white/10 rounded-xl text-white p-3 mb-6 h-28 outline-none focus:border-blue-500 focus:bg-white/10 text-sm transition-all resize-none" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCampfireForm(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium text-sm transition-colors">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Thread'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

