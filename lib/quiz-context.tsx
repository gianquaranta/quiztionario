"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import { io, type Socket } from "socket.io-client"

// Types
interface Student {
  id: string
  student_name: string
  total_points: number
  is_connected: boolean
  joined_at: string
}

interface Response {
  id: string
  participant: Student
  responseTime: number
  timestamp: number
}

interface QuizState {
  students: Student[]
  responses: Response[]
  currentQuestion: any
  questionActive: boolean
  questionStartTime: number | null
  currentSessionCode: string | null
  socket: Socket | null
  isConnected: boolean
}

type QuizAction =
  | { type: "SET_SOCKET"; payload: Socket }
  | { type: "SET_CONNECTED"; payload: boolean }
  | { type: "ADD_STUDENT"; payload: Student }
  | { type: "REMOVE_STUDENT"; payload: string }
  | { type: "UPDATE_STUDENT_POINTS"; payload: { id: string; points: number } }
  | { type: "SET_STUDENTS"; payload: Student[] }
  | { type: "ADD_RESPONSE"; payload: Response }
  | { type: "CLEAR_RESPONSES" }
  | { type: "SET_CURRENT_QUESTION"; payload: { question: any; startTime: number } }
  | { type: "SET_QUESTION_ACTIVE"; payload: boolean }
  | { type: "SET_SESSION_CODE"; payload: string | null }
  | { type: "RESET_QUIZ" }

const initialState: QuizState = {
  students: [],
  responses: [],
  currentQuestion: null,
  questionActive: false,
  questionStartTime: null,
  currentSessionCode: null,
  socket: null,
  isConnected: false,
}

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "SET_SOCKET":
      return { ...state, socket: action.payload }
    case "SET_CONNECTED":
      return { ...state, isConnected: action.payload }
    case "ADD_STUDENT":
      return {
        ...state,
        students: [...state.students.filter((s) => s.id !== action.payload.id), action.payload],
      }
    case "REMOVE_STUDENT":
      return {
        ...state,
        students: state.students.filter((s) => s.id !== action.payload),
      }
    case "UPDATE_STUDENT_POINTS":
      return {
        ...state,
        students: state.students.map((s) =>
          s.id === action.payload.id ? { ...s, total_points: action.payload.points } : s,
        ),
      }
    case "SET_STUDENTS":
      return { ...state, students: action.payload }
    case "ADD_RESPONSE":
      console.log("🎯 Agregando respuesta al contexto:", action.payload)
      return {
        ...state,
        responses: [...state.responses, action.payload].sort((a, b) => a.responseTime - b.responseTime),
      }
    case "CLEAR_RESPONSES":
      return { ...state, responses: [] }
    case "SET_CURRENT_QUESTION":
      return {
        ...state,
        currentQuestion: action.payload.question,
        questionStartTime: action.payload.startTime,
        questionActive: true,
      }
    case "SET_QUESTION_ACTIVE":
      if (!action.payload) {
        // Si se desactiva la pregunta, limpiar todo
        return {
          ...state,
          questionActive: false,
          currentQuestion: null,
          questionStartTime: null,
          responses: [],
        }
      }
      return { ...state, questionActive: action.payload }
    case "SET_SESSION_CODE":
      return { ...state, currentSessionCode: action.payload }
    case "RESET_QUIZ":
      return { ...initialState, socket: state.socket, isConnected: state.isConnected }
    default:
      return state
  }
}

const QuizContext = createContext<{
  state: QuizState
  dispatch: React.Dispatch<QuizAction>
  emit: (event: string, ...args: any[]) => void
} | null>(null)

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initialState)

  useEffect(() => {
    console.log("🔌 Inicializando Socket.IO...")

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "", {
      path: "/api/socket.io",
      addTrailingSlash: false,
    })

    socket.on("connect", () => {
      console.log("✅ Socket conectado:", socket.id)
      dispatch({ type: "SET_CONNECTED", payload: true })
    })

    socket.on("disconnect", () => {
      console.log("❌ Socket desconectado")
      dispatch({ type: "SET_CONNECTED", payload: false })
    })

    // Eventos para el profesor
    socket.on("student-joined", (participant: Student) => {
      console.log("👥 Estudiante se unió:", participant)
      dispatch({ type: "ADD_STUDENT", payload: participant })
    })

    socket.on("student-left", (participant: Student) => {
      console.log("👋 Estudiante se fue:", participant)
      dispatch({ type: "REMOVE_STUDENT", payload: participant.id })
    })

    socket.on("new-response", (responseData: any) => {
      console.log("📨 Nueva respuesta recibida en contexto:", responseData)
      dispatch({
        type: "ADD_RESPONSE",
        payload: {
          id: responseData.responseId || responseData.id || `${responseData.participant?.id}-${Date.now()}`,
          participant: responseData.participant,
          responseTime: responseData.responseTime,
          timestamp: Date.now(),
        },
      })
    })

    socket.on("points-awarded", ({ participantId, totalPoints }: { participantId: string; totalPoints: number }) => {
      console.log("🏆 Puntos otorgados:", participantId, totalPoints)
      dispatch({ type: "UPDATE_STUDENT_POINTS", payload: { id: participantId, points: totalPoints } })
    })

    // Eventos para estudiantes
    socket.on("question-started", (data: { question: any; startTime: number; sessionCode: string }) => {
      console.log("❓ Pregunta iniciada:", data)
      dispatch({ type: "SET_CURRENT_QUESTION", payload: { question: data.question, startTime: data.startTime } })
      dispatch({ type: "SET_SESSION_CODE", payload: data.sessionCode })
    })

    socket.on("question-ended", () => {
      console.log("⏹️ Pregunta terminada")
      dispatch({ type: "SET_QUESTION_ACTIVE", payload: false })
    })

    socket.on("session-ended", () => {
      console.log("🛑 Sesión terminada")
      dispatch({ type: "RESET_QUIZ" })
    })

    dispatch({ type: "SET_SOCKET", payload: socket })

    return () => {
      console.log("🔌 Desconectando socket...")
      socket.disconnect()
    }
  }, [])

  const emit = (event: string, ...args: any[]) => {
    if (state.socket && state.isConnected) {
      console.log(`📤 Emitiendo evento: ${event}`, args)
      state.socket.emit(event, ...args)
    } else {
      console.warn("⚠️ Socket no conectado, no se puede emitir:", event)
    }
  }

  return <QuizContext.Provider value={{ state, dispatch, emit }}>{children}</QuizContext.Provider>
}

export function useQuiz() {
  const context = useContext(QuizContext)
  if (!context) {
    throw new Error("useQuiz debe usarse dentro de QuizProvider")
  }
  return context
}
