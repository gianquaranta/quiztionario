"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Shield, Lock, Users, Play, Square, Trophy, Home, Copy } from "lucide-react"
import { useQuiz } from "@/lib/quiz-context"
import { db, type Quiz, type QuizSession, type SessionParticipant } from "@/lib/supabase"

const TEACHER_PIN = "187416"

export default function TeacherPage() {
  const [pin, setPin] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showError, setShowError] = useState(false)

  const handlePinSubmit = () => {
    if (pin === TEACHER_PIN) {
      setIsAuthenticated(true)
      setShowError(false)
    } else {
      setShowError(true)
      setPin("")
      setTimeout(() => setShowError(false), 2000)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 p-4 flex items-center justify-center">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23475569' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <Card
          className={`w-full max-w-md bg-white/90 backdrop-blur-lg border border-slate-300 shadow-xl ${showError ? "animate-shake" : ""}`}
        >
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl text-slate-800">🔐 Acceso Docente</CardTitle>
            <CardDescription className="text-slate-600">
              Ingresa el PIN de seguridad para acceder al panel de control
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pin" className="text-slate-700">
                PIN de Seguridad
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Ingresa el PIN de 6 dígitos"
                  className="pl-10 bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-slate-500"
                  maxLength={6}
                  onKeyPress={(e) => e.key === "Enter" && handlePinSubmit()}
                />
              </div>
              {showError && (
                <p className="text-red-600 text-sm mt-2 animate-pulse">❌ PIN incorrecto. Intenta nuevamente.</p>
              )}
            </div>
            <Button
              onClick={handlePinSubmit}
              className="w-full bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white font-bold"
              disabled={pin.length !== 6}
            >
              🚀 Acceder al Panel
            </Button>
            <div className="text-center">
              <Link href="/">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-800">
                  <Home className="w-4 h-4 mr-2" />
                  Volver al Inicio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <style jsx>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
        `}</style>
      </div>
    )
  }

  return <TeacherDashboard />
}

function TeacherDashboard() {
  const { state, dispatch, emit } = useQuiz()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [showCreateQuiz, setShowCreateQuiz] = useState(false)
  const [newQuiz, setNewQuiz] = useState({ title: "", description: "", questions: [{ text: "", maxPoints: 1 }] })
  const [activeSession, setActiveSession] = useState<QuizSession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [questionActive, setQuestionActive] = useState(false)
  const [responses, setResponses] = useState<any[]>([])
  const [participants, setParticipants] = useState<SessionParticipant[]>([])
  const [loading, setLoading] = useState(false)
  const [teacherId] = useState("temp-teacher-id")

  useEffect(() => {
    loadQuizzes()
  }, [])

  useEffect(() => {
    if (state.students.length > 0) {
      setParticipants(state.students)
    }

    if (state.responses.length > 0) {
      setResponses(state.responses)
    }

    setQuestionActive(state.questionActive)
    setCurrentQuestion(state.currentQuestion)
  }, [state])

  const loadQuizzes = async () => {
    try {
      const existingQuizzes = await db.getTeacherQuizzes(teacherId)
      if (existingQuizzes.length === 0) {
        const sampleQuiz = await db.createQuiz(teacherId, "Quiz de Ejemplo", "Un quiz de prueba rápido")
        await db.addQuestionToQuiz(sampleQuiz.id, "¿Cuánto es 2 + 2?", 1, 0)
        await db.addQuestionToQuiz(sampleQuiz.id, "¿Cuál es la capital de Francia?", 2, 1)
        await db.addQuestionToQuiz(sampleQuiz.id, "Nombra un lenguaje de programación", 1, 2)

        const updatedQuizzes = await db.getTeacherQuizzes(teacherId)
        setQuizzes(updatedQuizzes)
      } else {
        setQuizzes(existingQuizzes)
      }
    } catch (error) {
      console.error("Error al cargar quizzes:", error)
      setQuizzes([])
    }
  }

  const createQuiz = async () => {
    if (!newQuiz.title || !newQuiz.questions[0].text) return

    setLoading(true)
    try {
      const quiz = await db.createQuiz(teacherId, newQuiz.title, newQuiz.description)

      for (let i = 0; i < newQuiz.questions.length; i++) {
        const question = newQuiz.questions[i]
        if (question.text.trim()) {
          await db.addQuestionToQuiz(quiz.id, question.text, question.maxPoints, i)
        }
      }

      await loadQuizzes()
      setNewQuiz({ title: "", description: "", questions: [{ text: "", maxPoints: 1 }] })
      setShowCreateQuiz(false)
    } catch (error) {
      console.error("Error al crear quiz:", error)
      alert("Error al crear el quiz. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const startQuizSession = async (quiz: Quiz) => {
    setLoading(true)
    try {
      const session = await db.createQuizSession(teacherId, quiz.id)
      setActiveSession(session)

      emit("teacher-start-session", session.session_code, session.id)

      console.log(`🎯 Sesión de quiz iniciada! Código: ${session.session_code}`)
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      alert("Error al iniciar la sesión. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const startQuestion = (question: any) => {
    const startTime = Date.now()
    setCurrentQuestion(question)
    setQuestionActive(true)
    setResponses([])

    if (activeSession) {
      emit("teacher-start-question", activeSession.session_code, question, startTime)
    }

    if (activeSession) {
      db.startQuestion(activeSession.id, question.id).catch(console.error)
    }
  }

  const awardPoints = async (participantId: string, points: number) => {
    try {
      const response = responses.find((r) => r.participant?.id === participantId)
      if (response && response.id) {
        const rank = responses.findIndex((r) => r.participant?.id === participantId) + 1
        await db.awardPoints(response.id, points, rank)
      }

      const updatedParticipants = participants.map((p) =>
        p.id === participantId ? { ...p, total_points: p.total_points + points } : p,
      )
      setParticipants(updatedParticipants)

      if (activeSession) {
        const participant = participants.find((p) => p.id === participantId)
        if (participant) {
          emit("teacher-award-points", activeSession.session_code, participantId, participant.total_points + points)
        }
      }

      console.log(`🏆 Se otorgaron ${points} puntos al participante ${participantId}`)
    } catch (error) {
      console.error("Error al otorgar puntos:", error)
    }
  }

  const endQuestion = () => {
    setQuestionActive(false)
    setCurrentQuestion(null)
    setResponses([])

    if (activeSession) {
      emit("teacher-end-question", activeSession.session_code)
    }
  }

  const endSession = async () => {
    if (!activeSession) return

    try {
      await db.endSession(activeSession.id)
      emit("teacher-end-session", activeSession.session_code)

      setActiveSession(null)
      setCurrentQuestion(null)
      setQuestionActive(false)
      setResponses([])
      setParticipants([])

      console.log("🛑 Sesión terminada")
    } catch (error) {
      console.error("Error al terminar sesión:", error)
    }
  }

  const copySessionCode = () => {
    if (activeSession?.session_code) {
      navigator.clipboard.writeText(activeSession.session_code)
      alert("¡Código copiado al portapapeles!")
    }
  }

  const leaderboard = [...participants].sort((a, b) => b.total_points - a.total_points)

  if (showCreateQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/90 backdrop-blur-lg border border-slate-300 shadow-xl">
            <CardHeader>
              <CardTitle className="text-slate-800 text-2xl">🎯 Crear Nuevo Quiz</CardTitle>
              <CardDescription className="text-slate-600">
                Diseña preguntas que desafíen a tus estudiantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-slate-700">
                  Título del Quiz
                </Label>
                <Input
                  id="title"
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                  placeholder="Ingresa un título genial"
                  className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-slate-700">
                  Descripción (Opcional)
                </Label>
                <Input
                  id="description"
                  value={newQuiz.description}
                  onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                  placeholder="Breve descripción del quiz"
                  className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400"
                />
              </div>

              {newQuiz.questions.map((question, index) => (
                <div key={index} className="border border-slate-300 rounded-lg p-4 space-y-3 bg-slate-50">
                  <Label className="text-slate-700">Pregunta {index + 1} 🤔</Label>
                  <Textarea
                    value={question.text}
                    onChange={(e) => {
                      const updatedQuestions = [...newQuiz.questions]
                      updatedQuestions[index].text = e.target.value
                      setNewQuiz({ ...newQuiz, questions: updatedQuestions })
                    }}
                    placeholder="¿Qué pregunta desafiante harás?"
                    className="w-full p-3 rounded-md bg-white border border-slate-300 text-slate-800 placeholder:text-slate-400 resize-none"
                    rows={3}
                  />
                  <div>
                    <Label className="text-slate-700">Puntos Máximos (1-3) 🏆</Label>
                    <Input
                      type="number"
                      min="1"
                      max="3"
                      value={question.maxPoints}
                      onChange={(e) => {
                        const updatedQuestions = [...newQuiz.questions]
                        updatedQuestions[index].maxPoints = Number.parseInt(e.target.value) || 1
                        setNewQuiz({ ...newQuiz, questions: updatedQuestions })
                      }}
                      className="w-20 bg-white border-slate-300 text-slate-800"
                    />
                  </div>
                </div>
              ))}

              <Button
                onClick={() =>
                  setNewQuiz({
                    ...newQuiz,
                    questions: [...newQuiz.questions, { text: "", maxPoints: 1 }],
                  })
                }
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                ➕ Agregar Otra Pregunta
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={createQuiz}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  {loading ? "Creando..." : "🚀 Crear Quiz"}
                </Button>
                <Button
                  onClick={() => setShowCreateQuiz(false)}
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">🎓 Panel de Control Docente</h1>
            <p className="text-slate-600 text-lg">Controla el universo de quizzes desde aquí</p>
            {activeSession && (
              <div className="mt-2 flex items-center gap-4">
                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-lg border border-green-200 flex items-center gap-2">
                  📡 Código de Sesión: {activeSession.session_code}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copySessionCode}
                    className="h-6 w-6 p-0 hover:bg-green-200"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-200">
                  <Users className="w-4 h-4 inline mr-1" />
                  {participants.length} Estudiantes Conectados
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {activeSession && (
              <Button onClick={endSession} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                🛑 Terminar Sesión
              </Button>
            )}
            <Link href="/">
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                <Home className="w-4 h-4 mr-2" />
                Inicio
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Gestión de Quizzes */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/90 backdrop-blur-lg border border-slate-300">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-slate-800 text-xl">📚 Mi Colección de Quizzes</CardTitle>
                  <Button
                    onClick={() => setShowCreateQuiz(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    ✨ Crear Nuevo Quiz
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {quizzes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600 text-lg">🎯 Aún no hay quizzes - ¡crea tu primera obra maestra!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all"
                      >
                        <div>
                          <h3 className="font-medium text-slate-800 text-lg">{quiz.title}</h3>
                          <p className="text-slate-600">
                            {quiz.questions?.length || 0} preguntas • {quiz.description || "¡Listo para lanzar!"}
                          </p>
                        </div>
                        <Button
                          onClick={() => startQuizSession(quiz)}
                          size="sm"
                          disabled={loading || activeSession?.quiz?.id === quiz.id}
                          className={
                            activeSession?.quiz?.id === quiz.id
                              ? "bg-green-500"
                              : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                          }
                        >
                          {activeSession?.quiz?.id === quiz.id ? "🔥 Activo" : loading ? "Iniciando..." : "🚀 Lanzar"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Control de Quiz Activo */}
            {activeSession && activeSession.quiz && (
              <Card className="bg-white/90 backdrop-blur-lg border border-slate-300">
                <CardHeader>
                  <CardTitle className="text-slate-800 text-xl flex items-center gap-2">
                    🎮 Quiz Activo: {activeSession.quiz.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeSession.quiz.questions?.map((question) => (
                      <div
                        key={question.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{question.question_text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-sm border border-amber-200">
                              🏆 Máx {question.max_points} puntos
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => startQuestion(question)}
                          disabled={questionActive}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Hacer Pregunta
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resultados de Pregunta Actual */}
            {questionActive && currentQuestion && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 backdrop-blur-lg border border-green-200">
                <CardHeader>
                  <CardTitle className="text-slate-800 text-xl flex items-center gap-2">
                    ⚡ Resultados en Vivo
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-lg">{currentQuestion.question_text}</CardDescription>
                </CardHeader>
                <CardContent>
                  {responses.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="animate-pulse text-4xl mb-4">⏱️</div>
                      <p className="text-slate-600 text-lg">Esperando respuestas súper rápidas...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {responses.slice(0, 10).map((response, index) => (
                        <div
                          key={response.id || index}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white/80"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                index === 0
                                  ? "bg-yellow-500 text-black"
                                  : index === 1
                                    ? "bg-gray-400 text-white"
                                    : index === 2
                                      ? "bg-orange-500 text-white"
                                      : "bg-blue-500 text-white"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 text-lg">
                                {response.participant?.student_name || "Estudiante Desconocido"}
                              </p>
                              <p className="text-slate-600">⚡ {(response.responseTime / 1000).toFixed(2)}s</p>
                            </div>
                            {index < 3 && (
                              <span className="text-2xl">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {[1, 2, 3].slice(0, currentQuestion.max_points).map((points) => (
                              <Button
                                key={points}
                                size="sm"
                                variant="outline"
                                onClick={() => awardPoints(response.participant?.id, points)}
                                className="border-slate-300 text-slate-700 hover:bg-slate-100"
                              >
                                <Trophy className="w-3 h-3 mr-1" />
                                {points} pt{points > 1 ? "s" : ""}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <Button
                        onClick={endQuestion}
                        className="w-full mt-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Terminar Pregunta
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Rankings de Estudiantes y Participantes */}
          <div>
            <Card className="bg-white/90 backdrop-blur-lg border border-slate-300">
              <CardHeader>
                <CardTitle className="text-slate-800 text-xl flex items-center gap-2">🏆 Tabla de Posiciones</CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600">🎯 Aún no hay campeones - ¡comienza a otorgar puntos!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((participant, index) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0
                                ? "bg-yellow-500 text-black"
                                : index === 1
                                  ? "bg-gray-400 text-white"
                                  : index === 2
                                    ? "bg-orange-500 text-white"
                                    : "bg-blue-500 text-white"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{participant.student_name}</p>
                            {index === 0 && <span className="text-amber-600 text-sm">👑 ¡Campeón del Quiz!</span>}
                          </div>
                        </div>
                        <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold border border-purple-200">
                          {participant.total_points} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6 bg-white/90 backdrop-blur-lg border border-slate-300">
              <CardHeader>
                <CardTitle className="text-slate-800 text-xl flex items-center gap-2">
                  👥 Todos los Participantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600">👋 Esperando que se unan estudiantes...</p>
                    {activeSession && (
                      <p className="text-slate-500 text-sm mt-2">Comparte el código: {activeSession.session_code}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span className="text-slate-800">{participant.student_name}</span>
                        </div>
                        <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs border border-blue-200">
                          {participant.total_points} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
