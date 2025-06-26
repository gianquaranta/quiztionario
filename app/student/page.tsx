"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"
import { useQuiz } from "@/lib/quiz-context"
import { db, type SessionParticipant } from "@/lib/supabase"

export default function StudentPage() {
  const { state, dispatch, emit } = useQuiz()
  const [studentName, setStudentName] = useState("")
  const [sessionCode, setSessionCode] = useState("")
  const [currentParticipant, setCurrentParticipant] = useState<SessionParticipant | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [hasResponded, setHasResponded] = useState(false)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [rank, setRank] = useState<number | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const leaderboard = [...state.students]
    .sort((a, b) => b.total_points - a.total_points)
    .filter((s) => s.total_points > 0)

  const joinQuiz = async () => {
    if (!studentName.trim() || !sessionCode.trim()) {
      setError("Por favor ingresa tu nombre y el código de sesión")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("🎓 STUDENT ATTEMPTING TO JOIN:", studentName, sessionCode.toUpperCase())

      const session = await db.getSessionByCode(sessionCode.toUpperCase())
      if (!session) {
        setError("Sesión no encontrada. Verifica el código e intenta nuevamente.")
        return
      }

      const participant = await db.joinSession(session.id, studentName)
      setCurrentParticipant(participant)
      setIsJoined(true)

      console.log("📤 EMITTING STUDENT JOIN EVENT...")
      emit("student-join-session", sessionCode.toUpperCase(), participant)

      // Solicitar lista actualizada de participantes
      emit("request-participants", sessionCode.toUpperCase())

      console.log("✅ STUDENT SUCCESSFULLY JOINED SESSION:", sessionCode.toUpperCase())
    } catch (error) {
      console.error("❌ ERROR JOINING SESSION:", error)
      setError("No se pudo unir a la sesión. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const respondToQuestion = async () => {
    console.log("🔥 STUDENT ATTEMPTING TO RESPOND...")
    console.log("📊 Current state:", {
      questionActive: state.questionActive,
      currentQuestion: state.currentQuestion?.question_text,
      currentParticipant: currentParticipant?.student_name,
      hasResponded: hasResponded,
      questionStartTime: state.questionStartTime,
      sessionCode: state.currentSessionCode,
    })

    if (!state.currentQuestion || !currentParticipant || hasResponded) {
      console.log("❌ CANNOT RESPOND:", {
        noQuestion: !state.currentQuestion,
        noParticipant: !currentParticipant,
        alreadyResponded: hasResponded,
      })
      return
    }

    // Calculate response time
    const questionStartTime = state.questionStartTime || Date.now()
    const time = Date.now() - questionStartTime

    console.log("⏱️ RESPONSE TIME:", time, "ms")

    setResponseTime(time)
    setHasResponded(true)

    try {
      const response = await db.recordStudentResponse(
        currentParticipant.session_id,
        currentParticipant.id,
        state.currentQuestion.id,
        time,
      )

      console.log("💾 RESPONSE SAVED TO DB:", response)

      // Emit response to teacher
      const responseData = {
        participantId: currentParticipant.id,
        responseTime: time,
        participant: currentParticipant,
        responseId: response.id,
      }

      console.log("📤 EMITTING STUDENT RESPONSE...")
      emit("student-response", state.currentSessionCode, responseData)

      console.log("✅ RESPONSE SENT TO TEACHER:", responseData)

      // Calculate approximate ranking
      const currentRank = state.responses.length + 1
      setRank(currentRank)

      if (currentRank <= 3) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
      }
    } catch (error) {
      console.error("❌ ERROR RECORDING RESPONSE:", error)
      setHasResponded(false) // Allow retry
    }
  }

  // Reset when new question appears
  useEffect(() => {
    if (state.questionActive && state.currentQuestion) {
      console.log("🆕 NEW QUESTION DETECTED, RESETTING STATE")
      setHasResponded(false)
      setResponseTime(null)
      setRank(null)
    }
  }, [state.questionActive, state.currentQuestion])

  // Update participant when state changes
  useEffect(() => {
    if (currentParticipant) {
      const updatedParticipant = state.students.find((s) => s.id === currentParticipant.id)
      if (updatedParticipant) {
        const newParticipant = {
          ...updatedParticipant,
          session_id: currentParticipant.session_id,
          joined_at: currentParticipant.joined_at,
          is_connected: updatedParticipant.is_connected ?? currentParticipant.is_connected,
        }

        // Only update state if the new participant data is different
        if (JSON.stringify(newParticipant) !== JSON.stringify(currentParticipant)) {
          setCurrentParticipant(newParticipant)
        }
      }
    }
  }, [state.students, currentParticipant])

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute top-3/4 right-1/4 w-32 h-32 md:w-64 md:h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float-delayed"></div>
        </div>

        <div className="max-w-md mx-auto pt-10 md:pt-20 relative z-10">
          <Card className="bg-white/90 backdrop-blur-lg border border-slate-200 shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                <Star className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <CardTitle className="text-2xl md:text-3xl text-slate-800">🎮 ¡Únete al Quiz!</CardTitle>
              <CardDescription className="text-slate-600 text-base md:text-lg">
                Ingresa tu nombre y el código de sesión
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-slate-700 text-base md:text-lg">
                  Tu Nombre
                </Label>
                <Input
                  id="name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Ingresa tu nombre"
                  className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 text-base md:text-lg h-12 focus:border-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="code" className="text-slate-700 text-base md:text-lg">
                  Código de Sesión
                </Label>
                <Input
                  id="code"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  placeholder="Ingresa el código de sesión"
                  className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 text-base md:text-lg h-12 focus:border-blue-500"
                />
              </div>

              <Button onClick={joinQuiz} className="bg-blue-500 text-white hover:bg-blue-600">
                Unirse al Quiz
              </Button>

              {error && <div className="text-red-500 text-sm">{error}</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-32 h-32 md:w-64 md:h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float-delayed"></div>
      </div>

      <div className="max-w-md mx-auto pt-10 md:pt-20 relative z-10">
        <Card className="bg-white/90 backdrop-blur-lg border border-slate-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center animate-bounce shadow-lg">
              <Star className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <CardTitle className="text-2xl md:text-3xl text-slate-800">🎮 Quiz Activo</CardTitle>
            <CardDescription className="text-slate-600 text-base md:text-lg">Esperando una pregunta...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {state.currentQuestion && (
              <div>
                <Label htmlFor="question" className="text-slate-700 text-base md:text-lg">
                  Pregunta Actual
                </Label>
                <div className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 text-base md:text-lg h-12 focus:border-blue-500 p-4">
                  {state.currentQuestion.question_text}
                </div>
              </div>
            )}

            <Button onClick={respondToQuestion} className="bg-blue-500 text-white hover:bg-blue-600">
              Responder Pregunta
            </Button>

            {responseTime !== null && (
              <div className="text-slate-600 text-base md:text-lg">Tiempo de Respuesta: {responseTime} ms</div>
            )}

            {rank !== null && <div className="text-slate-600 text-base md:text-lg">Rango Aproximado: {rank}</div>}

            {showCelebration && (
              <div className="text-green-500 text-base md:text-lg">¡Felicidades! Estás en el top 3.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
