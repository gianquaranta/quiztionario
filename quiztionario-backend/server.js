const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = createServer(app);

// Configuración de CORS para Express
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Configuración de Socket.IO con CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
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
    connectedUsers: io.sockets.sockets.size
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'Quiztionario Backend Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      socket: '/socket.io'
    }
  });
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
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Frontend URL configurada: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
});

// Manejo de errores globales
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
