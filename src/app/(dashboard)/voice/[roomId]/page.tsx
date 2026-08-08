"use client";

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Device } from 'mediasoup-client';
import { useTeam } from '@/lib/team-context';
import { useUser } from '@clerk/nextjs';
import { Mic, MicOff, MonitorUp, PhoneOff, Video, VideoOff, Maximize, Minimize } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VoiceRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const [hasJoined, setHasJoined] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [camEnabled, setCamEnabled] = useState(false);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [maximizedUser, setMaximizedUser] = useState<string | null>(null);
  
  const { team } = useTeam();
  const { user } = useUser();
  const router = useRouter();
  
  const { roomId: rawRoomId } = React.use(params);
  const roomId = rawRoomId || 'general';
  const username = user?.fullName || user?.firstName || 'User';
  
  const socketRef = useRef<Socket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<any>(null);
  const recvTransportRef = useRef<any>(null);
  
  // Local producers
  const micProducerRef = useRef<any>(null);
  const camProducerRef = useRef<any>(null);
  const screenProducerRef = useRef<any>(null);

  const [localCamTrack, setLocalCamTrack] = useState<any>(null);
  const [localScreenTrack, setLocalScreenTrack] = useState<any>(null);
  const [peers, setPeers] = useState<{ id: string, name: string, audioTrack?: any, videoTrack?: any, screenTrack?: any }[]>([]);
  
  const joinRoom = async () => {
    setHasJoined(true);
  };

  const leaveRoom = () => {
    setHasJoined(false);
    socketRef.current?.disconnect();
    
    // Stop local tracks
    [micProducerRef, camProducerRef, screenProducerRef].forEach(ref => {
      if (ref.current) {
        ref.current.track?.stop();
        ref.current.close();
        ref.current = null;
      }
    });

    setLocalCamTrack(null);
    setLocalScreenTrack(null);

    setMicEnabled(false);
    setCamEnabled(false);
    setScreenEnabled(false);
    setPeers([]);
    
    router.push('/chat');
  };

  useEffect(() => {
    if (!hasJoined) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinRoom', { roomId, name: username, avatarUrl: user?.imageUrl }, async (response: any) => {
        if (response.error) {
          console.error('Failed to join room:', response.error);
          return;
        }
        
        if (response.peers) {
          setPeers(response.peers);
        }

        const device = new Device();
        deviceRef.current = device;
        await device.load({ routerRtpCapabilities: response.rtpCapabilities });

        // Init Send Transport
        socket.emit('createWebRtcTransport', { roomId }, async (params: any) => {
          if (params.error) return console.error(params.error);
          
          const sendTransport = device.createSendTransport(params);
          sendTransportRef.current = sendTransport;
          
          sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
            socket.emit('connectTransport', { roomId, transportId: sendTransport.id, dtlsParameters }, (res: any) => {
              if (res.error) errback(new Error(res.error));
              else callback();
            });
          });

          sendTransport.on('produce', async (parameters, callback, errback) => {
            socket.emit('produce', {
              roomId,
              transportId: sendTransport.id,
              kind: parameters.kind,
              rtpParameters: parameters.rtpParameters,
              appData: parameters.appData,
            }, (res: any) => {
              if (res.error) errback(new Error(res.error));
              else callback({ id: res.id });
            });
          });
        });

        // Init Recv Transport
        socket.emit('createWebRtcTransport', { roomId }, async (params: any) => {
          if (params.error) return console.error(params.error);

          const recvTransport = device.createRecvTransport(params);
          recvTransportRef.current = recvTransport;
          
          recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
            socket.emit('connectTransport', { roomId, transportId: recvTransport.id, dtlsParameters }, (res: any) => {
              if (res.error) errback(new Error(res.error));
              else callback();
            });
          });

          // Get existing producers
          socket.emit('getProducers', { roomId }, (producers: any[]) => {
            producers.forEach(p => consumeProducer(p));
          });
        });
      });
    });

    socket.on('newPeer', (peerInfo: any) => {
      setPeers(prev => {
        if (prev.find(p => p.id === peerInfo.id)) return prev;
        return [...prev, peerInfo];
      });
    });

    socket.on('peerClosed', ({ peerId }: any) => {
      setPeers(prev => prev.filter(p => p.id !== peerId));
    });

    socket.on('newProducer', (producerInfo: any) => {
      consumeProducer(producerInfo);
    });

    socket.on('producerClosed', ({ producerId }: any) => {
      setPeers(prev => prev.map(p => {
        let np = { ...p };
        if (np.audioTrack?.producerId === producerId) np.audioTrack = undefined;
        if (np.videoTrack?.producerId === producerId) np.videoTrack = undefined;
        if (np.screenTrack?.producerId === producerId) np.screenTrack = undefined;
        return np;
      }).filter(p => p.audioTrack || p.videoTrack || p.screenTrack));
    });

    socket.on('peerClosed', ({ peerId }: any) => {
      setPeers(prev => prev.filter(p => p.id !== peerId));
    });

    return () => {
      socket.disconnect();
    };
  }, [hasJoined, roomId, username]);

  const consumeProducer = async (producerInfo: any) => {
    const { producerId, peerId, peerName, peerAvatarUrl, appData } = producerInfo;
    const device = deviceRef.current;
    const recvTransport = recvTransportRef.current;
    const socket = socketRef.current;
    if (!device || !recvTransport || !socket) return;

    socket.emit('consume', {
      roomId,
      transportId: recvTransport.id,
      producerId,
      rtpCapabilities: device.rtpCapabilities
    }, async (res: any) => {
      if (res.error) return console.error(res.error);

      const consumer = await recvTransport.consume({
        id: res.id,
        producerId: res.producerId,
        kind: res.kind,
        rtpParameters: res.rtpParameters,
      });

      const track = consumer.track;
      
      setPeers(prev => {
        const existing: any = prev.find(p => p.id === peerId) || { id: peerId, name: peerName, avatarUrl: peerAvatarUrl };
        const others = prev.filter(p => p.id !== peerId);
        
        if (appData.type === 'audio') existing.audioTrack = { track, producerId };
        if (appData.type === 'video') existing.videoTrack = { track, producerId };
        if (appData.type === 'screen') existing.screenTrack = { track, producerId };
        
        return [...others, existing];
      });
    });
  };

  const toggleMic = async () => {
    if (!sendTransportRef.current) return;
    if (micEnabled && micProducerRef.current) {
      micProducerRef.current.track?.stop();
      micProducerRef.current.close();
      socketRef.current?.emit('closeProducer', { roomId, producerId: micProducerRef.current.id });
      setMicEnabled(false);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const track = stream.getAudioTracks()[0];
      micProducerRef.current = await sendTransportRef.current.produce({ track, appData: { type: 'audio' } });
      setMicEnabled(true);
    } catch (e: any) { 
      if (e.name === 'NotAllowedError') {
        alert("Microphone permission was denied. Please allow access in your browser settings.");
      } else {
        console.warn("Failed to get microphone:", e);
      }
    }
  };

  const toggleCam = async () => {
    if (!sendTransportRef.current) return;
    if (camEnabled && camProducerRef.current) {
      camProducerRef.current.track?.stop();
      camProducerRef.current.close();
      socketRef.current?.emit('closeProducer', { roomId, producerId: camProducerRef.current.id });
      setLocalCamTrack(null);
      setCamEnabled(false);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      const track = stream.getVideoTracks()[0];
      camProducerRef.current = await sendTransportRef.current.produce({ track, appData: { type: 'video' } });
      setLocalCamTrack(track);
      setCamEnabled(true);
    } catch (e: any) { 
      if (e.name === 'NotAllowedError') {
        alert("Camera permission was denied. Please allow access in your browser settings.");
      } else {
        console.warn("Failed to get camera:", e);
      }
    }
  };

  const toggleScreen = async () => {
    if (!sendTransportRef.current) return;
    if (screenEnabled && screenProducerRef.current) {
      screenProducerRef.current.track?.stop();
      screenProducerRef.current.close();
      socketRef.current?.emit('closeProducer', { roomId, producerId: screenProducerRef.current.id });
      setLocalScreenTrack(null);
      setScreenEnabled(false);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      screenProducerRef.current = await sendTransportRef.current.produce({ track, appData: { type: 'screen' } });
      setLocalScreenTrack(track);
      
      track.onended = () => { toggleScreen(); }; // User stopped sharing via browser button
      setScreenEnabled(true);
    } catch (e: any) { 
      if (e.name === 'NotAllowedError') {
        alert("Screen sharing permission was denied or cancelled.");
      } else {
        console.warn("Failed to share screen:", e);
      }
    }
  };

  if (!hasJoined) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6 relative bg-[#030303]">
        <div className="max-w-md w-full bg-[#0a0a0a] rounded-3xl p-10 border border-white/5 shadow-2xl text-center">
          <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mic size={32} className="text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Join Voice Room</h2>
          <p className="text-gray-400 text-sm mb-8">Connect with your team in real-time. Start with your mic and camera off.</p>
          <button 
            onClick={joinRoom}
            className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)]"
          >
            Join Room Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col p-4 bg-[#030303] relative overflow-hidden">
      
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
            {team?.name || 'General'} Voice
          </h2>
        </div>
        <div className="flex gap-2">
           <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-gray-400 border border-white/10">
             {peers.length + 1} participant{peers.length + 1 !== 1 ? 's' : ''}
           </span>
        </div>
      </div>

      {/* Media Grid */}
      <MediaGrid 
        localCamTrack={localCamTrack} 
        localScreenTrack={localScreenTrack} 
        camEnabled={camEnabled}
        screenEnabled={screenEnabled}
        micEnabled={micEnabled}
        username={username}
        userImageUrl={user?.imageUrl}
        peers={peers}
        maximizedUser={maximizedUser}
        setMaximizedUser={setMaximizedUser}
      />

      {/* Control Bar */}
      <div className="h-24 mt-4 bg-[#0a0a0a] rounded-3xl border border-white/5 flex items-center justify-center gap-4 shadow-xl">
        <button 
          onClick={toggleMic}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${micEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
        >
          {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button 
          onClick={toggleCam}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${camEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
        >
          {camEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button 
          onClick={toggleScreen}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${screenEnabled ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
        >
          <MonitorUp size={20} />
        </button>
        
        <div className="w-px h-8 bg-white/10 mx-2"></div>
        
        <button 
          onClick={leaveRoom}
          className="px-6 h-12 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all"
        >
          <PhoneOff size={18} />
          Leave
        </button>
      </div>

    </div>
  );
}

function VideoPlayer({ track, isScreen, isLocal }: { track: any, isScreen?: boolean, isLocal?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && track) {
      ref.current.srcObject = new MediaStream([track]);
    }
  }, [track]);
  return <video ref={ref} autoPlay playsInline muted={isLocal} className={`w-full h-full ${isScreen ? 'object-contain bg-black' : 'object-cover'} ${isLocal && !isScreen ? 'scale-x-[-1]' : ''}`} />;
}

function AudioPlayer({ track }: { track: any }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current && track) {
      ref.current.srcObject = new MediaStream([track]);
    }
  }, [track]);
  return <audio ref={ref} autoPlay playsInline />;
}

function MediaGrid({ 
  localCamTrack, localScreenTrack, camEnabled, screenEnabled, micEnabled, username, userImageUrl, peers, maximizedUser, setMaximizedUser
}: any) {
  const tiles: { id: string, content: React.ReactNode, isScreen?: boolean }[] = [];

  // Local Video
  tiles.push({
    id: 'local-video',
    content: (
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/40 border border-white/5 group">
        {camEnabled && localCamTrack ? (
          <VideoPlayer track={localCamTrack} isLocal={true} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#111] to-black">
             {userImageUrl ? (
               <img src={userImageUrl} alt={username} className="w-24 h-24 rounded-full border-2 border-teal-500/20 object-cover" />
             ) : (
               <div className="w-20 h-20 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-2xl font-bold border border-teal-500/20">
                 {username.charAt(0)}
               </div>
             )}
          </div>
        )}
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-sm font-medium flex items-center gap-2">
          {username} (You)
          {!micEnabled && <MicOff size={14} className="text-red-400" />}
        </div>
        <button onClick={() => setMaximizedUser(maximizedUser === 'local-video' ? null : 'local-video')} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
          {maximizedUser === 'local-video' ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>
    )
  });

  // Local Screen
  if (screenEnabled && localScreenTrack) {
    tiles.push({
      id: 'local-screen',
      isScreen: true,
      content: (
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/40 border border-white/5 group">
          <VideoPlayer track={localScreenTrack} isLocal={true} isScreen={true} />
          <div className="absolute top-4 left-4 bg-teal-500 text-white px-3 py-1 rounded-lg text-xs font-bold animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.5)]">
            You are sharing your screen
          </div>
          <button onClick={() => setMaximizedUser(maximizedUser === 'local-screen' ? null : 'local-screen')} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
            {maximizedUser === 'local-screen' ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      )
    });
  }

  // Peers
  peers.forEach((peer: any) => {
    tiles.push({
      id: `${peer.id}-video`,
      content: (
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/40 border border-white/5 group">
          {peer.videoTrack ? (
            <VideoPlayer track={peer.videoTrack.track} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#111] to-black">
               {peer.avatarUrl ? (
                 <img src={peer.avatarUrl} alt={peer.name} className="w-24 h-24 rounded-full border-2 border-blue-500/20 object-cover" />
               ) : (
                 <div className="w-20 h-20 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl font-bold border border-blue-500/20">
                   {peer.name.charAt(0)}
                 </div>
               )}
            </div>
          )}
          {peer.audioTrack && <AudioPlayer track={peer.audioTrack.track} />}
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-sm font-medium flex items-center gap-2">
            {peer.name}
            {!peer.audioTrack && <MicOff size={14} className="text-red-400" />}
          </div>
          <button onClick={() => setMaximizedUser(maximizedUser === `${peer.id}-video` ? null : `${peer.id}-video`)} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
            {maximizedUser === `${peer.id}-video` ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      )
    });

    if (peer.screenTrack) {
      tiles.push({
        id: `${peer.id}-screen`,
        isScreen: true,
        content: (
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black border border-white/5 group">
            <VideoPlayer track={peer.screenTrack.track} isScreen={true} />
            <div className="absolute top-4 left-4 bg-teal-500 text-white px-3 py-1 rounded-lg text-xs font-bold">
              {peer.name}'s Screen
            </div>
            <button onClick={() => setMaximizedUser(maximizedUser === `${peer.id}-screen` ? null : `${peer.id}-screen`)} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {maximizedUser === `${peer.id}-screen` ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        )
      });
    }
  });

  if (maximizedUser) {
    const mainTile = tiles.find(t => t.id === maximizedUser) || tiles[0];
    const sideTiles = tiles.filter(t => t.id !== mainTile.id);
    
    return (
      <div className="flex-1 min-h-0 bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 h-full min-w-0">
          {mainTile.content}
        </div>
        {sideTiles.length > 0 && (
          <div className="w-full md:w-64 flex-shrink-0 flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-y-auto pr-2 pb-2">
            {sideTiles.map(tile => (
              <div key={tile.id} className="w-48 md:w-full h-32 md:h-40 flex-shrink-0">
                {tile.content}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden p-4">
      <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
        {tiles.map(tile => (
          <div key={tile.id} className={tile.isScreen ? "lg:col-span-2" : ""}>
            {tile.content}
          </div>
        ))}
      </div>
    </div>
  );
}
