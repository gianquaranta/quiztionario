"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"

interface Student {
  id: string
  name: string
  points: number
  isConnected: boolean
  lastResponseTime?: number
}

interface Question {
  id: string
  text: string
  maxPoints: number
}

interface Quiz {
  id: string
  title: string
  questions: Question[]
}

interface QuizState {
  students: Student[]
  activeQuiz: Quiz | null
  currentQuestion: Question | null
  questionActive: boolean
  questionStartTime: number | null
  responses: Array<{ studentId: string; responseTime: number }>
  quizzes: Quiz[]
}

type QuizAction =
  | { type: "ADD_STUDENT"; payload: Student }
  | { type: "REMOVE_STUDENT"; payload: string }
  | { type: "START_QUESTION"; payload: Question }
  | { type: "END_QUESTION" }
  | { type: "STUDENT_RESPONSE"; payload: { studentId: string; responseTime: number } }
  | { type: "AWARD_POINTS"; payload: { studentId: string; points: number } }
  | { type: "SET_ACTIVE_QUIZ"; payload: Quiz }
  | { type: "ADD_QUIZ"; payload: Quiz }
  | { type: "UPDATE_STUDENTS"; payload: Student[] }

const initialState: QuizState = {
  students: [],
  activeQuiz: null,
  currentQuestion: null,
  questionActive: false,
  questionStartTime: null,
  responses: [],
  quizzes: [],
}

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "ADD_STUDENT":
      return {
        ...state,
        students: [...state.students, action.payload],
      }
    case "REMOVE_STUDENT":
      return {
        ...state,
        students: state.students.filter((s) => s.id !== action.payload),
      }
    case "START_QUESTION":
      return {
        ...state,
        currentQuestion: action.payload,
        questionActive: true,
        questionStartTime: Date.now(),
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
    case "STUDENT_RESPONSE":
      return {
        ...state,
        responses: [...state.responses, action.payload].sort((a, b) => a.responseTime - b.responseTime),
      }
    case "AWARD_POINTS":
      return {
        ...state,
        students: state.students.map((s) =>
          s.id === action.payload.studentId ? { ...s, points: s.points + action.payload.points } : s,
        ),
      }
    case "SET_ACTIVE_QUIZ":
      return {
        ...state,
        activeQuiz: action.payload,
      }
    case "ADD_QUIZ":
      return {
        ...state,
        quizzes: [...state.quizzes, action.payload],
      }
    case "UPDATE_STUDENTS":
      return {
        ...state,
        students: action.payload,
      }
    default:
      return state
  }
}

const QuizContext = createContext<{
  state: QuizState
  dispatch: React.Dispatch<QuizAction>
} | null>(null)

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initialState)

  // Simulate WebSocket connection
  useEffect(() => {
    // In a real app, this would be WebSocket connection
    console.log("Quiz WebSocket connected")

    return () => {
      console.log("Quiz WebSocket disconnected")
    }
  }, [])

  return <QuizContext.Provider value={{ state, dispatch }}>{children}</QuizContext.Provider>
}

export function useQuiz() {
  const context = useContext(QuizContext)
  if (!context) {
    throw new Error("useQuiz must be used within a QuizProvider")
  }
  return context
}
