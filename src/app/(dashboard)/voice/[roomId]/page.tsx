"use client";

import { useEffect, useState } from 'react';
import { useTeam } from '@/lib/team-context';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
  DisconnectButton,
  useTrackToggle,
  VideoTrack
} from '@livekit/components-react';
import { Track, Participant } from 'livekit-client';
import '@livekit/components-styles';
import { Mic, ArrowRight, Video, MonitorUp, PhoneOff, MicOff, VideoOff, Users, SignalHigh, SignalMedium, SignalLow, Settings, MessageSquare, Maximize2 } from 'lucide-react';

function CustomGlassTile({ participant, trackRef, isMaximized, onToggleMaximize }: { participant: Participant, trackRef: any, isMaximized: boolean, onToggleMaximize: () => void }) {
  const isSpeaking = participant.isSpeaking;
  const connectionQuality = participant.connectionQuality;
  const isVideoEnabled = trackRef.publication?.track !== undefined;
  const isLocal = participant.isLocal;
  
  let avatarUrl = '';
  try {
    if (participant.metadata) {
      const meta = JSON.parse(participant.metadata);
      avatarUrl = meta.avatarUrl || '';
    }
  } catch (e) {}
  
  // Format the name nicely (removing 'anon_' prefix if present)
  let displayName = participant.name || participant.identity;
  if (displayName.startsWith('anon_')) displayName = 'Guest';
  
  return (
    <div className={`rounded-2xl overflow-hidden bg-white/[0.02] backdrop-blur-md relative group transition-all duration-300 border shadow-lg ${isSpeaking ? 'border-teal-400 shadow-[0_0_30px_rgba(45,212,191,0.2)]' : 'border-white/10 hover:border-white/20'} ${isMaximized ? 'w-full h-full' : 'w-full h-[300px]'}`}>
      
      {isVideoEnabled ? (
         <VideoTrack trackRef={trackRef} style={isLocal ? { transform: 'rotateY(0deg)' } : {}} className="w-full h-full object-cover" />
      ) : (
         <div className="w-full h-full flex flex-col items-center justify-center bg-black/20">
           {avatarUrl ? (
             <img src={avatarUrl} alt={displayName} className={`w-28 h-28 rounded-full border-2 object-cover shadow-inner ${isSpeaking ? 'border-teal-400' : 'border-white/10'}`} />
           ) : (
             <div className={`w-28 h-28 rounded-full border-2 flex items-center justify-center text-4xl font-bold text-gray-400 uppercase transition-colors shadow-inner ${isSpeaking ? 'border-teal-400/50 bg-teal-500/10 text-teal-400' : 'bg-white/5 border-white/10'}`}>
               {displayName.substring(0, 2)}
             </div>
           )}
         </div>
      )}
      
      {/* Maximize Button */}
      <button 
        onClick={onToggleMaximize}
        className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100 z-50"
      >
        <Maximize2 size={14} />
      </button>

      {/* Overlay details */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20">
         <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
           {isSpeaking ? <Mic size={14} className="text-teal-400 animate-pulse" /> : <MicOff size={14} className="text-red-400" />}
           <span className="text-xs font-semibold text-gray-200 truncate max-w-[120px]">{displayName}</span>
         </div>
         
         <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-sm">
            {connectionQuality === 'excellent' ? <SignalHigh size={14} className="text-teal-400" /> : 
             connectionQuality === 'good' ? <SignalMedium size={14} className="text-yellow-400" /> : 
             <SignalLow size={14} className="text-red-400" />}
         </div>
      </div>
    </div>
  );
}

function MicToggle() {
  const { toggle, enabled } = useTrackToggle({ source: Track.Source.Microphone });
  return (
    <button 
      onClick={() => toggle()}
      className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all shadow-sm ${enabled ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}
    >
      {enabled ? <Mic size={20} /> : <MicOff size={20} />}
    </button>
  );
}

function CameraToggle() {
  const { toggle, enabled } = useTrackToggle({ source: Track.Source.Camera });
  return (
    <button 
      onClick={() => toggle()}
      className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all shadow-sm ${enabled ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}
    >
      {enabled ? <Video size={20} /> : <VideoOff size={20} />}
    </button>
  );
}

function ScreenShareToggle() {
  const { toggle, enabled } = useTrackToggle({ source: Track.Source.ScreenShare });
  return (
    <button 
      onClick={() => toggle()}
      className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all shadow-sm ${enabled ? 'bg-teal-500/20 hover:bg-teal-500/30 border-teal-500/50 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)]' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'}`}
    >
      <MonitorUp size={20} />
    </button>
  );
}

function CustomVoiceUI({ roomName }: { roomName: string }) {
  const [maximizedTrackId, setMaximizedTrackId] = useState<string | null>(null);
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const maximizedTrack = tracks.find(t => t.participant.identity + t.source === maximizedTrackId);
  const otherTracks = tracks.filter(t => t.participant.identity + t.source !== maximizedTrackId);

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden">
      {/* Ambient Glass Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#121212]">
        <div className="absolute top-[20%] left-[10%] w-[60vw] h-[60vw] rounded-full bg-teal-500/10 blur-[130px] animate-pulse-slow" />
        <div className="absolute bottom-[20%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <header className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.01] backdrop-blur-xl relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
            <Mic size={20} className="text-teal-400" />
          </div>
          <div>
            <h2 className="text-gray-200 font-semibold flex items-center gap-2">
              #{roomName}
              <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-400 text-xs font-medium border border-teal-500/20">Active</span>
            </h2>
            <p className="text-gray-500 text-xs">Real-time voice and video</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden p-6 relative flex gap-6">
        {tracks.length === 0 ? (
           <div className="absolute inset-0 flex items-center justify-center text-gray-500">
             <div className="text-center">
               <Users size={48} className="mx-auto mb-4 opacity-20" />
               <p>Waiting for participants...</p>
             </div>
           </div>
        ) : maximizedTrackId && maximizedTrack ? (
           <>
             {/* Maximized Main View */}
             <div className="flex-1 h-full pb-20">
               <CustomGlassTile 
                 participant={maximizedTrack.participant} 
                 trackRef={maximizedTrack} 
                 isMaximized={true}
                 onToggleMaximize={() => setMaximizedTrackId(null)}
               />
             </div>
             {/* Sidebar for others */}
             <div className="w-[300px] h-full overflow-y-auto pb-20 flex flex-col gap-4 pr-2">
               {otherTracks.map((track) => (
                 <CustomGlassTile 
                   key={track.participant.identity + track.source} 
                   participant={track.participant} 
                   trackRef={track} 
                   isMaximized={false}
                   onToggleMaximize={() => setMaximizedTrackId(track.participant.identity + track.source)}
                 />
               ))}
             </div>
           </>
        ) : (
          <div className="w-full h-full flex items-center justify-center pb-20">
            <div className="w-full max-w-5xl grid gap-6 place-content-center" style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(280px, 320px))`
            }}>
              {tracks.map((track) => (
                <CustomGlassTile 
                  key={track.participant.identity + track.source} 
                  participant={track.participant} 
                  trackRef={track}
                  isMaximized={false}
                  onToggleMaximize={() => setMaximizedTrackId(track.participant.identity + track.source)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-black/50 backdrop-blur-3xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-50">
        <MicToggle />
        <CameraToggle />
        <ScreenShareToggle />
        
        <div className="w-px h-8 bg-white/10 mx-2"></div>

        <button className="w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
          <MessageSquare size={16} />
        </button>
        <button className="w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
          <Settings size={16} />
        </button>

        <div className="w-px h-8 bg-white/10 mx-2"></div>
        
        <DisconnectButton className="!w-auto !px-5 !py-2.5 !h-12 !rounded-xl !bg-red-500 hover:!bg-red-600 !border-0 !text-white flex items-center justify-center transition-all gap-2 font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] transform hover:scale-105">
          <PhoneOff size={16} />
          <span className="text-sm">Leave</span>
        </DisconnectButton>
      </div>
    </div>
  );
}

export default function VoiceRoomPage() {
  const [token, setToken] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const { team } = useTeam();
  const { user } = useUser();
  const router = useRouter();

  const roomName = team?.name ? `${team.name.toLowerCase().replace(/\s+/g, '-')}-voice` : 'general-voice';
  const username = user?.fullName || user?.firstName || 'User';
  const userId = user?.id || `anon_${Math.random()}`;
  const avatarUrl = user?.imageUrl || '';

  useEffect(() => {
    if (!hasJoined || !team) return;

    (async () => {
      try {
        const resp = await fetch(
          `/api/livekit?room=${roomName}&username=${encodeURIComponent(username)}&userId=${encodeURIComponent(userId)}&avatarUrl=${encodeURIComponent(avatarUrl)}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [hasJoined, team, roomName, username]);

  if (!hasJoined) {
    return (
      <div className="absolute inset-0 bg-[#121212]/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
        <div className="w-full max-w-sm bg-black/40 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-xl bg-teal-500/10 flex items-center justify-center mb-5 border border-teal-500/20">
            <Mic size={28} className="text-teal-400" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-200 mb-2 tracking-tight">Ready to join?</h2>
          <p className="text-gray-400 mb-8">
            You are about to join the <span className="text-gray-200 font-medium">#{roomName}</span> channel.
          </p>

          <button
            onClick={() => setHasJoined(true)}
            className="w-full py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-white font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2 group"
          >
            Join Voice <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={() => router.push('/tasks')}
            className="mt-4 text-sm font-medium text-gray-500 hover:text-teal-400 transition-colors"
          >
            Cancel and return
          </button>
        </div>
      </div>
    );
  }

  if (token === "") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-[#0a0a0c] z-50">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mb-4"></div>
        <p>Connecting to secure voice server...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col z-50 overflow-hidden" data-lk-theme="default">
      <LiveKitRoom
        video={false}
        audio={false}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        style={{ height: '100dvh', width: '100%', display: 'flex', flexDirection: 'column' }}
        onDisconnected={() => setHasJoined(false)}
      >
        <CustomVoiceUI roomName={roomName} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
