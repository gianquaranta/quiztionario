"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Shield, Lock, Users, Play, Square, Trophy, Home, Copy, Pause } from "lucide-react"
import { useQuiz } from "@/lib/quiz-context"
import { db, type Quiz, type QuizSession, type SessionParticipant } from "@/lib/supabase"

const TEACHER_PIN = "187416"

// Función para generar UUID válido
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

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
  const [teacherId, setTeacherId] = useState<string>("")

  // Inicializar o crear profesor temporal
  useEffect(() => {
    initializeTeacher()
  }, [])

  useEffect(() => {
    if (teacherId) {
      loadQuizzes()
    }
  }, [teacherId])

  useEffect(() => {
    console.log("🔄 Estado actualizado:", {
      students: state.students.length,
      responses: state.responses.length,
      questionActive: state.questionActive,
      currentQuestion: state.currentQuestion?.question_text,
    })

    if (state.students.length > 0) {
      setParticipants(state.students)
    }

    if (state.responses.length > 0) {
      console.log("📊 Respuestas recibidas:", state.responses)
      setResponses(state.responses)
    }

    setQuestionActive(state.questionActive)
    setCurrentQuestion(state.currentQuestion)
  }, [state])

  const initializeTeacher = async () => {
    try {
      // Intentar obtener el profesor demo existente
      let teacher = await db.getTeacherByEmail("demo@profesor.com")

      if (!teacher) {
        // Si no existe, crear un profesor demo
        const tempId = generateUUID()
        teacher = await db.createTeacher("demo@profesor.com", "Profesor Demo", "demo-hash")
        console.log("✅ Profesor demo creado:", teacher.id)
      }

      setTeacherId(teacher.id)
      console.log("👨‍🏫 Profesor inicializado:", teacher.id)
    } catch (error) {
      console.error("❌ Error al inicializar profesor:", error)
      // Fallback: usar UUID generado localmente
      const fallbackId = generateUUID()
      setTeacherId(fallbackId)
      console.log("🔄 Usando ID fallback:", fallbackId)
    }
  }

  const loadQuizzes = async () => {
    if (!teacherId) return

    try {
      const existingQuizzes = await db.getTeacherQuizzes(teacherId)
      if (existingQuizzes.length === 0) {
        // Crear quiz de ejemplo
        const sampleQuiz = await db.createQuiz(teacherId, "Quiz de Ejemplo", "Un quiz de prueba rápido")
        await db.addQuestionToQuiz(sampleQuiz.id, "¿Cuánto es 2 + 2?", 1, 0)
        await db.addQuestionToQuiz(sampleQuiz.id, "¿Cuál es la capital de Francia?", 2, 1)
        await db.addQuestionToQuiz(sampleQuiz.id, "Nombra un lenguaje de programación", 1, 2)

        const updatedQuizzes = await db.getTeacherQuizzes(teacherId)
        setQuizzes(updatedQuizzes)
        console.log("✅ Quiz de ejemplo creado")
      } else {
        setQuizzes(existingQuizzes)
        console.log("✅ Quizzes cargados:", existingQuizzes.length)
      }
    } catch (error) {
      console.error("❌ Error al cargar quizzes:", error)
      setQuizzes([])
    }
  }

  const createQuiz = async () => {
    if (!newQuiz.title || !newQuiz.questions[0].text || !teacherId) return

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
      console.log("✅ Quiz creado exitosamente")
    } catch (error) {
      console.error("❌ Error al crear quiz:", error)
      alert("Error al crear el quiz. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const startQuizSession = async (quiz: Quiz) => {
    if (!teacherId) return

    setLoading(true)
    try {
      const session = await db.createQuizSession(teacherId, quiz.id)
      setActiveSession(session)

      emit("teacher-start-session", session.session_code, session.id)

      console.log(`🎯 Sesión de quiz iniciada! Código: ${session.session_code}`)
    } catch (error) {
      console.error("❌ Error al iniciar sesión:", error)
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

    console.log("🚀 Iniciando pregunta:", question.question_text)
    console.log("📡 Código de sesión:", activeSession?.session_code)

    if (activeSession) {
      // Emitir a todos los estudiantes
      emit("teacher-start-question", activeSession.session_code, {
        question: question,
        startTime: startTime,
        sessionCode: activeSession.session_code,
      })

      console.log("📡 Pregunta enviada a estudiantes via Socket.IO")
    }

    // Actualizar estado local
    dispatch({
      type: "SET_CURRENT_QUESTION",
      payload: { question: question, startTime: startTime },
    })

    if (activeSession) {
      db.startQuestion(activeSession.id, question.id).catch(console.error)
    }
  }

  const pauseQuestion = () => {
    console.log("⏸️ Pausando pregunta")
    setQuestionActive(false)

    if (activeSession) {
      console.log("📡 Enviando pausa a sesión:", activeSession.session_code)
      emit("teacher-pause-question", activeSession.session_code)
    }

    dispatch({ type: "SET_QUESTION_ACTIVE", payload: false })
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

      // La pregunta se cierra automáticamente cuando se otorgan puntos
      // El servidor enviará "question-ended" que actualizará el estado
      console.log(`🏆 Puntos otorgados - la pregunta se cerrará automáticamente`)
    } catch (error) {
      console.error("❌ Error al otorgar puntos:", error)
    }
  }

  const endQuestion = () => {
    console.log("🛑 Terminando pregunta")
    setQuestionActive(false)
    setCurrentQuestion(null)
    setResponses([])

    if (activeSession) {
      emit("teacher-end-question", activeSession.session_code)
    }

    dispatch({ type: "SET_QUESTION_ACTIVE", payload: false })
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

      dispatch({ type: "RESET_QUIZ" })

      console.log("🛑 Sesión terminada")
    } catch (error) {
      console.error("❌ Error al terminar sesión:", error)
    }
  }

  const copySessionCode = () => {
    if (activeSession?.session_code) {
      navigator.clipboard.writeText(activeSession.session_code)
      alert("¡Código copiado al portapapeles!")
    }
  }

  const leaderboard = [...participants].sort((a, b) => b.total_points - a.total_points)

  // Mostrar loading mientras se inicializa el profesor
  if (!teacherId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 p-4 flex items-center justify-center">
        <Card className="bg-white/90 backdrop-blur-lg border border-slate-300 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Inicializando panel docente...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showCreateQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/90 backdrop-blur-lg border border-slate-300 shadow-xl">
            <CardHeader>
              <CardTitle className="text-slate-800 text-xl md:text-2xl">🎯 Crear Nuevo Quiz</CardTitle>
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

              <div className="flex flex-col sm:flex-row gap-2">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 p-2 md:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 md:mb-6 gap-4">
          <div className="w-full lg:w-auto">
            <h1 className="text-2xl md:text-4xl font-bold text-slate-800">🎓 Panel Quiztionario</h1>
            <p className="text-slate-600 text-sm md:text-lg">Controla el universo de quizzes desde aquí</p>
            {activeSession && (
              <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="bg-green-100 text-green-700 px-3 py-1 md:px-4 md:py-2 rounded-full font-bold text-sm md:text-lg border border-green-200 flex items-center gap-2">
                  📡 Código: {activeSession.session_code}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copySessionCode}
                    className="h-5 w-5 md:h-6 md:w-6 p-0 hover:bg-green-200"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="bg-blue-100 text-blue-700 px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm border border-blue-200">
                  <Users className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                  {participants.length} Estudiantes
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            {activeSession && (
              <Button
                onClick={endSession}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 text-sm"
              >
                🛑 Terminar Sesión
              </Button>
            )}
            <Link href="/">
              <Button
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 w-full sm:w-auto text-sm"
              >
                <Home className="w-4 h-4 mr-2" />
                Inicio
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Gestión de Quizzes */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <Card className="bg-white/90 backdrop-blur-lg border border-slate-300">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="text-slate-800 text-lg md:text-xl">📚 Mi Colección de Quizzes</CardTitle>
                  <Button
                    onClick={() => setShowCreateQuiz(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-sm w-full sm:w-auto"
                  >
                    ✨ Crear Nuevo Quiz
                  </Button>
                </div>
                {activeSession && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                    <p className="text-green-700 font-medium text-sm md:text-base">
                      🎯 <strong>Sesión Activa:</strong> {activeSession.quiz?.title}
                    </p>
                    <p className="text-green-600 text-xs md:text-sm">
                      Código: <strong>{activeSession.session_code}</strong> • {participants.length} estudiantes
                      conectados
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {quizzes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600 text-sm md:text-lg">
                      🎯 Aún no hay quizzes - ¡crea tu primera obra maestra!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 border rounded-lg transition-all gap-3 ${
                          activeSession?.quiz?.id === quiz.id
                            ? "border-green-300 bg-green-50 shadow-md"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex-1">
                          <h3
                            className={`font-medium text-base md:text-lg ${
                              activeSession?.quiz?.id === quiz.id ? "text-green-800" : "text-slate-800"
                            }`}
                          >
                            {quiz.title}
                            {activeSession?.quiz?.id === quiz.id && (
                              <span className="ml-2 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                ACTIVO
                              </span>
                            )}
                          </h3>
                          <p
                            className={`text-sm ${activeSession?.quiz?.id === quiz.id ? "text-green-600" : "text-slate-600"}`}
                          >
                            {quiz.questions?.length || 0} preguntas • {quiz.description || "¡Listo para lanzar!"}
                          </p>
                        </div>
                        <Button
                          onClick={() => startQuizSession(quiz)}
                          size="sm"
                          disabled={loading || activeSession?.quiz?.id === quiz.id}
                          className={`w-full sm:w-auto text-sm ${
                            activeSession?.quiz?.id === quiz.id
                              ? "bg-green-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                          }`}
                        >
                          {activeSession?.quiz?.id === quiz.id ? "🔥 En Uso" : loading ? "Iniciando..." : "🚀 Lanzar"}
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
                  <CardTitle className="text-slate-800 text-lg md:text-xl flex items-center gap-2">
                    🎮 Quiz Activo: {activeSession.quiz.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    {activeSession.quiz.questions?.map((question) => (
                      <div
                        key={question.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all gap-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 text-sm md:text-base">{question.question_text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs md:text-sm border border-amber-200">
                              🏆 Máx {question.max_points} puntos
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => startQuestion(question)}
                          disabled={questionActive}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 w-full sm:w-auto text-sm"
                        >
                          <Play className="w-3 h-3 md:w-4 md:h-4 mr-1" />
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <div>
                      <CardTitle className="text-slate-800 text-lg md:text-xl flex items-center gap-2">
                        ⚡ Resultados en Vivo
                      </CardTitle>
                      <CardDescription className="text-slate-600 text-sm md:text-lg">
                        {currentQuestion.question_text}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={pauseQuestion}
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50 font-bold text-sm w-full sm:w-auto"
                    >
                      <Pause className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      ⏸️ Pausar
                    </Button>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                    <p className="text-amber-700 text-xs md:text-sm font-medium">
                      💡 Puedes otorgar puntos a cualquier estudiante que haya respondido, no solo al primero.
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  {responses.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="animate-pulse text-3xl md:text-4xl mb-4">⏱️</div>
                      <p className="text-slate-600 text-sm md:text-lg">Esperando respuestas súper rápidas...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-blue-700 text-xs md:text-sm">
                          📊 <strong>{responses.length}</strong> estudiantes han respondido. Puedes otorgar puntos a
                          cualquiera.
                        </p>
                      </div>

                      {responses.slice(0, 10).map((response, index) => (
                        <div
                          key={response.id || index}
                          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 border rounded-lg transition-all gap-3 ${
                            index === 0 ? "border-green-300 bg-green-50 shadow-md" : "border-slate-200 bg-white/80"
                          }`}
                        >
                          <div className="flex items-center gap-3 md:gap-4">
                            <div
                              className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                index === 0
                                  ? "bg-yellow-500 text-black animate-pulse"
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
                              <p
                                className={`font-medium text-sm md:text-lg ${index === 0 ? "text-green-800" : "text-slate-800"}`}
                              >
                                {response.participant?.student_name || "Estudiante Desconocido"}
                              </p>
                              <p className={`text-xs md:text-sm ${index === 0 ? "text-green-600" : "text-slate-600"}`}>
                                ⚡ {(response.responseTime / 1000).toFixed(2)}s
                              </p>
                            </div>
                            {index === 0 && (
                              <div className="hidden sm:flex items-center gap-2">
                                <span className="text-xl md:text-2xl animate-bounce">🥇</span>
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold border border-green-300">
                                  ¡MÁS RÁPIDO!
                                </span>
                              </div>
                            )}
                            {index < 3 && index > 0 && (
                              <span className="text-lg md:text-2xl opacity-50">{index === 1 ? "🥈" : "🥉"}</span>
                            )}
                          </div>

                          {/* Mostrar botones para TODOS los que respondieron */}
                          <div className="flex gap-1 md:gap-2 w-full sm:w-auto">
                            {[1, 2, 3].slice(0, currentQuestion.max_points).map((points) => (
                              <Button
                                key={points}
                                size="sm"
                                onClick={() => awardPoints(response.participant?.id, points)}
                                className={`flex-1 sm:flex-none text-xs ${
                                  index === 0
                                    ? "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-lg"
                                    : "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600"
                                }`}
                              >
                                <Trophy className="w-3 h-3 mr-1" />
                                {points} pt{points > 1 ? "s" : ""}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={endQuestion}
                          variant="outline"
                          className="w-full border-red-300 text-red-700 hover:bg-red-50 text-sm"
                        >
                          <Square className="w-3 h-3 md:w-4 md:h-4 mr-2" />🛑 Cerrar Pregunta Definitivamente
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Rankings de Estudiantes y Participantes */}
          <div className="space-y-4 md:space-y-6">
            <Card className="bg-white/90 backdrop-blur-lg border border-slate-300">
              <CardHeader>
                <CardTitle className="text-slate-800 text-lg md:text-xl flex items-center gap-2">
                  🏆 Tabla de Posiciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600 text-sm">🎯 Aún no hay campeones - ¡comienza a otorgar puntos!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((participant, index) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-2 md:p-3 border border-slate-200 rounded-lg bg-slate-50"
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          <div
                            className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-sm ${
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
                            <p className="font-medium text-slate-800 text-sm md:text-base">
                              {participant.student_name}
                            </p>
                            {index === 0 && <span className="text-amber-600 text-xs">👑 ¡Campeón del Quiz!</span>}
                          </div>
                        </div>
                        <div className="bg-purple-100 text-purple-700 px-2 py-1 md:px-3 md:py-1 rounded-full font-bold border border-purple-200 text-xs md:text-sm">
                          {participant.total_points} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-lg border border-slate-300">
              <CardHeader>
                <CardTitle className="text-slate-800 text-lg md:text-xl flex items-center gap-2">
                  👥 Todos los Participantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600 text-sm">👋 Esperando que se unan estudiantes...</p>
                    {activeSession && (
                      <p className="text-slate-500 text-xs mt-2">Comparte el código: {activeSession.session_code}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-2 text-xs md:text-sm">
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
