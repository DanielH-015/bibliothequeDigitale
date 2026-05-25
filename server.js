import { app } from './src/app.js';
import { dbConfig } from './src/config/database.js';
import { GLOBAL_CONFIG } from './src/config/env.js';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

class Server {
  constructor() {
    this.port = GLOBAL_CONFIG.PORT;
    
    // First Create a native HTTP server wrapping the Express app
    this.httpServer = http.createServer(app);
    
    // Second Initialize Socket.io with CORS enabled for our frontends
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: "*", 
        methods: ["GET", "POST"]
      }
    });
    
    // Listen for real-time WebSocket connections
    this.io.on('connection', (socket) => {
      console.log(' New client connected via Socket.io:', socket.id);
      
      // Admin Dashboard joins its specific room to receive isolated scans
      socket.on('join-admin-room', (adminId) => {
        if (adminId) {
          socket.join(`admin_${adminId}`);
          console.log(` Socket ${socket.id} joined room admin_${adminId}`);
        }
      });
      
      // Listen for the specific 'mobile-scan' event coming from Flutter
      socket.on('mobile-scan', (data) => {
        console.log(' Mobile scan received:', data);
        
        // If the mobile app provides the logged-in adminId, route it only to that admin's dashboard
        if (data && data.adminId) {
          this.io.to(`admin_${data.adminId}`).emit('scan-received', data);
          console.log(` Scan routed securely to room admin_${data.adminId}`);
        } else {
          // Fallback (for older versions or testing without adminId)
          this.io.emit('scan-received', data);
        }
      });

      socket.on('disconnect', () => {
        console.log(' Client disconnected:', socket.id);
      });
    });
  }

  async start() {
    // Connect to Prisma/Database
    await dbConfig.connect();

    // We use this.httpServer.listen() instead of app.listen() now!
    this.httpServer.listen(this.port, () => {
      console.log(` Server is running on http://localhost:${this.port}`);
      console.log(` Socket.io is ready for real-time connections`);
    });
  }
}

// Official start of the server
const server = new Server();
server.start();
