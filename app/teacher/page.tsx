"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Shield, Lock } from "lucide-react"

const TEACHER_PIN = "187416"

interface Quiz {
  id: string
  title: string
  questions: Question[]
}

interface Question {
  id: string
  text: string
  maxPoints: number
}

interface Student {
  id: string
  name: string
  responseTime: number
  points: number
  isConnected: boolean
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
      // Add shake animation
      setTimeout(() => setShowError(false), 2000)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%239C92AC' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <Card
          className={`w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 ${showError ? "animate-shake" : ""}`}
        >
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">🔐 Teacher Access</CardTitle>
            <CardDescription className="text-white/70">
              Enter the secret PIN to access the teacher dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pin" className="text-white">
                Security PIN
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 6-digit PIN"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  maxLength={6}
                  onKeyPress={(e) => e.key === "Enter" && handlePinSubmit()}
                />
              </div>
              {showError && <p className="text-red-400 text-sm mt-2 animate-pulse">❌ Invalid PIN. Try again!</p>}
            </div>
            <Button
              onClick={handlePinSubmit}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
              disabled={pin.length !== 6}
            >
              🚀 Access Dashboard
            </Button>
            <div className="text-center">
              <Button variant="ghost" className="text-white/70 hover:text-white" onClick={() => window.history.back()}>
                ← Back to Home
              </Button>
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
  const [quizzes, setQuizzes] = useState([])
  const [showCreateQuiz, setShowCreateQuiz] = useState(false)
  const [newQuiz, setNewQuiz] = useState({ title: "", questions: [{ text: "", maxPoints: 1 }] })
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionActive, setQuestionActive] = useState(false)
  const [responses, setResponses] = useState([])
  const [students, setStudents] = useState([
    { id: "1", name: "Alice Johnson", responseTime: 0, points: 0, isConnected: true },
    { id: "2", name: "Bob Smith", responseTime: 0, points: 0, isConnected: true },
    { id: "3", name: "Charlie Brown", responseTime: 0, points: 0, isConnected: true },
    { id: "4", name: "Diana Prince", responseTime: 0, points: 0, isConnected: true },
    { id: "5", name: "Ethan Hunt", responseTime: 0, points: 0, isConnected: true },
  ])

  const createQuiz = () => {
    if (newQuiz.title && newQuiz.questions[0].text) {
      const quiz = {
        id: Date.now().toString(),
        title: newQuiz.title,
        questions: newQuiz.questions.map((q, i) => ({
          id: i.toString(),
          text: q.text,
          maxPoints: q.maxPoints,
        })),
      }
      setQuizzes([...quizzes, quiz])
      setNewQuiz({ title: "", questions: [{ text: "", maxPoints: 1 }] })
      setShowCreateQuiz(false)
    }
  }

  const startQuestion = (question) => {
    setCurrentQuestion(question)
    setQuestionActive(true)
    setResponses([])

    // Simulate real-time student responses
    setTimeout(() => {
      const shuffledStudents = [...students].sort(() => Math.random() - 0.5)
      const responseStudents = shuffledStudents
        .slice(0, Math.floor(Math.random() * 5) + 3)
        .map((student, index) => ({
          ...student,
          responseTime: Math.random() * 3000 + 500,
        }))
        .sort((a, b) => a.responseTime - b.responseTime)
      setResponses(responseStudents)
    }, 1000)
  }

  const awardPoints = (studentId, points) => {
    setStudents((prev) =>
      prev.map((student) => (student.id === studentId ? { ...student, points: student.points + points } : student)),
    )

    // Fun celebration effect
    console.log(`🎉 ${points} points awarded!`)
  }

  const endQuestion = () => {
    setQuestionActive(false)
    setCurrentQuestion(null)
    setResponses([])
  }

  const finalRankings = [...students].sort((a, b) => b.points - a.points).filter((s) => s.points > 0)

  if (showCreateQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl">🎯 Create Epic Quiz</CardTitle>
              <CardDescription className="text-white/70">
                Design questions that will challenge your students!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-white">
                  Quiz Title
                </Label>
                <Input
                  id="title"
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                  placeholder="Enter an awesome quiz title"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              {newQuiz.questions.map((question, index) => (
                <div key={index} className="border border-white/20 rounded-lg p-4 space-y-3 bg-white/5">
                  <Label className="text-white">Question {index + 1} 🤔</Label>
                  <Textarea
                    value={question.text}
                    onChange={(e) => {
                      const updatedQuestions = [...newQuiz.questions]
                      updatedQuestions[index].text = e.target.value
                      setNewQuiz({ ...newQuiz, questions: updatedQuestions })
                    }}
                    placeholder="What challenging question will you ask?"
                    className="w-full p-3 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/50 resize-none"
                    rows={3}
                  />
                  <div>
                    <Label className="text-white">Max Points (1-3) 🏆</Label>
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
                      className="w-20 bg-white/10 border-white/20 text-white"
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
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                ➕ Add Another Question
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={createQuiz}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  🚀 Create Quiz
                </Button>
                <Button
                  onClick={() => setShowCreateQuiz(false)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white">🎓 Teacher Command Center</h1>
            <p className="text-white/70 text-lg">Control the quiz universe from here!</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">
              🟢 {students.filter((s) => s.isConnected).length} Students Online
            </div>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => window.history.back()}
            >
              🏠 Home
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quiz Management */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white text-xl">📚 My Quiz Collection</CardTitle>
                  <Button
                    onClick={() => setShowCreateQuiz(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    ✨ Create New Quiz
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {quizzes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/70 text-lg">🎯 No quizzes yet - create your first masterpiece!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                      >
                        <div>
                          <h3 className="font-medium text-white text-lg">{quiz.title}</h3>
                          <p className="text-white/60">{quiz.questions.length} questions • Ready to launch!</p>
                        </div>
                        <Button
                          onClick={() => setActiveQuiz(quiz)}
                          size="sm"
                          disabled={activeQuiz?.id === quiz.id}
                          className={
                            activeQuiz?.id === quiz.id
                              ? "bg-green-500"
                              : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                          }
                        >
                          {activeQuiz?.id === quiz.id ? "🔥 Active" : "🚀 Launch"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Quiz Control */}
            {activeQuiz && (
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center gap-2">
                    🎮 Active Quiz: {activeQuiz.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeQuiz.questions.map((question) => (
                      <div
                        key={question.id}
                        className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-white">{question.text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-sm">
                              🏆 Max {question.maxPoints} points
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => startQuestion(question)}
                          disabled={questionActive}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                        >
                          ⚡ Ask Question
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Question Results */}
            {questionActive && currentQuestion && (
              <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-lg border border-green-300/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center gap-2">⚡ Live Question Results</CardTitle>
                  <CardDescription className="text-white/80 text-lg">{currentQuestion.text}</CardDescription>
                </CardHeader>
                <CardContent>
                  {responses.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="animate-pulse text-4xl mb-4">⏱️</div>
                      <p className="text-white/70 text-lg">Waiting for lightning-fast responses...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {responses.slice(0, 10).map((student, index) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/10"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                index === 0
                                  ? "bg-yellow-500 text-black"
                                  : index === 1
                                    ? "bg-gray-300 text-black"
                                    : index === 2
                                      ? "bg-orange-500 text-white"
                                      : "bg-blue-500 text-white"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-white text-lg">{student.name}</p>
                              <p className="text-white/60">⚡ {(student.responseTime / 1000).toFixed(2)}s</p>
                            </div>
                            {index < 3 && (
                              <span className="text-2xl">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {[1, 2, 3].slice(0, currentQuestion.maxPoints).map((points) => (
                              <Button
                                key={points}
                                size="sm"
                                variant="outline"
                                onClick={() => awardPoints(student.id, points)}
                                className="border-white/20 text-white hover:bg-white/10"
                              >
                                🏆 {points} pt{points > 1 ? "s" : ""}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <Button
                        onClick={endQuestion}
                        className="w-full mt-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                      >
                        🏁 End Question
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Student Rankings */}
          <div>
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">🏆 Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                {finalRankings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/70">🎯 No champions yet - start awarding points!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {finalRankings.map((student, index) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 border border-white/20 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0
                                ? "bg-yellow-500 text-black"
                                : index === 1
                                  ? "bg-gray-300 text-black"
                                  : index === 2
                                    ? "bg-orange-500 text-white"
                                    : "bg-blue-500 text-white"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-white">{student.name}</p>
                            {index === 0 && <span className="text-yellow-400 text-sm">👑 Quiz Champion!</span>}
                          </div>
                        </div>
                        <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full font-bold">
                          {student.points} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6 bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">👥 All Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${student.isConnected ? "bg-green-400" : "bg-red-400"}`}
                        ></div>
                        <span className="text-white">{student.name}</span>
                      </div>
                      <div className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">{student.points} pts</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
