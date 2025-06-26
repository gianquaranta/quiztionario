const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

console.log('🔧 Starting Quiztionario Backend...');

const app = express();
const server = createServer(app);

// Configuración de CORS para Express
const allowedOrigins = [
  "http://localhost:3000",
  "https://quiztionario.vercel.app",
  "https://quiztionario-git-main-gianquarantas-projects.vercel.app",
  "https://quiztionario-*-gianquarantas-projects.vercel.app"
];

// CORS middleware más permisivo para debug
app.use(cors({
  origin: true, // Temporalmente permitir todos los orígenes para debug
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware básico
app.use(express.json());
app.use(express.static('public'));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  
  if (req.path.includes('socket.io')) {
    console.log('🔍 Socket.IO request detected');
    console.log('User-Agent:', req.get('User-Agent'));
    console.log('Origin:', req.get('Origin'));
  }
  next();
});

// Configurar Socket.IO con configuración más básica
const io = new Server(server, {
  cors: {
    origin: true, // Temporalmente permitir todos para debug
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true,
  transports: ['polling', 'websocket'], // Polling primero
  path: '/socket.io/'
});

console.log('✅ Socket.IO configured');

// Rutas básicas
app.get('/', (req, res) => {
  res.json({
    message: 'Quiztionario Backend - Socket.IO Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    socketIO: {
      path: '/socket.io/',
      available: true,
      transports: ['polling', 'websocket']
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    socketIO: {
      initialized: !!io,
      path: io.path(),
      connectedClients: io.engine.clientsCount || 0
    }
  });
});

// Página de test simplificada
app.get('/test', (req, res) => {
  const serverUrl = `${req.protocol}://${req.get('host')}`;
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Socket.IO Test - Simple</title>
    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
</head>
<body>
    <h1>Socket.IO Connection Test</h1>
    <p>Server: ${serverUrl}</p>
    <div id="status">Testing...</div>
    <div id="logs"></div>
    
    <script>
        const logs = document.getElementById('logs');
        const status = document.getElementById('status');
        
        function log(msg) {
            const div = document.createElement('div');
            div.textContent = new Date().toLocaleTimeString() + ': ' + msg;
            logs.appendChild(div);
            console.log(msg);
        }
        
        log('Attempting connection to: ${serverUrl}');
        
        const socket = io('${serverUrl}', {
            transports: ['polling', 'websocket'],
            upgrade: true,
            timeout: 10000
        });
        
        socket.on('connect', () => {
            status.textContent = '✅ Connected: ' + socket.id;
            status.style.color = 'green';
            log('Connected successfully');
        });
        
        socket.on('connect_error', (error) => {
            status.textContent = '❌ Error: ' + error.message;
            status.style.color = 'red';
            log('Connection error: ' + error.message);
        });
        
        socket.on('disconnect', () => {
            status.textContent = '❌ Disconnected';
            status.style.color = 'orange';
            log('Disconnected');
        });
    </script>
</body>
</html>
  `);
});

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
  
  // Ping test
  socket.on('ping', (data) => {
    socket.emit('pong', data);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO path: /socket.io/`);
  console.log(`🧪 Test page: http://localhost:${PORT}/test`);
});
