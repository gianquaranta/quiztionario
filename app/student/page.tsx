"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Zap, Star, Users, Home } from "lucide-react"
import Link from "next/link"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-64 sm:h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute top-3/4 right-1/4 w-32 h-32 sm:w-64 sm:h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float-delayed"></div>
        </div>

        <div className="max-w-md mx-auto pt-8 sm:pt-20 relative z-10">
          <Card className="bg-white/90 backdrop-blur-lg border border-slate-200 shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                <Star className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl text-slate-800">🎮 ¡Únete a Quiztionario!</CardTitle>
              <CardDescription className="text-slate-600 text-base sm:text-lg">
                Ingresa tu nombre y el código de sesión
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div>
                <Label htmlFor="name" className="text-slate-700 text-base sm:text-lg">
                  Tu Nombre
                </Label>
                <Input
                  id="name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Ingresa tu nombre"
                  className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 text-base sm:text-lg h-12 focus:border-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="code" className="text-slate-700 text-base sm:text-lg">
                  Código de Sesión
                </Label>
                <Input
                  id="code"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  placeholder="Código de 6 dígitos"
                  className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 text-base sm:text-lg h-12 text-center font-mono focus:border-blue-500"
                  maxLength={6}
                />
                <p className="text-slate-500 text-sm mt-1">Tu profesor te dará este código</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">❌ {error}</p>
                </div>
              )}

              <Button
                onClick={joinQuiz}
                disabled={loading || !studentName.trim() || !sessionCode.trim()}
                className="w-full h-12 sm:h-14 text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading ? "Uniéndose..." : "🚀 ¡Unirse a Quiztionario!"}
              </Button>

              <Link href="/">
                <Button variant="ghost" className="w-full text-slate-600 hover:text-slate-800 hover:bg-slate-100">
                  <Home className="w-4 h-4 mr-2" />
                  Volver al Inicio
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-180deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 2s;
        }
      `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 relative overflow-hidden">
      {/* Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center animate-bounce">
            <div className="text-6xl sm:text-8xl mb-4">🎉</div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">¡Increíble Velocidad!</h2>
            <p className="text-lg sm:text-xl text-white/80">¡Estás en el top 3! 🏆</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">🌟 ¡Hola {studentName}!</h1>
            <p className="text-slate-600 text-base sm:text-lg">¿Listo para dominar Quiztionario? 💪</p>
            {state.currentSessionCode && (
              <p className="text-slate-500 text-sm sm:text-base">Sesión: {state.currentSessionCode}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="bg-amber-100 text-amber-700 px-3 sm:px-4 py-2 rounded-full text-base sm:text-lg font-bold border border-amber-200">
              🏆 {currentParticipant?.total_points || 0} puntos
            </div>
            <div className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded-full text-sm border border-blue-200">
              <Users className="w-4 h-4 inline mr-1" />
              {state.students.length} jugadores
            </div>
            <Link href="/">
              <Button
                variant="outline"
                className="border-slate-300 text-slate-600 hover:bg-slate-100 text-sm sm:text-base"
              >
                <Home className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main question area */}
          <div className="lg:col-span-2">
            {state.questionActive && state.currentQuestion ? (
              <Card className="border-4 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 backdrop-blur-lg shadow-2xl animate-pulse-border">
                <CardHeader>
                  <CardTitle className="text-slate-800 text-xl sm:text-2xl flex items-center gap-2 animate-bounce">
                    ⚡ ¡PREGUNTA ACTIVA! ⚡
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="text-lg sm:text-2xl font-bold text-slate-800 p-4 sm:p-6 bg-white/80 rounded-lg border border-slate-200 text-center">
                    {state.currentQuestion.question_text}
                  </div>

                  {!hasResponded ? (
                    <Button
                      onClick={respondToQuestion}
                      size="lg"
                      className="w-full h-16 sm:h-20 text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
                    >
                      <Zap className="w-6 h-6 sm:w-8 sm:h-8 mr-3" />
                      ¡PRESIONA AHORA! ⚡
                    </Button>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="p-4 sm:p-6 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-3xl sm:text-4xl mb-2">🎯</div>
                        <p className="text-xl sm:text-2xl font-bold text-green-700">¡Respuesta Registrada!</p>
                        <p className="text-slate-600 text-base sm:text-lg">
                          Tu tiempo: {responseTime ? (responseTime / 1000).toFixed(2) : 0}s ⚡
                        </p>
                        {rank && (
                          <div className="mt-3">
                            <Badge
                              variant={rank <= 3 ? "default" : "secondary"}
                              className={`text-base sm:text-lg px-3 sm:px-4 py-2 ${
                                rank === 1
                                  ? "bg-yellow-500 text-black"
                                  : rank === 2
                                    ? "bg-gray-400 text-white"
                                    : rank === 3
                                      ? "bg-orange-500 text-white"
                                      : "bg-blue-500 text-white"
                              }`}
                            >
                              {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏅"} Posición #{rank}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <p className="text-slate-500 animate-pulse text-sm sm:text-base">
                        ⏳ Esperando que el profesor asigne puntos...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-lg border border-slate-200">
                <CardContent className="text-center py-12 sm:py-16">
                  {state.currentSessionCode ? (
                    <>
                      <div className="animate-spin text-4xl sm:text-6xl mb-6">🎯</div>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">
                        ¡Esperando la Próxima Pregunta! 🚀
                      </h3>
                      <p className="text-slate-600 text-base sm:text-lg">
                        El profesor está preparando la siguiente pregunta... ¡Mantente alerta! ⚡
                      </p>
                      <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-4">
                        <div className="bg-blue-100 text-blue-700 px-3 sm:px-4 py-2 rounded-full border border-blue-200 text-sm sm:text-base">
                          🎮 Sesión Activa
                        </div>
                        <div
                          className={`px-3 sm:px-4 py-2 rounded-full border text-sm sm:text-base ${state.isConnected ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}
                        >
                          {state.isConnected ? "🟢 Conectado" : "🔴 Desconectado"}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl sm:text-6xl mb-6">😴</div>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">
                        ¡Prepárate para la Acción! 🚀
                      </h3>
                      <p className="text-slate-600 text-base sm:text-lg">
                        Las preguntas pueden aparecer en cualquier momento... ¡Mantente alerta! ⚡
                      </p>
                      <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-4">
                        <div className="bg-blue-100 text-blue-700 px-3 sm:px-4 py-2 rounded-full border border-blue-200 text-sm sm:text-base">
                          🎮 Modo Juego: ACTIVO
                        </div>
                        <div
                          className={`px-3 sm:px-4 py-2 rounded-full border text-sm sm:text-base ${state.isConnected ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}
                        >
                          {state.isConnected ? "🟢 Conectado" : "🔴 Desconectado"}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Mostrar cuando la pregunta fue cerrada pero aún no hay nueva */}
            {!state.questionActive && state.currentSessionCode && hasResponded && (
              <Card className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200">
                <CardContent className="text-center py-6 sm:py-8">
                  <div className="text-3xl sm:text-4xl mb-4">✅</div>
                  <h3 className="text-lg sm:text-xl font-bold text-blue-800 mb-2">¡Pregunta Finalizada!</h3>
                  <p className="text-blue-600 text-sm sm:text-base">
                    El profesor ha cerrado la pregunta. ¡Prepárate para la siguiente! 🎯
                  </p>
                  {responseTime && (
                    <div className="mt-4 bg-white/50 rounded-lg p-3">
                      <p className="text-blue-700 font-medium text-sm sm:text-base">
                        Tu tiempo de respuesta: {(responseTime / 1000).toFixed(2)}s ⚡
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Enhanced Debug Panel */}
            <Card className="mt-4 sm:mt-6 bg-yellow-50 border border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-800 text-sm">🐛 Debug Info (DETALLADO)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-yellow-700 space-y-1">
                <p>
                  <strong>Socket Connected:</strong> {state.isConnected ? "✅ YES" : "❌ NO"}
                </p>
                <p>
                  <strong>Socket ID:</strong> {state.socket?.id || "❌ NO SOCKET"}
                </p>
                <p>
                  <strong>Session Code:</strong> {state.currentSessionCode || "❌ NO SESSION"}
                </p>
                <p>
                  <strong>Question Active:</strong> {state.questionActive ? "✅ YES" : "❌ NO"}
                </p>
                <p>
                  <strong>Current Question:</strong>{" "}
                  {state.currentQuestion ? `✅ ${state.currentQuestion.question_text}` : "❌ NO QUESTION"}
                </p>
                <p>
                  <strong>Question Start Time:</strong>{" "}
                  {state.questionStartTime
                    ? `✅ ${new Date(state.questionStartTime).toLocaleTimeString()}`
                    : "❌ NO TIME"}
                </p>
                <p>
                  <strong>Has Responded:</strong> {hasResponded ? "✅ YES" : "❌ NO"}
                </p>
                <p>
                  <strong>Current Participant:</strong>{" "}
                  {currentParticipant ? `✅ ${currentParticipant.student_name}` : "❌ NO PARTICIPANT"}
                </p>
                <p>
                  <strong>Students Count:</strong> {state.students.length}
                </p>
                <p>
                  <strong>Responses Count:</strong> {state.responses.length}
                </p>
              </CardContent>
            </Card>

            {/* Student stats */}
            <Card className="mt-4 sm:mt-6 bg-white/80 backdrop-blur-lg border border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800 text-lg sm:text-xl">📊 Tus Estadísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                    <p className="text-2xl sm:text-3xl font-bold text-blue-700">
                      {currentParticipant?.total_points || 0}
                    </p>
                    <p className="text-slate-600 text-xs sm:text-sm">Puntos Totales 🏆</p>
                  </div>
                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                    <p className="text-2xl sm:text-3xl font-bold text-green-700">
                      {leaderboard.findIndex((s) => s.student_name === studentName) + 1 || "-"}
                    </p>
                    <p className="text-slate-600 text-xs sm:text-sm">Posición Actual 📈</p>
                  </div>
                  <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
                    <p className="text-2xl sm:text-3xl font-bold text-purple-700">
                      {responseTime ? (responseTime / 1000).toFixed(1) + "s" : "-"}
                    </p>
                    <p className="text-slate-600 text-xs sm:text-sm">Última Velocidad ⚡</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-white/80 backdrop-blur-lg border border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800 text-lg sm:text-xl flex items-center gap-2">
                  🏆 Tabla de Posiciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <div className="text-3xl sm:text-4xl mb-4">🎯</div>
                    <p className="text-slate-600 text-sm sm:text-base">¡Aún no hay campeones! ¡Sé el primero! 🚀</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {leaderboard.map((student, index) => (
                      <div
                        key={student.id}
                        className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-all ${
                          student.student_name === studentName
                            ? "bg-amber-50 border-amber-300 shadow-md"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg ${
                              index === 0
                                ? "bg-yellow-500 text-black"
                                : index === 1
                                  ? "bg-gray-400 text-white"
                                  : index === 2
                                    ? "bg-orange-500 text-white"
                                    : "bg-blue-500 text-white"
                            }`}
                          >
                            {index === 0 ? "👑" : index + 1}
                          </div>
                          <div>
                            <p
                              className={`font-bold text-sm sm:text-base ${student.student_name === studentName ? "text-amber-700" : "text-slate-800"}`}
                            >
                              {student.student_name === studentName ? "🌟 TÚ 🌟" : student.student_name}
                            </p>
                            {index === 0 && (
                              <p className="text-amber-600 text-xs sm:text-sm">¡Campeón de Quiztionario! 🏆</p>
                            )}
                          </div>
                        </div>
                        <div className="bg-purple-100 text-purple-700 px-2 sm:px-3 py-1 rounded-full font-bold border border-purple-200 text-xs sm:text-sm">
                          {student.total_points} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-lg border border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800 text-lg sm:text-xl flex items-center gap-2">
                  👥 Todos los Jugadores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {state.students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span
                          className={`${student.student_name === studentName ? "text-amber-700 font-bold" : "text-slate-800"}`}
                        >
                          {student.student_name === studentName ? "⭐ " + student.student_name : student.student_name}
                        </span>
                      </div>
                      <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs border border-blue-200">
                        {student.total_points} pts
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style jsx>{`
      @keyframes pulse-border {
        0%, 100% { border-color: rgb(251 191 36); }
        50% { border-color: rgb(249 115 22); }
      }
      .animate-pulse-border {
        animation: pulse-border 2s ease-in-out infinite;
      }
    `}</style>
    </div>
  )
}
