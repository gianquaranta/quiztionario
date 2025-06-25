"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Zap, Star } from "lucide-react"
import Link from "next/link"
import { useQuiz } from "@/lib/quiz-context"

export default function StudentPage() {
  const { state, dispatch } = useQuiz()
  const [studentName, setStudentName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [isJoined, setIsJoined] = useState(false)
  const [hasResponded, setHasResponded] = useState(false)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [rank, setRank] = useState<number | null>(null)
  const [totalPoints, setTotalPoints] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)

  const currentStudent = state.students.find((s) => s.id === studentId)
  const leaderboard = [...state.students].sort((a, b) => b.points - a.points).filter((s) => s.points > 0)

  const joinQuiz = () => {
    if (studentName.trim()) {
      const newStudentId = Date.now().toString()
      setStudentId(newStudentId)
      dispatch({
        type: "ADD_STUDENT",
        payload: {
          id: newStudentId,
          name: studentName,
          points: 0,
          isConnected: true,
        },
      })
      setIsJoined(true)
    }
  }

  const respondToQuestion = () => {
    if (state.questionStartTime) {
      const time = Date.now() - state.questionStartTime
      setResponseTime(time)
      setHasResponded(true)

      dispatch({
        type: "STUDENT_RESPONSE",
        payload: { studentId, responseTime: time },
      })

      // Calculate rank
      const currentRank = state.responses.findIndex((r) => r.studentId === studentId) + 1
      setRank(currentRank)

      // Show celebration for top 3
      if (currentRank <= 3) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
      }
    }
  }

  // Reset response state when new question starts
  useEffect(() => {
    if (state.questionActive && state.currentQuestion) {
      setHasResponded(false)
      setResponseTime(null)
      setRank(null)
    }
  }, [state.questionActive, state.currentQuestion])

  // Update total points
  useEffect(() => {
    if (currentStudent) {
      setTotalPoints(currentStudent.points)
    }
  }, [currentStudent])

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-delayed"></div>
        </div>

        <div className="max-w-md mx-auto pt-20 relative z-10">
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
            <CardHeader className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                <Star className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl text-white">🎮 Join the Quiz Battle!</CardTitle>
              <CardDescription className="text-white/80 text-lg">Enter your name and show your skills!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-white text-lg">
                  Your Epic Name
                </Label>
                <Input
                  id="name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your superhero name"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-lg h-12"
                  onKeyPress={(e) => e.key === "Enter" && joinQuiz()}
                />
              </div>
              <Button
                onClick={joinQuiz}
                className="w-full h-14 text-xl font-bold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={!studentName.trim()}
              >
                🚀 Join the Adventure!
              </Button>
              <Link href="/">
                <Button variant="ghost" className="w-full text-white/70 hover:text-white hover:bg-white/10">
                  ← Back to Home
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
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 p-4 relative overflow-hidden">
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center animate-bounce">
            <div className="text-8xl mb-4">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-2">Amazing Speed!</h2>
            <p className="text-xl text-white/80">You're in the top 3! 🏆</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">🌟 Hey {studentName}!</h1>
            <p className="text-white/80 text-lg">Ready to dominate this quiz? 💪</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-full text-lg font-bold">
              🏆 {totalPoints} points
            </div>
            <Link href="/">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                🏠 Leave Quiz
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-2">
            {state.questionActive && state.currentQuestion ? (
              <Card className="border-4 border-yellow-400 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 backdrop-blur-lg shadow-2xl animate-pulse-border">
                <CardHeader>
                  <CardTitle className="text-white text-2xl flex items-center gap-2 animate-bounce">
                    ⚡ QUESTION ALERT! ⚡
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-2xl font-bold text-white p-6 bg-white/10 rounded-lg border border-white/20 text-center">
                    {state.currentQuestion.text}
                  </div>

                  {!hasResponded ? (
                    <Button
                      onClick={respondToQuestion}
                      size="lg"
                      className="w-full h-20 text-2xl font-bold bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
                    >
                      <Zap className="w-8 h-8 mr-3" />
                      PRESS NOW! ⚡
                    </Button>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="p-6 bg-green-500/20 rounded-lg border border-green-300/30">
                        <div className="text-4xl mb-2">🎯</div>
                        <p className="text-2xl font-bold text-green-300">Response Recorded!</p>
                        <p className="text-white/80 text-lg">
                          Your lightning time: {responseTime ? (responseTime / 1000).toFixed(2) : 0}s ⚡
                        </p>
                        {rank && (
                          <div className="mt-3">
                            <Badge
                              variant={rank <= 3 ? "default" : "secondary"}
                              className={`text-lg px-4 py-2 ${
                                rank === 1
                                  ? "bg-yellow-500 text-black"
                                  : rank === 2
                                    ? "bg-gray-300 text-black"
                                    : rank === 3
                                      ? "bg-orange-500 text-white"
                                      : "bg-blue-500 text-white"
                              }`}
                            >
                              {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏅"} Rank #{rank}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <p className="text-white/70 animate-pulse">⏳ Waiting for teacher to award points...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardContent className="text-center py-16">
                  <div className="animate-spin text-6xl mb-6">🎯</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Get Ready for Action! 🚀</h3>
                  <p className="text-white/70 text-lg">Questions can drop at any moment... Stay alert! ⚡</p>
                  <div className="mt-6 flex justify-center gap-4">
                    <div className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full">🎮 Game Mode: ON</div>
                    <div className="bg-green-500/20 text-green-300 px-4 py-2 rounded-full">🟢 Connected</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Student Stats */}
            <Card className="mt-6 bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-xl">📊 Your Battle Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-500/20 p-4 rounded-lg">
                    <p className="text-3xl font-bold text-blue-300">{totalPoints}</p>
                    <p className="text-white/70">Total Points 🏆</p>
                  </div>
                  <div className="bg-green-500/20 p-4 rounded-lg">
                    <p className="text-3xl font-bold text-green-300">
                      {leaderboard.findIndex((s) => s.name === studentName) + 1 || "-"}
                    </p>
                    <p className="text-white/70">Current Rank 📈</p>
                  </div>
                  <div className="bg-purple-500/20 p-4 rounded-lg">
                    <p className="text-3xl font-bold text-purple-300">
                      {responseTime ? (responseTime / 1000).toFixed(1) + "s" : "-"}
                    </p>
                    <p className="text-white/70">Last Speed ⚡</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <div>
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">🏆 Hall of Fame</CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎯</div>
                    <p className="text-white/70">No champions yet! Be the first! 🚀</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((student, index) => (
                      <div
                        key={student.id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                          student.name === studentName
                            ? "bg-yellow-500/20 border-yellow-400/50 shadow-lg"
                            : "bg-white/5 border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                              index === 0
                                ? "bg-yellow-500 text-black"
                                : index === 1
                                  ? "bg-gray-300 text-black"
                                  : index === 2
                                    ? "bg-orange-500 text-white"
                                    : "bg-blue-500 text-white"
                            }`}
                          >
                            {index === 0 ? "👑" : index + 1}
                          </div>
                          <div>
                            <p
                              className={`font-bold ${student.name === studentName ? "text-yellow-300" : "text-white"}`}
                            >
                              {student.name === studentName ? "🌟 YOU 🌟" : student.name}
                            </p>
                            {index === 0 && <p className="text-yellow-400 text-sm">Quiz Champion! 🏆</p>}
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
                <CardTitle className="text-white text-xl flex items-center gap-2">👥 All Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {state.students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${student.isConnected ? "bg-green-400" : "bg-red-400"}`}
                        ></div>
                        <span
                          className={`${student.name === studentName ? "text-yellow-300 font-bold" : "text-white"}`}
                        >
                          {student.name === studentName ? "⭐ " + student.name : student.name}
                        </span>
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
