import { Server, Socket } from 'socket.io';
import { verifyToken } from '@clerk/backend';

// Extend Socket to attach the verified user payload
export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    claims: Record<string, any>;
  };
}

export const setupSocketSecurity = (io: Server) => {
  io.use(async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    try {
      // Extract the JWT from the handshake auth payload
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('VMAX_ERR_AUTH: NO_TOKEN_PROVIDED'));
      }

      // Cryptographically verify the token using Clerk's backend SDK
      const verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // Attach the user identity to the socket instance for subsequent events
      socket.user = {
        id: verifiedToken.sub,
        claims: verifiedToken,
      };

      console.log(`[VMAX_SYS] Access Granted: User ${socket.user.id} connected via secure socket.`);
      next();
    } catch (error) {
      console.error(`[VMAX_SYS] Access Denied: Invalid or expired JWT payload.`);
      next(new Error('VMAX_ERR_AUTH: INVALID_TOKEN_SIGNATURE'));
    }
  });
  
  // Connection handler (only reached if middleware passes)
  io.on('connection', (socket: AuthenticatedSocket) => {
     console.log(`[VMAX_SYS] Socket ${socket.id} joined.`);
     // Initialize Mediasoup transports, Yjs syncing, etc. here.
  });
};
