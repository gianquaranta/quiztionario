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

  // Store active sessions
  const activeSessions = new Map<string, Set<string>>()
  const socketToSession = new Map<string, string>()
  const socketToParticipant = new Map<string, any>()

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`)

    // Teacher starts a session
    socket.on("teacher-start-session", (sessionCode: string, sessionId: string) => {
      socket.join(sessionCode)
      socketToSession.set(socket.id, sessionCode)

      if (!activeSessions.has(sessionCode)) {
        activeSessions.set(sessionCode, new Set())
      }
      activeSessions.get(sessionCode)!.add(socket.id)

      console.log(`👨‍🏫 Teacher started session: ${sessionCode}`)
      socket.emit("session-started", { sessionCode, sessionId })
    })

    // Student joins session
    socket.on("student-join-session", (sessionCode: string, participant: any) => {
      socket.join(sessionCode)
      socketToSession.set(socket.id, sessionCode)
      socketToParticipant.set(socket.id, participant)

      if (!activeSessions.has(sessionCode)) {
        activeSessions.set(sessionCode, new Set())
      }
      activeSessions.get(sessionCode)!.add(socket.id)

      console.log(`🎓 Student ${participant.student_name} joined session ${sessionCode}`)

      // Notify everyone in the session
      io.to(sessionCode).emit("student-joined", participant)

      // Send participant count to teacher
      const participantCount = activeSessions.get(sessionCode)!.size - 1 // -1 for teacher
      io.to(sessionCode).emit("participant-count-updated", participantCount)
    })

    // Teacher starts question
    socket.on("teacher-start-question", (sessionCode: string, question: any, startTime: number) => {
      console.log(`❓ Question started in ${sessionCode}: ${question.question_text}`)
      io.to(sessionCode).emit("question-active", question, startTime)
    })

    // Student responds
    socket.on("student-response", (sessionCode: string, responseData: any) => {
      console.log(`⚡ Response from ${responseData.participant.student_name}`)
      io.to(sessionCode).emit("new-response", responseData)
    })

    // Teacher awards points
    socket.on("teacher-award-points", (sessionCode: string, participantId: string, totalPoints: number) => {
      console.log(`🏆 Points awarded to ${participantId}`)
      io.to(sessionCode).emit("points-awarded", { participantId, totalPoints })
    })

    // Teacher ends question
    socket.on("teacher-end-question", (sessionCode: string) => {
      console.log(`⏹️ Question ended in ${sessionCode}`)
      io.to(sessionCode).emit("question-ended")
    })

    // Teacher ends session
    socket.on("teacher-end-session", (sessionCode: string) => {
      console.log(`🛑 Session ended: ${sessionCode}`)
      io.to(sessionCode).emit("session-ended")

      // Clean up
      if (activeSessions.has(sessionCode)) {
        activeSessions.delete(sessionCode)
      }
    })

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`)

      const sessionCode = socketToSession.get(socket.id)
      const participant = socketToParticipant.get(socket.id)

      if (sessionCode && activeSessions.has(sessionCode)) {
        const sessionSockets = activeSessions.get(sessionCode)!
        sessionSockets.delete(socket.id)

        if (participant) {
          io.to(sessionCode).emit("student-left", participant)
          console.log(`👋 Student ${participant.student_name} left`)
        }

        // Update participant count
        const participantCount = Math.max(0, sessionSockets.size - 1)
        io.to(sessionCode).emit("participant-count-updated", participantCount)

        if (sessionSockets.size === 0) {
          activeSessions.delete(sessionCode)
        }
      }

      socketToSession.delete(socket.id)
      socketToParticipant.delete(socket.id)
    })
  })

  res.socket.server.io = io
  console.log("✅ Socket.IO server started successfully")
  res.end()
}

export default SocketHandler
