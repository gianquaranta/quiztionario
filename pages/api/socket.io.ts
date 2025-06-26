import type { Server as NetServer } from "http"
import type { NextApiRequest, NextApiResponse } from "next"
import { Server as ServerIO } from "socket.io"

export const config = {
  api: {
    bodyParser: false,
  },
}

type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log("✅ Socket.IO already running")
    res.end()
    return
  }

  console.log("🚀 Starting Socket.IO server...")

  const io = new ServerIO(res.socket.server, {
    path: "/api/socket.io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  // Store active sessions and participants
  const activeSessions = new Map<
    string,
    {
      teacherSocketId: string
      students: Map<string, any>
      currentQuestion: any
      questionActive: boolean
    }
  >()

  io.on("connection", (socket) => {
    console.log(`🔌 NEW CLIENT CONNECTED: ${socket.id}`)

    // Teacher starts a session
    socket.on("teacher-start-session", (sessionCode: string, sessionId: string) => {
      console.log(`👨‍🏫 TEACHER STARTING SESSION: ${sessionCode} with socket ${socket.id}`)

      // Join the session room
      socket.join(sessionCode)

      // Store session info
      activeSessions.set(sessionCode, {
        teacherSocketId: socket.id,
        students: new Map(),
        currentQuestion: null,
        questionActive: false,
      })

      console.log(`✅ Session ${sessionCode} created successfully`)
      console.log(`📊 Active sessions: ${Array.from(activeSessions.keys())}`)

      socket.emit("session-started", { sessionCode, sessionId })
    })

    // Student joins session
    socket.on("student-join-session", (sessionCode: string, participant: any) => {
      console.log(`🎓 STUDENT JOINING SESSION: ${participant.student_name} → ${sessionCode}`)
      console.log(`🔍 Socket ID: ${socket.id}`)

      const session = activeSessions.get(sessionCode)
      if (!session) {
        console.log(`❌ Session ${sessionCode} not found!`)
        socket.emit("error", "Session not found")
        return
      }

      console.log(`📍 Session found! Current students: ${session.students.size}`)

      // Join the session room
      socket.join(sessionCode)
      console.log(`🏠 Socket ${socket.id} joined room ${sessionCode}`)

      // Store student info
      session.students.set(socket.id, {
        ...participant,
        socketId: socket.id,
      })

      console.log(`✅ Student ${participant.student_name} joined session ${sessionCode}`)
      console.log(`👥 Students in session ${sessionCode}: ${session.students.size}`)

      // FIRST: Send current participants list to the NEW student (including existing ones)
      const allParticipants = Array.from(session.students.values())
      console.log(`📤 Sending complete participants list to new student: ${allParticipants.length} participants`)
      console.log(`📤 Participants names: ${allParticipants.map(p => p.student_name).join(', ')}`)
      
      // Send to the new student specifically
      console.log(`📨 Emitting participants-list to socket ${socket.id}`)
      socket.emit("participants-list", allParticipants)
      
      // ALSO send to all students in the session (to ensure everyone has the updated list)
      console.log(`📨 Broadcasting participants-list to room ${sessionCode}`)
      io.to(sessionCode).emit("participants-list", allParticipants)

      // THEN: Notify EVERYONE in the session about the new student
      console.log(`📨 Broadcasting student-joined to room ${sessionCode}`)
      io.to(sessionCode).emit("student-joined", participant)

      // Send current question if active
      if (session.questionActive && session.currentQuestion) {
        console.log(`📤 Sending active question to new student: ${session.currentQuestion.question_text}`)
        socket.emit("question-started", {
          question: session.currentQuestion,
          startTime: Date.now(),
          sessionCode: sessionCode,
        })
      }
    })

    // Handle request for participants list
    socket.on("request-participants", (sessionCode: string) => {
      console.log(`📋 🔍 PARTICIPANT LIST REQUESTED for session: ${sessionCode} by socket: ${socket.id}`)

      const session = activeSessions.get(sessionCode)
      if (session) {
        const allParticipants = Array.from(session.students.values())
        console.log(`📋 🔍 Found ${allParticipants.length} participants: ${allParticipants.map(p => p.student_name).join(', ')}`)
        console.log(`� 🔍 Sending participants-list to ${socket.id}`)
        socket.emit("participants-list", allParticipants)
        console.log(`✅ 🔍 Sent participants list successfully`)
      } else {
        console.log(`❌ 🔍 Session ${sessionCode} not found for participants request`)
      }
    })

    // Teacher starts question
    socket.on("teacher-start-question", (sessionCode: string, data: any) => {
      console.log(`❓ TEACHER STARTING QUESTION in ${sessionCode}: ${data.question.question_text}`)

      const session = activeSessions.get(sessionCode)
      if (!session) {
        console.log(`❌ Session ${sessionCode} not found for question!`)
        return
      }

      // Update session state
      session.currentQuestion = data.question
      session.questionActive = true

      console.log(`📡 Broadcasting question to ${session.students.size} students in room ${sessionCode}`)

      // Send to ALL clients in the session room (students will receive it)
      io.to(sessionCode).emit("question-started", {
        question: data.question,
        startTime: data.startTime,
        sessionCode: sessionCode,
      })

      console.log(`✅ Question broadcasted successfully`)
    })

    // Teacher pauses question
    socket.on("teacher-pause-question", (sessionCode: string) => {
      console.log(`⏸️ TEACHER PAUSING QUESTION in ${sessionCode}`)

      const session = activeSessions.get(sessionCode)
      if (session) {
        session.questionActive = false
        session.currentQuestion = null
      }

      io.to(sessionCode).emit("question-ended")
      console.log(`✅ Question paused and broadcasted`)
    })

    // Student responds
    socket.on("student-response", (sessionCode: string, responseData: any) => {
      console.log(`⚡ STUDENT RESPONSE in ${sessionCode}: ${responseData.participant?.student_name}`)
      console.log(`📊 Response time: ${responseData.responseTime}ms`)

      // Broadcast to everyone in the session
      io.to(sessionCode).emit("new-response", responseData)
      console.log(`✅ Response broadcasted to session ${sessionCode}`)
    })

    // Teacher awards points - MEJORADO para permitir asignar a cualquier estudiante
    socket.on("teacher-award-points", (sessionCode: string, participantId: string, totalPoints: number) => {
      console.log(`🏆 AWARDING POINTS in ${sessionCode}: ${totalPoints} to ${participantId}`)

      // Actualizar los puntos del estudiante en la sesión
      const session = activeSessions.get(sessionCode)
      if (session) {
        for (const [socketId, student] of session.students.entries()) {
          if (student.id === participantId) {
            student.total_points = totalPoints
            console.log(`✅ Updated points for ${student.student_name}: ${totalPoints}`)
            break
          }
        }
      }

      io.to(sessionCode).emit("points-awarded", { participantId, totalPoints })

      // Automatically end the question when points are awarded
      if (session) {
        session.questionActive = false
        session.currentQuestion = null
      }
      io.to(sessionCode).emit("question-ended")
      console.log(`🛑 Question automatically ended after awarding points`)

      console.log(`✅ Points awarded and broadcasted`)
    })

    // Teacher ends question
    socket.on("teacher-end-question", (sessionCode: string) => {
      console.log(`🛑 TEACHER ENDING QUESTION in ${sessionCode}`)

      const session = activeSessions.get(sessionCode)
      if (session) {
        session.questionActive = false
        session.currentQuestion = null
      }

      io.to(sessionCode).emit("question-ended")
      console.log(`✅ Question ended and broadcasted`)
    })

    // Teacher ends session
    socket.on("teacher-end-session", (sessionCode: string) => {
      console.log(`🛑 TEACHER ENDING SESSION: ${sessionCode}`)

      io.to(sessionCode).emit("session-ended")
      activeSessions.delete(sessionCode)

      console.log(`✅ Session ${sessionCode} ended and cleaned up`)
      console.log(`📊 Remaining sessions: ${Array.from(activeSessions.keys())}`)
    })

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`🔌 CLIENT DISCONNECTED: ${socket.id}`)

      // Find which session this socket was in
      for (const [sessionCode, session] of activeSessions.entries()) {
        if (session.teacherSocketId === socket.id) {
          console.log(`👨‍🏫 Teacher disconnected from session ${sessionCode}`)
          // Don't delete session immediately, teacher might reconnect
        } else if (session.students.has(socket.id)) {
          const student = session.students.get(socket.id)
          console.log(`🎓 Student ${student?.student_name} disconnected from session ${sessionCode}`)

          session.students.delete(socket.id)
          io.to(sessionCode).emit("student-left", student)

          console.log(`👥 Remaining students in ${sessionCode}: ${session.students.size}`)
        }
      }
    })

    // Debug: List rooms for this socket
    socket.on("debug-rooms", () => {
      console.log(`🐛 Socket ${socket.id} is in rooms:`, Array.from(socket.rooms))
    })
  })

  res.socket.server.io = io
  console.log("✅ Socket.IO server started successfully")
  res.end()
}

export default SocketHandler
