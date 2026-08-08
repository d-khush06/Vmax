import { types } from "mediasoup";

export const config = {
  // mediasoup Worker settings
  worker: {
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
    logLevel: "warn",
    logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"] as any[],
  },
  // mediasoup Router settings
  router: {
    mediaCodecs: [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: "video",
        mimeType: "video/VP8",
        clockRate: 90000,
        parameters: {
          "x-google-start-bitrate": 1000,
        },
      },
      {
        kind: "video",
        mimeType: "video/h264",
        clockRate: 90000,
        parameters: {
          "packetization-mode": 1,
          "profile-level-id": "42e01f",
          "level-asymmetry-allowed": 1,
        },
      },
    ] as types.RtpCodecCapability[],
  },
  // mediasoup WebRtcTransport settings
  webRtcTransport: {
    listenIps: [
      {
        ip: "0.0.0.0",
        announcedIp: "127.0.0.1", // Replace with public IP in production
      },
    ] as types.TransportListenIp[],
    maxIncomingBitrate: 1500000,
    initialAvailableOutgoingBitrate: 1000000,
  },
};
