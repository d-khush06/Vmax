import * as mediasoup from "mediasoup";
import { types } from "mediasoup";
import { config } from "./mediasoup-config";

export interface Peer {
  id: string;
  name: string;
  avatarUrl?: string;
  transports: Map<string, types.WebRtcTransport>;
  producers: Map<string, types.Producer>;
  consumers: Map<string, types.Consumer>;
}

export class Room {
  id: string;
  router: types.Router;
  peers: Map<string, Peer>;
  
  constructor(id: string, router: types.Router) {
    this.id = id;
    this.router = router;
    this.peers = new Map();
  }

  addPeer(peerId: string, name: string, avatarUrl?: string): Peer {
    if (this.peers.has(peerId)) {
      return this.peers.get(peerId)!;
    }
    const peer: Peer = {
      id: peerId,
      name,
      avatarUrl,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
    };
    this.peers.set(peerId, peer);
    return peer;
  }

  getPeer(peerId: string): Peer | undefined {
    return this.peers.get(peerId);
  }

  removePeer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    
    for (const transport of peer.transports.values()) {
      transport.close();
    }
    this.peers.delete(peerId);
  }

  async createWebRtcTransport(): Promise<types.WebRtcTransport> {
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate, listenIps } = config.webRtcTransport;
    const transport = await this.router.createWebRtcTransport({
      listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate,
    });
    
    if (maxIncomingBitrate) {
      try {
        await transport.setMaxIncomingBitrate(maxIncomingBitrate);
      } catch (error) {}
    }
    return transport;
  }
}
