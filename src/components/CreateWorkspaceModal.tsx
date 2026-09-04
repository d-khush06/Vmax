import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Users } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useTeam } from '@/lib/team-context';

export default function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
  const { user } = useUser();
  const router = useRouter();
  const { switchTeam } = useTeam();
  const createTeam = useMutation(api.teams.create);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [joinCode, setJoinCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setLoading(true);
    try {
      const result = await createTeam({ name: name.trim(), clerkId: user.id });
      switchTeam(result._id);
      setJoinCode(result.joinCode);
      setStep(2);
    } catch (err: any) {
      alert("Failed to create workspace: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinCode);
    alert('Join code copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-[60px] border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h3 className="font-semibold text-white text-lg tracking-wide flex items-center gap-2">
            <Users size={18} className="text-blue-400" /> Workspace Created
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        {step === 1 ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Workspace Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp"
                autoFocus
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
              />
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
                disabled={!name.trim() || loading}
                className="flex-1 py-3 bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40 hover:bg-blue-600 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                Create
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-sm text-white/70 mb-4">Share this code with your team to invite them.</p>
              <div className="text-3xl font-mono font-bold tracking-[0.2em] text-blue-400 mb-6">
                {joinCode}
              </div>
              <button
                onClick={copyToClipboard}
                className="w-full py-3 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/10"
              >
                Copy to Clipboard
              </button>
            </div>
            <button
              onClick={() => {
                onClose();
                router.push('/world');
              }}
              className="w-full py-3 bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all hover:bg-blue-600 shadow-lg shadow-blue-500/25"
            >
              Enter Workspace
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
