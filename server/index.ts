import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as mediasoup from 'mediasoup';
import { types } from 'mediasoup';
import dotenv from 'dotenv';
import { config } from './mediasoup-config';
import { Room } from './Room';

dotenv.config({ path: '../.env.local' });
dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

let worker: types.Worker;
const rooms: Map<string, Room> = new Map();

async function startMediasoup() {
  worker = await mediasoup.createWorker({
    logLevel: config.worker.logLevel as any,
    logTags: config.worker.logTags,
    rtcMinPort: config.worker.rtcMinPort,
    rtcMaxPort: config.worker.rtcMaxPort,
  });

  worker.on('died', () => {
    console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
    setTimeout(() => process.exit(1), 2000);
  });
  
  console.log(`[Mediasoup] Worker started [pid:${worker.pid}]`);
}

async function getOrCreateRoom(roomId: string): Promise<Room> {
  let room = rooms.get(roomId);
  if (!room) {
    const router = await worker.createRouter({ mediaCodecs: config.router.mediaCodecs });
    room = new Room(roomId, router);
    rooms.set(roomId, room);
    console.log(`[Mediasoup] Created Room: ${roomId}`);
  }
  return room;
}

startMediasoup().then(() => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Clean up when client disconnects
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      rooms.forEach((room) => {
        if (room.getPeer(socket.id)) {
          room.removePeer(socket.id);
          // Notify others in room
          socket.to(room.id).emit('peerClosed', { peerId: socket.id });
          if (room.peers.size === 0) {
            rooms.delete(room.id);
            room.router.close();
            console.log(`[Mediasoup] Room ${room.id} deleted (empty)`);
          }
        }
      });
    });

    socket.on('joinRoom', async ({ roomId, name, avatarUrl }, callback) => {
      const room = await getOrCreateRoom(roomId);
      room.addPeer(socket.id, name, avatarUrl);
      socket.join(roomId);
      
      const rtpCapabilities = room.router.rtpCapabilities;
      callback({ rtpCapabilities });
    });

    socket.on('createWebRtcTransport', async ({ roomId }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) throw new Error(`Room ${roomId} not found`);
        const peer = room.getPeer(socket.id);
        if (!peer) throw new Error(`Peer not found in room`);

        const transport = await room.createWebRtcTransport();
        peer.transports.set(transport.id, transport);

        callback({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        });
      } catch (err: any) {
        console.error(err);
        callback({ error: err.message });
      }
    });

    socket.on('connectTransport', async ({ roomId, transportId, dtlsParameters }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) throw new Error(`Room ${roomId} not found`);
        const peer = room.getPeer(socket.id);
        const transport = peer?.transports.get(transportId);
        if (!transport) throw new Error(`Transport ${transportId} not found`);
        
        await transport.connect({ dtlsParameters });
        callback({ success: true });
      } catch (err: any) {
        console.error(err);
        callback({ error: err.message });
      }
    });

    socket.on('produce', async ({ roomId, transportId, kind, rtpParameters, appData }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) throw new Error(`Room ${roomId} not found`);
        const peer = room.getPeer(socket.id);
        const transport = peer?.transports.get(transportId);
        if (!transport) throw new Error(`Transport ${transportId} not found`);

        const producer = await transport.produce({ kind, rtpParameters, appData });
        peer!.producers.set(producer.id, producer);

        // Notify others in the room
        socket.to(roomId).emit('newProducer', {
          producerId: producer.id,
          peerId: socket.id,
          peerName: peer!.name,
          peerAvatarUrl: peer!.avatarUrl,
          appData
        });

        callback({ id: producer.id });
      } catch (err: any) {
        console.error(err);
        callback({ error: err.message });
      }
    });

    socket.on('consume', async ({ roomId, transportId, producerId, rtpCapabilities }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) throw new Error(`Room ${roomId} not found`);
        const peer = room.getPeer(socket.id);
        const transport = peer?.transports.get(transportId);
        if (!transport) throw new Error(`Transport ${transportId} not found`);

        if (!room.router.canConsume({ producerId, rtpCapabilities })) {
          throw new Error(`Cannot consume producer ${producerId}`);
        }

        const consumer = await transport.consume({
          producerId,
          rtpCapabilities,
          paused: false,
        });

        peer!.consumers.set(consumer.id, consumer);

        consumer.on('transportclose', () => {
          peer!.consumers.delete(consumer.id);
        });

        consumer.on('producerclose', () => {
          peer!.consumers.delete(consumer.id);
          socket.emit('producerClosed', { producerId });
        });

        callback({
          id: consumer.id,
          producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });
      } catch (err: any) {
        console.error(err);
        callback({ error: err.message });
      }
    });

    socket.on('getProducers', ({ roomId }, callback) => {
      const room = rooms.get(roomId);
      if (!room) return callback([]);

      const producerList: any[] = [];
      room.peers.forEach((p) => {
        if (p.id === socket.id) return;
        p.producers.forEach((producer) => {
          producerList.push({
            producerId: producer.id,
            peerId: p.id,
            peerName: p.name,
            peerAvatarUrl: p.avatarUrl,
            appData: producer.appData
          });
        });
      });
      callback(producerList);
    });

    socket.on('closeProducer', ({ roomId, producerId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const peer = room.getPeer(socket.id);
      if (!peer) return;

      const producer = peer.producers.get(producerId);
      if (producer) {
        producer.close();
        peer.producers.delete(producerId);
        socket.to(roomId).emit('producerClosed', { producerId });
      }
    });
  });

  const PORT = process.env.SOCKET_PORT || 3001;
  server.listen(PORT, () => {
    console.log(`[Mediasoup] SFU WebSocket server listening on port ${PORT}`);
  });
});
