"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useCallback } from "react"
import { socketManager } from "./socket"
import type { Quiz, Question, SessionParticipant, QuizSession } from "./supabase"

interface Student extends SessionParticipant {
  lastResponseTime?: number
}

interface QuizState {
  students: Student[]
  activeQuiz: QuizSession | null
  currentQuestion: Question | null
  questionActive: boolean
  questionStartTime: number | null
  responses: Array<{ studentId: string; responseTime: number; participant?: SessionParticipant; id?: string }>
  quizzes: Quiz[]
  teacherId: string | null
  currentSessionCode: string | null
  isConnected: boolean
}

type QuizAction =
  | { type: "SET_TEACHER_ID"; payload: string | null }
  | { type: "SET_QUIZZES"; payload: Quiz[] }
  | { type: "ADD_QUIZ"; payload: Quiz }
  | { type: "SET_ACTIVE_QUIZ_SESSION"; payload: QuizSession | null }
  | { type: "UPDATE_SESSION_PARTICIPANTS"; payload: SessionParticipant[] }
  | { type: "START_QUESTION"; payload: { question: Question; startTime: number } }
  | { type: "END_QUESTION" }
  | {
      type: "ADD_STUDENT_RESPONSE"
      payload: { studentId: string; responseTime: number; participant?: SessionParticipant; id?: string }
    }
  | { type: "UPDATE_STUDENT_POINTS"; payload: { studentId: string; points: number } }
  | { type: "SET_CURRENT_SESSION_CODE"; payload: string | null }
  | { type: "SET_CONNECTION_STATUS"; payload: boolean }

const initialState: QuizState = {
  students: [],
  activeQuiz: null,
  currentQuestion: null,
  questionActive: false,
  questionStartTime: null,
  responses: [],
  quizzes: [],
  teacherId: null,
  currentSessionCode: null,
  isConnected: false,
}

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "SET_TEACHER_ID":
      return { ...state, teacherId: action.payload }
    case "SET_QUIZZES":
      return { ...state, quizzes: action.payload }
    case "ADD_QUIZ":
      return { ...state, quizzes: [...state.quizzes, action.payload] }
    case "SET_ACTIVE_QUIZ_SESSION":
      return {
        ...state,
        activeQuiz: action.payload,
        currentSessionCode: action.payload?.session_code || null,
        students: action.payload?.participants || [],
      }
    case "UPDATE_SESSION_PARTICIPANTS":
      return {
        ...state,
        students: action.payload.map((p) => ({ ...p, isConnected: true })),
      }
    case "START_QUESTION":
      return {
        ...state,
        currentQuestion: action.payload.question,
        questionActive: true,
        questionStartTime: action.payload.startTime,
        responses: [],
      }
    case "END_QUESTION":
      return {
        ...state,
        currentQuestion: null,
        questionActive: false,
        questionStartTime: null,
        responses: [],
      }
    case "ADD_STUDENT_RESPONSE":
      const newResponses = [...state.responses, action.payload].sort((a, b) => a.responseTime - b.responseTime)
      return {
        ...state,
        responses: newResponses,
      }
    case "UPDATE_STUDENT_POINTS":
      return {
        ...state,
        students: state.students.map((s) =>
          s.id === action.payload.studentId ? { ...s, total_points: action.payload.points } : s,
        ),
      }
    case "SET_CURRENT_SESSION_CODE":
      return { ...state, currentSessionCode: action.payload }
    case "SET_CONNECTION_STATUS":
      return { ...state, isConnected: action.payload }
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

  // Connect to Socket.IO and set up listeners
  useEffect(() => {
    const socket = socketManager.connect()

    // Connection status
    socket.on("connect", () => {
      dispatch({ type: "SET_CONNECTION_STATUS", payload: true })
    })

    socket.on("disconnect", () => {
      dispatch({ type: "SET_CONNECTION_STATUS", payload: false })
    })

    // Quiz events
    socket.on("student-joined", (participant: SessionParticipant) => {
      console.log("🎓 Socket: Student joined", participant)
      dispatch({ type: "UPDATE_SESSION_PARTICIPANTS", payload: [...state.students, participant] })
    })

    socket.on("question-active", (question: Question, startTime: number) => {
      console.log("❓ Socket: Question active", question)
      dispatch({ type: "START_QUESTION", payload: { question, startTime } })
    })

    socket.on(
      "new-response",
      (data: { participantId: string; responseTime: number; participant: SessionParticipant; responseId?: string }) => {
        console.log("⚡ Socket: New response", data)
        dispatch({
          type: "ADD_STUDENT_RESPONSE",
          payload: {
            studentId: data.participantId,
            responseTime: data.responseTime,
            participant: data.participant,
            id: data.responseId,
          },
        })
      },
    )

    socket.on("points-awarded", (data: { participantId: string; totalPoints: number }) => {
      console.log("🏆 Socket: Points awarded", data)
      dispatch({
        type: "UPDATE_STUDENT_POINTS",
        payload: { studentId: data.participantId, points: data.totalPoints },
      })
    })

    socket.on("question-ended", () => {
      console.log("⏹️ Socket: Question ended")
      dispatch({ type: "END_QUESTION" })
    })

    socket.on("session-ended", () => {
      console.log("🛑 Socket: Session ended")
      dispatch({ type: "END_QUESTION" })
      dispatch({ type: "SET_ACTIVE_QUIZ_SESSION", payload: null })
    })

    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("student-joined")
      socket.off("question-active")
      socket.off("new-response")
      socket.off("points-awarded")
      socket.off("question-ended")
      socket.off("session-ended")
    }
  }, [state.students])

  // Expose emit function
  const emit = useCallback((event: string, ...args: any[]) => {
    socketManager.emit(event, ...args)
  }, [])

  return <QuizContext.Provider value={{ state, dispatch, emit }}>{children}</QuizContext.Provider>
}

export function useQuiz() {
  const context = useContext(QuizContext)
  if (!context) {
    throw new Error("useQuiz must be used within a QuizProvider")
  }
  return context
}
