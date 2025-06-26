"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { io } from "socket.io-client"
import { useSearchParams } from "next/navigation"
import { db } from "@/lib/db"

let socket: any

export default function StudentPage() {
  const [sessionData, setSessionData] = useState<any>(null)
  const [participant, setParticipant] = useState<any>(null)
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [hasResponded, setHasResponded] = useState(false)
  const [responseTime, setResponseTime] = useState(0)
  const [sessionCodeValid, setSessionCodeValid] = useState(false)
  const [nameValid, setNameValid] = useState(false)
  const [showNameInput, setShowNameInput] = useState(true)
  const [studentName, setStudentName] = useState("")
  const [error, setError] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionCode = searchParams.get("sessionCode")

  const socketRef = useRef(socket)

  useEffect(() => {
    if (sessionCode) {
      validateSessionCode(sessionCode)
    }
  }, [sessionCode])

  useEffect(() => {
    if (sessionCodeValid && studentName) {
      joinSession(sessionCode, studentName)
    }
  }, [sessionCodeValid, studentName])

  useEffect(() => {
    socketInitializer()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const socketInitializer = async () => {
    await fetch("/api/socket")
    socket = io()

    socketRef.current = socket

    socket.on("connect", () => {
      console.log("Student Socket connected", socket.id)
    })

    socket.on("question", (question: any) => {
      console.log("🔥 Nueva pregunta:", question)
      setCurrentQuestion(question)
      setHasResponded(false)
      question.startTime = Date.now()
    })

    socket.on("session-ended", () => {
      console.log("Session ended")
      alert("Session ended by the teacher.")
      router.push("/")
    })
  }

  const emit = (event: string, sessionCode: string, data: any) => {
    socket.emit(event, sessionCode, data)
  }

  const validateSessionCode = async (sessionCode: string) => {
    try {
      const session = await db.getSessionByCode(sessionCode)
      if (session) {
        setSessionData(session)
        setSessionCodeValid(true)
      } else {
        setError("Invalid session code")
        setSessionCodeValid(false)
      }
    } catch (error) {
      console.error("Error validating session code:", error)
      setError("Error validating session code")
      setSessionCodeValid(false)
    }
  }

  const joinSession = async (sessionCode: string, studentName: string) => {
    try {
      const participant = await db.addParticipantToSession(sessionCode, studentName)
      setParticipant(participant)
      setShowNameInput(false)
    } catch (error) {
      console.error("Error joining session:", error)
      setError("Error joining session")
    }
  }

  const handleNameSubmit = () => {
    if (studentName.trim() !== "") {
      setNameValid(true)
      joinSession(sessionCode!, studentName)
    } else {
      setError("Please enter your name")
    }
  }

  const submitResponse = async () => {
    if (!currentQuestion || !participant || hasResponded) return

    const responseTime = Date.now() - currentQuestion.startTime
    setHasResponded(true)
    setResponseTime(responseTime)

    try {
      // Registrar en la base de datos
      const response = await db.recordStudentResponse(sessionData.id, participant.id, currentQuestion.id, responseTime)

      // Emitir al profesor con todos los datos necesarios
      const responseData = {
        id: response.id,
        participant: participant,
        responseTime: responseTime,
        sessionCode: sessionData.session_code,
        questionId: currentQuestion.id,
      }

      console.log("📤 Enviando respuesta:", responseData)
      emit("student-response", sessionData.session_code, responseData)
    } catch (error) {
      console.error("❌ Error al enviar respuesta:", error)
      setHasResponded(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-bold">Student Page</h1>
      {error && <p className="text-red-500">{error}</p>}

      {showNameInput && (
        <div className="mt-4">
          <input
            type="text"
            placeholder="Enter your name"
            className="border rounded py-2 px-3"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
            onClick={handleNameSubmit}
          >
            Join Session
          </button>
        </div>
      )}

      {sessionData && participant && (
        <div className="mt-4">
          <p>
            Session Code: {sessionData.session_code} - Participant: {participant.name}
          </p>
        </div>
      )}

      {currentQuestion && (
        <div className="mt-8">
          <p className="text-lg font-semibold">Question: {currentQuestion.text}</p>
          {!hasResponded ? (
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
              onClick={submitResponse}
            >
              Send Response
            </button>
          ) : (
            <p className="mt-4">Response sent! Time taken: {responseTime}ms</p>
          )}
        </div>
      )}
    </div>
  )
}
