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

// Configuración de Socket.IO
io.on('connection', (socket) => {
  console.log(`🔌 Usuario conectado: ${socket.id}`);

  // Evento ping para testing
  socket.on('ping', (timestamp) => {
    socket.emit('pong', timestamp);
  });

  // Evento: Crear nuevo quiz (profesor)
  socket.on('create-quiz', (quizData) => {
    try {
      const roomCode = generateRoomCode();
      const quiz = {
        id: roomCode,
        title: quizData.title || 'Quiz sin título',
        questions: quizData.questions || [],
        createdBy: socket.id,
        currentQuestion: 0,
        status: 'waiting', // waiting, active, finished
        participants: new Map(),
        startTime: null,
        questionStartTime: null
      };

      activeQuizzes.set(roomCode, quiz);
      socket.join(roomCode);
      userRooms.set(socket.id, roomCode);

      socket.emit('quiz-created', { 
        roomCode, 
        quiz: {
          id: quiz.id,
          title: quiz.title,
          totalQuestions: quiz.questions.length,
          status: quiz.status
        }
      });

      console.log(`📝 Quiz creado: ${roomCode} por ${socket.id}`);
    } catch (error) {
      console.error('Error creating quiz:', error);
      socket.emit('error', { message: 'Error al crear el quiz' });
    }
  });

  // Evento: Unirse a quiz (estudiante)
  socket.on('join-quiz', (data) => {
    try {
      const { roomCode, playerName } = data;
      const quiz = activeQuizzes.get(roomCode);

      if (!quiz) {
        socket.emit('error', { message: 'Quiz no encontrado' });
        return;
      }

      if (quiz.status !== 'waiting') {
        socket.emit('error', { message: 'El quiz ya ha comenzado' });
        return;
      }

      // Verificar si el nombre ya existe
      const existingPlayer = Array.from(quiz.participants.values())
        .find(p => p.name.toLowerCase() === playerName.toLowerCase());

      if (existingPlayer) {
        socket.emit('error', { message: 'Ese nombre ya está en uso' });
        return;
      }

      const participant = {
        id: socket.id,
        name: playerName,
        score: 0,
        answers: [],
        joinedAt: new Date()
      };

      quiz.participants.set(socket.id, participant);
      socket.join(roomCode);
      userRooms.set(socket.id, roomCode);

      socket.emit('joined-quiz', { 
        roomCode, 
        playerName,
        quiz: {
          id: quiz.id,
          title: quiz.title,
          totalQuestions: quiz.questions.length,
          status: quiz.status
        }
      });

      // Notificar a todos en la sala sobre el nuevo participante
      const participantsList = Array.from(quiz.participants.values())
        .map(p => ({ name: p.name, score: p.score }));

      io.to(roomCode).emit('participants-updated', participantsList);

      console.log(`👤 ${playerName} se unió al quiz ${roomCode}`);
    } catch (error) {
      console.error('Error joining quiz:', error);
      socket.emit('error', { message: 'Error al unirse al quiz' });
    }
  });

  // Evento: Iniciar quiz (profesor)
  socket.on('start-quiz', (data) => {
    try {
      const { roomCode } = data;
      const quiz = activeQuizzes.get(roomCode);

      if (!quiz || quiz.createdBy !== socket.id) {
        socket.emit('error', { message: 'No tienes permisos para iniciar este quiz' });
        return;
      }

      if (quiz.participants.size === 0) {
        socket.emit('error', { message: 'No hay participantes en el quiz' });
        return;
      }

      quiz.status = 'active';
      quiz.currentQuestion = 0;
      quiz.startTime = new Date();
      quiz.questionStartTime = new Date();

      const currentQuestion = quiz.questions[0];
      const questionData = {
        questionNumber: 1,
        totalQuestions: quiz.questions.length,
        question: currentQuestion.question,
        options: currentQuestion.options,
        timeLimit: currentQuestion.timeLimit || 30
      };

      io.to(roomCode).emit('quiz-started', questionData);
      console.log(`🚀 Quiz ${roomCode} iniciado`);
    } catch (error) {
      console.error('Error starting quiz:', error);
      socket.emit('error', { message: 'Error al iniciar el quiz' });
    }
  });

  // Evento: Responder pregunta (estudiante)
  socket.on('submit-answer', (data) => {
    try {
      const { roomCode, answer, timeLeft } = data;
      const quiz = activeQuizzes.get(roomCode);

      if (!quiz || quiz.status !== 'active') {
        socket.emit('error', { message: 'Quiz no disponible' });
        return;
      }

      const participant = quiz.participants.get(socket.id);
      if (!participant) {
        socket.emit('error', { message: 'No estás registrado en este quiz' });
        return;
      }

      const currentQuestion = quiz.questions[quiz.currentQuestion];
      const isCorrect = answer === currentQuestion.correctAnswer;
      
      let points = 0;
      if (isCorrect) {
        points = calculateScore(timeLeft, currentQuestion.timeLimit || 30);
        participant.score += points;
      }

      participant.answers.push({
        questionIndex: quiz.currentQuestion,
        answer,
        isCorrect,
        points,
        timeLeft
      });

      socket.emit('answer-submitted', { 
        isCorrect, 
        points,
        correctAnswer: currentQuestion.correctAnswer
      });

      console.log(`💡 ${participant.name} respondió: ${answer} (${isCorrect ? 'Correcto' : 'Incorrecto'})`);
    } catch (error) {
      console.error('Error submitting answer:', error);
      socket.emit('error', { message: 'Error al enviar respuesta' });
    }
  });

  // Evento: Siguiente pregunta (profesor)
  socket.on('next-question', (data) => {
    try {
      const { roomCode } = data;
      const quiz = activeQuizzes.get(roomCode);

      if (!quiz || quiz.createdBy !== socket.id) {
        socket.emit('error', { message: 'No tienes permisos' });
        return;
      }

      quiz.currentQuestion++;

      if (quiz.currentQuestion >= quiz.questions.length) {
        // Quiz terminado
        quiz.status = 'finished';
        
        const finalResults = Array.from(quiz.participants.values())
          .map(p => ({
            name: p.name,
            score: p.score,
            correctAnswers: p.answers.filter(a => a.isCorrect).length
          }))
          .sort((a, b) => b.score - a.score);

        io.to(roomCode).emit('quiz-finished', { results: finalResults });
        console.log(`🏁 Quiz ${roomCode} terminado`);
      } else {
        // Siguiente pregunta
        quiz.questionStartTime = new Date();
        const currentQuestion = quiz.questions[quiz.currentQuestion];
        
        const questionData = {
          questionNumber: quiz.currentQuestion + 1,
          totalQuestions: quiz.questions.length,
          question: currentQuestion.question,
          options: currentQuestion.options,
          timeLimit: currentQuestion.timeLimit || 30
        };

        io.to(roomCode).emit('next-question', questionData);
        console.log(`➡️ Quiz ${roomCode} - Pregunta ${quiz.currentQuestion + 1}`);
      }
    } catch (error) {
      console.error('Error next question:', error);
      socket.emit('error', { message: 'Error al pasar a la siguiente pregunta' });
    }
  });

  // Evento: Obtener leaderboard
  socket.on('get-leaderboard', (data) => {
    try {
      const { roomCode } = data;
      const quiz = activeQuizzes.get(roomCode);

      if (!quiz) {
        socket.emit('error', { message: 'Quiz no encontrado' });
        return;
      }

      const leaderboard = Array.from(quiz.participants.values())
        .map(p => ({
          name: p.name,
          score: p.score,
          correctAnswers: p.answers.filter(a => a.isCorrect).length
        }))
        .sort((a, b) => b.score - a.score);

      socket.emit('leaderboard-updated', leaderboard);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      socket.emit('error', { message: 'Error al obtener clasificación' });
    }
  });

  // Evento: Desconexión
  socket.on('disconnect', () => {
    try {
      const roomCode = userRooms.get(socket.id);
      
      if (roomCode) {
        const quiz = activeQuizzes.get(roomCode);
        
        if (quiz) {
          // Si es el creador del quiz, eliminar el quiz
          if (quiz.createdBy === socket.id) {
            activeQuizzes.delete(roomCode);
            socket.to(roomCode).emit('quiz-ended', { reason: 'El profesor se desconectó' });
            console.log(`🗑️ Quiz ${roomCode} eliminado (creador desconectado)`);
          } else {
            // Si es un participante, removerlo de la lista
            quiz.participants.delete(socket.id);
            
            const participantsList = Array.from(quiz.participants.values())
              .map(p => ({ name: p.name, score: p.score }));
            
            socket.to(roomCode).emit('participants-updated', participantsList);
          }
        }
        
        userRooms.delete(socket.id);
      }
      
      console.log(`🔌 Usuario desconectado: ${socket.id}`);
    } catch (error) {
      console.error('Error on disconnect:', error);
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
