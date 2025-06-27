const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

console.log('🔧 Initializing server...');

const app = express();
const server = createServer(app);

// Configuración de CORS para Express
const allowedOrigins = [
  "http://localhost:3000",
  "https://quiztionario.vercel.app",
  "https://quiztionario-git-main-gianquarantas-projects.vercel.app",
  "https://quiztionario-*-gianquarantas-projects.vercel.app"
];

// Configuración de Socket.IO PRIMERO - antes de cualquier middleware
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      console.log('🔍 Socket.IO CORS check for origin:', origin);
      // Permitir requests sin origin
      if (!origin) return callback(null, true);
      
      // Verificar si el origin está permitido
      if (allowedOrigins.includes(origin) || 
          origin.includes('vercel.app') || 
          origin.includes('localhost') ||
          origin.includes('koyeb.app')) {
        console.log('✅ Socket.IO CORS allowed for:', origin);
        return callback(null, true);
      }
      
      console.log('❌ Socket.IO CORS blocked for:', origin);
      callback(new Error('No permitido por CORS'));
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'], // Polling primero para Koyeb
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true,
  path: '/socket.io/',
  serveClient: true,
  cookie: false,
  // Configuraciones específicas para proxies (Koyeb)
  allowRequest: (req, fn) => {
    console.log('🔍 Socket.IO allowRequest check:', req.url);
    fn(null, true);
  }
});

console.log('🔧 Socket.IO initialized with path: /socket.io/');

// Configurar Express para confiar en proxies (importante para Koyeb)
app.set('trust proxy', true);

app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 CORS check for origin:', origin);
    // Permitir requests sin origin (como mobile apps o Postman)
    if (!origin) return callback(null, true);
    
    // Verificar si el origin está en la lista permitida o es un preview de Vercel
    if (allowedOrigins.includes(origin) || 
        origin.includes('vercel.app') || 
        origin.includes('localhost') ||
        origin.includes('koyeb.app')) {
      console.log('✅ CORS allowed for:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked for:', origin);
    callback(new Error('No permitido por CORS'));
  },
  credentials: true
}));

// Middleware para parsear JSON
app.use(express.json());

// Middleware para servir archivos estáticos si es necesario
app.use(express.static('public'));

// Middleware de logging para debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.path.includes('socket.io')) {
    console.log('🔍 Socket.IO request detected:', req.headers);
  }
  next();
});

// Middleware específico para debug de Socket.IO requests (ANTES de las rutas)
app.use('/socket.io/*', (req, res, next) => {
  console.log(`🔍 Socket.IO request: ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  next();
});

// Almacenamiento en memoria para los quizzes (en producción usa una base de datos)
const activeQuizzes = new Map();
const userRooms = new Map();

// Ruta de salud para verificar que el servidor funciona
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeQuizzes: activeQuizzes.size,
    connectedUsers: io.sockets.sockets.size,
    socketIOPath: '/socket.io/',
    environment: process.env.NODE_ENV || 'development',
    socketIOEngine: io.engine ? 'available' : 'unavailable'
  });
});

// Debug route para Socket.IO
app.get('/socket.io-debug', (req, res) => {
  res.json({
    socketIO: {
      initialized: !!io,
      engine: !!io.engine,
      path: io.path(),
      transports: io.engine ? Object.keys(io.engine.transports) : [],
      clientsCount: io.engine ? io.engine.clientsCount : 0,
      generateId: typeof io.engine?.generateId === 'function' ? 'available' : 'unavailable'
    },
    server: {
      address: server.address(),
      listening: server.listening
    }
  });
});

// Ruta para verificar Socket.IO específicamente
app.get('/socket-status', (req, res) => {
  res.json({
    socketIO: {
      status: 'initialized',
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      connected: io.sockets.sockets.size,
      cors: {
        enabled: true,
        origins: allowedOrigins
      }
    }
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'Quiztionario Backend Server',
    version: '1.0.0',
    status: 'running',
    socketIO: 'available at /socket.io',
    endpoints: {
      health: '/health',
      socket: '/socket.io',
      'socket-status': '/socket-status',
      test: '/test-socket'
    }
  });
});

// Ruta de prueba para Socket.IO
app.get('/test-socket', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Socket.IO Test - Koyeb</title>
        <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
            .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
            #logs { max-height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; }
            .log-entry { margin: 5px 0; padding: 5px; border-left: 3px solid #007bff; }
            button { padding: 10px 20px; margin: 5px; cursor: pointer; }
        </style>
    </head>
    <body>
        <h1>Socket.IO Connection Test - Koyeb Backend</h1>
        <div class="info">
            <p><strong>Server URL:</strong> ${req.protocol}://${req.get('host')}</p>
            <p><strong>Socket.IO Path:</strong> /socket.io/</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
        
        <div id="status" class="status info">Ready to test...</div>
        
        <button onclick="testConnection()">Test Connection</button>
        <button onclick="disconnect()">Disconnect</button>
        <button onclick="clearLogs()">Clear Logs</button>
        
        <h3>Connection Logs:</h3>
        <div id="logs"></div>
        
        <script>
            let socket;
            
            function addLog(message, type = 'info') {
                const div = document.createElement('div');
                div.className = 'log-entry';
                div.innerHTML = '<strong>' + new Date().toLocaleTimeString() + ':</strong> ' + message;
                if (type === 'error') div.style.borderLeftColor = '#dc3545';
                if (type === 'success') div.style.borderLeftColor = '#28a745';
                
                const logs = document.getElementById('logs');
                logs.appendChild(div);
                logs.scrollTop = logs.scrollHeight;
                console.log(message);
            }
            
            function updateStatus(message, type = 'info') {
                const status = document.getElementById('status');
                status.textContent = message;
                status.className = 'status ' + type;
            }
            
            function testConnection() {
                if (socket) {
                    socket.disconnect();
                }
                
                updateStatus('Connecting...', 'info');
                addLog('Attempting to connect to: ' + window.location.origin);
                
                socket = io(window.location.origin, {
                    transports: ['websocket', 'polling'],
                    timeout: 20000,
                    forceNew: true
                });
                
                socket.on('connect', () => {
                    updateStatus('✅ Connected: ' + socket.id, 'success');
                    addLog('Connected successfully with ID: ' + socket.id, 'success');
                    addLog('Transport: ' + socket.io.engine.transport.name, 'success');
                });
                
                socket.on('disconnect', (reason) => {
                    updateStatus('❌ Disconnected: ' + reason, 'error');
                    addLog('Disconnected. Reason: ' + reason, 'error');
                });
                
                socket.on('connect_error', (error) => {
                    updateStatus('❌ Connection Error: ' + error.message, 'error');
                    addLog('Connection error: ' + error.message, 'error');
                    addLog('Error details: ' + JSON.stringify(error), 'error');
                });
                
                socket.on('error', (error) => {
                    addLog('Socket error: ' + error, 'error');
                });
                
                // Test ping
                socket.on('connect', () => {
                    setTimeout(() => {
                        if (socket.connected) {
                            addLog('Testing ping...', 'info');
                            const start = Date.now();
                            socket.emit('ping', start);
                        }
                    }, 1000);
                });
                
                socket.on('pong', (timestamp) => {
                    const latency = Date.now() - timestamp;
                    addLog('Pong received. Latency: ' + latency + 'ms', 'success');
                });
            }
            
            function disconnect() {
                if (socket) {
                    socket.disconnect();
                    updateStatus('Manually disconnected', 'info');
                    addLog('Manual disconnect requested', 'info');
                }
            }
            
            function clearLogs() {
                document.getElementById('logs').innerHTML = '';
            }
            
            // Auto conectar al cargar
            window.onload = testConnection;
        </script>
    </body>
    </html>
  `);
});

// Funciones utilitarias
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function calculateScore(timeLeft, maxTime = 30) {
  const baseScore = 100;
  const timeBonus = Math.floor((timeLeft / maxTime) * 50);
  return baseScore + timeBonus;
}

// --- NUEVA LÓGICA DE SOCKET.IO ---
const sessionRooms = new Map(); // Almacena el profesor de cada sala: { [roomCode]: teacherSocketId }
const participantRooms = new Map(); // Almacena la sala de cada participante: { [socket.id]: roomCode }
const roomParticipants = new Map(); // Almacena la lista de participantes por sala: { [roomCode]: [participant] }

io.on('connection', (socket) => {
  console.log(`🔌 Usuario conectado: ${socket.id}`);

  // --- Eventos del Profesor ---

  socket.on('teacher-start-session', (roomCode, sessionId) => {
    console.log(`👨‍🏫 Profesor ${socket.id} inició sesión en sala ${roomCode}`);
    socket.join(roomCode);
    sessionRooms.set(roomCode, socket.id);
    participantRooms.set(socket.id, roomCode);
    roomParticipants.set(roomCode, []); // Inicializar lista de participantes
  });

  const handleTeacherEvent = (eventName, handler) => {
    socket.on(eventName, (roomCode, ...args) => {
      if (sessionRooms.get(roomCode) === socket.id) {
        console.log(`📢 Profesor ${socket.id} emitió ${eventName} en sala ${roomCode}`);
        handler(roomCode, ...args);
      } else {
        console.warn(`⚠️ Intento no autorizado de ${eventName} por ${socket.id} en sala ${roomCode}`);
      }
    });
  };

  handleTeacherEvent('teacher-start-question', (roomCode, data) => {
    // Explicitly add the roomCode to the payload for the client
    const payload = {
      ...data,
      sessionCode: roomCode
    };
    io.to(roomCode).emit('question-started', payload);
    console.log(`❓ Pregunta iniciada en ${roomCode}:`, data.question.question_text);
  });

  handleTeacherEvent('teacher-pause-question', (roomCode) => {
    io.to(roomCode).emit('question-ended'); // Reutilizamos este evento para pausar
    console.log(`⏸️ Pregunta pausada en ${roomCode}`);
  });

  handleTeacherEvent('teacher-end-question', (roomCode) => {
    io.to(roomCode).emit('question-ended');
    console.log(`🛑 Pregunta finalizada en ${roomCode}`);
  });

  handleTeacherEvent('teacher-award-points', (roomCode, participantId, totalPoints) => {
    const participants = roomParticipants.get(roomCode) || [];
    const participant = participants.find(p => p.id === participantId);

    if (participant) {
      participant.total_points = totalPoints;
      roomParticipants.set(roomCode, participants);

      console.log(`🏆 Puntos actualizados para ${participant.student_name} en ${roomCode}: ${totalPoints}`);

      // Marcar la pregunta como cerrada definitivamente
      const currentQuestion = participants.find(p => p.current_question_id);
      if (currentQuestion) {
        currentQuestion.closedDefinitively = true;
      }

      // Notificar a todos de la lista actualizada
      io.to(roomCode).emit('participants-list', participants);
      io.to(roomCode).emit('question-closed-definitively', { questionId: currentQuestion?.id });

    } else {
      console.warn(`⚠️ No se encontró al participante ${participantId} para otorgar puntos en la sala ${roomCode}`);
    }
  });

  handleTeacherEvent('teacher-end-session', (roomCode) => {
    const participants = roomParticipants.get(roomCode) || [];

    // Calcular el ganador
    const winner = participants.sort((a, b) => b.total_points - a.total_points)[0]?.student_name || null;

    io.to(roomCode).emit('session-ended', { reason: 'El profesor ha finalizado la sesión.', winner });
    console.log(`🏁 Sesión finalizada en ${roomCode}. Ganador: ${winner}`);
    
    participants.forEach(p => {
        const participantSocket = io.sockets.sockets.get(p.socketId);
        if(participantSocket) {
            participantSocket.leave(roomCode);
        }
        participantRooms.delete(p.socketId);
    });
    roomParticipants.delete(roomCode);
    sessionRooms.delete(roomCode);
  });

  // Nuevo evento para cerrar preguntas definitivamente
  handleTeacherEvent('teacher-close-question-definitively', (roomCode, questionId) => {
    const participants = roomParticipants.get(roomCode) || [];

    // Emitir evento a todos los participantes
    io.to(roomCode).emit('question-closed-definitively', { questionId });
    console.log(`🛑 Pregunta ${questionId} cerrada definitivamente en sala ${roomCode}`);

    // Actualizar estado local si es necesario
    participants.forEach((participant) => {
      const participantSocket = io.sockets.sockets.get(participant.socketId);
      if (participantSocket) {
        participantSocket.emit('question-closed-definitively', { questionId });
      }
    });
  });

  // --- Eventos del Estudiante ---

  socket.on('join-session', (data) => {
    const { sessionCode, participantId, studentName } = data;
    console.log(`🎓 Estudiante ${studentName} (${socket.id}) intentando unirse a ${sessionCode}`);

    if (sessionRooms.has(sessionCode)) {
      socket.join(sessionCode);
      participantRooms.set(socket.id, sessionCode);

      const participants = roomParticipants.get(sessionCode) || [];
      const existingParticipantIndex = participants.findIndex(p => p.id === participantId);

      if (existingParticipantIndex !== -1) {
        // El participante se está reconectando
        participants[existingParticipantIndex].is_connected = true;
        participants[existingParticipantIndex].socketId = socket.id;
        console.log(`🔄 ${studentName} se ha reconectado a la sala ${sessionCode}.`);
      } else {
        // Nuevo participante
        const newParticipant = {
          id: participantId,
          socketId: socket.id,
          student_name: studentName,
          total_points: 0,
          is_connected: true,
          joined_at: new Date().toISOString()
        };
        participants.push(newParticipant);
        console.log(`✅ ${studentName} se unió a la sala ${sessionCode}.`);
      }

      roomParticipants.set(sessionCode, participants);

      // Notificar a todos en la sala (profesor y otros estudiantes)
      io.to(sessionCode).emit('participants-list', participants);
      console.log(`📢 Lista de participantes actualizada enviada a la sala ${sessionCode}. Total: ${participants.length}`);

    } else {
      console.log(`❌ Sala ${sessionCode} no encontrada para ${studentName}`);
      socket.emit('error', { message: 'La sesión no existe o no ha sido iniciada por el profesor.' });
    }
  });

  socket.on('student-response', (roomCode, responseData) => {
    const teacherSocketId = sessionRooms.get(roomCode);
    if (teacherSocketId) {
      console.log(`📨 Respuesta de ${responseData.participant?.student_name} enviada al profesor en sala ${roomCode}`);
      io.to(teacherSocketId).emit('new-response', responseData);
    }
  });


  // --- Eventos Generales ---

  socket.on('debug-rooms', () => {
    console.log('🔍 DEBUG: Sockets y Salas:', {
      participantRooms: Array.from(participantRooms.entries()),
      sessionRooms: Array.from(sessionRooms.entries()),
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Usuario desconectado: ${socket.id}`);
    const roomCode = participantRooms.get(socket.id);

    if (roomCode) {
      // ¿Era el profesor?
      if (sessionRooms.get(roomCode) === socket.id) {
        console.log(`👨‍🏫 Profesor de la sala ${roomCode} se ha desconectado. Finalizando sesión.`);
        io.to(roomCode).emit('session-ended', { reason: 'El profesor se ha desconectado.' });
        
        const participants = roomParticipants.get(roomCode) || [];
        participants.forEach(p => {
          const participantSocket = io.sockets.sockets.get(p.socketId);
          if(participantSocket) {
            participantSocket.leave(roomCode);
          }
          participantRooms.delete(p.socketId);
        });
        roomParticipants.delete(roomCode);
        sessionRooms.delete(roomCode);

      } else {
        // Era un estudiante
        const participants = roomParticipants.get(roomCode) || [];
        const disconnectedParticipantIndex = participants.findIndex(p => p.socketId === socket.id);
        
        if (disconnectedParticipantIndex !== -1) {
          const disconnectedParticipant = participants[disconnectedParticipantIndex];
          console.log(`👋 Estudiante ${disconnectedParticipant.student_name} se ha desconectado de ${roomCode}`);
          
          participants[disconnectedParticipantIndex].is_connected = false;
          roomParticipants.set(roomCode, participants);
          
          io.to(roomCode).emit('participants-list', participants);
        }
      }
      participantRooms.delete(socket.id);
    }
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Frontend URL configurada: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
  console.log(`🔌 Socket.IO disponible en: http://localhost:${PORT}/socket.io/`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test Socket.IO: http://localhost:${PORT}/test-socket`);
  
  // Verificar que Socket.IO esté montado
  console.log('🔧 Verificando Socket.IO...');
  console.log('Socket.IO engine:', io.engine ? '✅ OK' : '❌ ERROR');
  console.log('Socket.IO path:', io.path());
  console.log('Socket.IO transports:', io.engine?.transports || 'unknown');
});

// Manejo de errores globales
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
