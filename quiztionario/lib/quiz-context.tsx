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
  | { type: "SET_PARTICIPANTS_LIST"; payload: Student[] }
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
      console.log("🎯 ADDING STUDENT TO STATE:", action.payload.student_name)
      // Evitar duplicados al agregar estudiante
      const existingStudent = state.students.find(s => s.id === action.payload.id)
      if (existingStudent) {
        console.log("⚠️ Student already exists, updating instead of adding")
        return {
          ...state,
          students: state.students.map(s => 
            s.id === action.payload.id ? action.payload : s
          ),
        }
      }
      return {
        ...state,
        students: [...state.students, action.payload],
      }
    case "REMOVE_STUDENT":
      console.log("👋 REMOVING STUDENT FROM STATE:", action.payload)
      return {
        ...state,
        students: state.students.filter((s) => s.id !== action.payload),
      }
    case "UPDATE_STUDENT_POINTS":
      console.log("🏆 UPDATING STUDENT POINTS:", action.payload)
      return {
        ...state,
        students: state.students.map((s) =>
          s.id === action.payload.id ? { ...s, total_points: action.payload.points } : s,
        ),
      }
    case "SET_STUDENTS":
      return { ...state, students: action.payload }
    case "SET_PARTICIPANTS_LIST":
      console.log("📋 🎯 SETTING COMPLETE PARTICIPANTS LIST:", action.payload.length, "participants")
      console.log("📋 🎯 Participants received:", action.payload.map(p => p.student_name))
      console.log("📋 🎯 Old participants:", state.students.map(s => s.student_name))
      // Reemplazar completamente la lista de estudiantes
      const newState = { ...state, students: action.payload }
      console.log("📋 🎯 New participants after update:", newState.students.map(s => s.student_name))
      return newState
    case "ADD_RESPONSE":
      console.log("📨 ADDING RESPONSE TO STATE:", action.payload.participant?.student_name)
      return {
        ...state,
        responses: [...state.responses, action.payload].sort((a, b) => a.responseTime - b.responseTime),
      }
    case "CLEAR_RESPONSES":
      console.log("🧹 CLEARING RESPONSES")
      return { ...state, responses: [] }
    case "SET_CURRENT_QUESTION":
      console.log("📝 SETTING CURRENT QUESTION:", action.payload.question.question_text)
      return {
        ...state,
        currentQuestion: action.payload.question,
        questionStartTime: action.payload.startTime,
        questionActive: true,
        responses: [], // Limpiar respuestas cuando empiece nueva pregunta
      }
    case "SET_QUESTION_ACTIVE":
      if (!action.payload) {
        // Si se desactiva la pregunta, NO limpiar las respuestas inmediatamente
        // para que el estudiante pueda ver su resultado
        console.log("🛑 DEACTIVATING QUESTION (keeping responses for feedback)")
        return {
          ...state,
          questionActive: false,
          currentQuestion: null,
          questionStartTime: null,
          // NO limpiar responses aquí para mantener feedback
        }
      }
      return { ...state, questionActive: action.payload }
    case "SET_SESSION_CODE":
      console.log("📝 SETTING SESSION CODE:", action.payload)
      return { ...state, currentSessionCode: action.payload }
    case "RESET_QUIZ":
      console.log("🔄 RESETTING QUIZ STATE")
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
    console.log("🔌 INITIALIZING SOCKET.IO CONNECTION...")

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "", {
      path: "/api/socket.io",
      addTrailingSlash: false,
    })

    socket.on("connect", () => {
      console.log("✅ SOCKET CONNECTED:", socket.id)
      dispatch({ type: "SET_CONNECTED", payload: true })

      // Debug: Check which rooms we're in
      socket.emit("debug-rooms")
    })

    socket.on("disconnect", () => {
      console.log("❌ SOCKET DISCONNECTED")
      dispatch({ type: "SET_CONNECTED", payload: false })
    })

    socket.on("error", (error) => {
      console.error("🚨 SOCKET ERROR:", error)
    })

    // NUEVO: Manejar lista completa de participantes (PRIORITARIO)
    socket.on("participants-list", (participants: Student[]) => {
      console.log("� 🎯 PARTICIPANTS LIST RECEIVED:", participants.length, "participants")
      console.log("📋 🎯 Current participants names:", participants.map(p => p.student_name))
      console.log("� 🎯 Current state students before update:", state.students.map(s => s.student_name))
      dispatch({ type: "SET_PARTICIPANTS_LIST", payload: participants })
    })

    // Events for teacher
    socket.on("student-joined", (participant: Student) => {
      console.log("� STUDENT JOINED EVENT RECEIVED:", participant.student_name)
      console.log("👥 Current students in state:", state.students.map(s => s.student_name))
      dispatch({ type: "ADD_STUDENT", payload: participant })
    })

    socket.on("student-left", (participant: Student) => {
      console.log("👋 STUDENT LEFT EVENT RECEIVED:", participant.student_name)
      dispatch({ type: "REMOVE_STUDENT", payload: participant.id })
    })

    socket.on("new-response", (responseData: any) => {
      console.log("📨 NEW RESPONSE EVENT RECEIVED:", responseData.participant?.student_name)
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
      console.log("🏆 POINTS AWARDED EVENT RECEIVED:", participantId, totalPoints)
      dispatch({ type: "UPDATE_STUDENT_POINTS", payload: { id: participantId, points: totalPoints } })
    })

    // Events for students
    socket.on("question-started", (data: { question: any; startTime: number; sessionCode: string }) => {
      console.log("❓ QUESTION STARTED EVENT RECEIVED:", data.question.question_text)
      console.log("⏰ Question start time:", data.startTime)
      console.log("📍 Session code:", data.sessionCode)

      dispatch({ type: "SET_CURRENT_QUESTION", payload: { question: data.question, startTime: data.startTime } })
      dispatch({ type: "SET_SESSION_CODE", payload: data.sessionCode })
    })

    socket.on("question-ended", () => {
      console.log("⏹️ QUESTION ENDED EVENT RECEIVED")
      dispatch({ type: "SET_QUESTION_ACTIVE", payload: false })
    })

    socket.on("session-ended", () => {
      console.log("🛑 SESSION ENDED EVENT RECEIVED")
      dispatch({ type: "RESET_QUIZ" })
    })

    dispatch({ type: "SET_SOCKET", payload: socket })

    return () => {
      console.log("🔌 DISCONNECTING SOCKET...")
      socket.disconnect()
    }
  }, [])

  const emit = (event: string, ...args: any[]) => {
    if (state.socket && state.isConnected) {
      console.log(`📤 EMITTING EVENT: ${event}`, args)
      state.socket.emit(event, ...args)
    } else {
      console.warn("⚠️ SOCKET NOT CONNECTED, CANNOT EMIT:", event)
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
