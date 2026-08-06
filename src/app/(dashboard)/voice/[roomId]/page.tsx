'use client';

import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Settings, Users, Maximize, UserPlus, Check, Link2, ArrowRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTeam } from '@/lib/team-context';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

function AudioWave({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-0.5 h-5">
      {[3, 5, 7, 5, 3].map((h, i) => (
        <span
          key={i}
          className={`w-1 rounded-full transition-all duration-200 ${active ? 'bg-green-400' : 'bg-gray-600'}`}
          style={{
            height: active ? `${h + Math.sin(Date.now() / 300 + i) * 3}px` : '4px',
            animation: active ? `bounce 0.8s ease-in-out ${i * 0.1}s infinite` : 'none',
          }}
        />
      ))}
    </div>
  );
}

export default function VoiceRoomPage() {
  const [hasJoined, setHasJoined] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [callTime, setCallTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const { team, teammates } = useTeam();
  const { user } = useUser();
  const router = useRouter();

  // Call timer
  useEffect(() => {
    if (!hasJoined) return;
    const timer = setInterval(() => setCallTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [hasJoined]);

  // Handle Video
  useEffect(() => {
    if (isVideoOn) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        setVideoStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }).catch(err => {
        console.error('Failed to get video stream', err);
        setIsVideoOn(false);
      });
    } else {
      if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
        setVideoStream(null);
      }
    }
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isVideoOn]);

  // Handle Screen Share
  useEffect(() => {
    if (isScreenSharing) {
      navigator.mediaDevices.getDisplayMedia({ video: true }).then(stream => {
        setScreenStream(stream);
        if (screenRef.current) {
          screenRef.current.srcObject = stream;
        }
        
        // Listen for user stopping screen share via browser UI
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      }).catch(err => {
        console.error('Failed to get screen stream', err);
        setIsScreenSharing(false);
      });
    } else {
      if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
        setScreenStream(null);
      }
    }
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isScreenSharing]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleInvite = () => {
    if (!team) return;
    const inviteText = `Join ${team.name} on VMAX! Code: ${team.joinCode}`;
    navigator.clipboard.writeText(inviteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEndCall = () => {
    setHasJoined(false);
    setCallTime(0);
    if (isMicOn) setIsMicOn(false);
    if (isVideoOn) setIsVideoOn(false);
    if (isScreenSharing) setIsScreenSharing(false);
  };

  const displayName = user?.fullName || user?.firstName || 'You';
  const avatarUrl = user?.imageUrl;
  const initials = displayName.substring(0, 2).toUpperCase();

  if (!hasJoined) {
    return (
      <div className="absolute inset-0 bg-transparent flex flex-col items-center justify-center z-50">
        <div className="w-full max-w-sm bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-600/20 flex items-center justify-center mb-5 border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.15)]">
            <Mic size={28} className="text-green-400" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Ready to join?</h2>
          <p className="text-gray-400 mb-8">
            You are about to join the <span className="text-white font-medium">#{team?.name ? `${team.name.toLowerCase().replace(/\s+/g, '-')}-voice` : 'general-voice'}</span> channel.
          </p>

          <button
            onClick={() => setHasJoined(true)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-base shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all flex items-center justify-center gap-2 group"
          >
            Join Voice <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={() => router.push('/kanban')}
            className="mt-4 text-sm font-medium text-gray-500 hover:text-white transition-colors"
          >
            Cancel and return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-transparent flex flex-col z-50">

      {/* ── Top Bar ── */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-white/5 bg-black/30 backdrop-blur-xl absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-green-500/20">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div>
            <span className="font-semibold text-sm text-gray-200">
              #{team?.name ? `${team.name.toLowerCase().replace(/\s+/g, '-')}-voice` : 'general-voice'}
            </span>
            <span className="text-xs text-gray-500 ml-2 font-mono">{formatTime(callTime)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleInvite}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors text-sm border border-white/10"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Link2 size={14} />}
            {copied ? 'Copied!' : 'Invite'}
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors">
            <Settings size={16} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors">
            <Maximize size={16} />
          </button>
        </div>
      </div>

      {/* ── Participant grid ── */}
      <div className="flex-1 flex items-center justify-center p-6 pt-20 pb-28 relative overflow-hidden">
        
        {/* Ambient glow */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-1000`}>
          <div className={`w-[50vw] h-[50vw] rounded-full blur-[150px] opacity-20 transition-all duration-1000 ${isMicOn ? 'bg-green-500/40' : isVideoOn ? 'bg-indigo-500/30' : 'bg-gray-800/20'}`} />
        </div>

        <div className="w-full h-full max-w-5xl flex gap-4 items-center justify-center">
          {/* My Tile */}
          <div className={`relative flex-1 max-w-xl aspect-video bg-[#0c0c0e] border rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-300 ${isMicOn ? 'border-green-500/30 shadow-green-500/10' : 'border-white/5'}`}>
            {isScreenSharing ? (
              <video ref={screenRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : isVideoOn ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
            ) : (
              <div className="flex flex-col items-center gap-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-24 h-24 rounded-full shadow-[0_0_30px_rgba(249,115,22,0.25)] border-2 border-white/10" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                    <span className="text-3xl font-bold text-white">{initials}</span>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-gray-200 font-medium">{displayName}</p>
                  <p className="text-gray-500 text-xs mt-1">{isMicOn ? 'Speaking...' : 'Camera off'}</p>
                </div>
                {isMicOn && <AudioWave active={true} />}
              </div>
            )}
            
            {/* Name tag */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-white flex items-center gap-2">
              {isMicOn ? <Mic size={11} className="text-green-400" /> : <MicOff size={11} className="text-red-400" />}
              {displayName} (You)
            </div>
          </div>

          {/* Other participants (teammates minus self) */}
          {teammates.slice(0, 3).map((tm: any) => (
            <div key={tm.id} className="relative flex flex-col items-center justify-center w-48 h-36 bg-[#0c0c0e] border border-white/5 rounded-2xl overflow-hidden shadow-xl opacity-50">
              <div className="flex flex-col items-center gap-2">
                {tm.avatar_url ? (
                  <img src={tm.avatar_url} alt={tm.full_name} className="w-14 h-14 rounded-full border border-white/10 grayscale" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-300">{tm.full_name?.substring(0, 2).toUpperCase() || '??'}</span>
                  </div>
                )}
                <p className="text-xs text-gray-400">{tm.full_name || 'Member'}</p>
                <p className="text-[10px] text-gray-600">Not in call</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Controls Bar ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-3 bg-black/70 backdrop-blur-2xl border border-white/10 px-5 py-3 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
          
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            title={isMicOn ? 'Mute mic' : 'Unmute mic'}
            className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20'}`}
          >
            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{isMicOn ? 'Mute' : 'Unmute'}</span>
          </button>

          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            title={isVideoOn ? 'Stop video' : 'Start video'}
            className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isVideoOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20'}`}
          >
            {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Camera</span>
          </button>

          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isScreenSharing ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-white/[0.06] hover:bg-white/10 text-gray-300'}`}
          >
            <MonitorUp size={20} />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Share screen</span>
          </button>

          <button
            onClick={() => {}}
            className="group relative w-12 h-12 rounded-xl flex items-center justify-center bg-white/[0.06] hover:bg-white/10 text-gray-300 transition-all"
          >
            <Users size={20} />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Participants</span>
          </button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          <button
            onClick={handleEndCall}
            className="w-16 h-12 rounded-xl flex items-center justify-center bg-red-600 hover:bg-red-500 active:bg-red-700 text-white transition-all shadow-[0_0_20px_rgba(220,38,38,0.35)]"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
